/** Templat email transaksional: teks bisa diedit admin (disimpan di app_settings key "email"), tata letaknya tetap profesional. */
export type TemplateKey =
  | "signup"
  | "invite"
  | "recovery"
  | "magiclink"
  | "email_change"
  | "reauthentication";
export type Tpl = {
  subject: string;
  heading: string;
  body: string;
  button: string;
};
export type MailSettings = {
  from_name: string;
  from_email: string;
  footer: string;
  templates: Record<TemplateKey, Tpl>;
};

export const TEMPLATE_LABELS: Record<TemplateKey, string> = {
  signup: "Konfirmasi pendaftaran",
  invite: "Undangan admin komunitas",
  recovery: "Atur ulang kata sandi",
  magiclink: "Tautan masuk",
  email_change: "Perubahan email",
  reauthentication: "Kode verifikasi",
};

export const DEFAULTS: MailSettings = {
  from_name: "Indie GO",
  from_email: process.env.MAIL_FROM_EMAIL ?? "noreply@example.com",
  footer:
    "Email ini dikirim otomatis oleh Indie GO. Mohon tidak membalas email ini.",
  templates: {
    signup: {
      subject: "Konfirmasi pendaftaran Indie GO",
      heading: "Selamat datang di Indie GO!",
      button: "Konfirmasi email",
      body: "Halo {{name}},\n\nTerima kasih sudah mendaftar. Tekan tombol di bawah untuk mengonfirmasi alamat email Anda dan mulai berdiskusi.\n\nJika Anda tidak merasa mendaftar, abaikan email ini.",
    },
    invite: {
      subject: "Undangan mengelola komunitas di Indie GO",
      heading: "Anda diundang bergabung",
      button: "Terima undangan",
      body: "Halo,\n\nAnda diundang untuk bergabung di Indie GO dan mengelola sebuah komunitas. Tekan tombol di bawah untuk menerima undangan dan membuat kata sandi Anda.",
    },
    recovery: {
      subject: "Atur ulang kata sandi Indie GO",
      heading: "Atur ulang kata sandi",
      button: "Atur ulang kata sandi",
      body: "Halo {{name}},\n\nKami menerima permintaan untuk mengatur ulang kata sandi akun Anda. Tekan tombol di bawah untuk membuat kata sandi baru.\n\nJika bukan Anda yang meminta, abaikan email ini. Kata sandi Anda tidak berubah.",
    },
    magiclink: {
      subject: "Tautan masuk Indie GO",
      heading: "Masuk ke Indie GO",
      button: "Masuk sekarang",
      body: "Halo {{name}},\n\nTekan tombol di bawah untuk masuk ke akun Anda. Tautan ini hanya berlaku sementara dan sekali pakai.",
    },
    email_change: {
      subject: "Konfirmasi perubahan email Indie GO",
      heading: "Konfirmasi perubahan email",
      button: "Konfirmasi perubahan",
      body: "Halo {{name}},\n\nTekan tombol di bawah untuk mengonfirmasi perubahan alamat email akun Anda.\n\nJika bukan Anda yang meminta, abaikan email ini dan segera amankan akun Anda.",
    },
    reauthentication: {
      subject: "Kode verifikasi Indie GO",
      heading: "Kode verifikasi Anda",
      button: "",
      body: "Halo {{name}},\n\nMasukkan kode berikut untuk melanjutkan:\n\n{{code}}\n\nJangan bagikan kode ini kepada siapa pun.",
    },
  },
};

/** Gabungkan nilai tersimpan dengan bawaan agar templat baru atau kolom kosong tetap aman. */
export function mergeSettings(v: any): MailSettings {
  const t = (k: TemplateKey): Tpl => ({
    ...DEFAULTS.templates[k],
    ...(v?.templates?.[k] ?? {}),
  });
  return {
    from_name: v?.from_name || DEFAULTS.from_name,
    from_email: v?.from_email || DEFAULTS.from_email,
    footer: v?.footer ?? DEFAULTS.footer,
    templates: Object.fromEntries(
      (Object.keys(DEFAULTS.templates) as TemplateKey[]).map((k) => [k, t(k)]),
    ) as Record<TemplateKey, Tpl>,
  };
}

