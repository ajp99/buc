"use server";

import { cookies } from "next/headers";
import { revalidatePath } from "next/cache";
import { isLang } from "@/lib/i18n";
import { LANG_COOKIE } from "@/lib/i18n-server";
import { getSessionUser } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

export async function setLanguage(lang: string) {
  if (!isLang(lang)) return;
  (await cookies()).set(LANG_COOKIE, lang, { path: "/", maxAge: 60 * 60 * 24 * 365, sameSite: "lax" });
  const user = await getSessionUser();
  if (user) {
    const supabase = await createClient();
    await supabase.from("users").update({ language: lang }).eq("id", user.id);
  }
  revalidatePath("/", "layout");
}
