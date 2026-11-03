import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { BannerStrip } from "@/components/Toggles";
import { SideBanner } from "@/components/BannerView";
import { safeUrl } from "@/lib/media";
import ThreadRows from "@/components/ThreadRows";
import SearchBox from "@/components/SearchBox";
import SearchResults, { Pager } from "@/components/SearchResults";
import { PAGE, buildHref, cleanQuery, pickSort, termsOf } from "@/lib/search";

type SP = { q?: string; kat?: string; urut?: string; hal?: string };
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export default async function Beranda({
  searchParams,
}: {
  searchParams: Promise<SP>;
}) {
  const sp = await searchParams;
  const q = cleanQuery(sp.q);
  const searching = q.length > 0;
  const kat = UUID.test(sp.kat ?? "") ? sp.kat! : "";
  const urut = pickSort(sp.urut, searching);
  const page = Math.max(1, Number(sp.hal) || 1);
  const locale = await getLocale();
  const t = makeT(locale);
  const sb = await supabaseServer();
  const now = new Date().toISOString();

  const list = searching
    ? sb.rpc("search_threads", {
        q,
        cat: kat || null,
        comm: null,
        sort: urut,
        lim: PAGE,
        off: (page - 1) * PAGE,
      })
    : (() => {
        let b = sb
          .from("threads")
          .select(
            "id,title,upvote_count,comment_count,last_activity_at,categories(name,color),communities(name,slug)",
          )
          .eq("status", "published");
        if (kat) b = b.eq("category_id", kat);
        return b
          .order(urut === "populer" ? "upvote_count" : "last_activity_at", {
            ascending: false,
          })
          .range((page - 1) * PAGE, page * PAGE - 1);
      })();
  const [{ data: rows }, { data: banners }, { data: cats }] = await Promise.all(
    [
      list,
      sb.from("banners").select("*").order("sort"),
      sb.from("categories").select("id,name,color").order("sort"),
    ],
  );
  const items = (rows ?? []) as any[];
  const total = searching ? Number(items[0]?.total ?? 0) : 0;
  const hasNext = searching ? total > page * PAGE : items.length === PAGE;

  const live = (banners ?? []).filter(
    (b: any) =>
      (!b.starts_at || b.starts_at <= now) && (!b.ends_at || b.ends_at >= now),
  );
  const strips = live.filter((b: any) => b.slot === "strip").slice(0, 3);
  const side = live.filter((b: any) => b.slot === "side").slice(0, 5);

  const defSort = searching ? "relevan" : "terbaru";
  const href = (o: Record<string, string>) =>
    buildHref("/", { q, kat, urut: urut === defSort ? "" : urut, ...o });
  const chip = (on: boolean) =>
    `inline-flex items-center rounded-md px-3 py-1 text-sm ${on ? "bg-primary text-primary-foreground" : "bg-accent"}`;
  const sorts = searching
    ? ["relevan", "terbaru", "populer"]
    : ["terbaru", "populer"];
  const sortLabel: Record<string, string> = {
    relevan: t("search.relevance"),
    terbaru: t("thread.latest"),
    populer: t("thread.popular"),
  };

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
          {/* Pencarian: tepat setelah banner strip pengumuman */}
          <SearchBox
            action="/"
            q={q}
            placeholder={t("search.placeholder")}
            button={t("search.button")}
            clearLabel={t("search.clear")}
            hidden={{
              kat,
              urut: sp.urut && sp.urut !== "relevan" ? sp.urut : "",
            }}
          />
          <div className="mb-3 flex flex-wrap items-center gap-1.5">
            <Link href={href({ kat: "", hal: "" })} className={chip(!kat)}>
              {t("search.allCategories")}
            </Link>
            {(cats ?? []).map((c: any) => (
              <Link
                key={c.id}
                href={href({ kat: c.id, hal: "" })}
                className={chip(kat === c.id)}
              >
                <span
                  className="mr-1.5 inline-block size-2 rounded-sm"
                  style={{ background: c.color }}
                />
                {c.name}
              </Link>
            ))}
          </div>
          <div className="mb-3 flex flex-wrap items-center gap-2">
            {sorts.map((s) => (
              <Link
                key={s}
                href={href({ urut: s === defSort ? "" : s, hal: "" })}
                className={chip(urut === s)}
              >
                {sortLabel[s]}
              </Link>
            ))}
            {searching && (
              <span className="ml-auto text-xs text-muted">
                {t("search.results", { n: total, q })}
              </span>
            )}
          </div>

          {searching ? (
            <SearchResults
              rows={items}
              terms={termsOf(q)}
              locale={locale}
              none={t("search.none", { q })}
              hint={t("search.hint")}
            />
          ) : (
            <ThreadRows
              threads={items}
              locale={locale}
              l={{
                topic: t("home.topic"),
                votes: t("thread.votes"),
                replies: t("home.replies"),
                active: t("thread.active"),
                empty: t("home.empty"),
              }}
            />
          )}
          <Pager
            prev={
              page > 1
                ? href({ hal: page > 2 ? String(page - 1) : "" })
                : undefined
            }
            next={hasNext ? href({ hal: String(page + 1) }) : undefined}
            prevLabel={t("search.prev")}
            nextLabel={t("search.next")}
          />
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
