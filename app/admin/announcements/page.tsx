import Link from "next/link";
import { ActionForm, Field } from "@/components/forms/action-form";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { ShareButton } from "@/components/share-button";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { Textarea } from "@/components/ui/textarea";
import { formatDateTime } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { createAnnouncement, deleteAnnouncement, updateAnnouncement } from "./actions";

export default async function AdminAnnouncementsPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);

  const [{ data: batches }, { data: announcements }] = await Promise.all([
    supabase.from("batches").select("id, name").order("standard"),
    supabase
      .from("announcements")
      .select("id, title, body, target_batch_id, created_at, batch:batches(name)")
      .order("created_at", { ascending: false })
      .limit(100),
  ]);
  const editing = announcements?.find((a) => a.id === edit);

  return (
    <>
      <PageHeader title={t("nav.announcements")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <div className="order-2 grid h-fit gap-4 lg:order-1">
          {announcements?.length ? (
            announcements.map((a) => (
              <Card key={a.id}>
                <CardHeader>
                  <div className="flex flex-wrap items-center gap-2">
                    <CardTitle>{a.title}</CardTitle>
                    <Badge variant="secondary">{a.batch?.name ?? t("content.allBatches")}</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {t("content.postedOn", { date: formatDateTime(a.created_at, lang) })}
                  </p>
                </CardHeader>
                <CardContent className="grid gap-3">
                  <p className="whitespace-pre-wrap">{a.body}</p>
                  <div className="flex flex-wrap gap-2">
                    <ShareButton text={`${a.title}\n\n${a.body}`} label={t("common.share")} />
                    <Link href={`/admin/announcements?edit=${a.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                      {t("common.edit")}
                    </Link>
                    <ConfirmButton
                      action={deleteAnnouncement.bind(null, a.id)}
                      confirmText={t("common.confirmDelete")}
                      label={t("common.delete")}
                    />
                  </div>
                </CardContent>
              </Card>
            ))
          ) : (
            <p className="text-muted-foreground">{t("announcements.none")}</p>
          )}
        </div>

        <Card className="order-1 h-fit lg:order-2">
          <CardHeader>
            <CardTitle>{editing ? t("announcements.edit") : t("announcements.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              key={editing?.id ?? "new"}
              action={editing ? updateAnnouncement.bind(null, editing.id) : createAnnouncement}
              submitLabel={editing ? t("common.update") : t("common.add")}
              resetOnSuccess={!editing}
            >
              <Field name="target_batch_id" label={t("announcements.target")}>
                <NativeSelect id="target_batch_id" name="target_batch_id" defaultValue={editing?.target_batch_id ?? ""} className="w-full">
                  <NativeSelectOption value="">{t("content.allBatches")}</NativeSelectOption>
                  {batches?.map((b) => (
                    <NativeSelectOption key={b.id} value={b.id}>
                      {b.name}
                    </NativeSelectOption>
                  ))}
                </NativeSelect>
              </Field>
              <Field name="title" label={t("content.title")}>
                <Input id="title" name="title" defaultValue={editing?.title} required />
              </Field>
              <Field name="body" label={t("announcements.body")}>
                <Textarea id="body" name="body" rows={5} defaultValue={editing?.body} required />
              </Field>
            </ActionForm>
            {editing && (
              <Link href="/admin/announcements" className="mt-3 inline-block text-sm text-muted-foreground underline">
                {t("common.cancelEdit")}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
