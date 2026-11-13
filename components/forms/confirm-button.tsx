"use client";

import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
import { useT } from "@/components/i18n-provider";
import type { ActionState } from "@/lib/actions/result";

/** A button that asks for confirmation, then runs a server action. */
export function ConfirmButton({ action, confirmText, label, variant = "destructive" }: {
  action: () => Promise<ActionState | void>;
  confirmText: string;
  label: string;
  variant?: "destructive" | "outline";
}) {
  const t = useT();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string>();

  return (
    <span className="inline-flex flex-col items-start gap-1">
      <Button
        type="button"
        size="sm"
        variant={variant}
        disabled={pending}
        onClick={() => {
          if (!window.confirm(confirmText)) return;
          startTransition(async () => {
            const result = await action();
            setError(result?.error);
          });
        }}
      >
        {label}
      </Button>
      {error && <span className="text-sm text-destructive">{t(error)}</span>}
    </span>
  );
}
