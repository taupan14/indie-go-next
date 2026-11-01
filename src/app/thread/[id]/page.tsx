import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { ago } from "@/lib/time";
import { safeUrl } from "@/lib/media";
import { tint, initials } from "@/lib/community";
import { levelOf, levelsFrom } from "@/lib/popularity";
import { liveSideBanners } from "@/lib/banners";
import MediaList from "@/components/MediaList";
import ThreadActions from "@/components/ThreadActions";
import AdSlot from "@/components/AdSlot";
import { SideBanner } from "@/components/BannerView";
import { addComment, toggleMembership, reportContent } from "./actions";

const box = "rounded-xl border border-border bg-surface p-4";
const btn =
  "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground";

export default async function ThreadPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const locale = await getLocale();
  const t = makeT(locale);
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { data: th } = await sb
    .from("threads")
    .select(
      "*,categories(name,color),communities(id,name,slug,description,member_count,admin_id)",
    )
    .eq("id", id)
    .maybeSingle();
  if (!th) notFound();

  // Komentar dan interaksi hanya untuk pengguna login (RLS juga menegakkan ini)
  let comments: any[] = [],
    liked = false,
    disliked = false,
    myScore: number | null = null,
    isMember = false;
  if (user) {
    const [c, v, d, r, m] = await Promise.all([
      sb
        .from("comments")
        .select("*")
        .eq("thread_id", id)
        .eq("status", "published")
        .order("created_at"),
      sb
        .from("votes")
        .select("id")
        .eq("thread_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      sb
        .from("dislikes")
        .select("user_id")
        .eq("thread_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      sb
        .from("ratings")
        .select("score")
        .eq("thread_id", id)
        .eq("user_id", user.id)
        .maybeSingle(),
      th.communities
        ? sb
            .from("community_members")
            .select("user_id")
            .eq("community_id", th.communities.id)
            .eq("user_id", user.id)
            .maybeSingle()
        : Promise.resolve({ data: null }),
    ]);
    comments = c.data ?? [];
    liked = !!v.data;
    disliked = !!d.data;
    myScore = r.data?.score ?? null;
    isMember = !!m.data;
  }
  const ids = [
    ...new Set(
      [
        th.author_id,
        ...comments.map((c) => c.author_id),
        th.communities?.admin_id,
      ].filter(Boolean),
    ),
  ];
  const { data: authors } = await sb
    .from("author_public")
    .select("id,username,avatar_url")
    .in("id", ids);
  const name = (uid: string | null) =>
    (uid && authors?.find((a: any) => a.id === uid)?.username) ||
    t("thread.deletedUser");
  const author = authors?.find((a: any) => a.id === th.author_id);
  const nm = name(th.author_id);
  const avatar = author?.avatar_url ? safeUrl(author.avatar_url) : null;

  // Lencana dan jumlah thread penulis hanya untuk pengguna login (profil tertutup bagi tamu)
  let threadCount: number | null = null,
    level: string | null = null;
  if (user && th.author_id) {
    const [tc, pts, ps] = await Promise.all([
      sb
        .from("threads")
        .select("id", { count: "exact", head: true })
        .eq("author_id", th.author_id)
        .eq("status", "published"),
      sb.rpc("popularity_of", { uid: th.author_id }),
      sb
        .from("app_settings")
        .select("value")
        .eq("key", "popularity")
        .maybeSingle(),
    ]);
    threadCount = tc.count ?? 0;
    level = levelOf(Number(pts.data ?? 0), levelsFrom(ps.data?.value)).key;
  }
  const sideBanners = await liveSideBanners(sb);
  const posted =
    new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
      dateStyle: "medium",
      timeStyle: "short",
      timeZone: "Asia/Jakarta",
    }).format(new Date(th.created_at)) + " WIB";
  const avg = th.rating_count ? th.rating_sum / th.rating_count : null;

  const roots = comments.filter((c) => !c.parent_id);
  const REASONS = [
    "porn",
    "drugs",
    "gambling",
    "trafficking",
    "violence",
    "swearing",
    "racism",
    "other",
  ];
  const Report = ({ comment }: { comment?: string }) => (
    <details className="mt-1">
      <summary className="cursor-pointer text-xs text-muted">
        {t("report.button")}
      </summary>
      <form action={reportContent} className="mt-1 flex gap-2">
        <input type="hidden" name="thread_id" value={id} />
        {comment && <input type="hidden" name="comment_id" value={comment} />}
        <select
          name="reason"
          required
          defaultValue=""
          className="rounded-lg border border-border bg-background px-2 py-1 text-xs"
        >
          <option value="" disabled>
            —
          </option>
          {REASONS.map((r) => (
            <option key={r} value={r}>
              {t("report.reason_" + r)}
            </option>
          ))}
        </select>
        <button className="rounded-lg border border-border px-2 py-1 text-xs">
          {t("report.send")}
        </button>
      </form>
    </details>
  );
  const CommentForm = ({ parent }: { parent?: string }) => (
    <form action={addComment} className="mt-2 flex gap-2">
      <input type="hidden" name="thread_id" value={id} />
      {parent && <input type="hidden" name="parent_id" value={parent} />}
      <input
        name="body"
        required
        maxLength={5000}
        placeholder={t("thread.write")}
        className="flex-1 rounded-lg border border-border bg-background px-3 py-1.5 text-sm outline-none focus:border-primary"
      />
      <button className={btn}>{t("thread.send")}</button>
    </form>
  );

  return (
    <main className="mx-auto grid max-w-5xl gap-4 px-4 py-5 md:grid-cols-[minmax(0,1fr)_240px]">
      <section className="min-w-0">
        <article className={box}>
          <h1 className="text-xl font-medium">{th.title}</h1>
          <p className="mt-1 text-xs text-muted">
            {nm} · {ago(th.created_at, locale)} · {th.categories?.name}
          </p>
          <p className="mt-3 whitespace-pre-wrap break-words text-sm">
            {th.body}
          </p>
          <MediaList items={th.media} />
        </article>

        <div className="mt-3">
          <ThreadActions
            threadId={id}
            title={th.title}
            likes={th.upvote_count}
            dislikes={th.dislike_count}
            avg={avg}
            count={th.rating_count}
            liked={liked}
            disliked={disliked}
            myScore={myScore}
            signedIn={!!user}
            locale={locale}
            labels={{
              like: t("thread.like"),
              dislike: t("thread.dislike"),
              share: t("thread.share"),
              copy: t("thread.copyLink"),
              copied: t("thread.copied"),
              more: t("thread.shareMore"),
              signIn: t("thread.signInToReact"),
              noRating: t("thread.noRating"),
              error: t("thread.actionError"),
              rates: [1, 2, 3, 4, 5].map((n) => t("thread.rate" + n)),
            }}
          />
        </div>

        {/* Ruang Google Ads: pemisah antara thread dan komentar */}
        <AdSlot label={t("thread.adLabel")} hint={t("thread.adHint")} />

        <h2 className="mb-3 text-sm font-medium">
          {t("thread.comments")} ({th.comment_count})
        </h2>
        {!user ? (
          <div className="rounded-xl border border-dashed border-border bg-surface p-6 text-center">
            <p className="font-medium">
              {t("thread.lockedComments", { count: th.comment_count })}
            </p>
            <div className="mt-3 flex justify-center gap-2">
              <Link href="/masuk" className={btn}>
                {t("nav.signIn")}
              </Link>
              <Link
                href="/masuk?mode=daftar"
                className="rounded-lg border border-border px-3 py-1.5 text-sm"
              >
                {t("nav.signUp")}
              </Link>
            </div>
          </div>
        ) : (
          <div className="space-y-3">
            {!roots.length && (
              <p className="text-sm text-muted">{t("thread.noComments")}</p>
            )}
            {roots.map((c) => (
              <div key={c.id} className={box}>
                <p className="text-xs text-muted">
                  {name(c.author_id)} · {ago(c.created_at, locale)}
                </p>
                <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                  {c.body}
                </p>
                {c.author_id !== user.id && <Report comment={c.id} />}
                {comments
                  .filter((r) => r.parent_id === c.id)
                  .map((r) => (
                    <div
                      key={r.id}
                      className="ml-4 mt-3 border-l-2 border-border pl-3"
                    >
                      <p className="text-xs text-muted">
                        {name(r.author_id)} · {ago(r.created_at, locale)}
                      </p>
                      <p className="mt-1 whitespace-pre-wrap break-words text-sm">
                        {r.body}
                      </p>
                      {r.author_id !== user.id && <Report comment={r.id} />}
                    </div>
                  ))}
                <details className="mt-2">
                  <summary className="cursor-pointer text-xs text-primary">
                    {t("thread.reply")}
                  </summary>
                  <CommentForm parent={c.id} />
                </details>
              </div>
            ))}
            {th.status === "published" && (
              <div className={box}>
                <CommentForm />
              </div>
            )}
          </div>
        )}
      </section>

      <aside className="space-y-3 text-sm">
        <div className={box}>
          <div className="flex items-center gap-3">
            {avatar ? (
              <img
                src={avatar}
                alt=""
                className="size-11 shrink-0 rounded-full object-cover"
              />
            ) : (
              <span
                className="inline-flex size-11 shrink-0 items-center justify-center rounded-full text-sm font-medium text-[#2B1B17]"
                style={{ background: tint(nm) }}
              >
                {initials(nm)}
              </span>
            )}
            <div className="min-w-0">
              {user && th.author_id ? (
                <Link
                  href={`/u/${nm}`}
                  className="block truncate font-medium hover:underline"
                >
                  {nm}
                </Link>
              ) : (
                <p className="truncate font-medium">{nm}</p>
              )}
              {level && (
                <span className="mt-0.5 inline-block rounded-full border border-primary px-2 py-0.5 text-[11px] text-primary">
                  {t("profile.level_" + level)}
                </span>
              )}
            </div>
          </div>
          {threadCount !== null && (
            <p className="mt-3 text-xs text-muted">
              {threadCount} {t("thread.threadsCount")}
            </p>
          )}
          <p
            className={`${threadCount !== null ? "mt-1" : "mt-3"} text-xs text-muted`}
          >
            {posted}
          </p>
          {user && th.author_id !== user.id && <Report />}
        </div>

        {sideBanners.map((b: any) => (
          <SideBanner key={b.id} b={b} />
        ))}

        {th.communities && (
          <div className={box}>
            <p className="text-xs text-muted">{t("thread.about")}</p>
            <p className="mt-1 font-medium">{th.communities.name}</p>
            {th.communities.description && (
              <p className="mt-1 text-xs text-muted">
                {th.communities.description}
              </p>
            )}
            <p className="mt-2 text-xs text-muted">
              {t("thread.admin")}: {name(th.communities.admin_id)} ·{" "}
              {th.communities.member_count} {t("thread.members")}
            </p>
            {user ? (
              <form action={toggleMembership} className="mt-3">
                <input
                  type="hidden"
                  name="community_id"
                  value={th.communities.id}
                />
                <input type="hidden" name="thread_id" value={id} />
                <button
                  className={
                    isMember
                      ? "rounded-lg border border-primary px-3 py-1.5 text-sm font-medium text-primary"
                      : btn
                  }
                >
                  {isMember ? t("community.member") : t("community.join")}
                </button>
              </form>
            ) : (
              <Link href="/masuk" className={`${btn} mt-3 inline-block`}>
                {t("thread.signInToJoin")}
              </Link>
            )}
          </div>
        )}
      </aside>
    </main>
  );
}
