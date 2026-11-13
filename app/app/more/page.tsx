import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { LangToggle } from "@/components/lang-toggle";
import { PageHeader } from "@/components/page-header";
import { getT } from "@/lib/i18n-server";

export default async function MorePage() {
  const t = await getT();
  const links = [
    { href: "/app/fees", label: t("nav.fees") },
    { href: "/app/parent-summary", label: t("nav.parentSummary") },
    { href: "/app/profile", label: t("nav.profile") },
  ];
  return (
    <>
      <PageHeader title={t("nav.more")} />
      <div className="divide-y rounded-xl border bg-card">
        {links.map((l) => (
          <Link key={l.href} href={l.href} className="flex min-h-12 items-center justify-between px-4 hover:bg-accent">
            {l.label}
            <ChevronRight className="size-4 text-muted-foreground" aria-hidden />
          </Link>
        ))}
        <div className="flex min-h-12 flex-wrap items-center justify-between gap-2 px-4 py-2">
          {t("common.language")}
          <LangToggle />
        </div>
      </div>
    </>
  );
}
