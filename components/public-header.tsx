import Link from "next/link";
import { LangToggle } from "@/components/lang-toggle";
import { getT } from "@/lib/i18n-server";

export async function PublicHeader() {
  const t = await getT();
  return (
    <header className="flex flex-wrap items-center justify-between gap-3 border-b px-4 py-3">
      <Link href="/" className="text-lg font-semibold text-primary">
        {t("app.name")}
      </Link>
      <div className="flex items-center gap-3">
        <Link href="/login" className="flex min-h-11 items-center text-sm font-medium underline-offset-4 hover:underline">
          {t("auth.signIn")}
        </Link>
        <LangToggle />
      </div>
    </header>
  );
}
