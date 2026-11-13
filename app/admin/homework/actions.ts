"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { fromDb, type ActionState } from "@/lib/actions/result";
import { parseSubjectContent } from "@/lib/actions/subject-content";
import { createClient } from "@/lib/supabase/server";
import { homeworkSchema } from "@/lib/validators/content";

function revalidate() {
  revalidatePath("/admin/homework");
  revalidatePath("/app", "layout");
}

export async function createHomework(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const result = await parseSubjectContent(homeworkSchema, formData);
  if (!result.ok) return result.state;
  const { supabase, row } = result;

  const { data, error } = await supabase.from("homework").insert({ ...row, created_by: user.id }).select("id").single();
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "create", entity: "homework", entityId: data.id, meta: { title: row.title, due_date: row.due_date } });
  revalidate();
  return { ok: true };
}

export async function updateHomework(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const result = await parseSubjectContent(homeworkSchema, formData);
  if (!result.ok) return result.state;
  const { supabase, row } = result;

  const { error } = await supabase.from("homework").update(row).eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "homework", entityId: id, meta: { title: row.title, due_date: row.due_date } });
  revalidate();
  redirect("/admin/homework");
}

export async function deleteHomework(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("homework").delete().eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "homework", entityId: id });
  revalidate();
  return { ok: true };
}
