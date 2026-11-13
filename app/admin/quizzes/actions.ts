"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { logAudit } from "@/lib/audit";
import { requireRole } from "@/lib/auth/session";
import { fromDb, fromZod, type ActionState } from "@/lib/actions/result";
import { parseSubjectContent } from "@/lib/actions/subject-content";
import { createClient } from "@/lib/supabase/server";
import { questionSchema, quizSchema } from "@/lib/validators/quiz";

function revalidate(quizId?: string) {
  revalidatePath("/admin/quizzes");
  if (quizId) revalidatePath(`/admin/quizzes/${quizId}`);
  revalidatePath("/app", "layout");
}

export async function createQuiz(_prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const result = await parseSubjectContent(quizSchema, formData);
  if (!result.ok) return result.state;
  const { supabase, row } = result;

  const { data, error } = await supabase.from("quizzes").insert({ ...row, created_by: user.id }).select("id").single();
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "create", entity: "quiz", entityId: data.id, meta: { title: row.title } });
  revalidate();
  redirect(`/admin/quizzes/${data.id}`);
}

export async function updateQuiz(id: string, _prev: ActionState, formData: FormData): Promise<ActionState> {
  const user = await requireRole("admin");
  const result = await parseSubjectContent(quizSchema, formData);
  if (!result.ok) return result.state;
  const { supabase, row } = result;

  const { error } = await supabase.from("quizzes").update(row).eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "update", entity: "quiz", entityId: id, meta: { title: row.title } });
  revalidate(id);
  return { ok: true };
}

export async function deleteQuiz(id: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("quizzes").delete().eq("id", id);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "quiz", entityId: id });
  revalidate();
  redirect("/admin/quizzes");
}

export async function saveQuestion(
  quizId: string,
  questionId: string | null,
  _prev: ActionState,
  formData: FormData,
): Promise<ActionState> {
  const user = await requireRole("admin");
  const parsed = questionSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return fromZod(parsed.error);
  const supabase = await createClient();

  if (questionId) {
    const { error } = await supabase.from("quiz_questions").update(parsed.data).eq("id", questionId).eq("quiz_id", quizId);
    if (error) return fromDb(error);
    await logAudit(supabase, user.id, { action: "update", entity: "quiz_question", entityId: questionId, meta: { quiz_id: quizId } });
    revalidate(quizId);
    redirect(`/admin/quizzes/${quizId}`);
  }

  const { data: last } = await supabase
    .from("quiz_questions")
    .select("position")
    .eq("quiz_id", quizId)
    .order("position", { ascending: false })
    .limit(1)
    .maybeSingle();
  const { data, error } = await supabase
    .from("quiz_questions")
    .insert({ ...parsed.data, quiz_id: quizId, position: (last?.position ?? 0) + 1 })
    .select("id")
    .single();
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "create", entity: "quiz_question", entityId: data.id, meta: { quiz_id: quizId } });
  revalidate(quizId);
  return { ok: true };
}

export async function deleteQuestion(quizId: string, questionId: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_questions").delete().eq("id", questionId).eq("quiz_id", quizId);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "quiz_question", entityId: questionId, meta: { quiz_id: quizId } });
  revalidate(quizId);
  return { ok: true };
}

/** Removes a student's attempt so they can take the quiz again. */
export async function deleteAttempt(quizId: string, attemptId: string): Promise<ActionState> {
  const user = await requireRole("admin");
  const supabase = await createClient();
  const { error } = await supabase.from("quiz_attempts").delete().eq("id", attemptId).eq("quiz_id", quizId);
  if (error) return fromDb(error);

  await logAudit(supabase, user.id, { action: "delete", entity: "quiz_attempt", entityId: attemptId, meta: { quiz_id: quizId } });
  revalidate(quizId);
  return { ok: true };
}
