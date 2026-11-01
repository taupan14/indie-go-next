import Link from "next/link";
import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { CommunityBanner, CommunityLogo } from "@/components/CommunityArt";
import ThreadRows from "@/components/ThreadRows";
import MembersDialog from "@/components/MembersDialog";
import { toggleMembership } from "../actions";

const box = "rounded-xl border border-border bg-surface p-4";
const btn =
  "rounded-lg bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground";

export default async function CommunityPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const locale = await getLocale();
  const t = makeT(locale);
  const sb = await supabaseServer();
  const { data: c } = await sb
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!c) notFound();
  const {
    data: { user },
  } = await sb.auth.getUser();

  const { data: threads } = await sb
    .from("threads")
    .select(
      "id,title,upvote_count,comment_count,last_activity_at,categories(name,color)",
    )
    .eq("community_id", c.id)
    .eq("status", "published")
    .order("last_activity_at", { ascending: false })
    .limit(30);

  // Daftar anggota hanya untuk pengguna login
  let members: { username: string; joined: string }[] = [];
  let isMember = false;
  const ids = [c.admin_id];
  if (user) {
    const { data: rows } = await sb
      .from("community_members")
      .select("user_id,joined_at")
      .eq("community_id", c.id)
      .order("joined_at")
      .limit(500);
    isMember = !!rows?.some((r: any) => r.user_id === user.id);
    ids.push(...(rows ?? []).map((r: any) => r.user_id));
    const { data: names } = await sb
      .from("author_public")
      .select("id,username")
      .in("id", [...new Set(ids)]);
    const fmt = new Intl.DateTimeFormat(locale === "id" ? "id-ID" : "en-US", {
      month: "short",
      year: "numeric",
    });
    members = (rows ?? []).map((r: any) => ({
      username: names?.find((n: any) => n.id === r.user_id)?.username ?? "?",
      joined: fmt.format(new Date(r.joined_at)),
    }));
  }
  const { data: adm } = await sb
    .from("author_public")
    .select("username")
    .eq("id", c.admin_id)
    .maybeSingle();
  const isAdmin = user?.id === c.admin_id;
  const { data: me } = user
    ? await sb.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const canManage = isAdmin || me?.role === "super_admin";

  return (
    <main className="mx-auto max-w-5xl px-4 py-5">
      <div className="overflow-hidden rounded-xl border border-border">
        <CommunityBanner c={c} className="h-28 md:h-36" />
      </div>

      <div className="my-4 flex flex-wrap items-center gap-3">
        <CommunityLogo c={c} size={52} />
        <div className="min-w-0 flex-1">
          <h1 className="text-xl font-medium">{c.name}</h1>
          <p className="text-xs text-muted">
            {c.member_count} {t("community.membersCount")} · {c.thread_count}{" "}
            {t("community.threads")}
          </p>
        </div>
        {!user ? (
          <Link href="/masuk" className={btn}>
            {t("community.join")}
          </Link>
        ) : isMember ? (
          <>
            <Link href={`/thread/new?c=${c.id}`} className={btn}>
              {t("nav.newThread")}
            </Link>
            {!isAdmin && (
              <form action={toggleMembership}>
                <input type="hidden" name="community_id" value={c.id} />
                <input type="hidden" name="slug" value={c.slug} />
                <button className="rounded-lg border border-border px-3 py-1.5 text-sm text-muted">
                  {t("community.leave")}
                </button>
              </form>
            )}
          </>
        ) : (
          <form action={toggleMembership}>
            <input type="hidden" name="community_id" value={c.id} />
            <input type="hidden" name="slug" value={c.slug} />
            <button className={btn}>{t("community.join")}</button>
          </form>
        )}
      </div>
      {user && !isMember && (
        <p className="mb-3 text-xs text-muted">{t("community.joinToPost")}</p>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_240px]">
        <section>
          <ThreadRows
            threads={threads ?? []}
            locale={locale}
            l={{
              topic: t("home.topic"),
              votes: t("thread.votes"),
              replies: t("home.replies"),
              active: t("thread.active"),
              empty: t("community.noThreads"),
            }}
          />
        </section>
        <aside className="space-y-3 text-sm">
          {c.description && (
            <div className={box}>
              <p className="text-xs text-muted">{t("community.about")}</p>
              <p className="mt-1">{c.description}</p>
            </div>
          )}
          {c.announcement && (
            <div className={box}>
              <p className="text-xs text-muted">
                {t("community.announcement")}
              </p>
              <p className="mt-1 whitespace-pre-wrap">{c.announcement}</p>
            </div>
          )}
          {c.rules && (
            <div className={box}>
              <p className="text-xs text-muted">{t("community.rules")}</p>
              <p className="mt-1 whitespace-pre-wrap">{c.rules}</p>
            </div>
          )}
          <div className={box}>
            <p className="text-xs text-muted">{t("community.admin")}</p>
            <p className="mt-1 font-medium">{adm?.username ?? "?"}</p>
            {canManage && (
              <Link
                href={`/komunitas/${c.slug}/kelola`}
                className="mt-2 inline-block text-xs font-medium text-primary"
              >
                Kelola komunitas
              </Link>
            )}
            <p className="mt-3 text-xs text-muted">{t("community.members")}</p>
            <p className="font-medium">{c.member_count}</p>
            {user ? (
              <MembersDialog
                label={t("community.viewMembers")}
                title={t("community.members")}
                close={t("community.close")}
                count={members.length}
                members={members}
              />
            ) : (
              <p className="mt-2 text-xs text-muted">
                {t("community.signInMembers")}
              </p>
            )}
          </div>
        </aside>
      </div>
    </main>
  );
}
