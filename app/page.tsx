import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { LangToggle } from "@/components/lang-toggle";
import { getT } from "@/lib/i18n-server";

export default async function LandingPage() {
  const t = await getT();
  return (
    <main className="mx-auto flex min-h-dvh max-w-2xl flex-col gap-8 px-4 py-10">
      <div className="flex justify-end">
        <LangToggle />
      </div>
      <section className="grid gap-3">
        <h1 className="text-3xl font-semibold text-primary">{t("app.name")}</h1>
        <p className="text-lg text-muted-foreground">{t("app.tagline")}</p>
      </section>
      <div className="flex flex-wrap gap-3">
        <Link href="/login" className={buttonVariants({ size: "lg" })}>
          {t("auth.signIn")}
        </Link>
      </div>
    </main>
  );
}
