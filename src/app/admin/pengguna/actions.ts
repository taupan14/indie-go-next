"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const back = (q: string): never => redirect(`/admin/pengguna?${q}`);

/** Blokir atau buka blokir. Akun terblokir otomatis dikeluarkan dan tidak bisa masuk lagi (lihat src/proxy.ts). */
export async function setStatus(fd: FormData) {
  const { user } = await requireSuperAdmin();
  const { id, status } = z
    .object({ id: z.string().uuid(), status: z.enum(["active", "banned"]) })
    .parse(Object.fromEntries(fd));
  if (id === user.id) return;
  await supabaseAdmin()
    .from("profiles")
    .update({ status })
    .eq("id", id)
    .eq("role", "user"); // super admin tidak bisa diubah
  await audit(
    user.id,
    status === "banned" ? "user.ban" : "user.unban",
    `user:${id}`,
  );
  revalidatePath("/admin/pengguna");
}

/** Hapus permanen: semua thread dan komentar pengguna dihapus, keanggotaan komunitas lepas, akun dihapus. */
export async function deleteUser(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const p = z
    .object({
      id: z.string().uuid(),
      password: z.string().optional(),
      confirm: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) back("error=invalid");
  const { id, password, confirm } = p.data!;
  if (id === user.id) back("error=self");

  const a = supabaseAdmin();
  const { data: target } = await a
    .from("profiles")
    .select("username,role")
    .eq("id", id)
    .maybeSingle();
  if (!target || target.role !== "user") back("error=forbidden");

  // Verifikasi identitas super admin: kata sandi (akun email) atau mengetik username target (akun Google)
  if ((user.app_metadata?.providers ?? []).includes("email")) {
    const { error } = await sb.auth.signInWithPassword({
      email: user.email!,
      password: password ?? "",
    });
    if (error) back("error=password");
  } else if ((confirm ?? "").trim().toLowerCase() !== target!.username)
    back("error=confirm");

  const { count } = await a
    .from("communities")
    .select("id", { count: "exact", head: true })
    .eq("admin_id", id);
  if ((count ?? 0) > 0) back("error=admin"); // alihkan admin komunitasnya dulu

  await a.from("threads").delete().eq("author_id", id); // beserta komentar, suara, dan laporan pada thread itu
  await a.from("comments").delete().eq("author_id", id); // beserta balasan atas komentar itu
  const { error } = await a.auth.admin.deleteUser(id); // profil, keanggotaan, suara, rating, dan share ikut terhapus
  if (error) back("error=failed");
  await audit(user.id, "user.delete", `user:${target!.username}`);
  revalidatePath("/admin/pengguna");
  back("ok=1");
}
