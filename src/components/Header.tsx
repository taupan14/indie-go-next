import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import { signOut } from "@/app/(auth)/actions";
import { ThemeToggle, LocaleToggle } from "./Toggles";
import NavLinks from "./NavLinks";
import MobileMenu from "./MobileMenu";
import Image from "next/image";

export function Logo({ size = 28 }: { size?: number }) {
  return (
    <Image
      src="/brand/logo-indie.png"
      alt="IndieGo"
      width={size}
      height={size}
      className="rounded-full object-contain"
    />
  );
}

export default async function Header() {
  const locale = await getLocale();
  const t = makeT(locale);
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  const { data: prof } = user
    ? await sb.from("profiles").select("role").eq("id", user.id).maybeSingle()
    : { data: null };
  const items = [
    { href: "/", label: t("nav.home") },
    { href: "/komunitas", label: t("nav.communities") },
    ...(prof?.role === "super_admin"
      ? [{ href: "/admin", label: "Admin" }]
      : []),
  ];
  const link =
    "rounded-md px-2 py-1 text-sm text-muted hover:bg-accent hover:text-foreground";
  const brand = (
    <>
      <Logo />
      <span>Indie Go</span>
    </>
  );

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-surface/95 backdrop-blur">
      {/* Desktop */}
      <div className="mx-auto hidden max-w-5xl items-center gap-2 px-4 py-2.5 md:flex">
        <Link href="/" className="mr-3 flex items-center gap-2 font-medium">
          {brand}
        </Link>
        <nav className="flex-1" aria-label="Menu utama">
          <NavLinks items={items} />
        </nav>
        <LocaleToggle current={locale} />
        <ThemeToggle label={t("settings.theme")} />
        {user ? (
          <>
            <Link
              href="/thread/new"
              className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
            >
              {t("nav.newThread")}
            </Link>
            <Link href="/settings" className={link}>
              {t("nav.settings")}
            </Link>
            <form action={signOut}>
              <button className={link}>{t("nav.signOut")}</button>
            </form>
          </>
        ) : (
          <Link
            href="/masuk"
            className="rounded-md bg-primary px-3 py-1.5 text-sm font-medium text-primary-foreground"
          >
            {t("nav.signIn")}
          </Link>
        )}
      </div>

      {/* Mobile: logo, tombol buat thread (+), menu hamburger */}
      <div className="mx-auto flex max-w-5xl items-center gap-2 px-3 py-1.5 md:hidden">
        <Link
          href="/"
          className="flex min-w-0 flex-1 items-center gap-2 font-medium"
        >
          {brand}
        </Link>
        {user && (
          <Link
            href="/thread/new"
            aria-label={t("nav.newThread")}
            className="inline-flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary text-xl leading-none text-primary-foreground"
          >
            +
          </Link>
        )}
        <MobileMenu
          items={items}
          signedIn={!!user}
          locale={locale}
          labels={{
            menu: "Menu",
            close: t("home.dismiss"),
            settings: t("nav.settings"),
            signOut: t("nav.signOut"),
            signIn: t("nav.signIn"),
            signUp: t("nav.signUp"),
            theme: t("settings.theme"),
          }}
        />
      </div>
    </header>
  );
}
