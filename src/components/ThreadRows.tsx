import Link from "next/link";
import { ago } from "@/lib/time";
import type { Locale } from "@/i18n";

type Labels = {
  topic: string;
  votes: string;
  replies: string;
  active: string;
  empty: string;
};

export default function ThreadRows({
  threads,
  locale,
  l,
}: {
  threads: any[];
  locale: Locale;
  l: Labels;
}) {
  const grid =
    "grid grid-cols-[minmax(0,1fr)_44px_44px] sm:grid-cols-[minmax(0,1fr)_56px_56px_48px] items-center gap-2";
  return (
    <div>
      <div
        className={`${grid} border-b border-border px-1 pb-2 text-xs text-muted`}
      >
        <span>{l.topic}</span>
        <span className="text-center">{l.votes}</span>
        <span className="text-center">{l.replies}</span>
        <span className="hidden text-center sm:block">{l.active}</span>
      </div>
      {threads.map((th) => (
        <Link
          key={th.id}
          href={`/thread/${th.id}`}
          className={`${grid} border-b border-border px-1 py-3 text-sm hover:bg-accent`}
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
      {!threads.length && (
        <p className="py-10 text-center text-sm text-muted">{l.empty}</p>
      )}
    </div>
  );
}
