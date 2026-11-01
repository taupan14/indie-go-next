import { supabaseServer } from "@/lib/supabase/server";
import { getLocale, makeT } from "@/i18n";
import ThreadForm from "./ThreadForm";

export default async function NewThreadPage({ searchParams }: { searchParams: Promise<{ c?: string }> }) {
  const { c } = await searchParams;
  const t = makeT(await getLocale());
  const sb = await supabaseServer();
  const { data: { user } } = await sb.auth.getUser(); // halaman ini dijaga middleware
  const [{ data: categories }, { data: mem }] = await Promise.all([
    sb.from("categories").select("id,name").order("sort"),
    sb.from("community_members").select("communities(id,name)").eq("user_id", user?.id ?? ""),
  ]);
  const communities = (mem ?? []).map((r: any) => r.communities).filter(Boolean);

  const m: Record<string, string> = {
    title: t("form.title"), category: t("form.category"), community: t("form.community"), publicOnly: t("form.publicOnly"),
    tags: t("form.tags"), tagsHint: t("form.tagsHint"), body: t("form.body"), photos: t("form.photos"), photosHint: t("form.photosHint"),
    links: t("form.links"), linksHint: t("form.linksHint"), publish: t("thread.publish"),
    rejected: t("curation.rejected"), reasonLabel: t("curation.reasonLabel"),
    err_invalid: t("form.errInvalid"), err_rate: t("form.errRate"), err_upload: t("form.errUpload"), err_links: t("form.errLinks"),
  };
  for (const k of ["swearing", "gambling", "drugs", "porn", "trafficking", "violence", "custom"]) m["reason_" + k] = t("curation.reason." + k);

  return (
    <main className="mx-auto max-w-2xl px-4 py-6">
      <h1 className="mb-4 text-xl font-medium">{t("nav.newThread")}</h1>
      <ThreadForm categories={categories ?? []} communities={communities} m={m} initialCommunity={communities.some((x: any) => x.id === c) ? c : ""} />
    </main>
  );
}
