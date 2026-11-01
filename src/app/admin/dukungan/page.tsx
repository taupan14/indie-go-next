import { requireSuperAdmin } from "@/lib/admin";
import { safeUrl } from "@/lib/media";
import { Head, Flash, ui } from "@/components/AdminUI";
import { saveSupport } from "./actions";

export default async function Dukungan({
  searchParams,
}: {
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { sb } = await requireSuperAdmin();
  const { ok, error } = await searchParams;
  const { data } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "support")
    .maybeSingle();
  const qris = data?.value?.qris_url ? safeUrl(data.value.qris_url) : null;
  return (
    <main className="mx-auto max-w-xl px-4 py-6">
      <Head title="Dukungan (QRIS)" tab="sistem" />
      <Flash
        ok={ok}
        error={error}
        map={{
          invalid: "Tautan Saweria harus diawali https://.",
          upload: "Gambar tidak valid: maks. 5 MB, format JPG/PNG/WebP.",
        }}
      />
      <form action={saveSupport} className="space-y-4">
        <div className={`${ui.card} space-y-3`}>
          <h2 className="text-sm font-medium">Gambar QRIS</h2>
          {qris ? (
            <img
              src={qris}
              alt="QRIS saat ini"
              className="size-40 rounded-lg border border-border bg-white object-contain p-1"
            />
          ) : (
            <p className="text-xs text-muted">Belum ada gambar QRIS.</p>
          )}
          <input
            name="qris"
            type="file"
            accept="image/jpeg,image/png,image/webp"
            className="block text-xs"
          />
          <p className="text-xs text-muted">
            Unggah gambar QRIS asli dari Saweria. Gunakan gambar persegi yang
            tajam agar mudah dipindai. Maks. 5 MB.
          </p>
          {qris && (
            <label className="flex items-center gap-2 text-xs">
              <input name="remove_qris" type="checkbox" /> Hapus gambar QRIS
            </label>
          )}
        </div>
        <div className={`${ui.card} space-y-2`}>
          <label className="block text-sm font-medium">
            Tautan Saweria
            <input
              name="saweria_url"
              defaultValue={data?.value?.saweria_url ?? ""}
              placeholder="https://saweria.co/namaanda"
              className={`${ui.input} mt-1 w-full font-normal`}
            />
          </label>
        </div>
        <button className={ui.btn}>Simpan</button>
        <p className="text-xs text-muted">
          Bagian dukungan di footer tampil jika gambar QRIS atau tautan Saweria
          diisi. Jika keduanya kosong, bagian itu disembunyikan.
        </p>
      </form>
    </main>
  );
}
