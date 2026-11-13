import { z } from "zod";
import { normalizePhone } from "@/lib/auth/identity";

export const enquirySchema = z.object({
  name: z.string().trim().min(1, "validation.required").max(100, "validation.tooLong"),
  phone: z.string().transform((v, ctx) => {
    const phone = normalizePhone(v);
    if (!phone) {
      ctx.addIssue({ code: "custom", message: "validation.phone" });
      return z.NEVER;
    }
    return phone;
  }),
  standard: z.coerce.number("validation.standard").int().min(5, "validation.standard").max(10, "validation.standard"),
  message: z.string().trim().max(1000, "validation.tooLong").default(""),
});

const MIN_FILL_MS = 2_000;

/**
 * Cheap spam checks for the public form: a hidden "website" field humans
 * leave empty, and a render timestamp that bots submit too quickly after.
 */
export function isLikelyBot(fields: { website?: string; renderedAt?: string }, now = Date.now()): boolean {
  if (fields.website) return true;
  const renderedAt = Number(fields.renderedAt);
  if (!Number.isFinite(renderedAt) || renderedAt > now) return true;
  return now - renderedAt < MIN_FILL_MS;
}
