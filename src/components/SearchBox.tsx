import { buildHref } from "@/lib/search";

type P = {
  action: string;
  q: string;
  placeholder: string;
  button: string;
  clearLabel: string;
  hidden?: Record<string, string>;
};

/** Kotak cari (form GET): parameter lain seperti kategori dan urutan ikut terbawa lewat input tersembunyi. */
export default function SearchBox({
  action,
  q,
  placeholder,
  button,
  clearLabel,
  hidden = {},
}: P) {
  return (
    <form
      action={action}
      method="get"
      role="search"
      className="mb-3 flex gap-2"
    >
      {Object.entries(hidden)
        .filter(([, v]) => v)
        .map(([k, v]) => (
          <input key={k} type="hidden" name={k} value={v} />
        ))}
      <div className="relative min-w-0 flex-1">
        <svg
          viewBox="0 0 24 24"
          className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          aria-hidden
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m20 20-3.5-3.5" />
        </svg>
        <input
          type="search"
          name="q"
          defaultValue={q}
          maxLength={80}
          placeholder={placeholder}
          aria-label={placeholder}
          className="w-full rounded-xl border border-border bg-surface py-2 pl-9 pr-9 text-sm outline-none focus:border-primary"
        />
        {q && (
          <a
            href={buildHref(action, hidden)}
            aria-label={clearLabel}
            title={clearLabel}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted hover:text-foreground"
          >
            ✕
          </a>
        )}
      </div>
      <button className="rounded-xl bg-primary px-4 text-sm font-medium text-primary-foreground">
        {button}
      </button>
    </form>
  );
}
