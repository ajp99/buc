"use client";

import { createContext, useCallback, useContext } from "react";
import { t, type Lang } from "@/lib/i18n";

const LangContext = createContext<Lang>("en");

export function I18nProvider({ lang, children }: { lang: Lang; children: React.ReactNode }) {
  return <LangContext.Provider value={lang}>{children}</LangContext.Provider>;
}

export function useLang(): Lang {
  return useContext(LangContext);
}

export function useT() {
  const lang = useLang();
  return useCallback(
    (key: string, vars?: Record<string, string | number>) => t(lang, key, vars),
    [lang],
  );
}
