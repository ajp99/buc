import "server-only";
import type { SupabaseClient } from "@supabase/supabase-js";
import type { Database } from "@/lib/supabase/database.types";

export type SubjectOption = { id: string; batch_id: string; label: string; subject: string };

/** All subjects as "Standard 6 · Maths" options, ordered by standard then name. */
export async function getSubjectOptions(supabase: SupabaseClient<Database>): Promise<SubjectOption[]> {
  const { data } = await supabase.from("subjects").select("id, name, batch_id, batch:batches(name, standard)");
  return (data ?? [])
    .sort((a, b) => (a.batch?.standard ?? 0) - (b.batch?.standard ?? 0) || a.name.localeCompare(b.name))
    .map((s) => ({ id: s.id, batch_id: s.batch_id, subject: s.name, label: `${s.batch?.name ?? ""} · ${s.name}` }));
}

/** The batch a subject belongs to, so content rows can't mismatch batch and subject. */
export async function batchIdForSubject(supabase: SupabaseClient<Database>, subjectId: string): Promise<string | null> {
  const { data } = await supabase.from("subjects").select("batch_id").eq("id", subjectId).maybeSingle();
  return data?.batch_id ?? null;
}
