"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";
import { safeUrl } from "@/lib/media";

const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};
const back = (q: string): never => redirect(`/admin/dukungan?${q}`);

export async function saveSupport(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const p = z
    .object({
      saweria_url: z.string().trim().default(""),
      remove_qris: z.string().optional(),
    })
    .safeParse(Object.fromEntries(fd));
  if (!p.success) back("error=invalid");
  const saweria =
    p.data!.saweria_url === "" ? null : safeUrl(p.data!.saweria_url);
  if (p.data!.saweria_url && (!saweria || !saweria.startsWith("https://")))
    back("error=invalid");

  const { data: cur } = await sb
    .from("app_settings")
    .select("value")
    .eq("key", "support")
    .maybeSingle();
  let qris_url: string | null = cur?.value?.qris_url ?? null;
  const f = fd.get("qris") as File | null;
  if (f && f.size > 0) {
    if (!EXT[f.type] || f.size > 5 * 1024 * 1024) back("error=upload");
    const path = `${user.id}/qris-${crypto.randomUUID()}.${EXT[f.type]}`;
    const up = await sb.storage
      .from("media")
      .upload(path, f, { contentType: f.type });
    if (up.error) back("error=upload");
    qris_url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  } else if (p.data!.remove_qris === "on") qris_url = null;

  await sb
    .from("app_settings")
    .upsert({ key: "support", value: { saweria_url: saweria, qris_url } });
  await audit(user.id, "settings.support", "support");
  revalidatePath("/", "layout");
  back("ok=1");
}
