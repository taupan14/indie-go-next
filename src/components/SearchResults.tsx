import Link from "next/link";
import { ago } from "@/lib/time";
import type { Locale } from "@/i18n";
import { HighlightMarked, HighlightTerms } from "./Highlight";

export default function SearchResults({
  rows,
  terms,
  locale,
  none,
  hint,
}: {
  rows: any[];
  terms: string[];
  locale: Locale;
  none: string;
  hint: string;
}) {
  if (!rows.length)
    return (
      <div className="py-10 text-center">
        <p className="text-sm font-medium">{none}</p>
        <p className="mt-1 text-xs text-muted">{hint}</p>
      </div>
    );
  return (
    <div>
      {rows.map((r) => (
        <Link
          key={r.id}
          href={`/thread/${r.id}`}
          className="block border-b border-border px-1 py-3 hover:bg-accent"
        >
          <span className="block text-sm font-medium">
            <HighlightTerms text={r.title} terms={terms} />
          </span>
          {r.snippet && (
            <span className="mt-0.5 line-clamp-2 block break-words text-xs text-muted">
              <HighlightMarked text={r.snippet} />
            </span>
          )}
          <span className="mt-1.5 flex flex-wrap items-center gap-x-2 gap-y-1 text-xs text-muted">
            <span className="rounded-full border border-border px-2 py-0.5">
              <span
                className="mr-1.5 inline-block size-2 rounded-sm"
                style={{ background: r.category_color }}
              />
              {r.category_name}
            </span>
            {r.community_name && (
              <span className="rounded-full border border-border px-2 py-0.5">
                {r.community_name}
              </span>
            )}
            <span>👍 {r.upvote_count}</span>
            <span>💬 {r.comment_count}</span>
            <span>{ago(r.last_activity_at, locale)}</span>
          </span>
        </Link>
      ))}
    </div>
  );
}

export function Pager({
  prev,
  next,
  prevLabel,
  nextLabel,
}: {
  prev?: string;
  next?: string;
  prevLabel: string;
  nextLabel: string;
}) {
  if (!prev && !next) return null;
  const a = "rounded-lg border border-border px-3 py-1.5 hover:bg-accent";
  return (
    <nav className="mt-4 flex items-center justify-between text-sm">
      <span>
        {prev && (
          <Link href={prev} className={a}>
            ← {prevLabel}
          </Link>
        )}
      </span>
      <span>
        {next && (
          <Link href={next} className={a}>
            {nextLabel} →
          </Link>
        )}
      </span>
    </nav>
  );
}
