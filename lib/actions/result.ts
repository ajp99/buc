import type { ZodError } from "zod";

/** What a form action returns. Messages are i18n keys. */
export type ActionState = {
  ok?: boolean;
  error?: string;
  fieldErrors?: Record<string, string>;
};

export function fromZod(error: ZodError): ActionState {
  const fieldErrors: Record<string, string> = {};
  for (const issue of error.issues) {
    const field = String(issue.path[0] ?? "_");
    fieldErrors[field] ??= issue.message.includes(".") ? issue.message : "validation.invalid";
  }
  return { error: "validation.fix", fieldErrors };
}

/** Maps common Postgres errors to user-facing i18n keys. */
export function fromDb(error: { code?: string } | null): ActionState {
  switch (error?.code) {
    case "23505":
      return { error: "errors.duplicate" };
    case "23503":
      return { error: "errors.inUse" };
    case "42501":
      return { error: "errors.forbidden" };
    default:
      return { error: "errors.generic" };
  }
}
