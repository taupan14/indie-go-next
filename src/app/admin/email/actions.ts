"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";
import {
  mergeSettings,
  renderMail,
  type TemplateKey,
} from "@/lib/mail-templates";
import { sendMail } from "@/lib/mail";
import { siteUrl } from "@/lib/site";

const KEYS = [
  "signup",
  "invite",
  "recovery",
  "magiclink",
  "email_change",
  "reauthentication",
] as const;
const back = (q: string): never => redirect(`/admin/email?${q}`);

async function load() {
  const { sb, user } = await requireSuperAdmin();
  const { data } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "email")
    .maybeSingle();
  return { sb, user, s: mergeSettings(data?.value) };
}

export async function saveSender(fd: FormData) {
  const { sb, user, s } = await load();
  const p = z
    .object({
      from_name: z.string().trim().min(1).max(60),
      from_email: z.string().trim().email().max(120),
      footer: z.string().trim().max(300),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) back("error=invalid");
  await sb
    .from("app_settings")
    .upsert({ key: "email", value: { ...s, ...p.data } });
  await audit(user.id, "email.sender", "email", {
    from_email: p.data!.from_email,
  });
  revalidatePath("/admin/email");
  back("ok=1");
}

export async function saveTemplate(fd: FormData) {
  const { sb, user, s } = await load();
  const p = z
    .object({
      key: z.enum(KEYS),
      subject: z.string().trim().min(1).max(150),
      heading: z.string().trim().min(1).max(120),
      body: z.string().trim().min(1).max(2000),
      button: z.string().trim().max(40),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) back("error=invalid");
  const { key, ...tpl } = p.data!;
  await sb
    .from("app_settings")
    .upsert({
      key: "email",
      value: { ...s, templates: { ...s.templates, [key]: tpl } },
    });
  await audit(user.id, "email.template", `email:${key}`);
  revalidatePath("/admin/email");
  back(`ok=1&open=${key}`);
}

export async function sendTest(fd: FormData) {
  const { s } = await load();
  const p = z
    .object({ to: z.string().trim().email(), key: z.enum(KEYS) })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) back("error=invalid");
  try {
    const site = await siteUrl();
    const mail = renderMail(s, p.data!.key as TemplateKey, {
      name: "pengguna",
      email: p.data!.to,
      site: "Indie GO",
      link: `${site}/masuk`,
      code: "123456",
    });
    await sendMail(
      p.data!.to,
      { ...mail, subject: `[Uji] ${mail.subject}` },
      { name: s.from_name, email: s.from_email },
    );
  } catch (e) {
    console.error("[email-test]", e);
    back(
      `error=smtp&detail=${encodeURIComponent(e instanceof Error ? e.message.slice(0, 160) : "gagal")}`,
    );
  }
  back("ok=sent");
}
