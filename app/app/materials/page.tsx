import { ExternalLink } from "lucide-react";
import { MATERIAL_ICONS } from "@/components/materials-manager";
import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

export default async function StudentMaterialsPage() {
  const [t, supabase] = await Promise.all([getT(), createClient()]);
  // The URL is not selected: students open materials through the batch-checked redirect.
  const { data } = await supabase
    .from("materials")
    .select("id, title, type, created_at, subject:subjects(name)")
    .order("created_at", { ascending: false });

  const bySubject = new Map<string, NonNullable<typeof data>>();
  for (const m of data ?? []) {
    const key = m.subject?.name ?? "";
    bySubject.set(key, [...(bySubject.get(key) ?? []), m]);
  }

  return (
    <>
      <PageHeader title={t("nav.materials")} />
      {!data?.length && <p className="text-muted-foreground">{t("materials.none")}</p>}
      <div className="grid max-w-3xl gap-6">
        {[...bySubject.entries()]
          .sort(([a], [b]) => a.localeCompare(b))
          .map(([subject, items]) => (
            <Card key={subject}>
              <CardHeader>
                <CardTitle>{subject}</CardTitle>
              </CardHeader>
              <CardContent className="grid divide-y">
                {items.map((m) => {
                  const Icon = MATERIAL_ICONS[m.type as keyof typeof MATERIAL_ICONS];
                  return (
                    <a
                      key={m.id}
                      href={`/api/materials/${m.id}/open`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex min-h-12 items-center gap-3 py-2 hover:text-primary"
                    >
                      <Icon className="size-5 shrink-0 text-muted-foreground" aria-hidden />
                      <span className="flex-1">{m.title}</span>
                      <span className="sr-only">{t(`materials.${m.type}`)}</span>
                      <ExternalLink className="size-4 text-muted-foreground" aria-label={t("materials.open")} />
                    </a>
                  );
                })}
              </CardContent>
            </Card>
          ))}
      </div>
    </>
  );
}
