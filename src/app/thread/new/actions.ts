"use server";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";
import { checkContent, scanImage } from "@/lib/curation";
import { safeUrl, youtubeId, type Media } from "@/lib/media";

export type FormState = { error?: string; reason?: string; fields?: Record<string, string> };

const schema = z.object({
  title: z.string().trim().min(5).max(150),
  body: z.string().trim().min(1).max(10000),
  category_id: z.string().uuid(),
  community_id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  tags: z.string().default(""),
  links: z.string().default(""),
});
const EXT: Record<string, string> = { "image/jpeg": "jpg", "image/png": "png", "image/webp": "webp", "image/gif": "gif" };

export async function createThread(_prev: FormState, fd: FormData): Promise<FormState> {
  const fields = Object.fromEntries([...fd.entries()].filter(([, v]) => typeof v === "string")) as Record<string, string>;
  const p = schema.safeParse(fields);
  if (!p.success) return { error: "invalid", fields };

  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser();
  if (!user) redirect("/masuk");

  // Batas posting: maks. 10 thread per jam per pengguna
  const since = new Date(Date.now() - 3_600_000).toISOString();
  const { count } = await sb.from("threads").select("id", { count: "exact", head: true }).eq("author_id", user.id).gte("created_at", since);
  if ((count ?? 0) >= 10) return { error: "rate", fields };

  const tags = [...new Set(p.data.tags.split(",").map((s) => s.trim().toLowerCase().replace(/^#/, "")).filter(Boolean))].slice(0, 5);
  const lines = p.data.links.split("\n").map((s) => s.trim()).filter(Boolean);
  const links: Media[] = [];
  for (const line of lines) {
    const url = safeUrl(line);
    if (!url) return { error: "links", fields };
    links.push({ type: youtubeId(url) ? "youtube" : "link", url });
  }
  if (links.length > 4) return { error: "links", fields };

  // Kurasi teks dan link: tolak langsung dengan alasan
  const hit = await checkContent([p.data.title, p.data.body, ...tags], links.map((l) => l.url));
  if (hit) return { error: "curation", reason: hit, fields };

  // Validasi dan kurasi foto sebelum ada yang diunggah
  const files = (fd.getAll("photos") as File[]).filter((f) => f.size > 0);
  if (files.length > 4 || files.some((f) => !EXT[f.type] || f.size > 5 * 1024 * 1024)) return { error: "upload", fields };
  for (const f of files) {
    const bad = await scanImage(await f.arrayBuffer());
    if (bad) return { error: "curation", reason: bad, fields };
  }

  const images: Media[] = [];
  for (const f of files) {
    const path = `${user.id}/${crypto.randomUUID()}.${EXT[f.type]}`;
    const { error } = await sb.storage.from("media").upload(path, f, { contentType: f.type });
    if (error) return { error: "upload", fields };
    images.push({ type: "image", url: sb.storage.from("media").getPublicUrl(path).data.publicUrl });
  }

  const { data, error } = await sb.from("threads").insert({
    author_id: user.id, category_id: p.data.category_id, community_id: p.data.community_id ?? null,
    title: p.data.title, body: p.data.body, tags, media: [...images, ...links],
  }).select("id").single();
  if (error || !data) return { error: "invalid", fields };
  redirect(`/thread/${data.id}`);
}
