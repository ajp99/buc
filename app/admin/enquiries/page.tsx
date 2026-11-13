import Link from "next/link";
import { MessageCircle, Phone } from "lucide-react";
import { ConfirmButton } from "@/components/forms/confirm-button";
import { PageHeader } from "@/components/page-header";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDateTime } from "@/lib/dates";
import { getLang, getT } from "@/lib/i18n-server";
import { createClient } from "@/lib/supabase/server";
import { whatsappChatUrl } from "@/lib/whatsapp";
import { cn } from "@/lib/utils";
import { ENQUIRY_STATUSES, type EnquiryStatus as Status } from "@/lib/enquiry";
import { deleteEnquiry, setEnquiryStatus } from "./actions";

export default async function AdminEnquiriesPage({ searchParams }: { searchParams: Promise<{ status?: string }> }) {
  const params = await searchParams;
  const status: Status = ENQUIRY_STATUSES.includes(params.status as Status) ? (params.status as Status) : "new";
  const [t, lang, supabase] = await Promise.all([getT(), getLang(), createClient()]);

  const [{ data: enquiries }, ...counts] = await Promise.all([
    supabase.from("enquiries").select("id, name, phone, standard, message, status, created_at").eq("status", status).order("created_at", { ascending: false }),
    ...ENQUIRY_STATUSES.map((s) => supabase.from("enquiries").select("id", { count: "exact", head: true }).eq("status", s)),
  ]);

  return (
    <>
      <PageHeader title={t("nav.enquiries")} />
      <nav className="mb-4 flex flex-wrap gap-2">
        {ENQUIRY_STATUSES.map((s, i) => (
          <Link
            key={s}
            href={`/admin/enquiries?status=${s}`}
            aria-current={s === status ? "page" : undefined}
            className={cn(
              "flex min-h-11 items-center gap-2 rounded-full border px-4 text-sm",
              s === status ? "border-primary bg-primary text-primary-foreground" : "hover:bg-accent",
            )}
          >
            {t(`enquiry.status.${s}`)}
            <span className="tabular-nums opacity-80">{counts[i].count ?? 0}</span>
          </Link>
        ))}
      </nav>

      {!enquiries?.length && <p className="text-muted-foreground">{t("enquiry.none")}</p>}
      <div className="grid max-w-3xl gap-4">
        {enquiries?.map((e) => (
          <Card key={e.id}>
            <CardHeader>
              <div className="flex flex-wrap items-center gap-2">
                <CardTitle>{e.name}</CardTitle>
                <Badge variant="secondary">{t("enquiry.std", { n: e.standard })}</Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                {e.phone} · {t("enquiry.received", { date: formatDateTime(e.created_at, lang) })}
              </p>
            </CardHeader>
            <CardContent className="grid gap-3">
              {e.message && <p className="whitespace-pre-wrap">{e.message}</p>}
              <div className="flex flex-wrap gap-2">
                <a href={`tel:+91${e.phone}`} className={buttonVariants({ variant: "outline", size: "sm" })}>
                  <Phone aria-hidden />
                  {t("enquiry.call")}
                </a>
                <a
                  href={whatsappChatUrl(e.phone, t("enquiry.replyText", { name: e.name, standard: e.standard }))}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={buttonVariants({ variant: "outline", size: "sm" })}
                >
                  <MessageCircle aria-hidden />
                  {t("enquiry.whatsapp")}
                </a>
                {ENQUIRY_STATUSES.filter((s) => s !== e.status).map((s) => (
                  <ConfirmButton
                    key={s}
                    action={setEnquiryStatus.bind(null, e.id, s)}
                    label={t("enquiry.markAs", { status: t(`enquiry.status.${s}`) })}
                    variant={s === "contacted" ? "default" : "outline"}
                  />
                ))}
                <ConfirmButton action={deleteEnquiry.bind(null, e.id)} confirmText={t("common.confirmDelete")} label={t("common.delete")} />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  );
}
