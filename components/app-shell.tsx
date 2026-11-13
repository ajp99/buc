import Link from "next/link";
import { LogOut } from "lucide-react";
import { Button } from "@/components/ui/button";
import { LangToggle } from "@/components/lang-toggle";
import { BottomTabs, ScrollNav, SideNav, type NavItem } from "@/components/nav/app-nav";
import { signOut } from "@/lib/actions/auth";
import { getT } from "@/lib/i18n-server";

type Props = {
  root: string;
  items: NavItem[];
  /** Student bottom tabs; when omitted the mobile nav is a scrolling strip of `items`. */
  mobileTabs?: NavItem[];
  userLabel: string;
  children: React.ReactNode;
};

export async function AppShell({ root, items, mobileTabs, userLabel, children }: Props) {
  const t = await getT();
  return (
    <div className="flex min-h-dvh flex-col bg-background">
      <header className="no-print sticky top-0 z-10 flex items-center gap-3 border-b bg-background/95 px-4 py-2 backdrop-blur">
        <Link href={root} className="font-semibold text-primary">
          {t("app.name")}
        </Link>
        <span className="hidden truncate text-sm text-muted-foreground sm:inline">{userLabel}</span>
        <div className="ml-auto flex items-center gap-2">
          <div className="hidden sm:block">
            <LangToggle />
          </div>
          <form action={signOut}>
            <Button type="submit" variant="ghost" size="sm" aria-label={t("auth.logout")}>
              <LogOut aria-hidden />
              <span className="hidden sm:inline">{t("auth.logout")}</span>
            </Button>
          </form>
        </div>
      </header>
      {!mobileTabs && <ScrollNav items={items} root={root} />}
      <div className="flex flex-1">
        <SideNav items={items} root={root} />
        <main className={mobileTabs ? "min-w-0 flex-1 p-4 pb-24 md:p-6" : "min-w-0 flex-1 p-4 md:p-6"}>
          {children}
        </main>
      </div>
      {mobileTabs && <BottomTabs items={mobileTabs} root={root} />}
    </div>
  );
}
