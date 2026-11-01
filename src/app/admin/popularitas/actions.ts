"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";

const n = z.coerce.number().int().min(0).max(1000);
const schema = z.object({ vote: n, comment: n, share: n, active: n, popular: n, figure: n })
  .refine((v) => v.active < v.popular && v.popular < v.figure);

export async function savePopularity(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) redirect("/admin/popularitas?error=invalid");
  const { vote, comment, share, active, popular, figure } = p.data;
  await sb.from("app_settings").upsert({ key: "popularity", value: { weights: { vote, comment, share }, levels: { active, popular, figure } } });
  await audit(user.id, "settings.popularity", "popularity", p.data);
  revalidatePath("/admin/popularitas");
  redirect("/admin/popularitas?ok=1");
}
