import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT, type Locale } from "@/i18n";
import { BannerStrip } from "@/components/Toggles";
import { SideBanner } from "@/components/BannerView";
import { safeUrl } from "@/lib/media";

const UNIT = {
  id: { m: "m", h: "j", d: "h" },
  en: { m: "m", h: "h", d: "d" },
} as const;
function ago(iso: string, l: Locale) {
  const m = Math.max(
    1,
    Math.floor((Date.now() - new Date(iso).getTime()) / 60000),
  );
  if (m < 60) return m + UNIT[l].m;
  if (m < 1440) return Math.floor(m / 60) + UNIT[l].h;
  return Math.floor(m / 1440) + UNIT[l].d;
}

export default async function Beranda({
  searchParams,
}: {
  searchParams: Promise<{ urut?: string }>;
}) {
  const { urut } = await searchParams;
  const popular = urut === "populer";
  const locale = await getLocale();
  const t = makeT(locale);
  const sb = await supabaseServer();
  const now = new Date().toISOString();

  const [{ data: threads }, { data: banners }] = await Promise.all([
    sb
      .from("threads")
      .select(
        "id,title,upvote_count,comment_count,last_activity_at,categories(name,color),communities(name,slug)",
      )
      .eq("status", "published")
      .order(popular ? "upvote_count" : "last_activity_at", {
        ascending: false,
      })
      .limit(30),
    sb.from("banners").select("*").order("sort"),
  ]);
  const live = (banners ?? []).filter(
    (b: any) =>
      (!b.starts_at || b.starts_at <= now) && (!b.ends_at || b.ends_at >= now),
  );
  const strips = live.filter((b: any) => b.slot === "strip").slice(0, 3);
  const side = live.filter((b: any) => b.slot === "side").slice(0, 5);
  const tab = (on: boolean) =>
    `rounded-full px-3 py-1 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-accent"}`;

  return (
    <main className="mx-auto max-w-5xl px-4 py-5">
      {strips.map((strip: any) => (
        <BannerStrip
          key={strip.id}
          text={strip.title}
          body={strip.body}
          href={strip.link_url}
          image={strip.kind === "image" ? safeUrl(strip.image_url ?? "") : null}
          dismiss={t("home.dismiss")}
        />
      ))}
      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_260px]">
        <section>
          <div className="mb-3 flex gap-2">
            <Link href="/" className={tab(!popular)}>
              {t("thread.latest")}
            </Link>
            <Link href="/?urut=populer" className={tab(popular)}>
              {t("thread.popular")}
            </Link>
          </div>
          <div className="grid grid-cols-[minmax(0,1fr)_44px_44px] sm:grid-cols-[minmax(0,1fr)_56px_56px_48px] gap-2 border-b border-border px-1 pb-2 text-xs text-muted">
            <span>{t("home.topic")}</span>
            <span className="text-center">{t("thread.votes")}</span>
            <span className="text-center">{t("home.replies")}</span>
            <span className="hidden text-center sm:block">
              {t("thread.active")}
            </span>
          </div>
          {(threads ?? []).map((th: any) => (
            <Link
              key={th.id}
              href={`/thread/${th.id}`}
              className="grid grid-cols-[minmax(0,1fr)_44px_44px] sm:grid-cols-[minmax(0,1fr)_56px_56px_48px] items-center gap-2 border-b border-border px-1 py-3 text-sm hover:bg-accent"
            >
              <span>
                <span className="block font-medium">{th.title}</span>
                <span className="mt-1 flex flex-wrap gap-1.5 text-xs text-muted">
                  <span className="rounded-full border border-border px-2 py-0.5">
                    <span
                      className="mr-1.5 inline-block size-2 rounded-sm"
                      style={{ background: th.categories?.color }}
                    />
                    {th.categories?.name}
                  </span>
                  {th.communities && (
                    <span className="rounded-full border border-border px-2 py-0.5">
                      {th.communities.name}
                    </span>
                  )}
                </span>
              </span>
              <span className="text-center">{th.upvote_count}</span>
              <span className="text-center">{th.comment_count}</span>
              <span className="hidden text-center text-xs text-muted sm:block">
                {ago(th.last_activity_at, locale)}
              </span>
            </Link>
          ))}
          {!threads?.length && (
            <p className="py-10 text-center text-sm text-muted">
              {t("home.empty")}
            </p>
          )}
        </section>

        <aside className="space-y-3">
          {side.map((b: any) => (
            <SideBanner key={b.id} b={b} />
          ))}
        </aside>
      </div>
    </main>
  );
}
