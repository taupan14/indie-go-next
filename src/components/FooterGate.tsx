"use client";
import { usePathname } from "next/navigation";

/** Footer tidak ditampilkan di halaman Masuk/Daftar (layar terbagi) dan panel admin. */
export default function FooterGate({
  children,
}: {
  children: React.ReactNode;
}) {
  const path = usePathname();
  if (path.startsWith("/masuk") || path.startsWith("/admin")) return null;
  return <>{children}</>;
}
