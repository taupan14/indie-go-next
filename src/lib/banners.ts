import type { SupabaseClient } from "@supabase/supabase-js";

/** Banner samping yang aktif dan sesuai jadwal, urut sesuai posisi di panel admin. */
export async function liveSideBanners(sb: SupabaseClient, limit = 5) {
  const { data } = await sb
    .from("banners")
    .select("*")
    .eq("slot", "side")
    .order("sort");
  const now = new Date().toISOString();
  return (data ?? [])
    .filter(
      (b: any) =>
        b.active &&
        (!b.starts_at || b.starts_at <= now) &&
        (!b.ends_at || b.ends_at >= now),
    )
    .slice(0, limit);
}
