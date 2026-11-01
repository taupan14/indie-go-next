import { getLocale, makeT } from "@/i18n";
import { PAGES, type PageKey } from "@/content/pages";

export default async function InfoPage({ k }: { k: PageKey }) {
  const locale = await getLocale();
  const t = makeT(locale);
  const doc = PAGES[locale][k];
  return (
    <main className="mx-auto max-w-2xl px-4 py-8">
      <h1 className="text-2xl font-medium">{doc.title}</h1>
      {doc.draft && (
        <p
          role="note"
          className="mt-3 rounded-lg border border-border bg-accent px-3 py-2 text-xs text-muted"
        >
          {t("footer.draft")}
        </p>
      )}
      <div className="mt-4">
        {doc.blocks.map((b, i) =>
          b.startsWith("## ") ? (
            <h2 key={i} className="mb-1 mt-6 text-base font-medium">
              {b.slice(3)}
            </h2>
          ) : (
            <p key={i} className="mb-2 text-sm leading-relaxed">
              {b}
            </p>
          ),
        )}
      </div>
    </main>
  );
}
