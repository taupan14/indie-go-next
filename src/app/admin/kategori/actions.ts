"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin, audit, slugify } from "@/lib/admin";

const schema = z.object({
  id: z.string().uuid().optional().or(z.literal("").transform(() => undefined)),
  name: z.string().trim().min(2).max(30),
  color: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  sort: z.coerce.number().int().min(0).max(999).default(0),
});
const done = (q: string): never => { revalidatePath("/", "layout"); redirect(`/admin/kategori?${q}`); };

export async function saveCategory(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const p = schema.safeParse(Object.fromEntries(fd));
  if (!p.success) done("error=invalid");
  const { id, ...v } = p.data!;
  const { error } = id ? await sb.from("categories").update(v).eq("id", id) : await sb.from("categories").insert({ ...v, slug: slugify(v.name) });
  if (error) done(error.code === "23505" ? "error=dup" : "error=invalid");
  await audit(user.id, id ? "category.update" : "category.create", `category:${v.name}`);
  done("ok=1");
}

export async function deleteCategory(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  const { error } = await sb.from("categories").delete().eq("id", id);
  if (error) done("error=used"); // masih dipakai thread
  await audit(user.id, "category.delete", `category:${id}`);
  done("ok=1");
}
