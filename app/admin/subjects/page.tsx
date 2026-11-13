import Link from "next/link";
import { BatchFilter } from "@/components/batch-filter";
import { ActionForm, Field } from "@/components/forms/action-form";
import { BatchSelect } from "@/components/forms/batch-select";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { createSubject, deleteSubject, updateSubject } from "./actions";

export default async function SubjectsPage({ searchParams }: { searchParams: Promise<{ edit?: string; batch?: string }> }) {
  const { edit, batch } = await searchParams;
  const t = await getT();
  const supabase = await createClient();

  let subjectsQuery = supabase.from("subjects").select("id, name, batch_id, batch:batches(name, standard)").order("name");
  if (batch) subjectsQuery = subjectsQuery.eq("batch_id", batch);
  const [{ data: batches }, { data: subjects }] = await Promise.all([
    supabase.from("batches").select("id, name").order("standard"),
    subjectsQuery,
  ]);

  const sorted = (subjects ?? []).sort((a, b) => (a.batch?.standard ?? 0) - (b.batch?.standard ?? 0));
  const editing = sorted.find((s) => s.id === edit);

  return (
    <>
      <PageHeader title={t("nav.subjects")} description={t("admin.subjects.description")} />
      <BatchFilter basePath="/admin/subjects" batches={batches ?? []} current={batch} allLabel={t("common.all")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="order-2 lg:order-1">
          <CardContent>
            {sorted.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.subjects.batch")}</TableHead>
                    <TableHead>{t("admin.subjects.name")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sorted.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell>{s.batch?.name}</TableCell>
                      <TableCell className="font-medium">{s.name}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/subjects?edit=${s.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            {t("common.edit")}
                          </Link>
                          <ConfirmButton
                            action={deleteSubject.bind(null, s.id)}
                            confirmText={t("admin.subjects.deleteWarn")}
                            label={t("common.delete")}
                          />
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            ) : (
              <p className="text-muted-foreground">{t("common.none")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="order-1 h-fit lg:order-2">
          <CardHeader>
            <CardTitle>{editing ? t("admin.subjects.edit") : t("admin.subjects.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            {batches?.length ? (
              <ActionForm
                key={editing?.id ?? "new"}
                action={editing ? updateSubject.bind(null, editing.id) : createSubject}
                submitLabel={editing ? t("common.update") : t("common.add")}
                resetOnSuccess={!editing}
              >
                <Field name="batch_id" label={t("admin.subjects.batch")}>
                  <BatchSelect batches={batches} defaultValue={editing?.batch_id ?? batch} />
                </Field>
                <Field name="name" label={t("admin.subjects.name")}>
                  <Input id="name" name="name" defaultValue={editing?.name} required />
                </Field>
              </ActionForm>
            ) : (
              <p className="text-muted-foreground">{t("admin.subjects.needBatch")}</p>
            )}
            {editing && (
              <Link href="/admin/subjects" className="mt-3 inline-block text-sm text-muted-foreground underline">
                {t("common.cancelEdit")}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}

