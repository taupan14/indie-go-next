import { adminT } from "@/i18n/admin";
import ConfirmDialog from "./ConfirmDialog";

type Props = {
  action: (fd: FormData) => void | Promise<void>;
  fields: Record<string, string>;
  label: string;
  title: string;
  message: string;
  confirm?: string;
  danger?: boolean;
  className?: string;
};

/** Pembungkus server: menerjemahkan teks lalu menampilkan dialog konfirmasi untuk setiap aksi hapus atau keluarkan. */
export default async function ConfirmAction({
  action,
  fields,
  label,
  title,
  message,
  confirm = "Ya, lanjutkan",
  danger = true,
  className,
}: Props) {
  const tt = await adminT();
  return (
    <ConfirmDialog
      action={action}
      fields={fields}
      label={tt(label)}
      title={tt(title)}
      message={tt(message)}
      confirm={tt(confirm)}
      cancel={tt("Batal")}
      close={tt("Tutup")}
      danger={danger}
      className={className}
    />
  );
}
