import { AppShell } from "@/components/app-shell";
import { requireRole } from "@/lib/auth/session";
import { getT } from "@/lib/i18n-server";

export default async function StaffLayout({ children }: { children: React.ReactNode }) {
  const user = await requireRole("co_teacher");
  const t = await getT();
  return (
    <AppShell
      root="/staff"
      userLabel={`${user.username ?? ""} · ${t("roles.co_teacher")}`}
      items={[
        { href: "/staff", label: t("nav.dashboard"), icon: "dashboard" },
        { href: "/staff/materials", label: t("nav.materials"), icon: "materials" },
      ]}
    >
      {children}
    </AppShell>
  );
}
