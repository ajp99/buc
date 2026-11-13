import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatDateTime } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

const PAGE_SIZE = 50;
const ENTITIES = ["student", "batch", "subject", "announcement", "homework", "material", "quiz", "quiz_question", "quiz_attempt", "fee", "fees", "enquiry"];

export default async function AuditPage({ searchParams }: { searchParams: Promise<{ page?: string; entity?: string }> }) {
  const params = await searchParams;
  const page = Math.max(0, Number.parseInt(params.page ?? "0", 10) || 0);
  const entity = ENTITIES.includes(params.entity ?? "") ? params.entity : undefined;
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);

  let query = supabase
    .from("audit_log")
    .select("id, action, entity, entity_id, meta, created_at, actor:users(username, role)")
    .order("created_at", { ascending: false })
    .range(page * PAGE_SIZE, page * PAGE_SIZE + PAGE_SIZE); // one extra row tells us if there's an older page
  if (entity) query = query.eq("entity", entity);
  const { data } = await query;

  const rows = (data ?? []).slice(0, PAGE_SIZE);
  const hasOlder = (data?.length ?? 0) > PAGE_SIZE;
  const href = (p: number, e = entity) => `/admin/audit?page=${p}${e ? `&entity=${e}` : ""}`;

  return (
    <>
      <PageHeader title={t("nav.audit")} description={t("audit.description")} />
      <nav className="mb-4 flex flex-wrap gap-2">
        {[undefined, ...ENTITIES].map((e) => (
          <Link
            key={e ?? "all"}
            href={href(0, e)}
            aria-current={e === entity ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center rounded-full border px-3 text-sm",
              e === entity ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {e ? t(`audit.entity.${e}`) : t("audit.allEntities")}
          </Link>
        ))}
      </nav>
      <Card>
        <CardContent>
          {rows.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("audit.when")}</TableHead>
                  <TableHead>{t("audit.who")}</TableHead>
                  <TableHead>{t("audit.what")}</TableHead>
                  <TableHead>{t("audit.details")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="whitespace-nowrap">{formatDateTime(r.created_at, lang)}</TableCell>
                    <TableCell>{r.actor?.username ?? ""}</TableCell>
                    <TableCell className="whitespace-nowrap">
                      <Badge variant={r.action === "delete" ? "destructive" : r.action === "create" ? "default" : "secondary"}>
                        {t(`audit.action.${r.action}`)}
                      </Badge>{" "}
                      {t(`audit.entity.${r.entity}`)}
                    </TableCell>
                    <TableCell className="max-w-md truncate font-mono text-xs text-muted-foreground" title={JSON.stringify(r.meta)}>
                      {Object.keys((r.meta as object) ?? {}).length ? JSON.stringify(r.meta) : (r.entity_id ?? "")}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">{t("audit.none")}</p>
          )}
        </CardContent>
      </Card>
      <div className="mt-4 flex gap-2">
        {page > 0 && (
          <Link href={href(page - 1)} className={buttonVariants({ variant: "outline" })}>
            {t("audit.newer")}
          </Link>
        )}
        {hasOlder && (
          <Link href={href(page + 1)} className={buttonVariants({ variant: "outline" })}>
            {t("audit.older")}
          </Link>
        )}
      </div>
    </>
  );
}
