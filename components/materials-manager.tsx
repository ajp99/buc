import Link from "next/link";
import { FileText, ImageIcon, Link2 } from "lucide-react";
import { BatchFilter } from "@/components/batch-filter";
import { ActionForm, Field } from "@/components/forms/action-form";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { SubjectSelect } from "@/components/forms/subject-select";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { createMaterial, deleteMaterial, updateMaterial } from "@/lib/actions/materials";
import { getT } from "@/lib/i18n-server";
import { getSubjectOptions } from "@/lib/queries";
import { createClient } from "@/lib/supabase/server";

export const MATERIAL_ICONS = { pdf: FileText, image: ImageIcon, link: Link2 } as const;

/** Materials list + create/edit form, shared by /admin/materials and /staff/materials. */
export async function MaterialsManager({ basePath, edit, batch }: { basePath: string; edit?: string; batch?: string }) {
  const [t, supabase] = await Promise.all([getT(), createClient()]);

  let query = supabase
    .from("materials")
    .select("id, title, type, url, subject_id, created_at, batch:batches(name, standard), subject:subjects(name)")
    .order("created_at", { ascending: false })
    .limit(200);
  if (batch) query = query.eq("batch_id", batch);

  const [{ data: batches }, subjects, { data: materials }] = await Promise.all([
    supabase.from("batches").select("id, name").order("standard"),
    getSubjectOptions(supabase),
    query,
  ]);
  const editing = materials?.find((m) => m.id === edit);

  return (
    <>
      <PageHeader title={t("nav.materials")} />
      <BatchFilter basePath={basePath} batches={batches ?? []} current={batch} allLabel={t("common.all")} />
      <div className="grid gap-6 lg:grid-cols-[1fr_24rem]">
        <Card className="order-2 h-fit lg:order-1">
          <CardContent className="grid divide-y">
            {materials?.length ? (
              materials.map((m) => {
                const Icon = MATERIAL_ICONS[m.type as keyof typeof MATERIAL_ICONS] ?? Link2;
                return (
                  <div key={m.id} className="flex flex-wrap items-center gap-3 py-3">
                    <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <a href={m.url} target="_blank" rel="noopener noreferrer" className="font-medium hover:underline">
                        {m.title}
                      </a>
                      <div className="mt-1">
                        <Badge variant="secondary">{`${m.batch?.name} · ${m.subject?.name}`}</Badge>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Link href={`${basePath}?edit=${m.id}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                        {t("common.edit")}
                      </Link>
                      <ConfirmButton action={deleteMaterial.bind(null, m.id)} confirmText={t("common.confirmDelete")} label={t("common.delete")} />
                    </div>
                  </div>
                );
              })
            ) : (
              <p className="text-muted-foreground">{t("materials.none")}</p>
            )}
          </CardContent>
        </Card>

        <Card className="order-1 h-fit lg:order-2">
          <CardHeader>
            <CardTitle>{editing ? t("materials.edit") : t("materials.new")}</CardTitle>
          </CardHeader>
          <CardContent>
            {subjects.length ? (
              <ActionForm
                key={editing?.id ?? "new"}
                action={editing ? updateMaterial.bind(null, editing.id) : createMaterial}
                submitLabel={editing ? t("common.update") : t("common.add")}
                resetOnSuccess={!editing}
              >
                <Field name="subject_id" label={t("content.batchSubject")}>
                  <SubjectSelect options={subjects} defaultValue={editing?.subject_id} />
                </Field>
                <Field name="title" label={t("content.title")}>
                  <Input id="title" name="title" defaultValue={editing?.title} required />
                </Field>
                <Field name="type" label={t("materials.type")}>
                  <NativeSelect id="type" name="type" defaultValue={editing?.type ?? "pdf"} className="w-full">
                    <NativeSelectOption value="pdf">{t("materials.pdf")}</NativeSelectOption>
                    <NativeSelectOption value="image">{t("materials.image")}</NativeSelectOption>
                    <NativeSelectOption value="link">{t("materials.link")}</NativeSelectOption>
                  </NativeSelect>
                </Field>
                <Field name="url" label={t("materials.url")}>
                  <Input id="url" name="url" type="url" inputMode="url" defaultValue={editing?.url} placeholder="https://drive.google.com/..." required />
                  <p className="text-sm text-muted-foreground">{t("materials.urlHelp")}</p>
                </Field>
              </ActionForm>
            ) : (
              <p className="text-muted-foreground">{t("content.needSubject")}</p>
            )}
            {editing && (
              <Link href={basePath} className="mt-3 inline-block text-sm text-muted-foreground underline">
                {t("common.cancelEdit")}
              </Link>
            )}
          </CardContent>
        </Card>
      </div>
    </>
  );
}
