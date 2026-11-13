import { describe, expect, it } from "vitest";
import { homeFor, routeAccess } from "@/lib/auth/routes";

describe("homeFor", () => {
  it("sends each role to its area", () => {
    expect(homeFor("admin")).toBe("/admin");
    expect(homeFor("co_teacher")).toBe("/staff");
    expect(homeFor("student")).toBe("/app");
  });
});

describe("routeAccess", () => {
  it("leaves public routes open", () => {
    expect(routeAccess("/", null)).toEqual({ allow: true });
    expect(routeAccess("/enquiry", null)).toEqual({ allow: true });
    expect(routeAccess("/login", null)).toEqual({ allow: true });
  });

  it("sends signed-out users to login with a return path", () => {
    expect(routeAccess("/app/homework", null)).toEqual({ allow: false, redirect: "/login?next=%2Fapp%2Fhomework" });
    expect(routeAccess("/admin", null)).toEqual({ allow: false, redirect: "/login?next=%2Fadmin" });
  });

  it("keeps each role in its own area", () => {
    expect(routeAccess("/app", "student")).toEqual({ allow: true });
    expect(routeAccess("/admin/fees", "student")).toEqual({ allow: false, redirect: "/app" });
    expect(routeAccess("/staff/materials", "student")).toEqual({ allow: false, redirect: "/app" });
    expect(routeAccess("/staff/materials", "co_teacher")).toEqual({ allow: true });
    expect(routeAccess("/admin", "co_teacher")).toEqual({ allow: false, redirect: "/staff" });
    expect(routeAccess("/app", "co_teacher")).toEqual({ allow: false, redirect: "/staff" });
    expect(routeAccess("/admin/students", "admin")).toEqual({ allow: true });
    expect(routeAccess("/app", "admin")).toEqual({ allow: false, redirect: "/admin" });
  });

  it("does not treat look-alike paths as protected areas", () => {
    expect(routeAccess("/application", null)).toEqual({ allow: true });
    expect(routeAccess("/administrator", null)).toEqual({ allow: true });
  });

  it("sends signed-in users away from the login page", () => {
    expect(routeAccess("/login", "student")).toEqual({ allow: false, redirect: "/app" });
    expect(routeAccess("/login", "admin")).toEqual({ allow: false, redirect: "/admin" });
  });
});

describe("safeNext", () => {
  it("only allows same-site paths", async () => {
    const { safeNext } = await import("@/lib/auth/routes");
    expect(safeNext("/app/quizzes", "student")).toBe("/app/quizzes");
    expect(safeNext("//evil.com", "student")).toBe("/app");
    expect(safeNext("https://evil.com", "student")).toBe("/app");
    expect(safeNext("/admin", "student")).toBe("/app");
    expect(safeNext(null, "admin")).toBe("/admin");
  });
});
