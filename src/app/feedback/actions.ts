"use server";
import { headers } from "next/headers";
import { createHash } from "crypto";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { checkContent } from "@/lib/curation";

export type FeedbackState = {
  ok?: boolean;
  error?: "invalid" | "rate" | "curation" | "failed";
};
const schema = z.object({
  email: z.string().trim().email().max(120),
  message: z.string().trim().min(5).max(1000),
});

export async function sendFeedback(
  _prev: FeedbackState,
  fd: FormData,
): Promise<FeedbackState> {
  if (fd.get("website")) return { ok: true }; // jebakan bot terisi: pura-pura berhasil
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) return { error: "invalid" };

  // Pembatas: maks. 3 kiriman per jam per alamat IP (disimpan sebagai hash). Saat lokal semua IP dianggap sama.
  const h = await headers();
  const ip =
    (h.get("x-forwarded-for") ?? "").split(",")[0].trim() ||
    h.get("x-real-ip") ||
    "local";
  const ip_hash = createHash("sha256")
    .update(ip + (process.env.FEEDBACK_SALT ?? ""))
    .digest("hex");
  const a = supabaseAdmin();
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await a
    .from("feedbacks")
    .select("id", { count: "exact", head: true })
    .eq("ip_hash", ip_hash)
    .gte("created_at", since);
  if ((count ?? 0) >= 3) return { error: "rate" };
  if (await checkContent([p.data.message], [])) return { error: "curation" };

  const {
    data: { user },
  } = await (await supabaseServer()).auth.getUser();
  const { error } = await a
    .from("feedbacks")
    .insert({
      email: p.data.email,
      message: p.data.message,
      user_id: user?.id ?? null,
      ip_hash,
    });
  if (error) {
    console.error("[feedback]", error.message);
    return { error: "failed" };
  }
  return { ok: true };
}
