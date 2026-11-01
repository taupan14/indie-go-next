"use server";
import { redirect } from "next/navigation";
import { headers } from "next/headers";
import { supabaseServer } from "@/lib/supabase/server";
import { signInSchema, signUpSchema } from "@/lib/validation";

export async function signIn(fd: FormData) {
  const p = signInSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) redirect("/masuk?error=invalid");
  const sb = await supabaseServer();
  const { error } = await sb.auth.signInWithPassword(p.data);
  if (error) redirect("/masuk?error=credentials");
  redirect("/");
}

export async function signUp(fd: FormData) {
  const p = signUpSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) redirect("/masuk?mode=daftar&error=invalid");
  const origin = (await headers()).get("origin");
  const sb = await supabaseServer();
  const { error } = await sb.auth.signUp({
    email: p.data.email,
    password: p.data.password,
    options: { data: { username: p.data.username }, emailRedirectTo: `${origin}/auth/callback` },
  });
  if (error) redirect("/masuk?mode=daftar&error=signup");
  redirect("/masuk?mode=daftar&info=verify");
}

export async function signInWithGoogle() {
  const origin = (await headers()).get("origin");
  const sb = await supabaseServer();
  const { data } = await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: `${origin}/auth/callback` } });
  if (data.url) redirect(data.url);
  redirect("/masuk?error=invalid");
}

export async function signOut() {
  const sb = await supabaseServer();
  await sb.auth.signOut();
  redirect("/");
}
