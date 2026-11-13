import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { PrintButton } from "@/components/print-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getCurrentStudent } from "@/lib/auth/session";
import { addDays, formatDate, formatDateTime, isOverdue, todayIST } from "@/lib/dates";
import { formatINR, formatMonth } from "@/lib/fees";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

/** Read-only overview for parents. RLS scopes every query to this student. */
export default async function ParentSummaryPage() {
  const [t, lang, supabase, student] = await Promise.all([getT(), getLang(), createClient(), getCurrentStudent()]);
  const today = todayIST();
  const monthAgo = new Date(Date.now() - 30 * 86_400_000).toISOString();

  const [{ data: homework }, { data: attempts }, { data: attemptedIds }, { data: recentQuizzes }, { data: fees }, { data: announcements }] = await Promise.all([
    supabase
      .from("homework")
      .select("id, title, due_date, subject:subjects(name)")
      .gte("due_date", addDays(today, -7))
      .lte("due_date", addDays(today, 7))
      .order("due_date"),
    supabase.from("quiz_attempts").select("quiz_id, score, total, submitted_at, quiz:quizzes(title)").order("submitted_at", { ascending: false }).limit(5),
    supabase.from("quiz_attempts").select("quiz_id"),
    supabase.from("quizzes").select("id").gte("closes_at", monthAgo).lt("closes_at", new Date().toISOString()),
    supabase.from("fees").select("id, month, amount, status").order("month", { ascending: false }).limit(12),
    supabase.from("announcements").select("id, title, created_at").order("created_at", { ascending: false }).limit(3),
  ]);

  // Quizzes that closed in the last 30 days without an attempt.
  const attempted = new Set((attemptedIds ?? []).map((a) => a.quiz_id));
  const missed = (recentQuizzes ?? []).filter((q) => !attempted.has(q.id)).length;
  const unpaid = (fees ?? []).filter((f) => f.status === "unpaid");
  const unpaidTotal = unpaid.reduce((s, f) => s + Number(f.amount), 0);

  return (
    <>
      <PageHeader
        title={t("nav.parentSummary")}
        description={t("summary.subtitle", { name: student!.full_name, batch: student!.batch.name })}
        actions={
          <div className="no-print">
            <PrintButton label={t("summary.print")} />
          </div>
        }
      />
      <div className="grid gap-4 lg:grid-cols-2 print:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>{t("summary.homework")}</CardTitle>
          </CardHeader>
          <CardContent>
            {homework?.length ? (
              <ul className="grid gap-2">
                {homework.map((h) => (
                  <li key={h.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>
                      <span className="text-muted-foreground">{h.subject?.name}: </span>
                      {h.title}
                    </span>
                    <span className={cn("text-sm", isOverdue(h.due_date, today) ? "font-medium text-destructive" : "text-muted-foreground")}>
                      {isOverdue(h.due_date, today) ? t("homework.overdue") : t("homework.due", { date: formatDate(h.due_date, lang) })}
                    </span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t("homework.noneThisWeek")}</p>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("summary.quizzes")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {attempts?.length ? (
              <ul className="grid gap-2">
                {attempts.map((a) => (
                  <li key={a.quiz_id} className="flex items-baseline justify-between gap-2">
                    <Link href={`/app/quizzes/${a.quiz_id}`} className="hover:underline">
                      {a.quiz?.title}
                    </Link>
                    <span className="font-semibold tabular-nums">{`${a.score} / ${a.total}`}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t("summary.noQuizzes")}</p>
            )}
            {missed > 0 && <p className="text-sm text-destructive">{t("summary.missedQuizzes", { count: missed })}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("summary.fees")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            {unpaid.length ? (
              <>
                <p className="font-medium text-destructive">{t("summary.unpaid", { count: unpaid.length, amount: formatINR(unpaidTotal, lang) })}</p>
                <ul className="grid gap-1">
                  {unpaid.map((f) => (
                    <li key={f.id} className="flex justify-between gap-2">
                      <span>{formatMonth(f.month, lang)}</span>
                      <span>{formatINR(f.amount, lang)}</span>
                    </li>
                  ))}
                </ul>
              </>
            ) : fees?.length ? (
              <p>{t("summary.allPaid")}</p>
            ) : (
              <p className="text-muted-foreground">{t("fees.none")}</p>
            )}
            {fees?.[0] && (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                {formatMonth(fees[0].month, lang)}
                <Badge variant={fees[0].status === "paid" ? "default" : "destructive"}>{t(`fees.status.${fees[0].status}`)}</Badge>
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>{t("summary.announcements")}</CardTitle>
          </CardHeader>
          <CardContent>
            {announcements?.length ? (
              <ul className="grid gap-2">
                {announcements.map((a) => (
                  <li key={a.id} className="flex flex-wrap items-baseline justify-between gap-2">
                    <span>{a.title}</span>
                    <span className="text-sm text-muted-foreground">{formatDateTime(a.created_at, lang)}</span>
                  </li>
                ))}
              </ul>
            ) : (
              <p className="text-muted-foreground">{t("announcements.none")}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
