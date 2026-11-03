"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { commentSchema } from "@/lib/validation";

async function authed() {
  const sb = await supabaseServer();
  const {
    data: { user },
  } = await sb.auth.getUser();
  if (!user) redirect("/masuk");
  return { sb, user };
}

type Res = { error?: string };
/** Di mode development galat asli dikembalikan agar mudah ditelusuri; di produksi hanya pesan umum. */
const fail = (where: string, e: { message: string }): Res => {
  console.error(`[thread-actions] ${where}:`, e.message);
  return {
    error:
      process.env.NODE_ENV === "development"
        ? `${where}: ${e.message}`
        : "failed",
  };
};
const idOf = (v: string) => z.string().uuid().safeParse(v);

/** Suka (upvote). Menyukai otomatis melepas "tidak suka". */
export async function toggleVote(threadId: string): Promise<Res> {
  const id = idOf(threadId);
  if (!id.success) return { error: "invalid" };
  const { sb, user } = await authed();
  const { data: ex, error: e1 } = await sb
    .from("votes")
    .select("id")
    .eq("user_id", user.id)
    .eq("thread_id", id.data)
    .maybeSingle();
  if (e1) return fail("votes.select", e1);
  if (ex) {
    const { error } = await sb.from("votes").delete().eq("id", ex.id);
    if (error) return fail("votes.delete", error);
  } else {
    const { error } = await sb
      .from("votes")
      .insert({ user_id: user.id, thread_id: id.data });
    if (error) return fail("votes.insert", error);
    await sb
      .from("dislikes")
      .delete()
      .eq("user_id", user.id)
      .eq("thread_id", id.data);
  }
  revalidatePath(`/thread/${id.data}`);
  return {};
}

export async function addComment(fd: FormData) {
  const p = commentSchema.safeParse(Object.fromEntries(fd));
  if (!p.success) return;
  const { sb, user } = await authed();
  if (p.data.parent_id) {
    // maksimal satu level balasan
    const { data: parent } = await sb
      .from("comments")
      .select("parent_id,thread_id")
      .eq("id", p.data.parent_id)
      .single();
    if (!parent || parent.parent_id || parent.thread_id !== p.data.thread_id)
      return;
  }
  await sb
    .from("comments")
    .insert({
      thread_id: p.data.thread_id,
      parent_id: p.data.parent_id ?? null,
      body: p.data.body,
      author_id: user.id,
    });
  await supabaseAdmin()
    .from("threads")
    .update({ last_activity_at: new Date().toISOString() })
    .eq("id", p.data.thread_id);
  revalidatePath(`/thread/${p.data.thread_id}`);
}

export async function toggleMembership(fd: FormData) {
  const communityId = String(fd.get("community_id"));
  const threadId = String(fd.get("thread_id"));
  const { sb, user } = await authed();
  const { data: ex } = await sb
    .from("community_members")
    .select("user_id")
    .eq("community_id", communityId)
    .eq("user_id", user.id)
    .maybeSingle();
  if (ex)
    await sb
      .from("community_members")
      .delete()
      .eq("community_id", communityId)
      .eq("user_id", user.id);
  else
    await sb
      .from("community_members")
      .insert({ community_id: communityId, user_id: user.id });
  revalidatePath(`/thread/${threadId}`);
}

const REASONS = [
  "porn",
  "drugs",
  "gambling",
  "trafficking",
  "violence",
  "swearing",
  "racism",
  "other",
] as const;

