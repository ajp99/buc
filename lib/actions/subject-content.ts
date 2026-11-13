import "server-only";
import type { z } from "zod";
import { fromZod, type ActionState } from "@/lib/actions/result";
import { batchIdForSubject } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

type Parsed<T> =
  | { ok: false; state: ActionState }
  | { ok: true; supabase: Awaited<ReturnType<typeof createClient>>; row: T & { batch_id: string } };

/**
 * Validates a form for subject-scoped content (homework, materials, quizzes)
 * and adds the subject's batch_id, so batch and subject can never disagree.
 */
export async function parseSubjectContent<S extends z.ZodType<{ subject_id: string }>>(
  schema: S,
  formData: FormData,
): Promise<Parsed<z.infer<S>>> {
  const parsed = schema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { ok: false, state: fromZod(parsed.error) };
  const supabase = await createClient();
  const batchId = await batchIdForSubject(supabase, parsed.data.subject_id);
  if (!batchId) return { ok: false, state: { fieldErrors: { subject_id: "validation.required" } } };
  return { ok: true, supabase, row: { ...parsed.data, batch_id: batchId } };
}
