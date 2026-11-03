import "server-only";
import nodemailer from "nodemailer";

/** Kirim email lewat SMTP (SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS). Alamat pengirim harus diizinkan oleh penyedia SMTP. */
export async function sendMail(
  to: string,
  m: { subject: string; html: string; text: string },
  from: { name: string; email: string },
) {
  const host = process.env.SMTP_HOST;
  if (!host) throw new Error("SMTP_HOST belum diisi");
  const port = Number(process.env.SMTP_PORT ?? 587);
  const transport = nodemailer.createTransport({
    host,
    port,
    secure: port === 465,
    auth: process.env.SMTP_USER
      ? { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS }
      : undefined,
  });
  await transport.sendMail({
    from: `"${from.name.replace(/"/g, "")}" <${from.email}>`,
    to,
    subject: m.subject,
    html: m.html,
    text: m.text,
  });
}
