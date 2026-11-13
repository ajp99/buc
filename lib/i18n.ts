import en from "@/locales/en.json";
import hi from "@/locales/hi.json";

export type Lang = "en" | "hi";
export const LANGS: Lang[] = ["en", "hi"];
export const DEFAULT_LANG: Lang = "en";

const dictionaries = { en, hi } as const;

type Dict = Record<string, unknown>;

function lookup(dict: Dict, key: string): string | undefined {
  let cur: unknown = dict;
  for (const part of key.split(".")) {
    if (typeof cur !== "object" || cur === null) return undefined;
    cur = (cur as Dict)[part];
  }
  return typeof cur === "string" ? cur : undefined;
}

export function isLang(value: unknown): value is Lang {
  return value === "en" || value === "hi";
}

/** Translate a dotted key, falling back to English, then to the key itself. */
export function t(lang: Lang, key: string, vars?: Record<string, string | number>): string {
  const raw = lookup(dictionaries[lang], key) ?? lookup(dictionaries.en, key) ?? key;
  if (!vars) return raw;
  return raw.replace(/\{(\w+)\}/g, (_, name) => String(vars[name] ?? `{${name}}`));
}
