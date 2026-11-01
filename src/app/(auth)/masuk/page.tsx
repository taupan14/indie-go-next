import Link from "next/link";
import { getLocale, makeT } from "@/i18n";
import { Logo } from "@/components/Header";
import { signIn, signUp, signInWithGoogle } from "../actions";

type Search = Promise<{ mode?: string; error?: string; info?: string }>;
const field = "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";

export default async function MasukPage({ searchParams }: { searchParams: Search }) {
  const { mode, error, info } = await searchParams;
  const t = makeT(await getLocale());
  const signup = mode === "daftar";
  const msg = info === "verify" ? t("auth.verifyEmail")
    : error === "credentials" ? t("auth.errorCredentials")
    : error === "signup" ? t("auth.errorSignup")
    : error ? t("auth.errorInvalid") : null;

  return (
    <main className="mx-auto grid min-h-[calc(100vh-57px)] max-w-5xl md:grid-cols-2">
      <section className="hidden flex-col justify-between bg-primary p-8 text-primary-foreground md:flex">
        <Logo size={44} />
        <div>
          <h2 className="text-2xl font-medium">{t("auth.tagline")}</h2>
          <p className="mt-2 max-w-xs text-sm opacity-90">{t("auth.taglineSub")}</p>
        </div>
        <span />
      </section>

      <section className="flex flex-col justify-center p-6 md:p-10">
        <h1 className="text-xl font-medium">{signup ? t("auth.signUpTitle") : t("auth.welcomeBack")}</h1>
        <p className="mb-5 mt-1 text-sm text-muted">
          {signup ? t("auth.haveAccount") : t("auth.noAccount")}{" "}
          <Link className="font-medium text-primary" href={signup ? "/masuk" : "/masuk?mode=daftar"}>
            {signup ? t("nav.signIn") : t("nav.signUp")}
          </Link>
        </p>

        {msg && <p role="alert" className="mb-4 rounded-lg border border-border bg-accent px-3 py-2 text-sm">{msg}</p>}

        <form action={signup ? signUp : signIn} className="space-y-3">
          {signup && (
            <label className="block text-sm">{t("auth.username")}
              <input name="username" required pattern="[a-z0-9_]{3,20}" autoComplete="username" className={field} />
            </label>
          )}
          <label className="block text-sm">{t("auth.email")}
            <input name="email" type="email" required autoComplete="email" className={field} />
          </label>
          <label className="block text-sm">{t("auth.password")}
            <input name="password" type="password" required minLength={8} autoComplete={signup ? "new-password" : "current-password"} className={field} />
          </label>
          {signup && (
            <label className="flex items-start gap-2 text-xs text-muted">
              <input name="rules" type="checkbox" required className="mt-0.5" />{t("auth.rules")}
            </label>
          )}
          <button className="w-full rounded-lg bg-primary py-2 text-sm font-medium text-primary-foreground">
            {signup ? t("nav.signUp") : t("nav.signIn")}
          </button>
        </form>

        <p className="my-4 text-center text-xs text-muted">{t("auth.or")}</p>
        <form action={signInWithGoogle}>
          <button className="w-full rounded-lg border border-border bg-surface py-2 text-sm">{t("auth.google")}</button>
        </form>
      </section>
    </main>
  );
}
