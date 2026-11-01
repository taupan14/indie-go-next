"use server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { requireSuperAdmin, audit } from "@/lib/admin";

const done = (q: string): never => { revalidatePath("/admin/filter"); redirect(`/admin/filter?${q}`); };

export async function addTerm(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const p = z.object({ kind: z.enum(["word", "domain"]), term: z.string().trim().toLowerCase().min(2).max(60) }).safeParse(Object.fromEntries(fd));
  if (!p.success) done("error=invalid");
  // Domain: buang protokol, www, dan path
  const term = p.data!.kind === "domain" ? p.data!.term.replace(/^https?:\/\//, "").replace(/^www\./, "").split("/")[0] : p.data!.term;
  const { error } = await sb.from("filter_terms").insert({ kind: p.data!.kind, term });
  if (error) done(error.code === "23505" ? "error=dup" : "error=invalid");
  await audit(user.id, "filter.add", `${p.data!.kind}:${term}`);
  done("ok=1");
}

export async function deleteTerm(fd: FormData) {
  const { sb, user } = await requireSuperAdmin();
  const id = z.string().uuid().parse(fd.get("id"));
  await sb.from("filter_terms").delete().eq("id", id);
  await audit(user.id, "filter.delete", `term:${id}`);
  done("ok=1");
}
