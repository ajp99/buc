import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate, formatDateTime, isOverdue, todayIST } from "@/lib/dates";
import type { Lang } from "@/lib/i18n";
import { cn } from "@/lib/utils";

type T = (key: string, vars?: Record<string, string | number>) => string;

export type AnnouncementItem = { id: string; title: string; body: string; created_at: string };

export function AnnouncementCard({ item, t, lang }: { item: AnnouncementItem; t: T; lang: Lang }) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{item.title}</CardTitle>
        <p className="text-sm text-muted-foreground">{t("content.postedOn", { date: formatDateTime(item.created_at, lang) })}</p>
      </CardHeader>
      <CardContent className="grid gap-3">
        <p className="whitespace-pre-wrap">{item.body}</p>
        <div>
          <ShareButton text={`${item.title}\n\n${item.body}`} label={t("common.share")} />
        </div>
      </CardContent>
    </Card>
  );
}

export type HomeworkItem = { id: string; title: string; description: string; due_date: string; subject: { name: string } | null };

export function HomeworkCard({ item, t, lang, today = todayIST() }: { item: HomeworkItem; t: T; lang: Lang; today?: string }) {
  const overdue = isOverdue(item.due_date, today);
  const dueToday = item.due_date === today;
  const subject = item.subject?.name ?? "";
  return (
    <Card className={cn(overdue && "border-destructive/50 bg-destructive/5")}>
      <CardHeader>
        <div className="flex flex-wrap items-center gap-2">
          <Badge variant="secondary">{subject}</Badge>
          {overdue && <Badge variant="destructive">{t("homework.overdue")}</Badge>}
          {dueToday && <Badge>{t("homework.dueToday")}</Badge>}
        </div>
        <CardTitle>{item.title}</CardTitle>
        <p className={cn("text-sm", overdue ? "font-medium text-destructive" : "text-muted-foreground")}>
          {t("homework.due", { date: formatDate(item.due_date, lang) })}
        </p>
      </CardHeader>
      <CardContent className="grid gap-3">
        {item.description && <p className="whitespace-pre-wrap">{item.description}</p>}
        <div>
          <ShareButton
            text={t("homework.share", { subject, title: item.title, date: formatDate(item.due_date, lang) }) + (item.description ? `\n\n${item.description}` : "")}
            label={t("common.share")}
          />
        </div>
      </CardContent>
    </Card>
  );
}
