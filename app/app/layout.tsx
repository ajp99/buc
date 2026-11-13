import { AppShell } from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { requireRole, getCurrentStudent } from "@/lib/auth/session";
import { signOut } from "@/lib/actions/auth";
import { getT } from "@/lib/i18n-server";
import { cn } from "@/lib/utils";

export default async function StudentLayout({ children }: { children: React.ReactNode }) {
  await requireRole("student");
  const t = await getT();
  const student = await getCurrentStudent();

  if (!student) {
    return (
      <main className="mx-auto grid min-h-dvh max-w-md place-content-center gap-4 p-4 text-center">
        <p>{t("student.inactive")}</p>
        <form action={signOut}>
          <Button type="submit" variant="outline">{t("auth.logout")}</Button>
        </form>
      </main>
    );
  }

  const junior = student.batch.standard < 8;

  return (
    <div className={cn(junior && "theme-junior")}>
      <AppShell
        root="/app"
        userLabel={`${student.full_name} · ${student.batch.name}`}
        items={[
          { href: "/app", label: t("nav.home"), icon: "home" },
          { href: "/app/homework", label: t("nav.homework"), icon: "homework" },
          { href: "/app/materials", label: t("nav.materials"), icon: "materials" },
          { href: "/app/quizzes", label: t("nav.quizzes"), icon: "quizzes" },
          { href: "/app/fees", label: t("nav.fees"), icon: "fees" },
          { href: "/app/parent-summary", label: t("nav.parentSummary"), icon: "parentSummary" },
          { href: "/app/profile", label: t("nav.profile"), icon: "profile" },
        ]}
        mobileTabs={[
          { href: "/app", label: t("nav.home"), icon: "home" },
          { href: "/app/homework", label: t("nav.homework"), icon: "homework" },
          { href: "/app/materials", label: t("nav.materials"), icon: "materials" },
          { href: "/app/quizzes", label: t("nav.quizzes"), icon: "quizzes" },
          { href: "/app/more", label: t("nav.more"), icon: "more" },
        ]}
      >
        {children}
      </AppShell>
    </div>
  );
}
