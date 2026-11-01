import { requireSuperAdmin } from "@/lib/admin";
import { safeUrl } from "@/lib/media";
import { Head, Flash, ui } from "@/components/AdminUI";
import { BannerDialog, BannerOrder } from "@/components/BannerAdmin";
import { saveBanner, deleteBanner } from "./actions";

const toWib = (iso?: string | null) =>
  iso
    ? new Date(new Date(iso).getTime() + 7 * 3600e3).toISOString().slice(0, 16)
    : "";
const MAP = {
  invalid:
    "Judul wajib, tautan harus http(s) atau diawali /, dan waktu harus valid.",
  upload: "Gambar tidak valid: maks. 5 MB, format JPG/PNG/WebP/GIF.",
  noimage: "Banner berjenis Gambar wajib punya gambar.",
};

export default async function Banner({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { sb } = await requireSuperAdmin();
  const { ok, error } = await searchParams;
  const { data } = await sb.from("banners").select("*").order("sort");
  const now = Date.now();
  const banners = (data ?? []).map((b: any) => ({
    ...b,
    live:
      b.active &&
      (!b.starts_at || +new Date(b.starts_at) <= now) &&
      (!b.ends_at || +new Date(b.ends_at) >= now),
    img: b.kind === "image" && b.image_url ? safeUrl(b.image_url) : null,
  }));
  const zone = (slot: string) =>
    banners.filter((b: any) => b.slot === slot).map((b: any) => b.id);
  const status = (b: any) =>
    !b.active
      ? "Nonaktif"
      : b.live
        ? "Tayang"
        : b.starts_at && +new Date(b.starts_at) > now
          ? "Terjadwal"
          : "Berakhir";

  const Form = ({ b }: { b?: any }) => (
    <form action={saveBanner} className="grid gap-2 sm:grid-cols-2">
      {b && <input type="hidden" name="id" value={b.id} />}
      <label className="text-xs text-muted">
        Jenis
        <select
          name="kind"
          defaultValue={b?.kind ?? "text"}
          className={`${ui.input} mt-1 w-full`}
        >
          <option value="text">Teks</option>
          <option value="image">Gambar</option>
        </select>
      </label>
      <label className="text-xs text-muted">
        Posisi
        <select
          name="slot"
          defaultValue={b?.slot ?? "strip"}
          className={`${ui.input} mt-1 w-full`}
        >
          <option value="strip">Strip pengumuman (atas)</option>
          <option value="side">Banner samping</option>
        </select>
      </label>
      <input
        name="title"
        required
        maxLength={80}
        defaultValue={b?.title}
        placeholder="Judul (juga jadi teks alternatif gambar)"
        className={`${ui.input} sm:col-span-2`}
      />
      <input
        name="body"
        maxLength={200}
        defaultValue={b?.body ?? ""}
        placeholder="Teks singkat / deskripsi (tampil di strip dan banner samping jenis Teks)"
        className={`${ui.input} sm:col-span-2`}
      />
      <label className="text-xs text-muted sm:col-span-2">
        Gambar (jenis Gambar; JPG/PNG/WebP/GIF, maks. 5 MB)
        {b?.img && (
          <img
            src={b.img}
            alt=""
            className="mb-1 mt-1 max-h-24 rounded-lg border border-border"
          />
        )}
        <input
          name="image"
          type="file"
          accept="image/jpeg,image/png,image/webp,image/gif"
          className="mt-1 block text-xs"
        />
      </label>
      <input
        name="link_url"
        defaultValue={b?.link_url ?? ""}
        placeholder="Tautan (https://... atau /komunitas)"
        className={`${ui.input} sm:col-span-2`}
      />
      <label className="text-xs text-muted">
        Mulai (WIB)
        <input
          name="starts_at"
          type="datetime-local"
          defaultValue={toWib(b?.starts_at)}
          className={`${ui.input} mt-1 w-full`}
        />
      </label>
      <label className="text-xs text-muted">
        Selesai (WIB)
        <input
          name="ends_at"
          type="datetime-local"
          defaultValue={toWib(b?.ends_at)}
          className={`${ui.input} mt-1 w-full`}
        />
      </label>
      <label className="flex items-center gap-2 text-sm">
        <input
          name="active"
          type="checkbox"
          defaultChecked={b?.active ?? true}
        />{" "}
        Aktif
      </label>
      <div className="flex justify-end gap-2">
        {b && (
          <button formAction={deleteBanner} formNoValidate className={ui.ghost}>
            Hapus
          </button>
        )}
        <button className={ui.btn}>{b ? "Simpan" : "Tambah banner"}</button>
      </div>
    </form>
  );

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title="Banner" tab="konten" />
      <Flash ok={ok} error={error} map={MAP} />

      <h2 className="mb-2 text-sm font-medium">Banner baru</h2>
      <div className={`${ui.card} mb-6`}>
        <Form />
      </div>

      <h2 className="mb-1 text-sm font-medium">Atur posisi</h2>
      <p className="mb-2 text-xs text-muted">
        Seret banner ke zona lain atau ubah urutannya (atau pakai tombol ▲▼),
        lalu simpan. Beranda menampilkan 3 strip dan 5 banner samping teratas
        yang aktif dan sesuai jadwal.
      </p>
      <div className="mb-6">
        <BannerOrder
          initial={{ strip: zone("strip"), side: zone("side") }}
          items={banners.map((b: any) => ({
            id: b.id,
            title: b.title,
            body: b.body ?? "",
            image: b.img,
            live: b.live,
          }))}
        />
      </div>

      <h2 className="mb-2 text-sm font-medium">
        Daftar banner ({banners.length})
      </h2>
      <div className="space-y-1.5">
        {banners.map((b: any) => (
          <BannerDialog
            key={b.id}
            title="Detail banner"
            trigger={
              <span className="flex items-center gap-3 rounded-xl border border-border bg-surface p-2.5 hover:bg-accent">
                {b.img ? (
                  <img
                    src={b.img}
                    alt=""
                    className="size-10 shrink-0 rounded-lg object-cover"
                  />
                ) : (
                  <span className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-accent text-xs text-muted">
                    Aa
                  </span>
                )}
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-sm font-medium">
                    {b.title}
                  </span>
                  <span className="text-xs text-muted">
                    {b.slot === "strip" ? "Strip" : "Samping"} ·{" "}
                    {b.kind === "image" ? "Gambar" : "Teks"}
                  </span>
                </span>
                <span
                  className={`rounded-full px-2 py-0.5 text-xs ${b.live ? "bg-primary text-primary-foreground" : "bg-accent text-muted"}`}
                >
                  {status(b)}
                </span>
              </span>
            }
          >
            <Form b={b} />
          </BannerDialog>
        ))}
        {!banners.length && (
          <p className="py-6 text-center text-sm text-muted">
            Belum ada banner.
          </p>
        )}
      </div>
    </main>
  );
}
