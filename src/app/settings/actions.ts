"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkContent, scanImage } from "@/lib/curation";

const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };
const back = (s: string, q: string): never => redirect(`/settings?s=${s}&${q}`);

async function authed() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/masuk");
  return { sb, user };
}

export async function updateProfile(fd: FormData) {
  const p = z.object({ username: z.string().toLowerCase().regex(/^[a-z0-9_]{3,20}$/), bio: z.string().trim().max(160) }).safeParse(Object.fromEntries(fd));
  if (!p.success) back("profil", "error=invalid");
  const { sb, user } = await authed();
  const d = p.data!;
  const hit = await checkContent([d.username, d.bio], []);
  if (hit) back("profil", `error=curation`);

  const update: Record<string, string> = { username: d.username, bio: d.bio };
  const f = fd.get("avatar") as File | null;
  if (f && f.size > 0) {
    if (!EXT[f.type] || f.size > 5 * 1024 * 1024) back("profil", "error=upload");
    if (await scanImage(await f.arrayBuffer())) back("profil", "error=curation");
    const path = `${user.id}/avatar-${crypto.randomUUID()}.${EXT[f.type]}`;
    const up = await sb.storage.from("media").upload(path, f, { contentType: f.type });
    if (up.error) back("profil", "error=upload");
    update.avatar_url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  }
  const { error } = await sb.from("profiles").update(update).eq("id", user.id);
  if (error) back("profil", error.code === "23505" ? "error=taken" : "error=invalid");
  back("profil", "ok=1");
}

export async function updateEmail(fd: FormData) {
  const p = z.object({ email: z.string().email() }).safeParse(Object.fromEntries(fd));
  if (!p.success) back("akun", "error=invalid");
  const { sb } = await authed();
  const { error } = await sb.auth.updateUser({ email: p.data!.email });
  back("akun", error ? "error=invalid" : "ok=email");
}

export async function updatePassword(fd: FormData) {
  const p = z.object({ password: z.string().min(8), repeat: z.string() }).safeParse(Object.fromEntries(fd));
  if (!p.success) back("akun", "error=invalid");
  if (p.data!.password !== p.data!.repeat) back("akun", "error=password");
  const { sb } = await authed();
  const { error } = await sb.auth.updateUser({ password: p.data!.password });
  back("akun", error ? "error=invalid" : "ok=1");
}

export async function savePrivacy(fd: FormData) {
  const { sb, user } = await authed();
  await sb.from("profiles").update({ hide_communities: fd.get("hide") === "on" }).eq("id", user.id);
  back("privasi", "ok=1");
}

export async function deleteAccount(fd: FormData) {
  const { sb, user } = await authed();
  const { data: me } = await sb.from("profiles").select("username").eq("id", user.id).single();
  if (String(fd.get("confirm") ?? "").toLowerCase() !== me?.username) back("akun", "error=confirm");

  // Akun email: wajib verifikasi kata sandi. Akun Google saja: cukup konfirmasi username.
  if ((user.app_metadata?.providers ?? []).includes("email")) {
    const { error } = await sb.auth.signInWithPassword({ email: user.email!, password: String(fd.get("password") ?? "") });
    if (error) back("akun", "error=password");
  }
  const { count } = await sb.from("communities").select("id", { count: "exact", head: true }).eq("admin_id", user.id);
  if ((count ?? 0) > 0) back("akun", "error=admin");

  const { error } = await supabaseAdmin().auth.admin.deleteUser(user.id);
  if (error) back("akun", "error=invalid");
  await sb.auth.signOut();
  redirect("/");
}
