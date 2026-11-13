import "server-only";
import { cookies } from "next/headers";
import { DEFAULT_LANG, isLang, t, type Lang } from "./i18n";

export const LANG_COOKIE = "lang";

export async function getLang(): Promise<Lang> {
  const value = (await cookies()).get(LANG_COOKIE)?.value;
  return isLang(value) ? value : DEFAULT_LANG;
}

/** A translate function bound to the request's language. */
export async function getT() {
  const lang = await getLang();
  return (key: string, vars?: Record<string, string | number>) => t(lang, key, vars);
}
