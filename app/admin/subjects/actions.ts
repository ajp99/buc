"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { fromDb, fromZod, type ActionState } from "@/lib/actions/result";
import { createClient } from "@/lib/supabase/server";
import { subjectSchema } from "@/lib/validators/admin";

export async function createSubject(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = subjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { data, error } = await supabase.from("subjects").insert(parsed.data).select("id").single();
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "create", entity: "subject", entityId: data.id, meta: parsed.data });
  revalidatePath("/admin/subjects");
  return { ok: true };
}

export async function updateSubject(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = subjectSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);

  const supabase = await createClient();
  const { error } = await supabase.from("subjects").update(parsed.data).eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "subject", entityId: id, meta: parsed.data });
  revalidatePath("/admin/subjects");
  redirect("/admin/subjects");
}

export async function deleteSubject(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("subjects").delete().eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "subject", entityId: id });
  revalidatePath("/admin/subjects");
  return { ok: true };
}
