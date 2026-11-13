import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n-server";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("admin");
  const t = await getT();
  return (
    <AppShell
      root="/admin"
      userLabel={`${user.username ?? ""} · ${t("roles.admin")}`}
      items={[
        { href: "/admin", label: t("nav.dashboard"), icon: "dashboard" },
        { href: "/admin/students", label: t("nav.students"), icon: "students" },
        { href: "/admin/batches", label: t("nav.batches"), icon: "batches" },
        { href: "/admin/subjects", label: t("nav.subjects"), icon: "subjects" },
        { href: "/admin/announcements", label: t("nav.announcements"), icon: "announcements" },
        { href: "/admin/homework", label: t("nav.homework"), icon: "homework" },
        { href: "/admin/materials", label: t("nav.materials"), icon: "materials" },
        { href: "/admin/quizzes", label: t("nav.quizzes"), icon: "quizzes" },
        { href: "/admin/fees", label: t("nav.fees"), icon: "fees" },
        { href: "/admin/enquiries", label: t("nav.enquiries"), icon: "enquiries" },
        { href: "/admin/audit", label: t("nav.audit"), icon: "audit" },
      ]}
    >
      {children}
    </AppShell>
  );
}
