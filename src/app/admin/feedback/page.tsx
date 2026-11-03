import { requireSuperAdmin } from "@/lib/admin";
import { adminT } from "@/i18n/admin";
import ConfirmAction from "@/components/ConfirmAction";
import { Head, ui } from "@/components/AdminUI";
import { updateFeedback } from "./actions";

export default async function FeedbackAdmin() {
  const tt = await adminT();
  const { sb } = await requireSuperAdmin();
  const { data } = await sb
    .from("feedbacks")
    .select("id,email,message,status,created_at")
    .order("created_at", { ascending: false })
    .limit(100);
  const fmt = new Intl.DateTimeFormat(tt("id-ID"), {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "Asia/Jakarta",
  });
  const unread = (data ?? []).filter((f: any) => f.status === "new").length;
  const Btn = ({
    id,
    mode,
    label,
  }: {
    id: string;
    mode: string;
    label: string;
  }) => (
    <form action={updateFeedback}>
      <input type="hidden" name="id" value={id} />
      <input type="hidden" name="mode" value={mode} />
      <button className={ui.ghost}>{label}</button>
    </form>
  );
  return (
    <main className="mx-auto max-w-3xl px-4 py-6">
      <Head title={`Feedback (${unread} ${tt("baru")})`} tab="sistem" />
      <div className="space-y-2">
        {(data ?? []).map((f: any) => (
          <div
            key={f.id}
            className={`${ui.card} ${f.status === "new" ? "border-primary" : ""}`}
          >
            <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted">
              <a
                href={`mailto:${f.email}`}
                className="font-medium text-foreground hover:underline"
              >
                {f.email}
              </a>
              <span>
                {fmt.format(new Date(f.created_at))} {tt("WIB")}
                {f.status === "new" && (
                  <span className="ml-2 rounded-full bg-primary px-2 py-0.5 text-primary-foreground">
                    {tt("baru")}
                  </span>
                )}
              </span>
            </div>
            <p className="mt-2 whitespace-pre-wrap break-words text-sm">
              {f.message}
            </p>
            <div className="mt-3 flex gap-2">
              {f.status === "new" ? (
                <Btn id={f.id} mode="read" label={tt("Tandai dibaca")} />
              ) : (
                <Btn id={f.id} mode="new" label={tt("Tandai baru")} />
              )}
              <ConfirmAction
                action={updateFeedback}
                fields={{ id: f.id, mode: "delete" }}
                label={tt("Hapus")}
                title={tt("Hapus feedback?")}
                message="Masukan ini akan dihapus permanen."
                confirm="Ya, hapus"
                className={ui.ghost}
              />
            </div>
          </div>
        ))}
        {!data?.length && (
          <p className="py-10 text-center text-sm text-muted">
            {tt("Belum ada feedback.")}
          </p>
        )}
      </div>
    </main>
  );
}
