import { PageHeader } from "@/components/page-header";
import { getT } from "@/lib/i18n-server";

/** Placeholder for sections built in later phases. */
export async function ComingSoon({ titleKey }: { titleKey: string }) {
  const t = await getT();
  return <PageHeader title={t(titleKey)} description={t("common.comingSoon")} />;
}
