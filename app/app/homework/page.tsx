import { HomeworkCard } from "@/components/content-cards";
import { PageHeader } from "@/components/page-header";
import { addDays, todayIST } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

export default async function StudentHomeworkPage() {
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);
  const today = todayIST();

  // Recent overdue work first (highlighted), then upcoming by due date.
  const { data } = await supabase
    .from("homework")
    .select("id, title, description, due_date, subject:subjects(name)")
    .gte("due_date", addDays(today, -14))
    .order("due_date");
  const overdue = (data ?? []).filter((h) => h.due_date < today);
  const upcoming = (data ?? []).filter((h) => h.due_date >= today);

  return (
    <>
      <PageHeader title={t("nav.homework")} />
      {!data?.length && <p className="text-muted-foreground">{t("homework.none")}</p>}
      <div className="grid max-w-3xl gap-8">
        {overdue.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold text-destructive">{t("homework.recentPast")}</h2>
            {overdue.map((h) => <HomeworkCard key={h.id} item={h} t={t} lang={lang} today={today} />)}
          </section>
        )}
        {upcoming.length > 0 && (
          <section className="grid gap-4">
            <h2 className="text-lg font-semibold">{t("homework.upcoming")}</h2>
            {upcoming.map((h) => <HomeworkCard key={h.id} item={h} t={t} lang={lang} today={today} />)}
          </section>
        )}
      </div>
    </>
  );
}
