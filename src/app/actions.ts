"use server";
import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";

export async function setLocale(locale: string) {
  (await cookies()).set("locale", locale === "en" ? "en" : "id", { path: "/", maxAge: 60 * 60 * 24 * 365 });
  revalidatePath("/", "layout");
}
