import { cookies } from "next/headers";
import id from "./messages/id.json";
import en from "./messages/en.json";

export const locales = ["id", "en"] as const;
export type Locale = (typeof locales)[number];
const all = { id, en } as const;

export async function getLocale(): Promise<Locale> {
  const v = (await cookies()).get("locale")?.value;
  return v === "en" ? "en" : "id"; // default: Indonesia
}

/** Ambil teks: t("thread.publish"), t("thread.lockedComments", { count: 18 }) */
export function makeT(locale: Locale) {
  return (key: string, vars: Record<string, string | number> = {}) => {
    const raw = key.split(".").reduce<any>((o, k) => o?.[k], all[locale]) ?? key;
    return String(raw).replace(/\{(\w+)\}/g, (_, k) => String(vars[k] ?? ""));
  };
}
