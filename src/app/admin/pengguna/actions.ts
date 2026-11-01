"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

export async function setStatus(fd: FormData) {
  const { user } = await requireSuperAdmin();
  const { id, status } = z.object({ id: z.string().uuid(), status: z.enum(["active", "suspended", "banned"]) }).parse(Object.fromEntries(fd));
  if (id === user.id) return;
  // Hanya akun biasa; super admin tidak bisa diubah dari sini
  await supabaseAdmin().from("profiles").update({ status }).eq("id", id).eq("role", "user");
  await audit(user.id, `user.${status}`, `user:${id}`);
  revalidatePath("/admin/pengguna");
}
