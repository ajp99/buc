import Link from "next/link";
import { BatchFilter } from "@/components/batch-filter";
import { ActionForm } from "@/components/forms/action-form";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { getSubjectOptions } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { createQuiz } from "./actions";
import { QuizFields } from "./quiz-fields";

export default async function AdminQuizzesPage({ searchParams }: { searchParams: Promise<{ batch?: string }> }) {
  const { batch } = await searchParams;
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);

  let query = supabase
    .from("quizzes")
    .select("id, title, opens_at, closes_at, batch:batches(name), subject:subjects(name), quiz_questions(marks), quiz_attempts(count)")
    .order("opens_at", { ascending: false })
    .limit(100);
  if (batch) query = query.eq("batch_id", batch);

  const [{ data: batches }, subjects, { data: quizzes }] = await Promise.all([
    supabase.from("batches").select("id, name").order("standard"),
    getSubjectOptions(supabase),
    query,
  ]);

  return (
    <>
      <PageHeader title={t("nav.quizzes")} />
      <BatchFilter basePath="/admin/quizzes" batches={batches ?? []} current={batch} allLabel={t("common.all")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_26rem]">
        <div className="order-2 grid h-fit gap-4 lg:order-1">
          {quizzes?.length ? (
            quizzes.map((q) => {
              const marks = q.quiz_questions.reduce((sum, x) => sum + x.marks, 0);
              return (
                <Card key={q.id}>
                  <CardHeader>
                    <div className="flex flex-wrap items-center gap-2">
                      <CardTitle>{q.title}</CardTitle>
                      <Badge variant="secondary">{`${q.batch?.name} · ${q.subject?.name}`}</Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {t("quiz.window", { open: formatDateTime(q.opens_at, lang), close: formatDateTime(q.closes_at, lang) })}
                    </p>
                  </CardHeader>
                  <CardContent className="flex flex-wrap items-center justify-between gap-3">
                    <p className="text-sm">
                      {t("quiz.questionCount", { count: q.quiz_questions.length, marks })} ·{" "}
                      {t("quiz.attemptCount", { count: q.quiz_attempts[0]?.count ?? 0 })}
                    </p>
                    <Link href={`/admin/quizzes/${q.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {t("quiz.manage")}
                    </Link>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <p className="text-muted-foreground">{t("quiz.none")}</p>
          )}
        </div>

        <Card className="order-1 h-fit lg:order-2">
          <CardHeader>
            <CardTitle>{t("quiz.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length ? (
              <ActionForm action={createQuiz} submitLabel={t("common.add")}>
                <QuizFields t={t} subjects={subjects} />
              </ActionForm>
            ) : (
              <p className="text-muted-foreground">{t("content.needSubject")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