export async function reportContent(fd: FormData) {
  const p = z
    .object({
      thread_id: z.string().uuid(),
      comment_id: z
        .string()
        .uuid()
        .optional()
        .or(z.literal("").transform(() => undefined)),
      reason: z.enum(REASONS),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) return;
  const { sb, user } = await authed();
  const { thread_id, comment_id, reason } = p.data;
  // Satu pelapor hanya bisa melapor satu kali per konten (constraint unik di database)
  await sb
    .from("reports")
    .insert({
      reporter_id: user.id,
      thread_id: comment_id ? null : thread_id,
      comment_id: comment_id ?? null,
      reason,
    });

  // Sembunyikan otomatis setelah 3 pelapor berbeda; super admin bisa memulihkan dari antrean laporan
  const a = supabaseAdmin();
  const col = comment_id ? "comment_id" : "thread_id";
  const target = comment_id ?? thread_id;
  const { count } = await a
    .from("reports")
    .select("id", { count: "exact", head: true })
    .eq(col, target)
    .eq("status", "open");
  if ((count ?? 0) >= 3)
    await a
      .from(comment_id ? "comments" : "threads")
      .update({ status: "hidden" })
      .eq("id", target);
  revalidatePath(`/thread/${thread_id}`);
}

export async function toggleDislike(threadId: string): Promise<Res> {
  const id = idOf(threadId);
  if (!id.success) return { error: "invalid" };
  const { sb, user } = await authed();
  const { data: ex, error: e1 } = await sb
    .from("dislikes")
    .select("user_id")
    .eq("user_id", user.id)
    .eq("thread_id", id.data)
    .maybeSingle();
  if (e1) return fail("dislikes.select", e1);
  if (ex) {
    const { error } = await sb
      .from("dislikes")
      .delete()
      .eq("user_id", user.id)
      .eq("thread_id", id.data);
    if (error) return fail("dislikes.delete", error);
  } else {
    const { error } = await sb
      .from("dislikes")
      .insert({ user_id: user.id, thread_id: id.data });
    if (error) return fail("dislikes.insert", error);
    await sb
      .from("votes")
      .delete()
      .eq("user_id", user.id)
      .eq("thread_id", id.data);
  }
  revalidatePath(`/thread/${id.data}`);
  return {};
}

/** Rating emoji 1-5. Menekan skor yang sama lagi membatalkan penilaian. Tidak bergantung pada Suka/Tidak suka. */
export async function rateThread(
  threadId: string,
  score: number,
): Promise<Res> {
  const p = z
    .object({ id: z.string().uuid(), score: z.number().int().min(1).max(5) })
    .safeParse({ id: threadId, score });
  if (!p.success) return { error: "invalid" };
  const { sb, user } = await authed();
  const { data: ex, error: e1 } = await sb
    .from("ratings")
    .select("score")
    .eq("user_id", user.id)
    .eq("thread_id", p.data.id)
    .maybeSingle();
  if (e1) return fail("ratings.select", e1);
  const mine = { user_id: user.id, thread_id: p.data.id };
  const { error } = !ex
    ? await sb.from("ratings").insert({ ...mine, score: p.data.score })
    : ex.score === p.data.score
      ? await sb.from("ratings").delete().match(mine)
      : await sb.from("ratings").update({ score: p.data.score }).match(mine);
  if (error) return fail("ratings.write", error);
  revalidatePath(`/thread/${p.data.id}`);
  return {};
}

/** Dicatat saat pengguna login membagikan thread (3 poin popularitas penulis, sekali per pengguna per thread). */
export async function recordShare(threadId: string) {
  const id = z.string().uuid().safeParse(threadId);
  if (!id.success) return;
  const { sb, user } = await authed();
  await sb
    .from("shares")
    .upsert(
      { user_id: user.id, thread_id: id.data },
      { ignoreDuplicates: true },
    );
}

/** Hapus thread: hanya penulis atau super admin (ditegakkan RLS). Komentar, suara, dan penilaiannya ikut terhapus. */
export async function deleteThread(fd: FormData) {
  const id = idOf(String(fd.get("thread_id")));
  if (!id.success) return;
  const { sb } = await authed();
  await sb.from("threads").delete().eq("id", id.data);
  revalidatePath("/");
  redirect("/");
}

/** Hapus komentar (beserta balasannya): hanya penulis komentar atau super admin (ditegakkan RLS). */
export async function deleteComment(fd: FormData) {
  const c = idOf(String(fd.get("comment_id")));
  const t = idOf(String(fd.get("thread_id")));
  if (!c.success || !t.success) return;
  const { sb } = await authed();
  await sb.from("comments").delete().eq("id", c.data);
  revalidatePath(`/thread/${t.data}`);
}
