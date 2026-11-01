import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const code = url.searchParams.get("code");
  if (code) await (await supabaseServer()).auth.exchangeCodeForSession(code);
  const next = url.searchParams.get("next") ?? "/";
  const dest = next.startsWith("/") && !next.startsWith("//") ? next : "/"; // cegah open redirect
  return NextResponse.redirect(new URL(dest, url.origin));
}
