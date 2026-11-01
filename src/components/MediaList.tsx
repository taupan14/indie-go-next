import { safeUrl, youtubeId, type Media } from "@/lib/media";

export default function MediaList({ items }: { items: Media[] }) {
  if (!items?.length) return null;
  return (
    <div className="mt-3 space-y-3">
      {items.map((m, i) => {
        const url = safeUrl(m.url);
        if (!url) return null;
        if (m.type === "image")
          return <img key={i} src={url} alt="" loading="lazy" className="max-h-[480px] w-full rounded-lg border border-border object-contain" />;
        if (m.type === "youtube") {
          const id = youtubeId(url);
          return id ? (
            <iframe key={i} title="YouTube" loading="lazy" allowFullScreen
              src={`https://www.youtube-nocookie.com/embed/${id}`} className="aspect-video w-full rounded-lg border border-border" />
          ) : null;
        }
        return (
          <a key={i} href={url} target="_blank" rel="noopener noreferrer nofollow ugc"
            className="block truncate rounded-lg border border-border bg-accent px-3 py-2 text-sm text-primary">{url}</a>
        );
      })}
    </div>
  );
}
