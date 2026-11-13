// Which role may visit which area. Used by middleware and the login redirect.

export type Role = "admin" | "co_teacher" | "student";

export type Access = { allow: true } | { allow: false; redirect: string };

const AREAS: { prefix: string; role: Role }[] = [
  { prefix: "/app", role: "student" },
  { prefix: "/staff", role: "co_teacher" },
  { prefix: "/admin", role: "admin" },
];

export function homeFor(role: Role): string {
  return AREAS.find((a) => a.role === role)!.prefix;
}

function areaOf(pathname: string) {
  return AREAS.find((a) => pathname === a.prefix || pathname.startsWith(`${a.prefix}/`));
}

export function routeAccess(pathname: string, role: Role | null): Access {
  if (pathname === "/login") {
    return role ? { allow: false, redirect: homeFor(role) } : { allow: true };
  }
  const area = areaOf(pathname);
  if (!area) return { allow: true };
  if (!role) return { allow: false, redirect: `/login?next=${encodeURIComponent(pathname)}` };
  if (area.role !== role) return { allow: false, redirect: homeFor(role) };
  return { allow: true };
}

/** The post-login destination: `next` if it is a same-site path this role may visit. */
export function safeNext(next: string | null | undefined, role: Role): string {
  if (next && next.startsWith("/") && !next.startsWith("//") && !next.startsWith("/\\")) {
    const access = routeAccess(next, role);
    if (access.allow && areaOf(next)) return next;
  }
  return homeFor(role);
}
