import { PageHeader } from "@/components/page-header";
import { getCurrentStudent } from "@/lib/auth/session";
import { getT } from "@/lib/i18n-server";

export default async function StudentHome() {
  const t = await getT();
  const student = (await getCurrentStudent())!;
  return <PageHeader title={t("common.welcome", { name: student.full_name })} description={t("common.comingSoon")} />;
}
