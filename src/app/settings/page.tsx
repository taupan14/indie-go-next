import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { tint, initials } from "@/lib/community";
import { safeUrl } from "@/lib/media";
import SettingsPrefs from "@/components/SettingsPrefs";
import { updateProfile, updateEmail, updatePassword, savePrivacy, deleteAccount } from "./actions";

type Sp = Promise<{ s?: string; ok?: string; error?: string }>;
const SECTIONS = ["profil", "akun", "tampilan", "privasi", "tersimpan"] as const;
const input = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const btn = "rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground";
const card = "mb-4 rounded-xl border border-border bg-surface p-4";

export default async function SettingsPage({ searchParams }: { searchParams: Sp }) {
  const { s, ok, error } = await searchParams;
  const sec = SECTIONS.find((x) => x === s) ?? "profil";
  const locale = await getLocale();
  const t = makeT(locale);
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser(); // dijaga middleware
  const { data: me } = await sb.from("profiles").select("username,bio,avatar_url,hide_communities").eq("id", user!.id).single();
  const providers: string[] = user?.app_metadata?.providers ?? [];
  const avatar = me?.avatar_url ? safeUrl(me.avatar_url) : null;

  const menu: Record<(typeof SECTIONS)[number], string> = {
    profil: t("settings.menuProfile"), akun: t("settings.menuAccount"), tampilan: t("settings.menuDisplay"),
    privasi: t("settings.menuPrivacy"), tersimpan: t("settings.menuSaved"),
  };
  const msg = ok === "email" ? t("settings.okEmail") : ok ? t("settings.ok") : null;
  const err = error ? t("settings.err" + error[0].toUpperCase() + error.slice(1)) : null;

  return (
    <main className="mx-auto grid max-w-4xl gap-6 px-4 py-6 md:grid-cols-[190px_minmax(0,1fr)]">
      <nav aria-label={t("settings.title")}>
        <h1 className="mb-2 text-lg font-medium">{t("settings.title")}</h1>
        <ul className="flex gap-1 overflow-x-auto md:flex-col">
          {SECTIONS.map((k) => (
            <li key={k}>
              <Link href={`/settings?s=${k}`} className={`block whitespace-nowrap rounded-lg px-3 py-1.5 text-sm ${k === sec ? "bg-accent font-medium" : "text-muted hover:bg-accent"}`}>{menu[k]}</Link>
            </li>
          ))}
        </ul>
      </nav>

      <section>
        <h2 className="mb-3 text-base font-medium">{menu[sec]}</h2>
        {msg && <p role="status" className="mb-3 rounded-lg border border-border bg-accent px-3 py-2 text-sm">{msg}</p>}
        {err && <p role="alert" className="mb-3 rounded-lg border border-danger bg-accent px-3 py-2 text-sm text-danger">{err}</p>}

        {sec === "profil" && (
          <form action={updateProfile} className={`${card} space-y-4`}>
            <div className="flex items-center gap-3">
              {avatar ? <img src={avatar} alt="" className="size-14 rounded-full object-cover" />
                : <span className="inline-flex size-14 items-center justify-center rounded-full font-medium text-[#2B1B17]" style={{ background: tint(me?.username ?? "x") }}>{initials(me?.username ?? "?")}</span>}
              <label className="text-sm font-medium">{t("settings.changePhoto")}
                <input name="avatar" type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="mt-1 block text-xs font-normal" />
              </label>
            </div>
            <label className="block text-sm font-medium">Username
              <input name="username" required pattern="[a-z0-9_]{3,20}" defaultValue={me?.username} className={`${input} mt-1 font-normal`} />
            </label>
            <label className="block text-sm font-medium">{t("settings.bio")}
              <textarea name="bio" rows={3} maxLength={160} defaultValue={me?.bio ?? ""} className={`${input} mt-1 font-normal`} />
            </label>
            <button className={btn}>{t("settings.save")}</button>
          </form>
        )}

        {sec === "akun" && (
          <>
            <div className={card}>
              <p className="text-xs text-muted">{t("settings.email")}</p>
              <p className="mb-3 text-sm font-medium">{user?.email} {providers.includes("google") && <span className="ml-2 text-xs font-normal text-muted">· {t("settings.googleLinked")}</span>}</p>
              <form action={updateEmail} className="space-y-2">
                <input name="email" type="email" required placeholder={t("settings.newEmail")} className={input} />
                <p className="text-xs text-muted">{t("settings.emailNote")}</p>
                <button className={btn}>{t("settings.save")}</button>
              </form>
            </div>
            <form action={updatePassword} className={`${card} space-y-2`}>
              <input name="password" type="password" required minLength={8} autoComplete="new-password" placeholder={t("settings.newPassword")} className={input} />
              <input name="repeat" type="password" required minLength={8} autoComplete="new-password" placeholder={t("settings.repeatPassword")} className={input} />
              <button className={btn}>{t("settings.changePassword")}</button>
            </form>
            <form action={deleteAccount} className={`${card} space-y-2 border-danger`}>
              <h3 className="font-medium text-danger">{t("settings.deleteTitle")}</h3>
              <p className="text-xs text-muted">{t("settings.deleteHint")}</p>
              <input name="confirm" required autoComplete="off" placeholder={t("settings.deleteConfirm")} className={input} />
              {providers.includes("email") && <input name="password" type="password" required autoComplete="current-password" placeholder={t("auth.password")} className={input} />}
              <button className="rounded-lg border border-danger px-4 py-2 text-sm font-medium text-danger">{t("settings.deleteButton")}</button>
            </form>
          </>
        )}

        {sec === "tampilan" && (
          <div className={card}>
            <SettingsPrefs locale={locale} labels={{ language: t("settings.language"), theme: t("settings.theme"), light: t("settings.light"), dark: t("settings.dark"), system: t("settings.system"), perDevice: t("settings.perDevice") }} />
          </div>
        )}

        {sec === "privasi" && (
          <form action={savePrivacy} className={`${card} space-y-3`}>
            <label className="flex items-start gap-2 text-sm">
              <input name="hide" type="checkbox" defaultChecked={me?.hide_communities} className="mt-1" />
              <span>{t("settings.hideCommunities")}<span className="block text-xs text-muted">{t("settings.hideHint")}</span></span>
            </label>
            <button className={btn}>{t("settings.save")}</button>
          </form>
        )}

        {sec === "tersimpan" && <p className="py-8 text-center text-sm text-muted">{t("settings.soon")}</p>}
      </section>
    </main>
  );
}
