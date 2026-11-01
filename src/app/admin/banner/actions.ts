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
  "image/gif": "gif",
};
const schema = z.object({
  id: z
    .string()
    .uuid()
    .optional()
    .or(z.literal("").transform(() => undefined)),
  kind: z.enum(["text", "image"]),
  slot: z.enum(["strip", "side"]),
  title: z.string().trim().min(1).max(80),
  body: z.string().trim().max(200).default(""),
  link_url: z.string().trim().default(""),
  active: z.string().optional(),
  starts_at: z.string().default(""),
  ends_at: z.string().default(""),
});
const done = (q: string): never => {
  revalidatePath("/");
  redirect(`/admin/banner?${q}`);
};
// Input waktu dianggap WIB (UTC+7)
const wib = (v: string) => {
  if (!v) return null;
  const d = new Date(`${v}:00+07:00`);
  return isNaN(+d) ? undefined : d.toISOString();
};

export async function saveBanner(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) done("error=invalid");
  const { id, active, starts_at, ends_at, link_url, ...v } = p.data!;
  const s = wib(starts_at),
    e = wib(ends_at);
  const link =
    link_url === ""
      ? null
      : link_url.startsWith("/") && !link_url.startsWith("//")
        ? link_url
        : safeUrl(link_url);
  if (s === undefined || e === undefined || (link_url && !link))
    done("error=invalid");

  const cur = id
    ? (await sb.from("banners").select("slot,image_url").eq("id", id).single())
        .data
    : null;
  let image_url: string | null = cur?.image_url ?? null;
  const f = fd.get("image") as File | null;
  if (f && f.size > 0) {
    if (!EXT[f.type] || f.size > 5 * 1024 * 1024) done("error=upload");
    const path = `${user.id}/banner-${crypto.randomUUID()}.${EXT[f.type]}`;
    const up = await sb.storage
      .from("media")
      .upload(path, f, { contentType: f.type });
    if (up.error) done("error=upload");
    image_url = sb.storage.from("media").getPublicUrl(path).data.publicUrl;
  }
  if (v.kind === "image" && !image_url) done("error=noimage");

  const row: Record<string, unknown> = {
    ...v,
    image_url,
    link_url: link,
    active: active === "on",
    starts_at: s,
    ends_at: e,
  };
  if (!cur || cur.slot !== v.slot) {
    // posisi baru: taruh di akhir zona tujuan
    const { data: last } = await sb
      .from("banners")
      .select("sort")
      .eq("slot", v.slot)
      .order("sort", { ascending: false })
      .limit(1);
    row.sort = (last?.[0]?.sort ?? -1) + 1;
  }
  const { error } = id
    ? await sb.from("banners").update(row).eq("id", id)
    : await sb.from("banners").insert(row);
  if (error) done("error=invalid");
  await audit(
    user.id,
    id ? "banner.update" : "banner.create",
    `banner:${v.title}`,
  );
  done("ok=1");
}

export async function deleteBanner(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  await sb.from("banners").delete().eq("id", id);
  await audit(user.id, "banner.delete", `banner:${id}`);
  done("ok=1");
}

/** Dipanggil dari pratinjau seret-dan-lepas: menyimpan zona dan urutan semua banner. */
export async function reorderBanners(zones: {
  strip: string[];
  side: string[];
}) {
  const { sb, user } = await requireSuperAdmin();
  const z2 = z
    .object({
      strip: z.array(z.string().uuid()).max(50),
      side: z.array(z.string().uuid()).max(50),
    })
    .parse(zones);
  await Promise.all(
    (["strip", "side"] as const).flatMap((slot) =>
      z2[slot].map((id, i) =>
        sb.from("banners").update({ slot, sort: i }).eq("id", id),
      ),
    ),
  );
  await audit(user.id, "banner.reorder", "banners");
  revalidatePath("/");
  revalidatePath("/admin/banner");
}
