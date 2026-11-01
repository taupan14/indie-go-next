"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";
import { supabaseAdmin } from "@/lib/supabase/admin";

const schema = z.object({
  mode: z.enum(["hide", "dismiss", "suspend", "restore", "keep"]),
  kind: z.enum(["thread", "comment"]),
  id: z.string().uuid(),
  author: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
});

export async function resolveReport(fd: FormData) {
  const { user } = await requireSuperAdmin(); // setiap aksi dicek ulang di server
  const { mode, kind, id, author } = schema.parse(Object.fromEntries(fd));
  const a = supabaseAdmin();
  const table = kind === "thread" ? "threads" : "comments";

  if (mode === "hide" || mode === "suspend") await a.from(table).update({ status: "hidden" }).eq("id", id);
  if (mode === "restore") await a.from(table).update({ status: "published" }).eq("id", id);
  if (mode === "suspend" && author) await a.from("profiles").update({ status: "suspended" }).eq("id", author).eq("role", "user"); // super admin tidak bisa disuspend

  await a.from("reports").update({ status: mode === "dismiss" || mode === "restore" ? "dismissed" : "resolved" })
    .eq(kind === "thread" ? "thread_id" : "comment_id", id).eq("status", "open");
  await audit(user.id, `report.${mode}`, `${kind}:${id}`, { author });
  revalidatePath("/admin/laporan");
}
