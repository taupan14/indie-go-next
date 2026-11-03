"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { checkContent, scanImage } from "@/lib/curation";
import { audit } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};
const schema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  description: z.string().trim().max(300).default(""),
  announcement: z.string().trim().max(500).default(""),
  rules: z.string().trim().max(1000).default(""),
  remove_logo: z.string().optional(),
  remove_banner: z.string().optional(),
});

export async function updateCommunity(fd: FormData) {
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) redirect("/komunitas");
  const d = p.data;
  const back = (q: string): never =>
    redirect(`/komunitas/${d.slug}/kelola?${q}`);

  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/masuk");
  const { data: c } = await sb
    .from("communities")
    .select("id,admin_id")
    .eq("slug", d.slug)
    .maybeSingle();
  if (!c) redirect("/komunitas");
  const { data: me } = await sb
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();
  // Hanya admin komunitas ini atau super admin; RLS di database menegakkan hal yang sama
  if (
    me?.status !== "active" ||
    (c.admin_id !== user.id && me.role !== "super_admin")
  )
    redirect(`/komunitas/${d.slug}`);

  if (await checkContent([d.description, d.announcement, d.rules], []))
    back("error=curation");
  const update: Record<string, string | null> = {
    description: d.description || null,
    announcement: d.announcement || null,
    rules: d.rules || null,
  };

  for (const [field, col, remove] of [
    ["logo", "logo_url", d.remove_logo],
    ["banner", "banner_url", d.remove_banner],
  ] as const) {
    const f = fd.get(field) as File | null;
    if (f && f.size > 0) {
      if (!EXT[f.type] || f.size > 5 * 1024 * 1024) back("error=upload");
      if (await scanImage(await f.arrayBuffer())) back("error=curation");
      const path = `${user.id}/community-${field}-${crypto.randomUUID()}.${EXT[f.type]}`;
      const up = await sb.storage
        .from("media")
        .upload(path, f, { contentType: f.type });
      if (up.error) back("error=upload");
      update[col] = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
    } else if (remove === "on") update[col] = null;
  }
  const { error } = await sb.from("communities").update(update).eq("id", c.id);
  if (error) back("error=invalid");
  revalidatePath(`/komunitas/${d.slug}`);
  revalidatePath("/komunitas");
  back("ok=1");
}

/** Kelola anggota: keluarkan, blokir, buka blokir, atau serahkan peran admin. Hanya admin komunitas ini atau super admin. */
export async function manageMember(fd: FormData) {
  const p = z
    .object({
      slug: z.string().regex(/^[a-z0-9-]+$/),
      user_id: z.string().uuid(),
      mode: z.enum(["remove", "block", "unblock", "transfer"]),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) redirect("/komunitas");
  const { slug, user_id, mode } = p.data;
  const back = (q: string): never => redirect(`/komunitas/${slug}/kelola?${q}`);

  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/masuk");
  const { data: c } = await sb
    .from("communities")
    .select("id,admin_id")
    .eq("slug", slug)
    .maybeSingle();
  if (!c) redirect("/komunitas");
  const { data: me } = await sb
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();
  if (
    me?.status !== "active" ||
    (c.admin_id !== user.id && me.role !== "super_admin")
  )
    redirect(`/komunitas/${slug}`);
  if (user_id === c.admin_id) back("error=admin"); // admin tidak bisa dikeluarkan atau diblokir; serahkan perannya dulu

  const key = { community_id: c.id, user_id };
  if (mode === "remove") await sb.from("community_members").delete().match(key);
  if (mode === "block") {
    await sb.from("community_members").delete().match(key);
    const { error } = await sb.from("community_blocks").upsert(key);
    if (error) back("error=failed");
  }
  if (mode === "unblock") await sb.from("community_blocks").delete().match(key);
  if (mode === "transfer") {
    const { data: m } = await sb
      .from("community_members")
      .select("user_id")
      .match(key)
      .maybeSingle();
    if (!m) back("error=notmember");
    const { error } = await supabaseAdmin()
      .from("communities")
      .update({ admin_id: user_id })
      .eq("id", c.id); // admin_id hanya bisa diubah server
    if (error) back("error=failed");
    await audit(user.id, "community.transfer_admin", `community:${slug}`, {
      to: user_id,
    });
    revalidatePath(`/komunitas/${slug}`);
    redirect(`/komunitas/${slug}`); // admin lama (bukan super admin) tidak lagi punya akses kelola
  }
  await audit(user.id, `community.member_${mode}`, `community:${slug}`, {
    user_id,
  });
  revalidatePath(`/komunitas/${slug}`);
  back("ok=1");
}
