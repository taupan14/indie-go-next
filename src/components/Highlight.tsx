const mark = "rounded bg-primary/15 px-0.5 text-inherit";
const esc = (s: string) => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Menyorot kata pencarian di teks biasa (judul). */
export function HighlightTerms({
  text,
  terms,
}: {
  text: string;
  terms: string[];
}) {
  if (!terms.length) return <>{text}</>;
  const parts = text.split(new RegExp(`(${terms.map(esc).join("|")})`, "gi"));
  return (
    <>
      {parts.map((p, i) =>
        i % 2 ? (
          <mark key={i} className={mark}>
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}

/** Menyorot potongan teks dari database yang diberi penanda [[kata]]; hanya teks, tanpa HTML. */
export function HighlightMarked({ text }: { text: string }) {
  return (
    <>
      {text.split(/\[\[|\]\]/).map((p, i) =>
        i % 2 ? (
          <mark key={i} className={mark}>
            {p}
          </mark>
        ) : (
          p
        ),
      )}
    </>
  );
}
