import "server-only";
import { redirect } from "next/navigation";
import { supabaseServer } from "./supabase/server";
import { supabaseAdmin } from "./supabase/admin";

/** Dipanggil di awal setiap halaman dan aksi admin. Selain super admin aktif diarahkan keluar. */
export async function requireSuperAdmin() {
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/masuk");
  const { data: p } = await sb.from("profiles").select("role,status").eq("id", user.id).single();
  if (p?.role !== "super_admin" || p.status !== "active") redirect("/");
  return { sb, user };
}

export async function audit(actor: string, action: string, target: string, meta: object = {}) {
  await supabaseAdmin().from("audit_logs").insert({ actor_id: actor, action, target, meta });
}

export const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 40);
