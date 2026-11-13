import Link from "next/link";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { ActionForm } from "@/components/forms/action-form";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { currentMonthIST, formatINR, formatMonth, isMonth, shiftMonth } from "@/lib/fees";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { generateFees, markFeePaid, markFeeUnpaid, updateFeeAmount } from "./actions";

export default async function AdminFeesPage({ searchParams }: { searchParams: Promise<{ month?: string }> }) {
  const params = await searchParams;
  const month = isMonth(params.month) ? params.month : currentMonthIST();
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);

  const { data } = await supabase
    .from("fees")
    .select("id, amount, status, receipt_no, student:students!inner(full_name, batch:batches(name, standard))")
    .eq("month", month);
  const fees = (data ?? []).sort(
    (a, b) =>
      (a.student.batch?.standard ?? 0) - (b.student.batch?.standard ?? 0) ||
      a.student.full_name.localeCompare(b.student.full_name),
  );

  const total = fees.reduce((s, f) => s + Number(f.amount), 0);
  const collected = fees.filter((f) => f.status === "paid").reduce((s, f) => s + Number(f.amount), 0);
  const monthName = formatMonth(month, lang);

  return (
    <>
      <PageHeader title={t("nav.fees")} />

      <div className="mb-6 flex flex-wrap items-center gap-3">
        <Link href={`/admin/fees?month=${shiftMonth(month, -1)}`} className={buttonVariants({ variant: "outline", size: "icon-lg" })} aria-label={t("fees.prevMonth")}>
          <ChevronLeft />
        </Link>
        <span className="min-w-40 text-center text-lg font-semibold">{monthName}</span>
        <Link href={`/admin/fees?month=${shiftMonth(month, 1)}`} className={buttonVariants({ variant: "outline", size: "icon-lg" })} aria-label={t("fees.nextMonth")}>
          <ChevronRight />
        </Link>
      </div>

      <div className="mb-6 grid gap-2">
        <ConfirmButton action={generateFees.bind(null, month)} label={t("fees.generate", { month: monthName })} variant="default" size="lg" />
        <p className="max-w-2xl text-sm text-muted-foreground">{t("fees.generateHelp")}</p>
      </div>

      {fees.length > 0 && (
        <dl className="mb-6 grid max-w-2xl grid-cols-3 gap-3">
          {[
            [t("fees.total"), formatINR(total, lang)],
            [t("fees.collected"), formatINR(collected, lang)],
            [t("fees.pending"), formatINR(total - collected, lang)],
          ].map(([label, value]) => (
            <Card key={label} className="py-3">
              <CardContent className="px-4">
                <dt className="text-sm text-muted-foreground">{label}</dt>
                <dd className="text-xl font-semibold">{value}</dd>
              </CardContent>
            </Card>
          ))}
        </dl>
      )}

      <Card>
        <CardContent>
          {fees.length ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{t("quiz.student")}</TableHead>
                  <TableHead>{t("admin.students.batch")}</TableHead>
                  <TableHead>{t("fees.amount")}</TableHead>
                  <TableHead>{t("common.status")}</TableHead>
                  <TableHead className="text-right">{t("common.actions")}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {fees.map((f) => (
                  <TableRow key={f.id}>
                    <TableCell className="font-medium">{f.student.full_name}</TableCell>
                    <TableCell>{f.student.batch?.name}</TableCell>
                    <TableCell>
                      {f.status === "unpaid" ? (
                        <ActionForm action={updateFeeAmount.bind(null, f.id)} submitLabel={t("fees.saveAmount")} className="flex items-start gap-2 [&>div:last-child]:shrink-0">
                          <Input name="amount" type="number" min={0} inputMode="numeric" defaultValue={Number(f.amount)} aria-label={t("fees.amount")} className="w-28" />
                        </ActionForm>
                      ) : (
                        formatINR(f.amount, lang)
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={f.status === "paid" ? "default" : "outline"}>{t(`fees.status.${f.status}`)}</Badge>
                      {f.receipt_no && <div className="mt-1 text-xs text-muted-foreground">{f.receipt_no}</div>}
                    </TableCell>
                    <TableCell>
                      <div className="flex justify-end gap-2">
                        {f.status === "unpaid" ? (
                          <ConfirmButton action={markFeePaid.bind(null, f.id)} label={t("fees.markPaid")} variant="default" />
                        ) : (
                          <>
                            <Link href={`/admin/fees/${f.id}/receipt`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                              {t("fees.receipt")}
                            </Link>
                            <ConfirmButton action={markFeeUnpaid.bind(null, f.id)} confirmText={t("fees.markUnpaidWarn")} label={t("fees.markUnpaid")} variant="outline" />
                          </>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <p className="text-muted-foreground">{t("fees.noneForMonth")}</p>
          )}
        </CardContent>
      </Card>
    </>
  );
}
