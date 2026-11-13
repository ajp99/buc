import { notFound } from "next/navigation";
import { CheckCircle2, XCircle } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { quizStatus } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";
import { QuizTaker } from "./quiz-taker";

export default async function StudentQuizPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);

  // RLS returns the quiz only for the student's own batch.
  const [{ data: quiz }, { data: attempt }] = await Promise.all([
    supabase.from("quizzes").select("id, title, description, opens_at, closes_at, subject:subjects(name)").eq("id", id).maybeSingle(),
    supabase.from("quiz_attempts").select("score, total").eq("quiz_id", id).maybeSingle(),
  ]);
  if (!quiz) notFound();

  const status = quizStatus(quiz, !!attempt);
  const header = <PageHeader title={quiz.title} description={quiz.subject?.name} />;

  if (status === "upcoming" || status === "missed") {
    return (
      <>
        {header}
        <Alert>
          <AlertDescription>
            {status === "upcoming"
              ? t("quiz.notOpenYet", { date: formatDateTime(quiz.opens_at, lang) })
              : t("quiz.missedMsg", { date: formatDateTime(quiz.closes_at, lang) })}
          </AlertDescription>
        </Alert>
      </>
    );
  }

  if (status === "open") {
    const { data: questions } = await supabase.rpc("quiz_questions_for_student", { p_quiz_id: id });
    return (
      <>
        {header}
        <div className="grid max-w-3xl gap-4">
          {quiz.description && <p className="whitespace-pre-wrap">{quiz.description}</p>}
          <p className="text-sm text-muted-foreground">{t("quiz.closes", { date: formatDateTime(quiz.closes_at, lang) })}</p>
          <QuizTaker
            quizId={quiz.id}
            questions={(questions ?? []).map((q) => ({ ...q, options: q.options as string[] }))}
          />
        </div>
      </>
    );
  }

  const { data: review } = await supabase.rpc("quiz_review", { p_quiz_id: id });
  const answersShown = review?.some((r) => r.correct_option !== null);

  return (
    <>
      {header}
      <div className="grid max-w-3xl gap-4">
        <Card className="bg-accent">
          <CardContent className="py-2 text-center">
            <p className="text-2xl font-semibold">{t("quiz.yourScore", { score: attempt!.score, total: attempt!.total })}</p>
          </CardContent>
        </Card>
        {!answersShown && <p className="text-muted-foreground">{t("quiz.answersHidden")}</p>}
        {review?.map((r, i) => {
          const options = r.options as string[];
          const correct = r.correct_option !== null && r.chosen_option === r.correct_option;
          return (
            <Card key={r.id}>
              <CardHeader>
                <CardTitle className="flex items-start gap-2">
                  {answersShown &&
                    (correct ? (
                      <CheckCircle2 className="mt-0.5 size-5 shrink-0 text-primary" aria-hidden />
                    ) : (
                      <XCircle className="mt-0.5 size-5 shrink-0 text-destructive" aria-hidden />
                    ))}
                  {`${i + 1}. ${r.question_text}`}
                </CardTitle>
              </CardHeader>
              <CardContent className="grid gap-1 text-sm">
                <p className={cn(answersShown && !correct && "text-destructive")}>
                  {`${t("quiz.yourAnswer")}: `}
                  {r.chosen_option !== null ? `${String.fromCharCode(65 + r.chosen_option)}. ${options[r.chosen_option]}` : t("quiz.noAnswer")}
                </p>
                {r.correct_option !== null && (
                  <p className="font-medium text-primary">
                    {`${t("quiz.correctAnswer")}: ${String.fromCharCode(65 + r.correct_option)}. ${options[r.correct_option]}`}
                  </p>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </>
  );
}
