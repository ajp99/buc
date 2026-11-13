"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import type { ActionState } from "@/lib/actions/result";

/** A button that runs a server action, optionally asking for confirmation first. */
export function ConfirmButton({ action, confirmText, label, variant = "destructive", size = "sm" }: {
  action: () => Promise<ActionState | void>;
  confirmText?: string;
  label: string;
  variant?: "destructive" | "outline" | "default";
  size?: "sm" | "default" | "lg";
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [result, setResult] = useState<ActionState>();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        size={size}
        variant={variant}
        disabled={pending}
        onClick={() => {
          if (confirmText && !window.confirm(confirmText)) return;
          startTransition(async () => setResult((await action()) ?? undefined));
        }}
      >
        {label}
      </Button>
      {result?.error && <span className="text-sm text-destructive">{t(result.error)}</span>}
      {result?.message && (
        <span role="status" className="text-sm text-primary">
          {t(result.message, result.vars)}
        </span>
      )}
    </span>
  );
}
