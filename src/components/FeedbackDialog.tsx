"use client";
import { useActionState, useRef, useState } from "react";
import { sendFeedback, type FeedbackState } from "@/app/feedback/actions";

type M = Record<string, string>;
const field =
  "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm outline-none focus:border-primary";

function FeedbackForm({
  defaultEmail,
  m,
  close,
}: {
  defaultEmail?: string;
  m: M;
  close: () => void;
}) {
  const [state, action, pending] = useActionState<FeedbackState, FormData>(
    sendFeedback,
    {},
  );
  const [len, setLen] = useState(0);
  if (state.ok)
    return (
      <div className="p-6 text-center">
        <p className="text-3xl" aria-hidden>
          🙌
        </p>
        <p className="mt-2 text-sm">{m.dlgThanks}</p>
        <button
          type="button"
          onClick={close}
          className="mt-4 rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground"
        >
          {m.dlgClose}
        </button>
      </div>
    );
  const err = state.error
    ? m[
        {
          invalid: "errInvalid",
          rate: "errRate",
          curation: "errCuration",
          failed: "errFailed",
        }[state.error]
      ]
    : null;
  return (
    <form action={action} className="space-y-3 p-4">
      <input
        name="website"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden
        className="hidden"
      />{" "}
      {/* jebakan bot */}
      <label className="block text-xs text-muted">
        {m.dlgEmail}
        <input
          name="email"
          type="email"
          required
          maxLength={120}
          defaultValue={defaultEmail}
          autoComplete="email"
          className={`${field} mt-1 text-foreground`}
        />
      </label>
      <label className="block text-xs text-muted">
        {m.dlgMessage}
        <textarea
          name="message"
          required
          minLength={5}
          maxLength={1000}
          rows={5}
          placeholder={m.dlgPlaceholder}
          onChange={(e) => setLen(e.target.value.length)}
          className={`${field} mt-1 text-foreground`}
        />
        <span className="mt-1 block text-right">{len} / 1000</span>
      </label>
      {err && (
        <p role="alert" className="text-xs text-danger">
          {err}
        </p>
      )}
      <div className="flex justify-end gap-2">
        <button
          type="button"
          onClick={close}
          className="rounded-lg border border-border px-3 py-1.5 text-sm"
        >
          {m.dlgCancel}
        </button>
        <button
          disabled={pending}
          className="rounded-lg bg-primary px-4 py-1.5 text-sm font-medium text-primary-foreground disabled:opacity-60"
        >
          {pending ? m.dlgSending : m.dlgSend}
        </button>
      </div>
    </form>
  );
}

export default function FeedbackDialog({
  defaultEmail,
  m,
}: {
  defaultEmail?: string;
  m: M;
}) {
  const ref = useRef<HTMLDialogElement>(null);
  const [k, setK] = useState(0); // mengosongkan form setiap kali dialog ditutup
  return (
    <>
      <button
        type="button"
        onClick={() => ref.current?.showModal()}
        className="rounded-lg border border-border bg-surface px-3 py-1.5 text-sm hover:bg-accent"
      >
        ✉ {m.feedback}
      </button>
      <dialog
        ref={ref}
        onClose={() => setK((n) => n + 1)}
        onClick={(e) => {
          if (e.target === ref.current) ref.current?.close();
        }}
        className="m-auto w-[calc(100%-2rem)] max-w-sm rounded-2xl border border-border bg-surface p-0 text-foreground backdrop:bg-black/40"
      >
        <div className="flex items-center justify-between border-b border-border px-4 py-3">
          <h2 className="font-medium">{m.dlgTitle}</h2>
          <button
            type="button"
            onClick={() => ref.current?.close()}
            aria-label={m.dlgClose}
            className="text-xl leading-none text-muted"
          >
            ×
          </button>
        </div>
        <FeedbackForm
          key={k}
          defaultEmail={defaultEmail}
          m={m}
          close={() => ref.current?.close()}
        />
      </dialog>
    </>
  );
}
