import Link from "next/link";
import { adminT } from "@/i18n/admin";
import ConfirmAction from "@/components/ConfirmAction";
import FilePicker from "@/components/FilePicker";
import { notFound, redirect } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { safeUrl } from "@/lib/media";
import { CommunityBanner, CommunityLogo } from "@/components/CommunityArt";
import { Flash, ui } from "@/components/AdminUI";
import { updateCommunity, manageMember } from "./actions";

const MAP = {
  invalid: "Isian tidak valid atau gagal disimpan.",
  admin:
    "Admin tidak bisa dikeluarkan atau diblokir. Serahkan peran admin ke anggota lain dulu.",
  notmember: "Admin baru harus anggota komunitas ini.",
  failed: "Gagal menyimpan. Coba lagi.",
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
  const tt = await adminT();
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

  const [{ data: mem }, { data: blk }] = await Promise.all([
    sb
      .from("community_members")
      .select("user_id,joined_at")
      .eq("community_id", c.id)
      .order("joined_at")
      .limit(500),
    sb.from("community_blocks").select("user_id").eq("community_id", c.id),
  ]);
  const uids = [
    ...new Set([
      c.admin_id,
      ...(mem ?? []).map((m: any) => m.user_id),
      ...(blk ?? []).map((b: any) => b.user_id),
    ]),
  ];
  const { data: names } = await sb
    .from("author_public")
    .select("id,username")
    .in("id", uids);
  const nm = (id: string) =>
    names?.find((n: any) => n.id === id)?.username ?? "?";
  const CONFIRM: Record<string, [string, string, string]> = {
    transfer: [
      tt("Serahkan peran admin?"),
      tt(
        "Peran admin dan hak kelola komunitas ini berpindah ke anggota tersebut.",
      ),
      tt("Ya, serahkan"),
    ],
    remove: [
      tt("Keluarkan anggota?"),
      tt(
        "Anggota ini akan dikeluarkan dari komunitas dan bisa bergabung lagi.",
      ),
      tt("Ya, keluarkan"),
    ],
    block: [
      tt("Blokir anggota?"),
      tt(
        "Anggota ini dikeluarkan, tidak bisa bergabung lagi, dan tidak bisa melihat thread maupun anggota komunitas ini.",
      ),
      tt("Ya, blokir"),
    ],
  };
  const Act = ({
    id,
    mode,
    label,
    danger,
  }: {
    id: string;
    mode: string;
    label: string;
    danger?: boolean;
  }) =>
    CONFIRM[mode] ? (
      <ConfirmAction
        action={manageMember}
        fields={{ slug, user_id: id, mode }}
        label={label}
        title={CONFIRM[mode][0]}
        message={CONFIRM[mode][1]}
        confirm={CONFIRM[mode][2]}
        danger={mode !== "transfer"}
        className={
          danger
            ? "rounded-lg border border-danger px-2.5 py-1 text-xs text-danger"
            : ui.ghost
        }
      />
    ) : (
      <form action={manageMember}>
        <input type="hidden" name="slug" value={slug} />
        <input type="hidden" name="user_id" value={id} />
        <input type="hidden" name="mode" value={mode} />
        <button className={ui.ghost}>{label}</button>
      </form>
    );
  const area = `${ui.input} w-full`;
  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <Link href={`/komunitas/${slug}`} className="text-xs text-muted">
        ← {c.name}
      </Link>
      <h1 className="mb-4 mt-1 text-xl font-medium">
        {tt("Kelola komunitas")}
      </h1>
      <Flash ok={ok} error={error} map={MAP} />

      <form action={updateCommunity} className="space-y-5">
        <input type="hidden" name="slug" value={slug} />

        <div className={`${ui.card} space-y-3`}>
          <h2 className="text-sm font-medium">{tt("Banner")}</h2>
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
          <FilePicker
            name="banner"
            label={tt("Pilih banner")}
            emptyText={tt("Belum ada file dipilih")}
            filesText={tt("{n} file dipilih")}
          />
          <p className="text-xs text-muted">
            {tt(
              "Disarankan lebar dan pendek, sekitar 1200×300 piksel. Maks. 5 MB.",
            )}
          </p>
          {c.banner_url && (
            <label className="flex items-center gap-2 text-xs">
              <input name="remove_banner" type="checkbox" />{" "}
              {tt("Hapus banner (kembali ke warna otomatis)")}
            </label>
          )}
        </div>

        <div className={`${ui.card} space-y-3`}>
          <h2 className="text-sm font-medium">{tt("Foto profil (logo)")}</h2>
          <div className="flex items-center gap-3">
            <CommunityLogo c={c} size={64} />
            <FilePicker
              name="logo"
              label={tt("Pilih logo")}
              emptyText={tt("Belum ada file dipilih")}
              filesText={tt("{n} file dipilih")}
            />
          </div>
          <p className="text-xs text-muted">
            {tt("Disarankan persegi, minimal 256×256 piksel. Maks. 5 MB.")}
          </p>
          {c.logo_url && (
            <label className="flex items-center gap-2 text-xs">
              <input name="remove_logo" type="checkbox" />{" "}
              {tt("Hapus logo (kembali ke inisial)")}
            </label>
          )}
        </div>

        <div className={`${ui.card} space-y-3`}>
          <label className="block text-sm font-medium">
            {tt("Deskripsi")}
            <textarea
              name="description"
              rows={2}
              maxLength={300}
              defaultValue={c.description ?? ""}
              className={`${area} mt-1 font-normal`}
            />
          </label>
          <label className="block text-sm font-medium">
            {tt("Pengumuman")}
            <textarea
              name="announcement"
              rows={2}
              maxLength={500}
              defaultValue={c.announcement ?? ""}
              className={`${area} mt-1 font-normal`}
            />
          </label>
          <label className="block text-sm font-medium">
            {tt("Aturan komunitas")}
            <textarea
              name="rules"
              rows={4}
              maxLength={1000}
              defaultValue={c.rules ?? ""}
              className={`${area} mt-1 font-normal`}
            />
          </label>
        </div>

        <button className={ui.btn}>{tt("Simpan perubahan")}</button>
      </form>

      <section className="mt-8">
        <h2 className="mb-1 text-base font-medium">
          {tt("Anggota (")}
          {mem?.length ?? 0})
        </h2>
        <p className="mb-3 text-xs text-muted">
          {tt(
            "Keluarkan anggota (mereka bisa bergabung lagi), blokir (tidak bisa bergabung, melihat thread, atau melihat anggota komunitas ini), atau serahkan peran admin ke anggota lain. Menyerahkan admin memindahkan hak kelola ini, termasuk dari Anda.",
          )}
        </p>
        <div className="space-y-1.5">
          {(mem ?? []).map((m: any) => (
            <div
              key={m.user_id}
              className={`${ui.card} flex flex-wrap items-center justify-between gap-2`}
            >
              <span className="text-sm font-medium">
                {nm(m.user_id)}
                {m.user_id === c.admin_id && (
                  <span className="ml-2 rounded-full bg-accent px-2 py-0.5 text-[11px] font-normal">
                    {tt("Admin")}
                  </span>
                )}
              </span>
              {m.user_id !== c.admin_id && (
                <div className="flex flex-wrap gap-1.5">
                  <Act
                    id={m.user_id}
                    mode="transfer"
                    label={tt("Jadikan admin")}
                  />
                  <Act id={m.user_id} mode="remove" label={tt("Keluarkan")} />
                  <Act
                    id={m.user_id}
                    mode="block"
                    label={tt("Blokir")}
                    danger
                  />
                </div>
              )}
            </div>
          ))}
        </div>
        {!!blk?.length && (
          <>
            <h3 className="mb-2 mt-5 text-sm font-medium">
              {tt("Diblokir (")}
              {blk.length})
            </h3>
            <div className="space-y-1.5">
              {blk.map((b: any) => (
                <div
                  key={b.user_id}
                  className={`${ui.card} flex items-center justify-between gap-2`}
                >
                  <span className="text-sm">{nm(b.user_id)}</span>
                  <Act
                    id={b.user_id}
                    mode="unblock"
                    label={tt("Buka blokir")}
                  />
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
