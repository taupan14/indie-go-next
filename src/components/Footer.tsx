import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { safeUrl } from "@/lib/media";
import { Logo } from "./Header";
import FeedbackDialog from "./FeedbackDialog";

export default async function Footer() {
  const t = makeT(await getLocale());
  const sb = await supabaseServer();
  const [
    { data: s },
    {
      data: { user },
    },
  ] = await Promise.all([
    sb.from("app_settings").select("value").eq("key", "support").maybeSingle(),
    sb.auth.getUser(),
  ]);
  const qris = s?.value?.qris_url ? safeUrl(s.value.qris_url) : null;
  const saweria = s?.value?.saweria_url ? safeUrl(s.value.saweria_url) : null;

  const m: Record<string, string> = {};
  for (const k of [
    "feedback",
    "dlgTitle",
    "dlgEmail",
    "dlgMessage",
    "dlgPlaceholder",
    "dlgCancel",
    "dlgSend",
    "dlgSending",
    "dlgThanks",
    "dlgClose",
    "errInvalid",
    "errRate",
    "errCuration",
    "errFailed",
  ])
    m[k] = t("footer." + k);
  const feedback = <FeedbackDialog defaultEmail={user?.email} m={m} />;
  const link = "hover:text-foreground hover:underline";

  return (
    <footer className="mt-10 border-t border-border bg-background">
      <div className="mx-auto max-w-5xl px-4 py-6">
        {(qris || saweria) && (
          <div className="flex flex-wrap items-center gap-4 rounded-2xl border border-border bg-surface p-4">
            {qris && (
              <img
                src={qris}
                alt="QRIS"
                loading="lazy"
                className="size-20 shrink-0 rounded-lg border border-border object-contain p-0"
              />
            )}
            <div className="min-w-[180px] flex-1">
              <p className="font-medium">{t("footer.tagline")}</p>
              <p className="mb-3 mt-1 text-xs text-muted">{t("footer.sub")}</p>
              {saweria && (
                <a
                  href={saweria}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-block rounded-lg bg-primary px-5 py-1 text-xs font-medium text-primary-foreground"
                >
                  {t("footer.saweria")}
                </a>
              )}
            </div>
            {feedback}
          </div>
        )}

        <div className="mt-5 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 text-xs text-muted">
          <span className="flex items-center gap-2 font-medium text-foreground">
            <Logo /> Indie Go
          </span>
          <nav
            aria-label="Footer"
            className="flex flex-wrap items-center gap-x-4 gap-y-1"
          >
            <Link href="/tentang" className={link}>
              {t("footer.about")}
            </Link>
            <Link href="/faq" className={link}>
              {t("footer.faq")}
            </Link>
            <Link href="/privasi" className={link}>
              {t("footer.privacy")}
            </Link>
            <Link href="/syarat" className={link}>
              {t("footer.terms")}
            </Link>
            {!(qris || saweria) && feedback}
          </nav>
          <span>
            © {new Date().getFullYear()} Indie Go. {t("footer.rights")}.
          </span>
        </div>
      </div>
    </footer>
  );
}
