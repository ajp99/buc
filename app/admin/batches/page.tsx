import Link from "next/link";
import { ActionForm, Field } from "@/components/forms/action-form";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { createBatch, deleteBatch, updateBatch } from "./actions";

export default async function BatchesPage({ searchParams }: { searchParams: Promise<{ edit?: string }> }) {
  const { edit } = await searchParams;
  const t = await getT();
  const supabase = await createClient();
  const { data: batches } = await supabase
    .from("batches")
    .select("id, name, standard, students(count)")
    .order("standard");

  const editing = batches?.find((b) => b.id === edit);

  return (
    <>
      <PageHeader title={t("nav.batches")} description={t("admin.batches.description")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_22rem]">
        <Card className="order-2 lg:order-1">
          <CardContent>
            {batches?.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.batches.standard")}</TableHead>
                    <TableHead>{t("admin.batches.name")}</TableHead>
                    <TableHead>{t("admin.batches.students")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {batches.map((b) => (
                    <TableRow key={b.id}>
                      <TableCell>{b.standard}</TableCell>
                      <TableCell className="font-medium">{b.name}</TableCell>
                      <TableCell>{b.students[0]?.count ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/batches?edit=${b.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            {t("common.edit")}
                          </Link>
                          <ConfirmButton
                            action={deleteBatch.bind(null, b.id)}
                            confirmText={t("common.confirmDelete")}
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
            <CardTitle>{editing ? t("admin.batches.edit") : t("admin.batches.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            <ActionForm
              key={editing?.id ?? "new"}
              action={editing ? updateBatch.bind(null, editing.id) : createBatch}
              submitLabel={editing ? t("common.update") : t("common.add")}
              resetOnSuccess={!editing}
            >
              <Field name="standard" label={t("admin.batches.standard")}>
                <Input id="standard" name="standard" type="number" min={5} max={10} inputMode="numeric" defaultValue={editing?.standard} required />
              </Field>
              <Field name="name" label={t("admin.batches.name")}>
                <Input id="name" name="name" defaultValue={editing?.name} placeholder={t("enquiry.std", { n: 6 })} required />
              </Field>
            </ActionForm>
            {editing && (
              <Link href="/admin/batches" className="mt-3 inline-block text-sm text-muted-foreground underline">
                {t("common.cancelEdit")}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
