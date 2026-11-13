"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useLang, useT } from "@/components/i18n-provider";
import { setLanguage } from "@/lib/actions/language";
import { LANGS } from "@/lib/i18n";

export function LangToggle() {
  const lang = useLang();
  const t = useT();
  const [pending, startTransition] = useTransition();

  return (
    <div role="group" aria-label={t("common.language")} className="inline-flex gap-1">
      {LANGS.map((code) => (
        <Button
          key={code}
          type="button"
          size="sm"
          variant={code === lang ? "default" : "outline"}
          aria-pressed={code === lang}
          disabled={pending}
          onClick={() => startTransition(() => setLanguage(code))}
        >
          {t(code === "en" ? "common.english" : "common.hindi")}
        </Button>
      ))}
    </div>
  );
}
