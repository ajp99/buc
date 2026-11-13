import Link from "next/link";
import { BookOpen, FolderOpen, IndianRupee, ListChecks } from "lucide-react";
import { PublicHeader } from "@/components/public-header";
import { buttonVariants } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { getT } from "@/lib/i18n-server";

const FEATURES = [
  { icon: BookOpen, key: "f1" },
  { icon: FolderOpen, key: "f2" },
  { icon: ListChecks, key: "f3" },
  { icon: IndianRupee, key: "f4" },
] as const;

export default async function LandingPage() {
  const t = await getT();
  return (
    <>
      <PublicHeader />
      <main>
        <section className="bg-accent px-4 py-14">
          <div className="mx-auto grid max-w-3xl gap-5">
            <p className="text-sm font-medium tracking-wide text-primary uppercase">{t("app.name")}</p>
            <h1 className="text-3xl font-semibold tracking-tight sm:text-4xl">{t("public.heroTitle")}</h1>
            <p className="text-lg text-muted-foreground">{t("public.heroText")}</p>
            <div className="flex flex-wrap gap-2" aria-label={t("public.standards")}>
              {[5, 6, 7, 8, 9, 10].map((n) => (
                <span key={n} className="rounded-full border border-primary/30 bg-background px-3 py-1 text-sm">
                  {t("enquiry.std", { n })}
                </span>
              ))}
            </div>
            <div className="flex flex-wrap gap-3 pt-2">
              <Link href="/enquiry" className={buttonVariants({ size: "lg" })}>
                {t("public.enquire")}
              </Link>
              <Link href="/login" className={buttonVariants({ size: "lg", variant: "outline" })}>
                {t("public.studentLogin")}
              </Link>
            </div>
          </div>
        </section>
        <section className="mx-auto max-w-3xl px-4 py-12">
          <h2 className="mb-6 text-xl font-semibold">{t("public.featuresTitle")}</h2>
          <div className="grid gap-4 sm:grid-cols-2">
            {FEATURES.map(({ icon: Icon, key }) => (
              <Card key={key}>
                <CardHeader>
                  <Icon className="size-6 text-primary" aria-hidden />
                  <CardTitle>{t(`public.${key}Title`)}</CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-muted-foreground">{t(`public.${key}Text`)}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </section>
      </main>
    </>
  );
}
