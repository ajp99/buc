"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  BookOpen, FolderOpen, GraduationCap, History, House, Inbox, IndianRupee, Layers,
  LayoutDashboard, Library, ListChecks, Megaphone, Menu, UserRound, Users,
} from "lucide-react";
import { cn } from "@/lib/utils";

const ICONS = {
  home: House, homework: BookOpen, materials: FolderOpen, quizzes: ListChecks, more: Menu,
  fees: IndianRupee, parentSummary: Users, profile: UserRound, dashboard: LayoutDashboard,
  students: GraduationCap, batches: Layers, subjects: Library, announcements: Megaphone,
  enquiries: Inbox, audit: History,
};

export type IconName = keyof typeof ICONS;
export type NavItem = { href: string; label: string; icon: IconName };

function isActive(pathname: string, href: string, root: string) {
  return href === root ? pathname === root : pathname === href || pathname.startsWith(`${href}/`);
}

/** Desktop sidebar. */
export function SideNav({ items, root }: { items: NavItem[]; root: string }) {
  const pathname = usePathname();
  return (
    <nav className="no-print hidden w-56 shrink-0 border-r bg-sidebar p-3 md:block">
      <ul className="grid gap-1">
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href, root);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center gap-3 rounded-lg px-3 text-sm font-medium",
                  active ? "bg-primary text-primary-foreground" : "text-sidebar-foreground hover:bg-accent",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile bottom tab bar (students). */
export function BottomTabs({ items, root }: { items: NavItem[]; root: string }) {
  const pathname = usePathname();
  return (
    <nav className="no-print fixed inset-x-0 bottom-0 z-20 border-t bg-background pb-[env(safe-area-inset-bottom)] md:hidden">
      <ul className="grid" style={{ gridTemplateColumns: `repeat(${items.length}, minmax(0, 1fr))` }}>
        {items.map((item) => {
          const Icon = ICONS[item.icon];
          const active = isActive(pathname, item.href, root);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-14 flex-col items-center justify-center gap-0.5 text-xs",
                  active ? "font-semibold text-primary" : "text-muted-foreground",
                )}
              >
                <Icon className="size-5" aria-hidden />
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

/** Mobile horizontal scrolling nav (staff and admin have too many items for tabs). */
export function ScrollNav({ items, root }: { items: NavItem[]; root: string }) {
  const pathname = usePathname();
  return (
    <nav className="no-print overflow-x-auto border-b md:hidden">
      <ul className="flex gap-1 px-2 py-1">
        {items.map((item) => {
          const active = isActive(pathname, item.href, root);
          return (
            <li key={item.href} className="shrink-0">
              <Link
                href={item.href}
                aria-current={active ? "page" : undefined}
                className={cn(
                  "flex min-h-11 items-center rounded-lg px-3 text-sm whitespace-nowrap",
                  active ? "bg-primary text-primary-foreground" : "text-foreground hover:bg-accent",
                )}
              >
                {item.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
