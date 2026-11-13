"use client";

import { useActionState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useT } from "@/components/i18n-provider";
import { signIn, type LoginState } from "@/lib/actions/auth";

export function LoginForm({ next }: { next?: string }) {
  const t = useT();
  const [state, action, pending] = useActionState<LoginState, FormData>(signIn, {});

  return (
    <form action={action} className="grid gap-4">
      <input type="hidden" name="next" value={next ?? ""} />
      <div className="grid gap-2">
        <Label htmlFor="identifier">{t("auth.identifier")}</Label>
        <Input id="identifier" name="identifier" autoComplete="username" inputMode="text" required />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="password">{t("auth.password")}</Label>
        <Input id="password" name="password" type="password" autoComplete="current-password" required />
      </div>
      {state.error && (
        <Alert variant="destructive">
          <AlertDescription>{t(state.error)}</AlertDescription>
        </Alert>
      )}
      <Button type="submit" disabled={pending} className="w-full">
        {pending ? t("auth.signingIn") : t("auth.signIn")}
      </Button>
      <p className="text-sm text-muted-foreground">{t("auth.forgot")}</p>
    </form>
  );
}
