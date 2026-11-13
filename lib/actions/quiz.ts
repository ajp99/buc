"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { requireRole } from "@/lib/auth/session";
import { createClient } from "@/lib/supabase/server";

const KNOWN_ERRORS = ["already_attempted", "quiz_closed", "quiz_not_found"];

/**
 * Submits a student's answers. Grading, the one-attempt rule and the open
 * window are all enforced by the submit_quiz() database function.
 */
export async function submitQuiz(quizId: string, answers: Record<string, number>): Promise<{ error: string }> {
  await requireRole("student");
  const clean = Object.fromEntries(
    Object.entries(answers).filter(([k, v]) => /^[0-9a-f-]{36}$/.test(k) && Number.isInteger(v) && v >= 0 && v <= 3),
  );

  const supabase = await createClient();
  const { error } = await supabase.rpc("submit_quiz", { p_quiz_id: quizId, p_answers: clean });
  if (error) {
    const code = KNOWN_ERRORS.find((e) => error.message.includes(e));
    if (code !== "already_attempted") return { error: code ? `quiz.err.${code}` : "errors.generic" };
  }

  revalidatePath("/app", "layout");
  redirect(`/app/quizzes/${quizId}`);
}
