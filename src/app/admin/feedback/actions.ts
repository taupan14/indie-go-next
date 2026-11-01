"use server";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";

const schema = z.object({
  id: z.string().uuid(),
  mode: z.enum(["read", "new", "delete"]),
});

export async function updateFeedback(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const { id, mode } = schema.parse(Object.fromEntries(fd));
  if (mode === "delete") await sb.from("feedbacks").delete().eq("id", id);
  else await sb.from("feedbacks").update({ status: mode }).eq("id", id);
  await audit(user.id, `feedback.${mode}`, `feedback:${id}`);
  revalidatePath("/admin/feedback");
}
