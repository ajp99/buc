import Link from "next/link";
import { BatchFilter } from "@/components/batch-filter";
import { ActionForm, Field } from "@/components/forms/action-form";
import { BatchSelect } from "@/components/forms/batch-select";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { createStudent, removeStudent, resetStudentPassword, updateStudent } from "./actions";

export default async function StudentsPage({ searchParams }: { searchParams: Promise<{ edit?: string; batch?: string }> }) {
  const { edit, batch } = await searchParams;
  const t = await getT();
  const supabase = await createClient();

  let studentsQuery = supabase
    .from("students")
    .select("id, full_name, parent_phone, monthly_fee, is_active, batch_id, batch:batches(name, standard), user:users(phone)")
    .is("deleted_at", null)
    .order("full_name");
  if (batch) studentsQuery = studentsQuery.eq("batch_id", batch);

  const [{ data: batches }, { data: students }] = await Promise.all([
    supabase.from("batches").select("id, name").order("standard"),
    studentsQuery,
  ]);

  const list = (students ?? []).sort((a, b) => (a.batch?.standard ?? 0) - (b.batch?.standard ?? 0));
  const editing = list.find((s) => s.id === edit);

  return (
    <>
      <PageHeader title={t("nav.students")} description={t("admin.students.description")} />
      <BatchFilter basePath="/admin/students" batches={batches ?? []} current={batch} allLabel={t("common.all")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card className="order-2 lg:order-1">
          <CardContent>
            {list.length ? (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>{t("admin.students.fullName")}</TableHead>
                    <TableHead>{t("admin.students.batch")}</TableHead>
                    <TableHead>{t("admin.students.phone")}</TableHead>
                    <TableHead>{t("admin.students.monthlyFee")}</TableHead>
                    <TableHead>{t("common.status")}</TableHead>
                    <TableHead className="text-right">{t("common.actions")}</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {list.map((s) => (
                    <TableRow key={s.id}>
                      <TableCell className="font-medium">{s.full_name}</TableCell>
                      <TableCell>{s.batch?.name}</TableCell>
                      <TableCell>{s.user?.phone}</TableCell>
                      <TableCell>{Number(s.monthly_fee).toLocaleString("en-IN")}</TableCell>
                      <TableCell>
                        <Badge variant={s.is_active ? "default" : "secondary"}>
                          {s.is_active ? t("common.active") : t("common.inactive")}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex justify-end gap-2">
                          <Link href={`/admin/students?edit=${s.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                            {t("common.edit")}
                          </Link>
                          <ConfirmButton
                            action={removeStudent.bind(null, s.id)}
                            confirmText={t("admin.students.removeWarn")}
                            label={t("admin.students.remove")}
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

        <div className="order-1 grid h-fit gap-6 lg:order-2">
          <Card>
            <CardHeader>
              <CardTitle>{editing ? t("admin.students.edit") : t("admin.students.new")}</CardTitle>
            </CardHeader>
            <CardContent>
              {!batches?.length ? (
                <p className="text-muted-foreground">{t("admin.subjects.needBatch")}</p>
              ) : editing ? (
                <>
                  <ActionForm key={editing.id} action={updateStudent.bind(null, editing.id)} submitLabel={t("common.update")}>
                    <Field name="full_name" label={t("admin.students.fullName")}>
                      <Input id="full_name" name="full_name" defaultValue={editing.full_name} required />
                    </Field>
                    <div className="grid gap-2">
                      <span className="text-sm font-medium">{t("admin.students.phone")}</span>
                      <p>{editing.user?.phone}</p>
                      <p className="text-sm text-muted-foreground">{t("admin.students.phoneLocked")}</p>
                    </div>
                    <Field name="parent_phone" label={t("admin.students.parentPhone")}>
                      <Input id="parent_phone" name="parent_phone" type="tel" inputMode="tel" defaultValue={editing.parent_phone} required />
                    </Field>
                    <Field name="batch_id" label={t("admin.students.batch")}>
                      <BatchSelect batches={batches} defaultValue={editing.batch_id} />
                    </Field>
                    <Field name="monthly_fee" label={t("admin.students.monthlyFee")}>
                      <Input id="monthly_fee" name="monthly_fee" type="number" min={0} inputMode="numeric" defaultValue={Number(editing.monthly_fee)} />
                    </Field>
                    <label className="flex min-h-11 items-center gap-3">
                      <input type="checkbox" name="is_active" defaultChecked={editing.is_active} className="size-5 accent-primary" />
                      {t("admin.students.isActive")}
                    </label>
                  </ActionForm>
                  <Link href="/admin/students" className="mt-3 inline-block text-sm text-muted-foreground underline">
                    {t("common.cancelEdit")}
                  </Link>
                </>
              ) : (
                <ActionForm action={createStudent} submitLabel={t("common.add")} resetOnSuccess>
                  <Field name="full_name" label={t("admin.students.fullName")}>
                    <Input id="full_name" name="full_name" required />
                  </Field>
                  <Field name="phone" label={t("admin.students.phone")}>
                    <Input id="phone" name="phone" type="tel" inputMode="tel" required />
                  </Field>
                  <Field name="parent_phone" label={t("admin.students.parentPhone")}>
                    <Input id="parent_phone" name="parent_phone" type="tel" inputMode="tel" required />
                  </Field>
                  <Field name="batch_id" label={t("admin.students.batch")}>
                    <BatchSelect batches={batches} defaultValue={batch} />
                  </Field>
                  <Field name="monthly_fee" label={t("admin.students.monthlyFee")}>
                    <Input id="monthly_fee" name="monthly_fee" type="number" min={0} inputMode="numeric" defaultValue={0} />
                  </Field>
                  <Field name="password" label={t("admin.students.password")}>
                    <Input id="password" name="password" type="text" autoComplete="off" required />
                    <p className="text-sm text-muted-foreground">{t("admin.students.passwordHelp")}</p>
                  </Field>
                </ActionForm>
              )}
            </CardContent>
          </Card>

          {editing && (
            <Card>
              <CardHeader>
                <CardTitle>{t("admin.students.resetPassword")}</CardTitle>
              </CardHeader>
              <CardContent>
                <ActionForm
                  key={`pw-${editing.id}`}
                  action={resetStudentPassword.bind(null, editing.id)}
                  submitLabel={t("admin.students.resetPassword")}
                  successMessage={t("admin.students.passwordReset")}
                  resetOnSuccess
                >
                  <Field name="password" label={t("admin.students.newPassword")}>
                    <Input id="password" name="password" type="text" autoComplete="off" required />
                  </Field>
                </ActionForm>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </>
  );
}
