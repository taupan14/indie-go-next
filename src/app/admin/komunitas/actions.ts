"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { checkContent } from "@/lib/curation";

const schema = z.object({
  name: z.string().trim().min(3).max(60),
  slug: z.string().trim().toLowerCase().optional(),
  description: z.string().trim().max(300).default(""),
  email: z.string().trim().email(),
});
const slugify = (s: string) => s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
const go = (q: string): never => redirect(`/admin/komunitas?${q}`);

export async function createCommunity(fd: FormData) {
  const { user } = await requireSuperAdmin();
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) go("error=invalid");
  const d = p.data!;
  const slug = slugify(d.slug || d.name);
  if (slug.length < 3) go("error=invalid");
  if (await checkContent([d.name, d.description], [])) go("error=curation");

  const a = supabaseAdmin();
  // Admin = pengguna yang sudah ada (cari lewat email), atau undang lewat email
  let adminId: string | null = (await a.rpc("user_id_by_email", { e: d.email })).data;
  if (!adminId) {
    const origin = (await headers()).get("origin");
    const local = d.email.split("@")[0].toLowerCase().replace(/[^a-z0-9_]/g, "_").slice(0, 14);
    const { data, error } = await a.auth.admin.inviteUserByEmail(d.email, {
      data: { username: `${local}_${crypto.randomUUID().slice(0, 4)}` },
      redirectTo: `${origin}/auth/callback?next=${encodeURIComponent("/settings?s=akun")}`,
    });
    if (error || !data.user) go("error=invite");
    adminId = data.user!.id;
  }
  const { error } = await a.from("communities").insert({ slug, name: d.name, description: d.description || null, admin_id: adminId });
  if (error) go(error.code === "23505" ? "error=slug" : "error=invalid");
  await audit(user.id, "community.create", `community:${slug}`, { admin: adminId });
  go("ok=1");
}
