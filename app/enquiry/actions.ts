"use server";

import { fromDb, fromZod, type ActionState } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";
import { enquirySchema, isLikelyBot } from "@/lib/validators/enquiry";

/** Public enquiry form. RLS allows anonymous inserts with status 'new' only. */
export async function submitEnquiry(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const fields = Object.fromEntries(formData) as Record<string, string>;
  // Report success to bots so they don't retry with changes.
  if (isLikelyBot({ website: fields.website, renderedAt: fields.renderedAt })) return { ok: true };

  const parsed = enquirySchema.safeParse(fields);
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  // No .select(): visitors aren't allowed to read enquiries back.
  const { error } = await supabase.from("enquiries").insert(parsed.data);
  if (error) return fromDb(error);
  return { ok: true };
}
