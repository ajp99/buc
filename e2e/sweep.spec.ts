import { expect, test, type Page } from "@playwright/test";
import { adminPassword, DEV_PASSWORD, login, logout } from "./helpers";

// Visits every page per role in English and Hindi. A raw dictionary key in the
// page text (e.g. "quiz.status.open") means a missing translation.
const KEY_RE = /\b(?:common|nav|auth|admin|content|announcements|homework|materials|quiz|fees|enquiry|public|summary|dashboard|audit|validation|errors|profile|student|roles)\.[a-zA-Z_.]+\b/;

const PAGES = {
  public: ["/", "/enquiry", "/login"],
  student: ["/app", "/app/homework", "/app/materials", "/app/quizzes", "/app/fees", "/app/parent-summary", "/app/profile", "/app/more"],
  staff: ["/staff", "/staff/materials"],
  admin: [
    "/admin", "/admin/students", "/admin/batches", "/admin/subjects", "/admin/announcements", "/admin/homework",
    "/admin/materials", "/admin/quizzes", "/admin/fees", "/admin/enquiries", "/admin/audit",
  ],
};

async function sweep(page: Page, paths: string[]) {
  for (const lang of ["hi", "en"]) {
    await page.context().addCookies([{ name: "lang", value: lang, url: "http://localhost:3100" }]);
    for (const path of paths) {
      const res = await page.goto(path);
      expect(res?.status(), `${path} (${lang})`).toBe(200);
      const text = await page.locator("body").innerText();
      expect(text.match(KEY_RE)?.[0], `untranslated key on ${path} (${lang})`).toBeUndefined();
      if (lang === "hi") expect(text, `${path} should show Hindi`).toMatch(/[ऀ-ॿ]/);
    }
  }
}

test("public pages", async ({ page }) => {
  await sweep(page, PAGES.public);
});

test("student pages", async ({ page }) => {
  await login(page, "9000000006", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  await sweep(page, PAGES.student);
  await page.goto("/app/parent-summary");
  for (const heading of ["Homework due", "Recent quiz results", "Fees", "Recent announcements"]) {
    await expect(page.getByRole("heading", { name: heading })).toBeVisible();
  }
  await logout(page);
});

test("co-teacher pages", async ({ page }) => {
  await login(page, "coteacher", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/staff$/);
  await sweep(page, PAGES.staff);
  await logout(page);
});

test("admin pages", async ({ page }) => {
  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);
  await sweep(page, PAGES.admin);
  await page.goto("/admin");
  await expect(page.getByText("Active students")).toBeVisible();
  await page.goto("/admin/audit");
  await expect(page.getByRole("row").nth(1)).toBeVisible();
  await logout(page);
});
