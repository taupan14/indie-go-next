"use client";
import { useEffect, useId, useState } from "react";

type Props = {
  name: string;
  accept?: string;
  multiple?: boolean;
  label?: string;
  emptyText?: string;
  filesText?: string;
};

/** Pengganti tampilan bawaan "Choose file": tombol berikon + teks, nama file terpilih, dan pratinjau kecil. */
export default function FilePicker({
  name,
  accept = "image/jpeg,image/png,image/webp,image/gif",
  multiple,
  label = "Pilih gambar",
  emptyText = "Belum ada file dipilih",
  filesText = "{n} file dipilih",
}: Props) {
  const id = useId();
  const [files, setFiles] = useState<File[]>([]);
  const [urls, setUrls] = useState<string[]>([]);
  useEffect(() => {
    const u = files
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, 4)
      .map((f) => URL.createObjectURL(f));
    setUrls(u);
    return () => u.forEach((x) => URL.revokeObjectURL(x));
  }, [files]);

  return (
    <div className="flex flex-wrap items-center gap-3">
      <input
        id={id}
        name={name}
        type="file"
        accept={accept}
        multiple={multiple}
        className="peer sr-only"
        onChange={(e) => setFiles(Array.from(e.target.files ?? []))}
      />
      <label
        htmlFor={id}
        className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-border bg-surface px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent peer-focus-visible:ring-2 peer-focus-visible:ring-primary"
      >
        <svg
          viewBox="0 0 24 24"
          className="size-4"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden
        >
          <path d="M12 16V4m0 0L7 9m5-5 5 5" />
          <path d="M4 16v3a1 1 0 0 0 1 1h14a1 1 0 0 0 1-1v-3" />
        </svg>
        {label}
      </label>
      {urls.map((u) => (
        <img
          key={u}
          src={u}
          alt=""
          className="size-10 rounded-md border border-border object-cover"
        />
      ))}
      <span className="min-w-0 truncate text-xs font-normal text-muted">
        {files.length === 0
          ? emptyText
          : files.length === 1
            ? files[0].name
            : filesText.replace("{n}", String(files.length))}
      </span>
    </div>
  );
}
