"use client";
import FilePicker from "@/components/FilePicker";
import { useActionState } from "react";
import { createThread, type FormState } from "./actions";

const input =
  "w-full rounded-lg border border-border bg-surface px-3 py-2 text-sm outline-none focus:border-primary";
const label = "block text-sm font-medium";
const hint = "mt-1 text-xs text-muted";

type Opt = { id: string; name: string };

export default function ThreadForm({
  categories,
  communities,
  m,
  initialCommunity,
}: {
  categories: Opt[];
  communities: Opt[];
  m: Record<string, string>;
  initialCommunity?: string;
}) {
  const [state, action, pending] = useActionState<FormState, FormData>(
    createThread,
    {},
  );
  const f = state.fields ?? {};
  const error =
    state.error === "curation"
      ? `${m.rejected} (${m.reasonLabel}: ${m["reason_" + state.reason] ?? m.reason_custom})`
      : state.error
        ? m["err_" + state.error]
        : null;

  return (
    <form action={action} className="space-y-4">
      {error && (
        <p
          role="alert"
          className="rounded-lg border border-danger bg-accent px-3 py-2 text-sm text-danger"
        >
          {error}
        </p>
      )}

      <label className={label}>
        {m.title}
        <input
          name="title"
          required
          minLength={5}
          maxLength={150}
          defaultValue={f.title}
          className={`${input} mt-1 font-normal`}
        />
      </label>

      <div className="grid gap-3 sm:grid-cols-2">
        <label className={label}>
          {m.category}
          <select
            name="category_id"
            required
            defaultValue={f.category_id ?? ""}
            className={`${input} mt-1 font-normal`}
          >
            <option value="" disabled>
              —
            </option>
            {categories.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
        <label className={label}>
          {m.community}
          <select
            name="community_id"
            defaultValue={f.community_id ?? initialCommunity ?? ""}
            className={`${input} mt-1 font-normal`}
          >
            <option value="">{m.publicOnly}</option>
            {communities.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </label>
      </div>

      <label className={label}>
        {m.body}
        <textarea
          name="body"
          required
          maxLength={10000}
          rows={9}
          defaultValue={f.body}
          className={`${input} mt-1 font-normal`}
        />
      </label>

      <div>
        <p className={label}>{m.photos}</p>
        <div className="mt-1">
          <FilePicker
            name="photos"
            multiple
            label={m.pickPhotos}
            emptyText={m.noFile}
            filesText={m.filesChosen}
          />
        </div>
        <p className={hint}>{m.photosHint}</p>
      </div>

      <label className={label}>
        {m.links}
        <textarea
          name="links"
          rows={3}
          defaultValue={f.links}
          className={`${input} mt-1 font-normal`}
          placeholder="https://youtu.be/..."
        />
        <span className={hint}>{m.linksHint}</span>
      </label>

      <label className={label}>
        {m.tags}
        <input
          name="tags"
          defaultValue={f.tags}
          className={`${input} mt-1 font-normal`}
        />
        <span className={hint}>{m.tagsHint}</span>
      </label>

      <div className="flex justify-end">
        <button
          disabled={pending}
          className="rounded-lg bg-primary px-5 py-2 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {m.publish}
        </button>
      </div>
    </form>
  );
}
