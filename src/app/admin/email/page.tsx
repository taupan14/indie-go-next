import { requireSuperAdmin } from "@/lib/admin";
import { adminT } from "@/i18n/admin";
import { siteUrl } from "@/lib/site";
import {
  mergeSettings,
  renderMail,
  TEMPLATE_LABELS,
  type TemplateKey,
} from "@/lib/mail-templates";
import { Head, ui } from "@/components/AdminUI";
import { saveSender, saveTemplate, sendTest } from "./actions";

const MAP: Record<string, string> = {
  invalid: "Isian tidak valid.",
  smtp: "Gagal mengirim email uji.",
};

export default async function EmailAdmin({
  searchParams,
}: {
  searchParams: Promise<{
    ok?: string;
    error?: string;
    detail?: string;
    open?: string;
  }>;
}) {
  const tt = await adminT();
  const { sb } = await requireSuperAdmin();
  const { ok, error, detail, open } = await searchParams;
  const { data } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "email")
    .maybeSingle();
  const s = mergeSettings(data?.value);
  const site = await siteUrl();
  const keys = Object.keys(s.templates) as TemplateKey[];
  const smtpReady = !!process.env.SMTP_HOST;
  const hookReady = !!process.env.SEND_EMAIL_HOOK_SECRET;
  const wide = `${ui.input} w-full`;

  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title={tt("Email")} tab="sistem" />
      {ok && (
        <p
          role="status"
          className="mb-3 rounded-lg border border-border bg-accent px-3 py-2 text-sm"
        >
          {ok === "sent" ? tt("Email uji terkirim.") : tt("Tersimpan.")}
        </p>
      )}
      {error && (
        <p
          role="alert"
          className="mb-3 rounded-lg border border-danger bg-accent px-3 py-2 text-sm text-danger"
        >
          {tt(MAP[error] ?? MAP.invalid)}
          {detail ? ` (${detail})` : ""}
        </p>
      )}

      {/* <div className={`${ui.card} mb-4 text-xs`}>
        <p className="font-medium text-sm">{tt("Status pengiriman")}</p>
        <p className="mt-1">
          {tt("SMTP:")}{" "}
          {smtpReady
            ? tt("terhubung (variabel SMTP_HOST terisi)")
            : tt(
                "belum diatur: isi SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS",
              )}
        </p>
        <p>
          {tt("Auth Hook Supabase:")}{" "}
          {hookReady
            ? tt("rahasia hook terisi")
            : tt(
                "belum diatur: isi SEND_EMAIL_HOOK_SECRET dan aktifkan hook Send Email di Supabase",
              )}
        </p>
        <p>
          {tt("Alamat situs untuk tautan:")} <b>{site}</b>
          {process.env.NEXT_PUBLIC_SITE_URL
            ? ""
            : tt(
                " (isi NEXT_PUBLIC_SITE_URL agar tidak memakai alamat sementara)",
              )}
        </p>
      </div> */}

      <form action={saveSender} className={`${ui.card} mb-4 space-y-2`}>
        <h2 className="text-sm font-medium">{tt("Pengirim")}</h2>
        <div className="grid gap-2 sm:grid-cols-2">
          <label className="text-xs text-muted">
            {tt("Nama pengirim")}
            <input
              name="from_name"
              required
              defaultValue={s.from_name}
              className={`${wide} mt-1`}
            />
          </label>
          <label className="text-xs text-muted">
            {tt("Email pengirim")}
            <input
              name="from_email"
              type="email"
              required
              defaultValue={s.from_email}
              className={`${wide} mt-1`}
            />
          </label>
        </div>
        <label className="block text-xs text-muted">
          {tt("Teks footer email")}
          <textarea
            name="footer"
            rows={2}
            maxLength={300}
            defaultValue={s.footer}
            className={`${wide} mt-1`}
          />
        </label>
        <p className="text-xs text-muted">
          {tt(
            "Alamat pengirim harus sudah diverifikasi di penyedia SMTP Anda (domain atau alamat), jika tidak email akan ditolak atau masuk spam.",
          )}
        </p>
        <button className={ui.btn}>{tt("Simpan pengirim")}</button>
      </form>

      <h2 className="mb-1 text-sm font-medium">{tt("Templat email")}</h2>
      <p className="mb-3 text-xs text-muted">
        {tt(
          "Variabel yang bisa dipakai: {{name}} nama pengguna, {{email}}, {{site_name}}, {{code}} kode verifikasi. Tautan konfirmasi dipasang otomatis pada tombol. Kosongkan teks tombol untuk menyembunyikannya.",
        )}
      </p>
      <div className="space-y-2">
        {keys.map((k) => {
          const t = s.templates[k];
          const html = renderMail(s, k, {
            name: "dewi_r",
            email: "dewi@email.com",
            site: "Indie GO",
            link: `${site}/masuk`,
            code: "123456",
          }).html;
          return (
            <details key={k} open={open === k} className={ui.card}>
              <summary className="cursor-pointer text-sm font-medium">
                {tt(TEMPLATE_LABELS[k])}{" "}
                <span className="ml-1 text-xs font-normal text-muted">
                  · {t.subject}
                </span>
              </summary>
              <div className="mt-3 grid gap-4 md:grid-cols-2">
                <form action={saveTemplate} className="space-y-2">
                  <input type="hidden" name="key" value={k} />
                  <label className="block text-xs text-muted">
                    {tt("Subjek")}
                    <input
                      name="subject"
                      required
                      maxLength={150}
                      defaultValue={t.subject}
                      className={`${wide} mt-1`}
                    />
                  </label>
                  <label className="block text-xs text-muted">
                    {tt("Judul di dalam email")}
                    <input
                      name="heading"
                      required
                      maxLength={120}
                      defaultValue={t.heading}
                      className={`${wide} mt-1`}
                    />
                  </label>
                  <label className="block text-xs text-muted">
                    {tt("Isi (pisahkan paragraf dengan baris kosong)")}
                    <textarea
                      name="body"
                      required
                      rows={7}
                      maxLength={2000}
                      defaultValue={t.body}
                      className={`${wide} mt-1`}
                    />
                  </label>
                  <label className="block text-xs text-muted">
                    {tt("Teks tombol")}
                    <input
                      name="button"
                      maxLength={40}
                      defaultValue={t.button}
                      className={`${wide} mt-1`}
                    />
                  </label>
                  <button className={ui.btn}>{tt("Simpan templat")}</button>
                </form>
                <div>
                  <p className="mb-1 text-xs text-muted">
                    {tt("Pratinjau (data contoh, tersimpan terakhir)")}
                  </p>
                  <iframe
                    title={`${tt("Pratinjau")} ${tt(TEMPLATE_LABELS[k])}`}
                    srcDoc={html}
                    sandbox=""
                    className="h-[420px] w-full rounded-lg border border-border bg-white"
                  />
                  <form action={sendTest} className="mt-2 flex gap-2">
                    <input type="hidden" name="key" value={k} />
                    <input
                      name="to"
                      type="email"
                      required
                      placeholder={tt("Kirim uji ke email...")}
                      className={`${wide} flex-1`}
                    />
                    <button className={ui.ghost}>{tt("Kirim uji")}</button>
                  </form>
                </div>
              </div>
            </details>
          );
        })}
      </div>
    </main>
  );
}
