import { NextResponse } from "next/server";
import { createHmac, timingSafeEqual } from "crypto";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { mergeSettings, renderMail } from "@/lib/mail-templates";
import { sendMail } from "@/lib/mail";

export const runtime = "nodejs";

/** Memeriksa tanda tangan webhook Supabase (Standard Webhooks) memakai SEND_EMAIL_HOOK_SECRET. */
function verified(req: Request, raw: string) {
  const secret = (process.env.SEND_EMAIL_HOOK_SECRET ?? "")
    .replace(/^v1,whsec_/, "")
    .replace(/^whsec_/, "");
  const id = req.headers.get("webhook-id"),
    ts = req.headers.get("webhook-timestamp"),
    sig = req.headers.get("webhook-signature");
  if (!secret || !id || !ts || !sig) return false;
  if (Math.abs(Date.now() / 1000 - Number(ts)) > 300) return false;
  const expected = createHmac("sha256", Buffer.from(secret, "base64"))
    .update(`${id}.${ts}.${raw}`)
    .digest();
  return sig.split(" ").some((part) => {
    const [v, s] = part.split(",");
    if (v !== "v1" || !s) return false;
    const got = Buffer.from(s, "base64");
    return got.length === expected.length && timingSafeEqual(got, expected);
  });
}

const fail = (code: number, message: string) =>
  NextResponse.json({ error: { http_code: code, message } }, { status: code });

/** Auth Hook "Send Email" dari Supabase: semua email autentikasi dikirim dari sini memakai templat dan pengirim dari panel admin. */
export async function POST(req: Request) {
  const raw = await req.text();
  if (!verified(req, raw)) return fail(401, "Tanda tangan tidak valid");

  try {
    const { user, email_data: d } = JSON.parse(raw);
    const type: string = d.email_action_type;
    const { data } = await supabaseAdmin()
      .from("app_settings")
      .select("value")
      .eq("key", "email")
      .maybeSingle();
    const s = mergeSettings(data?.value);
    const site = process.env.NEXT_PUBLIC_SITE_URL?.replace(/\/+$/, "") ?? "";
    const redirect = encodeURIComponent(d.redirect_to || site);
    const linkFor = (hash: string) =>
      `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/verify?token=${hash}&type=${type}&redirect_to=${redirect}`;
    const meta = user.user_metadata ?? {};
    const targets: { to: string; hash: string; code: string }[] = [];
    if (type === "email_change") {
      if (user.new_email && d.token_hash_new)
        targets.push({
          to: user.new_email,
          hash: d.token_hash_new,
          code: d.token_new,
        });
      if (d.token_hash)
        targets.push({ to: user.email, hash: d.token_hash, code: d.token });
    } else targets.push({ to: user.email, hash: d.token_hash, code: d.token });

    for (const t of targets) {
      const name = meta.username || String(t.to).split("@")[0];
      const mail = renderMail(s, type, {
        name,
        email: t.to,
        site: "Indie GO",
        link: linkFor(t.hash),
        code: t.code,
      });
      await sendMail(t.to, mail, { name: s.from_name, email: s.from_email });
    }
    return NextResponse.json({});
  } catch (e) {
    console.error("[send-email]", e);
    return fail(500, "Gagal mengirim email");
  }
}
