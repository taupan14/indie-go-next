import { tint, initials } from "@/lib/community";
import { safeUrl } from "@/lib/media";

type C = { slug: string; name: string; logo_url?: string | null; banner_url?: string | null };

export function CommunityLogo({ c, size = 40 }: { c: C; size?: number }) {
  const url = c.logo_url ? safeUrl(c.logo_url) : null;
  const style = { width: size, height: size };
  return url
    ? <img src={url} alt="" style={style} className="shrink-0 rounded-xl object-cover" />
    : <span style={{ ...style, background: tint(c.slug) }} aria-hidden
        className="inline-flex shrink-0 items-center justify-center rounded-xl text-sm font-medium text-[#2B1B17]">{initials(c.name)}</span>;
}

export function CommunityBanner({ c, className = "h-24" }: { c: C; className?: string }) {
  const url = c.banner_url ? safeUrl(c.banner_url) : null;
  return url
    ? <img src={url} alt="" className={`w-full object-cover ${className}`} />
    : <div className={`w-full ${className}`} style={{ background: tint(c.slug) }} />;
}
