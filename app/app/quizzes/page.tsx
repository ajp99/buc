import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { quizStatus, type QuizStatus } from "@/lib/quiz";
import { createClient } from "@/lib/supabase/server";

const ORDER: Record<QuizStatus, number> = { open: 0, upcoming: 1, submitted: 2, missed: 3 };
const BADGE: Record<QuizStatus, "default" | "secondary" | "outline" | "destructive"> = {
  open: "default",
  upcoming: "secondary",
  submitted: "outline",
  missed: "destructive",
};

export default async function StudentQuizzesPage() {
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);
  const [{ data: quizzes }, { data: attempts }] = await Promise.all([
    supabase.from("quizzes").select("id, title, opens_at, closes_at, subject:subjects(name)").order("opens_at", { ascending: false }),
    supabase.from("quiz_attempts").select("quiz_id, score, total"),
  ]);
  const attemptByQuiz = new Map((attempts ?? []).map((a) => [a.quiz_id, a]));
  const now = new Date();

  const list = (quizzes ?? [])
    .map((q) => ({ ...q, attempt: attemptByQuiz.get(q.id), status: quizStatus(q, attemptByQuiz.has(q.id), now) }))
    .sort((a, b) => ORDER[a.status] - ORDER[b.status]);

  return (
    <>
      <PageHeader title={t("nav.quizzes")} />
      {!list.length && <p className="text-muted-foreground">{t("quiz.none")}</p>}
      <div className="grid max-w-3xl gap-4">
        {list.map((q) => (
          <Card key={q.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{q.subject?.name}</Badge>
                <Badge variant={BADGE[q.status]}>{t(`quiz.status.${q.status}`)}</Badge>
              </div>
              <CardTitle>{q.title}</CardTitle>
              <p className="text-sm text-muted-foreground">
                {q.status === "upcoming"
                  ? t("quiz.opens", { date: formatDateTime(q.opens_at, lang) })
                  : q.status === "open"
                    ? t("quiz.closes", { date: formatDateTime(q.closes_at, lang) })
                    : t("quiz.closed", { date: formatDateTime(q.closes_at, lang) })}
              </p>
            </CardHeader>
            {(q.status === "open" || q.status === "submitted") && (
              <CardContent className="flex flex-wrap items-center justify-between gap-3">
                {q.attempt ? (
                  <span className="font-medium">{t("quiz.yourScore", { score: q.attempt.score, total: q.attempt.total })}</span>
                ) : (
                  <span />
                )}
                <Link href={`/app/quizzes/${q.id}`} className={buttonVariants({ variant: q.status === "open" ? "default" : "outline" })}>
                  {q.status === "open" ? t("quiz.start") : t("quiz.view")}
                </Link>
              </CardContent>
            )}
          </Card>
        ))}
      </div>
    </>
  );
}
