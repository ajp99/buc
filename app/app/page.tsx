import Link from "next/link";
import { AnnouncementCard, HomeworkCard } from "@/components/content-cards";
import { PageHeader } from "@/components/page-header";
import { getCurrentStudent } from "@/lib/auth/session";
import { addDays, todayIST } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

export default async function StudentHome() {
  const [t, lang, supabase, student] = await Promise.all([getT(), getLang(), createClient(), getCurrentStudent()]);
  const today = todayIST();

  // RLS limits both queries to the student's batch (plus all-batch announcements).
  const [{ data: announcements }, { data: homework }] = await Promise.all([
    supabase.from("announcements").select("id, title, body, created_at").order("created_at", { ascending: false }).limit(5),
    supabase
      .from("homework")
      .select("id, title, description, due_date, subject:subjects(name)")
      .gte("due_date", today)
      .lte("due_date", addDays(today, 6))
      .order("due_date"),
  ]);

  return (
    <>
      <PageHeader title={t("common.welcome", { name: student!.full_name })} />
      <div className="grid gap-8 lg:grid-cols-2">
        <section aria-labelledby="whats-new" className="grid h-fit gap-4">
          <h2 id="whats-new" className="text-lg font-semibold">{t("announcements.latest")}</h2>
          {announcements?.length ? (
            announcements.map((a) => <AnnouncementCard key={a.id} item={a} t={t} lang={lang} />)
          ) : (
            <p className="text-muted-foreground">{t("announcements.none")}</p>
          )}
        </section>
        <section aria-labelledby="whats-due" className="grid h-fit gap-4">
          <h2 id="whats-due" className="text-lg font-semibold">{t("homework.thisWeek")}</h2>
          {homework?.length ? (
            homework.map((h) => <HomeworkCard key={h.id} item={h} t={t} lang={lang} today={today} />)
          ) : (
            <p className="text-muted-foreground">{t("homework.noneThisWeek")}</p>
          )}
          <Link href="/app/homework" className="text-sm font-medium text-primary underline">
            {t("homework.viewAll")}
          </Link>
        </section>
      </div>
    </>
  );
}
