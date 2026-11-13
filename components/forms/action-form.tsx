"use client";

import { createContext, useContext, useRef, useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n-provider";
import type { ActionState } from "@/lib/actions/result";
import { cn } from "@/lib/utils";

const FieldErrors = createContext<Record<string, string>>({});

type Props = {
  action: (prev: ActionState, formData: FormData) => Promise<ActionState>;
  submitLabel: string;
  /** Clear the form after a successful submit (create forms). */
  resetOnSuccess?: boolean;
  successMessage?: string;
  className?: string;
  children: React.ReactNode;
};

/**
 * Form wired to a server action. Submits via a transition rather than
 * <form action> so React 19 doesn't clear the inputs when validation fails.
 */
export function ActionForm({ action, submitLabel, resetOnSuccess, successMessage, className, children }: Props) {
  const t = useT();
  const formRef = useRef<HTMLFormElement>(null);
  const [state, setState] = useState<ActionState>({});
  const [pending, startTransition] = useTransition();

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    startTransition(async () => {
      const next = await action(state, formData);
      setState(next ?? {});
      if (next?.ok && resetOnSuccess) formRef.current?.reset();
    });
  }

  return (
    <form ref={formRef} onSubmit={onSubmit} className={cn("grid gap-4", className)} noValidate>
      <FieldErrors.Provider value={state.fieldErrors ?? {}}>{children}</FieldErrors.Provider>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{t(state.error)}</AlertDescription>
        </Alert>
      )}
      {state.ok && (
        <p role="status" className="text-sm text-primary">
          {successMessage ?? t("common.saved")}
        </p>
      )}
      <div>
        <Button type="submit" disabled={pending}>
          {pending ? t("common.saving") : submitLabel}
        </Button>
      </div>
    </form>
  );
}

/** Label + control + this field's validation error. */
export function Field({ name, label, className, children }: {
  name: string;
  label: string;
  className?: string;
  children: React.ReactNode;
}) {
  const t = useT();
  const error = useContext(FieldErrors)[name];
  return (
    <div className={cn("grid gap-2", className)}>
      <Label htmlFor={name}>{label}</Label>
      {children}
      {error && (
        <p id={`${name}-error`} className="text-sm text-destructive">
          {t(error)}
        </p>
      )}
    </div>
  );
}
