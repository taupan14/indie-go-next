import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Next.js 16: berkas ini bernama proxy.ts (dulu middleware.ts). Halaman yang butuh login. Thread, komunitas, dan Beranda tetap publik.
const PROTECTED = ["/settings", "/thread/new", "/u", "/admin"];

export async function proxy(req: NextRequest) {
  let res = NextResponse.next({ request: req });
  const sb = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll: () => req.cookies.getAll(),
        setAll: (list: any[]) => {
          list.forEach(({ name, value }) => req.cookies.set(name, value));
          res = NextResponse.next({ request: req });
          list.forEach(({ name, value, options }) =>
            res.cookies.set(name, value, options),
          );
        },
      },
    },
  );
  const {
    data: { user },
  } = await sb.auth.getUser(); // menyegarkan sesi
  const path = req.nextUrl.pathname;
  if (user && !path.startsWith("/masuk") && !path.startsWith("/auth")) {
    const { data: p } = await sb
      .from("profiles")
      .select("status")
      .eq("id", user.id)
      .maybeSingle();
    if (p?.status === "banned") {
      // akun diblokir: keluarkan dari sesi
      await sb.auth.signOut();
      const r = NextResponse.redirect(new URL("/masuk?error=banned", req.url));
      res.cookies.getAll().forEach((c) => r.cookies.set(c));
      return r;
    }
  }
  if (!user && PROTECTED.some((p) => path === p || path.startsWith(p + "/"))) {
    return NextResponse.redirect(new URL("/masuk", req.url));
  }
  return res;
}

export const config = {
  matcher: [
    "/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|webp)$).*)",
  ],
};
