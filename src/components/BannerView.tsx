import { safeUrl } from "@/lib/media";

/** Banner samping di Beranda: gambar penuh atau kartu teks. */
export function SideBanner({ b }: { b: any }) {
  const img = b.kind === "image" && b.image_url ? safeUrl(b.image_url) : null;
  if (img)
    return (
      <a
        href={b.link_url ?? "#"}
        className="block overflow-hidden rounded-xl border border-border"
      >
        <img src={img} alt={b.title} loading="lazy" className="w-full" />
      </a>
    );
  return (
    <a
      href={b.link_url ?? "#"}
      className="block rounded-xl border border-border bg-accent p-4"
    >
      <p className="text-sm font-medium">{b.title}</p>
      {b.body && <p className="mt-1 text-xs text-muted">{b.body}</p>}
    </a>
  );
}
