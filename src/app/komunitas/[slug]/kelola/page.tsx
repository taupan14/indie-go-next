import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { safeUrl } from "@/lib/media";
import { CommunityBanner, CommunityLogo } from "@/components/CommunityArt";
import { Flash, ui } from "@/components/AdminUI";
import { updateCommunity } from "./actions";

const MAP = {
  invalid: "Isian tidak valid atau gagal disimpan.",
  upload: "Gambar tidak valid: maks. 5 MB, format JPG/PNG/WebP/GIF.",
  curation: "Tidak bisa disimpan karena mengandung konten yang dilarang.",
};

export default async function Kelola({
  params,
  searchParams,
}: {
  params: Promise<{ slug: string }>;
  searchParams: Promise<{ ok?: string; error?: string }>;
}) {
  const { slug } = await params;
  const { ok, error } = await searchParams;
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/masuk");
  const { data: c } = await sb
    .from("communities")
    .select("*")
    .eq("slug", slug)
    .maybeSingle();
  if (!c) notFound();
  const { data: me } = await sb
    .from("profiles")
    .select("role,status")
    .eq("id", user.id)
    .single();
  if (
    me?.status !== "active" ||
    (c.admin_id !== user.id && me.role !== "super_admin")
  )
    redirect(`/komunitas/${slug}`);

  const area = `${ui.input} w-full`;
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href={`/komunitas/${slug}`} className="text-xs text-muted">
        ← {c.name}
      </Link>
      <h1 className="mb-4 mt-1 text-xl font-medium">Kelola komunitas</h1>
      <Flash ok={ok} error={error} map={MAP} />

      <form action={updateCommunity} className="space-y-5">
        <input type="hidden" name="slug" value={slug} />

        <div className={`${ui.card} space-y-3`}>
          <h2 className="text-sm font-medium">Banner</h2>
          <div className="overflow-hidden rounded-lg border border-border">
            {c.banner_url && safeUrl(c.banner_url) ? (
              <img
                src={safeUrl(c.banner_url)!}
                alt=""
                className="h-28 w-full object-cover"
              />
            ) : (
              <CommunityBanner c={c} className="h-28" />
            )}
          </div>
          <input
            name="banner"
            type="file"
            accept="image/jpeg,image/png,image/webp,image/gif"
            className="block text-xs"
          />
          <p className="text-xs text-muted">
            Disarankan lebar dan pendek, sekitar 1200×300 piksel. Maks. 5 MB.
          </p>
          {c.banner_url && (
            <label className="flex items-center gap-2 text-xs">
              <input name="remove_banner" type="checkbox" /> Hapus banner
              (kembali ke warna otomatis)
            </label>
          )}
        </div>

        <div className={`${ui.card} space-y-3`}>
          <h2 className="text-sm font-medium">Foto profil (logo)</h2>
          <div className="flex items-center gap-3">
            <CommunityLogo c={c} size={64} />
            <input
              name="logo"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif"
              className="block text-xs"
            />
          </div>
          <p className="text-xs text-muted">
            Disarankan persegi, minimal 256×256 piksel. Maks. 5 MB.
          </p>
          {c.logo_url && (
            <label className="flex items-center gap-2 text-xs">
              <input name="remove_logo" type="checkbox" /> Hapus logo (kembali
              ke inisial)
            </label>
          )}
        </div>

        <div className={`${ui.card} space-y-3`}>
          <label className="block text-sm font-medium">
            Deskripsi
            <textarea
              name="description"
              rows={2}
              maxLength={300}
              defaultValue={c.description ?? ""}
              className={`${area} mt-1 font-normal`}
            />
          </label>
          <label className="block text-sm font-medium">
            Pengumuman
            <textarea
              name="announcement"
              rows={2}
              maxLength={500}
              defaultValue={c.announcement ?? ""}
              className={`${area} mt-1 font-normal`}
            />
          </label>
          <label className="block text-sm font-medium">
            Aturan komunitas
            <textarea
              name="rules"
              rows={4}
              maxLength={1000}
              defaultValue={c.rules ?? ""}
              className={`${area} mt-1 font-normal`}
            />
          </label>
        </div>

        <button className={ui.btn}>Simpan perubahan</button>
      </form>
    </main>
  );
}
