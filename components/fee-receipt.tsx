import { notFound } from "next/navigation";
import { PrintButton } from "@/components/print-button";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { formatDate, todayIST } from "@/lib/dates";
import { formatINR, formatMonth } from "@/lib/fees";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";

/**
 * Printable fee receipt. RLS decides who can load it: the student it belongs
 * to, or staff. Everything except the receipt itself is hidden when printing.
 */
export async function FeeReceipt({ feeId }: { feeId: string }) {
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);
  const { data: fee } = await supabase
    .from("fees")
    .select("month, amount, status, paid_at, receipt_no, student:students!inner(full_name, batch:batches(name))")
    .eq("id", feeId)
    .maybeSingle();
  if (!fee) notFound();

  if (fee.status !== "paid" || !fee.receipt_no || !fee.paid_at) {
    return (
      <Alert>
        <AlertDescription>{t("fees.receiptUnpaid")}</AlertDescription>
      </Alert>
    );
  }

  const rows: [string, string][] = [
    [t("fees.receivedFrom"), fee.student.full_name],
    [t("admin.students.batch"), fee.student.batch?.name ?? ""],
    [t("fees.forMonth"), formatMonth(fee.month, lang)],
    [t("fees.date"), formatDate(todayIST(new Date(fee.paid_at)), lang)],
  ];

  return (
    <div className="grid max-w-xl gap-4">
      <div className="no-print">
        <PrintButton label={t("fees.print")} />
      </div>
      <article className="receipt rounded-xl border bg-card p-6 print:rounded-none print:border-black">
        <header className="mb-6 flex items-start justify-between gap-4 border-b pb-4">
          <div>
            <p className="text-xl font-semibold text-primary print:text-black">{t("app.name")}</p>
            <h1 className="text-lg font-medium">{t("fees.receiptTitle")}</h1>
          </div>
          <div className="text-right">
            <p className="text-sm text-muted-foreground">{t("fees.receiptNo")}</p>
            <p className="font-mono font-semibold">{fee.receipt_no}</p>
          </div>
        </header>
        <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-3">
          {rows.map(([label, value]) => (
            <div key={label} className="contents">
              <dt className="text-muted-foreground">{label}</dt>
              <dd className="font-medium">{value}</dd>
            </div>
          ))}
          <dt className="text-muted-foreground">{t("fees.amount")}</dt>
          <dd className="text-2xl font-semibold">{formatINR(fee.amount, lang)}</dd>
        </dl>
        <footer className="mt-10 flex items-end justify-between gap-4">
          <p className="text-sm">{t("fees.thanks")}</p>
          <p className="border-t px-6 pt-1 text-sm text-muted-foreground print:border-black">{t("fees.signature")}</p>
        </footer>
      </article>
    </div>
  );
}
