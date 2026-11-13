import Link from "next/link";
import { PageHeader } from "@/components/page-header";
import { buttonVariants } from "@/components/ui/button";
import { getT } from "@/lib/i18n-server";

export default async function StaffHome() {
  const t = await getT();
  return (
    <>
      <PageHeader title={t("nav.dashboard")} description={t("materials.staffHome")} />
      <Link href="/staff/materials" className={buttonVariants({ size: "lg" })}>
        {t("materials.manage")}
      </Link>
    </>
  );
}
