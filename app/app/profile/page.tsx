import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LangToggle } from "@/components/lang-toggle";
import { PageHeader } from "@/components/page-header";
import { signOut } from "@/lib/actions/auth";
import { getCurrentStudent } from "@/lib/auth/session";
import { getT } from "@/lib/i18n-server";

export default async function ProfilePage() {
  const t = await getT();
  const student = (await getCurrentStudent())!;
  return (
    <>
      <PageHeader title={t("profile.title")} />
      <div className="grid max-w-lg gap-4">
        <Card>
          <CardHeader>
            <CardTitle>{student.full_name}</CardTitle>
          </CardHeader>
          <CardContent>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2">
              <dt className="text-muted-foreground">{t("profile.batch")}</dt>
              <dd>{student.batch.name}</dd>
              <dt className="text-muted-foreground">{t("profile.parentPhone")}</dt>
              <dd>{student.parent_phone}</dd>
            </dl>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>{t("common.language")}</CardTitle>
          </CardHeader>
          <CardContent className="grid gap-3">
            <p className="text-sm text-muted-foreground">{t("profile.languageHelp")}</p>
            <LangToggle />
          </CardContent>
        </Card>
        <form action={signOut}>
          <Button type="submit" variant="outline">{t("auth.logout")}</Button>
        </form>
      </div>
    </>
  );
}
