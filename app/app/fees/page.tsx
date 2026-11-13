import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { formatDate, todayIST } from "@/lib/dates";
import { formatINR, formatMonth } from "@/lib/fees";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { cn } from "@/lib/utils";

export default async function StudentFeesPage() {
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);
  // RLS returns only this student's fees.
  const { data: fees } = await supabase
    .from("fees")
    .select("id, month, amount, status, paid_at, receipt_no")
    .order("month", { ascending: false });

  return (
    <>
      <PageHeader title={t("nav.fees")} />
      {!fees?.length && <p className="text-muted-foreground">{t("fees.none")}</p>}
      <div className="grid max-w-2xl gap-3">
        {fees?.map((f) => (
          <Card key={f.id} className={cn(f.status === "unpaid" && "border-destructive/50")}>
            <CardContent className="flex flex-wrap items-center justify-between gap-3">
              <div>
                <p className="font-semibold">{formatMonth(f.month, lang)}</p>
                <p className="text-lg">{formatINR(f.amount, lang)}</p>
                {f.paid_at && (
                  <p className="text-sm text-muted-foreground">{t("fees.paidOn", { date: formatDate(todayIST(new Date(f.paid_at)), lang) })}</p>
                )}
              </div>
              <div className="flex flex-col items-end gap-2">
                <Badge variant={f.status === "paid" ? "default" : "destructive"}>{t(`fees.status.${f.status}`)}</Badge>
                {f.status === "paid" && f.receipt_no && (
                  <Link href={`/app/fees/${f.id}/receipt`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                    {t("fees.viewReceipt")}
                  </Link>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
