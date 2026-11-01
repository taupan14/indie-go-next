/** Ruang iklan Google Ads (belum aktif). Tinggi minimum dipesan agar halaman tidak melompat saat iklan dimuat nanti.
 *  Untuk mengaktifkan: ganti isi <aside> ini dengan <ins class="adsbygoogle" data-ad-client=... data-ad-slot=... />
 *  dan muat skrip AdSense (bagian ini sengaja belum diimplementasikan). */
export default function AdSlot({
  label,
  hint,
}: {
  label: string;
  hint: string;
}) {
  return (
    <aside
      aria-label={label}
      data-ad-slot="thread-between"
      className="my-4 flex min-h-[110px] flex-col items-center justify-center rounded-xl border border-dashed border-border px-3 py-4 text-center"
      style={{
        backgroundImage:
          "repeating-linear-gradient(135deg, var(--accent) 0 8px, var(--background) 8px 16px)",
      }}
    >
      <span className="rounded bg-surface px-2 py-0.5 text-[11px] font-medium tracking-wide">
        {label}
      </span>
      <span className="mt-1 text-xs text-muted">{hint}</span>
    </aside>
  );
}