export type Vars = {
  name: string;
  email: string;
  site: string;
  link?: string;
  code?: string;
};
const esc = (s: string) =>
  s
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
const fill = (s: string, v: Record<string, string>) =>
  s.replace(/\{\{(\w+)\}\}/g, (_, k) => v[k] ?? "");

export function renderMail(s: MailSettings, key: string, v: Vars) {
  const t = s.templates[key as TemplateKey] ?? s.templates.signup;
  const vars = {
    name: v.name,
    email: v.email,
    site_name: v.site,
    link: v.link ?? "",
    code: v.code ?? "",
  };
  const subject = fill(t.subject, vars);
  const heading = fill(t.heading, vars);
  const paras = fill(t.body, vars)
    .split(/\n{2,}/)
    .map((p) => p.trim())
    .filter(Boolean);
  const button = t.button.trim();
  const font = "font-family:Arial,Helvetica,sans-serif;";
  const body = paras
    .map((p) => {
      const isCode = v.code && p === v.code; // kode verifikasi tampil menonjol
      return isCode
        ? `<p style="margin:0 0 18px;${font}font-size:28px;font-weight:bold;letter-spacing:6px;color:#A80000;">${esc(p)}</p>`
        : `<p style="margin:0 0 14px;${font}font-size:15px;line-height:1.6;color:#2B1B17;">${esc(p).replace(/\n/g, "<br>")}</p>`;
    })
    .join("");
  const cta =
    v.link && button
      ? `<table role="presentation" cellpadding="0" cellspacing="0" style="margin:22px 0 8px;"><tr><td style="background:#A80000;border-radius:10px;"><a href="${esc(v.link)}" style="display:inline-block;padding:13px 26px;${font}font-size:15px;font-weight:bold;color:#ffffff;text-decoration:none;">${esc(button)}</a></td></tr></table>
       <p style="margin:14px 0 0;${font}font-size:12px;line-height:1.5;color:#7A6458;">Jika tombol tidak berfungsi, salin dan tempel tautan ini ke browser Anda:<br><a href="${esc(v.link)}" style="color:#A80000;word-break:break-all;">${esc(v.link)}</a></p>`
      : "";
  const html = `<!doctype html><html lang="id"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>${esc(subject)}</title></head>
<body style="margin:0;padding:0;background:#FBF5EE;">
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#FBF5EE;padding:28px 12px;"><tr><td align="center">
<table role="presentation" width="560" cellpadding="0" cellspacing="0" style="width:100%;max-width:560px;">
<tr><td style="padding:0 4px 16px;"><table role="presentation" cellpadding="0" cellspacing="0"><tr><td style="background:#A80000;border-radius:22px;padding:9px 18px;${font}font-size:14px;font-weight:bold;color:#F4E6DA;">${esc(v.site)}</td></tr></table></td></tr>
<tr><td style="background:#ffffff;border:1px solid #E7D5C6;border-radius:16px;padding:32px 28px;">
<h1 style="margin:0 0 18px;${font}font-size:22px;line-height:1.3;color:#2B1B17;">${esc(heading)}</h1>${body}${cta}
</td></tr>
<tr><td style="padding:18px 8px;${font}font-size:12px;line-height:1.6;color:#7A6458;text-align:center;">${esc(fill(s.footer, vars))}<br>&copy; ${new Date().getFullYear()} ${esc(v.site)}</td></tr>
</table></td></tr></table></body></html>`;
  const text = [
    heading,
    "",
    ...paras.flatMap((p) => [p, ""]),
    ...(v.link ? [button ? `${button}: ${v.link}` : v.link, ""] : []),
    fill(s.footer, vars),
  ].join("\n");
  return { subject, html, text };
}
