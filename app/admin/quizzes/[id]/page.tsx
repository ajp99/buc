import Link from "next/link";
import { notFound } from "next/navigation";
import { ActionForm, Field } from "@/components/forms/action-form";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { getSubjectOptions } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { deleteAttempt, deleteQuestion, deleteQuiz, saveQuestion, updateQuiz } from "../actions";
import { QuizFields } from "../quiz-fields";

export default async function AdminQuizPage({
  params,
  searchParams,
}: {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ q?: string }>;
}) {
  const [{ id }, { q: editQuestionId }] = await Promise.all([params, searchParams]);
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);

  const { data: quiz } = await supabase
    .from("quizzes")
    .select("id, title, description, subject_id, batch_id, opens_at, closes_at, show_answers_after_submit, batch:batches(name), subject:subjects(name)")
    .eq("id", id)
    .maybeSingle();
  if (!quiz) notFound();

  const [subjects, { data: questions }, { data: attempts }, { data: students }] = await Promise.all([
    getSubjectOptions(supabase),
    supabase.from("quiz_questions").select("id, question_text, options, correct_option, marks").eq("quiz_id", id).order("position"),
    supabase.from("quiz_attempts").select("id, student_id, score, total, submitted_at").eq("quiz_id", id),
    supabase
      .from("students")
      .select("id, full_name")
      .eq("batch_id", quiz.batch_id)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("full_name"),
  ]);

  const editingQuestion = questions?.find((q) => q.id === editQuestionId);
  const attemptByStudent = new Map((attempts ?? []).map((a) => [a.student_id, a]));
  const attemptCount = attempts?.length ?? 0;

  return (
    <>
      <PageHeader
        title={quiz.title}
        description={`${quiz.batch?.name} · ${quiz.subject?.name}`}
        actions={
          <div className="flex gap-2">
            <Link href="/admin/quizzes" className={buttonVariants({ variant: "outline", size: "sm" })}>
              {t("common.back")}
            </Link>
            <ConfirmButton action={deleteQuiz.bind(null, quiz.id)} confirmText={t("quiz.deleteWarn")} label={t("common.delete")} />
          </div>
        }
      />

      <div className="grid gap-6 xl:grid-cols-[1fr_26rem]">
        <div className="grid h-fit gap-6">
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">{t("quiz.questions")}</h2>
            {attemptCount > 0 && (
              <Alert>
                <AlertDescription>{t("quiz.regradeWarn", { count: attemptCount })}</AlertDescription>
              </Alert>
            )}
            {!questions?.length && <p className="text-muted-foreground">{t("quiz.noQuestions")}</p>}
            {questions?.map((q, i) => (
              <Card key={q.id} className={q.id === editQuestionId ? "ring-2 ring-ring" : undefined}>
                <CardHeader>
                  <CardTitle>{`${i + 1}. ${q.question_text}`}</CardTitle>
                  <p className="text-sm text-muted-foreground">{`${t("quiz.marks")}: ${q.marks}`}</p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <ol className="grid gap-1">
                    {(q.options as string[]).map((opt, idx) => (
                      <li key={idx} className={idx === q.correct_option ? "font-semibold text-primary" : undefined}>
                        {`${String.fromCharCode(65 + idx)}. ${opt}`}
                        {idx === q.correct_option && <span className="sr-only">{` (${t("quiz.correct")})`}</span>}
                      </li>
                    ))}
                  </ol>
                  <div className="flex gap-2">
                    <Link href={`/admin/quizzes/${quiz.id}?q=${q.id}#question-form`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {t("common.edit")}
                    </Link>
                    <ConfirmButton action={deleteQuestion.bind(null, quiz.id, q.id)} confirmText={t("common.confirmDelete")} label={t("common.delete")} />
                  </div>
                </CardContent>
              </Card>
            ))}

            <Card id="question-form">
              <CardHeader>
                <CardTitle>{editingQuestion ? t("quiz.editQuestion") : t("quiz.addQuestion")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionForm
                  key={editingQuestion?.id ?? "new"}
                  action={saveQuestion.bind(null, quiz.id, editingQuestion?.id ?? null)}
                  submitLabel={editingQuestion ? t("common.update") : t("quiz.addQuestion")}
                  resetOnSuccess={!editingQuestion}
                >
                  <Field name="question_text" label={t("quiz.question")}>
                    <Textarea id="question_text" name="question_text" rows={2} defaultValue={editingQuestion?.question_text} required />
                  </Field>
                  <fieldset className="grid gap-3">
                    <legend className="mb-2 text-sm font-medium">{t("quiz.correct")}</legend>
                    {[0, 1, 2, 3].map((idx) => (
                      <div key={idx} className="flex items-center gap-3">
                        <input
                          type="radio"
                          name="correct_option"
                          value={idx}
                          defaultChecked={editingQuestion?.correct_option === idx}
                          aria-label={`${t("quiz.correct")}: ${t("quiz.option", { n: String.fromCharCode(65 + idx) })}`}
                          className="size-5 shrink-0 accent-primary"
                        />
                        <Field name={`option_${idx}`} label={t("quiz.option", { n: String.fromCharCode(65 + idx) })} className="flex-1">
                          <Input
                            id={`option_${idx}`}
                            name={`option_${idx}`}
                            defaultValue={(editingQuestion?.options as string[] | undefined)?.[idx]}
                            required
                          />
                        </Field>
                      </div>
                    ))}
                  </fieldset>
                  <CorrectOptionError />
                  <Field name="marks" label={t("quiz.marks")} className="max-w-32">
                    <Input id="marks" name="marks" type="number" min={1} max={100} inputMode="numeric" defaultValue={editingQuestion?.marks ?? 1} />
                  </Field>
                </ActionForm>
                {editingQuestion && (
                  <Link href={`/admin/quizzes/${quiz.id}`} className="mt-3 inline-block text-sm text-muted-foreground underline">
                    {t("common.cancelEdit")}
                  </Link>
                )}
              </CardContent>
            </Card>
          </section>

          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">{t("quiz.results")}</h2>
            <Card>
              <CardContent>
                {students?.length ? (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>{t("quiz.student")}</TableHead>
                        <TableHead>{t("quiz.score")}</TableHead>
                        <TableHead className="text-right">{t("common.actions")}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {students.map((s) => {
                        const a = attemptByStudent.get(s.id);
                        return (
                          <TableRow key={s.id}>
                            <TableCell className="font-medium">{s.full_name}</TableCell>
                            <TableCell>
                              {a ? (
                                <span>
                                  {`${a.score} / ${a.total}`}
                                  <span className="ml-2 text-sm text-muted-foreground">{formatDateTime(a.submitted_at, lang)}</span>
                                </span>
                              ) : (
                                <Badge variant="secondary">{t("quiz.notAttempted")}</Badge>
                              )}
                            </TableCell>
                            <TableCell className="text-right">
                              {a && (
                                <ConfirmButton
                                  action={deleteAttempt.bind(null, quiz.id, a.id)}
                                  confirmText={t("quiz.allowRetakeWarn")}
                                  label={t("quiz.allowRetake")}
                                  variant="outline"
                                />
                              )}
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                ) : (
                  <p className="text-muted-foreground">{t("common.none")}</p>
                )}
              </CardContent>
            </Card>
          </section>
        </div>

        <Card className="h-fit">
          <CardHeader>
            <CardTitle>{t("quiz.details")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm action={updateQuiz.bind(null, quiz.id)} submitLabel={t("common.update")}>
              <QuizFields t={t} subjects={subjects} quiz={quiz} />
            </ActionForm>
          </CardContent>
        </Card>
      </div>
    </>
  );
}

/** The correct-answer radio group has no single input, so its error is shown separately. */
function CorrectOptionError() {
  return <Field name="correct_option" label="" className="-mt-2 [&>label]:hidden">{null}</Field>;
}
