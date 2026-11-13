import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { addDays, formatDateTime, todayIST } from "@/lib/dates";
import { currentMonthIST, formatINR, formatMonth } from "@/lib/fees";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

export default async function AdminDashboard() {
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);
  const month = currentMonthIST();
  const today = todayIST();
  const nowIso = new Date().toISOString();

  const [students, enquiries, { data: unpaid }, quizzes, homework, { data: activity }] = await Promise.all([
    supabase.from("students").select("id", { count: "exact", head: true }).eq("is_active", true).is("deleted_at", null),
    supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", "new"),
    supabase.from("fees").select("amount").eq("month", month).eq("status", "unpaid"),
    supabase.from("quizzes").select("id", { count: "exact", head: true }).lte("opens_at", nowIso).gte("closes_at", nowIso),
    supabase.from("homework").select("id", { count: "exact", head: true }).gte("due_date", today).lte("due_date", addDays(today, 6)),
    supabase
      .from("audit_log")
      .select("id, action, entity, created_at, actor:users(username)")
      .order("created_at", { ascending: false })
      .limit(5),
  ]);

  const unpaidTotal = (unpaid ?? []).reduce((s, f) => s + Number(f.amount), 0);
  const stats = [
    { label: t("dashboard.activeStudents"), value: String(students.count ?? 0), href: "/admin/students" },
    { label: t("dashboard.newEnquiries"), value: String(enquiries.count ?? 0), href: "/admin/enquiries" },
    {
      label: t("dashboard.unpaidThisMonth", { month: formatMonth(month, lang) }),
      value: `${unpaid?.length ?? 0} · ${formatINR(unpaidTotal, lang)}`,
      href: `/admin/fees?month=${month}`,
    },
    { label: t("dashboard.openQuizzes"), value: String(quizzes.count ?? 0), href: "/admin/quizzes" },
    { label: t("dashboard.dueThisWeek"), value: String(homework.count ?? 0), href: "/admin/homework" },
  ];

  return (
    <>
      <PageHeader title={t("nav.dashboard")} />
      <div className="grid gap-8">
        <div className="grid grid-cols-2 gap-3 lg:grid-cols-5">
          {stats.map((s) => (
            <Link key={s.href} href={s.href} className="rounded-xl focus-visible:ring-3 focus-visible:ring-ring/50 focus-visible:outline-none">
              <Card className="h-full transition-colors hover:bg-accent">
                <CardContent>
                  <p className="text-sm text-muted-foreground">{s.label}</p>
                  <p className="mt-1 text-2xl font-semibold tabular-nums">{s.value}</p>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>

        <section className="grid gap-3">
          <h2 className="text-lg font-semibold">{t("dashboard.quickActions")}</h2>
          <div className="flex flex-wrap gap-2">
            <Link href="/admin/announcements" className={buttonVariants()}>{t("dashboard.postAnnouncement")}</Link>
            <Link href="/admin/homework" className={buttonVariants({ variant: "outline" })}>{t("dashboard.addHomework")}</Link>
            <Link href="/admin/quizzes" className={buttonVariants({ variant: "outline" })}>{t("dashboard.newQuiz")}</Link>
            <Link href={`/admin/fees?month=${month}`} className={buttonVariants({ variant: "outline" })}>{t("dashboard.collectFees")}</Link>
          </div>
        </section>

        <section className="grid max-w-3xl gap-3">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold">{t("dashboard.recentActivity")}</h2>
            <Link href="/admin/audit" className="text-sm text-primary underline">{t("dashboard.viewAll")}</Link>
          </div>
          {activity?.length ? (
            <ul className="grid gap-1 text-sm">
              {activity.map((a) => (
                <li key={a.id} className="flex flex-wrap justify-between gap-2 border-b py-2">
                  <span>{`${a.actor?.username ?? ""} ${t(`audit.action.${a.action}`)} ${t(`audit.entity.${a.entity}`)}`}</span>
                  <span className="text-muted-foreground">{formatDateTime(a.created_at, lang)}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-muted-foreground">{t("audit.none")}</p>
          )}
        </section>

        <Alert className="max-w-3xl">
          <AlertDescription>{t("dashboard.backupReminder")}</AlertDescription>
        </Alert>
      </div>
    </>
  );
}
