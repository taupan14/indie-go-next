"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";

export async function toggleMembership(fd: FormData) {
  const cid = String(fd.get("community_id"));
  const slug = String(fd.get("slug") ?? "");
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/masuk");
  const { data: ex } = await sb.from("community_members").select("user_id").eq("community_id", cid).eq("user_id", user.id).maybeSingle();
  // Admin tidak bisa keluar: ditegakkan oleh RLS (members_leave)
  if (ex) await sb.from("community_members").delete().eq("community_id", cid).eq("user_id", user.id);
  else await sb.from("community_members").insert({ community_id: cid, user_id: user.id });
  revalidatePath("/komunitas");
  if (/^[a-z0-9-]+$/.test(slug)) revalidatePath(`/komunitas/${slug}`);
}
