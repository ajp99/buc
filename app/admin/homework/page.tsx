import Link from "next/link";
import { BatchFilter } from "@/components/batch-filter";
import { ActionForm, Field } from "@/components/forms/action-form";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { SubjectSelect } from "@/components/forms/subject-select";
import { PageHeader } from "@/components/page-header";
import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { formatDate, isOverdue, todayIST } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { getSubjectOptions } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";
import { createHomework, deleteHomework, updateHomework } from "./actions";

export default async function AdminHomeworkPage({ searchParams }: { searchParams: Promise<{ edit?: string; batch?: string }> }) {
  const { edit, batch } = await searchParams;
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);

  let query = supabase
    .from("homework")
    .select("id, title, description, due_date, subject_id, batch:batches(name), subject:subjects(name)")
    .order("due_date", { ascending: false })
    .limit(100);
  if (batch) query = query.eq("batch_id", batch);

  const [{ data: batches }, subjects, { data: homework }] = await Promise.all([
    supabase.from("batches").select("id, name").order("standard"),
    getSubjectOptions(supabase),
    query,
  ]);
  const editing = homework?.find((h) => h.id === edit);
  const today = todayIST();

  return (
    <>
      <PageHeader title={t("nav.homework")} />
      <BatchFilter basePath="/admin/homework" batches={batches ?? []} current={batch} allLabel={t("common.all")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="order-2 grid h-fit gap-4 lg:order-1">
          {homework?.length ? (
            homework.map((h) => (
              <Card key={h.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{h.title}</CardTitle>
                    <Badge variant="secondary">{`${h.batch?.name} · ${h.subject?.name}`}</Badge>
                    {isOverdue(h.due_date, today) && <Badge variant="outline">{t("homework.overdue")}</Badge>}
                  </div>
                  <p className="text-sm text-muted-foreground">{t("homework.due", { date: formatDate(h.due_date, lang) })}</p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  {h.description && <p className="whitespace-pre-wrap">{h.description}</p>}
                  <div className="flex flex-wrap gap-2">
                    <ShareButton
                      text={t("homework.share", { subject: h.subject?.name ?? "", title: h.title, date: formatDate(h.due_date, lang) }) + (h.description ? `\n\n${h.description}` : "")}
                      label={t("common.share")}
                    />
                    <Link href={`/admin/homework?edit=${h.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {t("common.edit")}
                    </Link>
                    <ConfirmButton action={deleteHomework.bind(null, h.id)} confirmText={t("common.confirmDelete")} label={t("common.delete")} />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">{t("homework.none")}</p>
          )}
        </div>

        <Card className="order-1 h-fit lg:order-2">
          <CardHeader>
            <CardTitle>{editing ? t("homework.edit") : t("homework.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length ? (
              <ActionForm
                key={editing?.id ?? "new"}
                action={editing ? updateHomework.bind(null, editing.id) : createHomework}
                submitLabel={editing ? t("common.update") : t("common.add")}
                resetOnSuccess={!editing}
              >
                <Field name="subject_id" label={t("content.batchSubject")}>
                  <SubjectSelect options={subjects} defaultValue={editing?.subject_id} />
                </Field>
                <Field name="title" label={t("content.title")}>
                  <Input id="title" name="title" defaultValue={editing?.title} required />
                </Field>
                <Field name="description" label={t("homework.description")}>
                  <Textarea id="description" name="description" rows={4} defaultValue={editing?.description} />
                </Field>
                <Field name="due_date" label={t("homework.dueDate")}>
                  <Input id="due_date" name="due_date" type="date" defaultValue={editing?.due_date} required />
                </Field>
              </ActionForm>
            ) : (
              <p className="text-muted-foreground">{t("content.needSubject")}</p>
            )}
            {editing && (
              <Link href="/admin/homework" className="mt-3 inline-block text-sm text-muted-foreground underline">
                {t("common.cancelEdit")}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
