import { expect, test } from "@playwright/test";
import { adminPassword, DEV_PASSWORD, login, logout } from "./helpers";

test("signed-out visitors are sent to login with a return path", async ({ page }) => {
  await page.goto("/admin/students");
  await expect(page).toHaveURL(/\/login\?next=%2Fadmin%2Fstudents$/);
});

test("wrong password shows an error", async ({ page }) => {
  await login(page, "9000000006", "wrong-password");
  await expect(page.getByText("Wrong phone number, username or password.")).toBeVisible();
  await expect(page).toHaveURL(/\/login/);
});

test("admin lands on /admin and cannot open the student area", async ({ page }) => {
  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);
  await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  await page.goto("/app");
  await expect(page).toHaveURL(/\/admin$/);
  await logout(page);
});

test("co-teacher lands on /staff and cannot open admin", async ({ page }) => {
  await login(page, "coteacher", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/staff$/);
  await page.goto("/admin");
  await expect(page).toHaveURL(/\/staff$/);
  await logout(page);
});

test("std 6 student gets the junior theme and bottom tabs", async ({ page }) => {
  await login(page, "+91 90000 00006", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: "Welcome, Asha Verma" })).toBeVisible();
  await expect(page.locator(".theme-junior")).toHaveCount(1);
  await expect(page.getByRole("link", { name: "More" })).toBeVisible();
  await page.goto("/staff");
  await expect(page).toHaveURL(/\/app$/);
  await logout(page);
});

test("std 9 student gets the academic theme", async ({ page }) => {
  await login(page, "9000000009", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.locator(".theme-junior")).toHaveCount(0);
  await logout(page);
});

test("login honours a safe next path", async ({ page }) => {
  await login(page, "9000000009", DEV_PASSWORD, "/login?next=%2Fapp%2Fhomework");
  await expect(page).toHaveURL(/\/app\/homework$/);
  await logout(page);
});

test("language choice switches the UI and persists across sessions", async ({ page, context }) => {
  await login(page, "9000000009", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/profile");
  await page.getByRole("button", { name: "हिन्दी" }).click();
  await expect(page.getByRole("heading", { name: "प्रोफ़ाइल" })).toBeVisible();
  await page.reload();
  await expect(page.getByRole("heading", { name: "प्रोफ़ाइल" })).toBeVisible();

  // Fresh browser state: language comes back from users.language on login.
  await logout(page);
  await context.clearCookies();
  await login(page, "9000000009", DEV_PASSWORD);
  await expect(page.getByRole("heading", { name: "नमस्ते, Ravi Kumar" })).toBeVisible();

  // Reset to English for other tests.
  await page.goto("/app/profile");
  await expect(page.getByRole("heading", { name: "प्रोफ़ाइल" })).toBeVisible();
  await page.getByRole("button", { name: "English" }).click();
  await expect(page.getByRole("heading", { name: "Profile" })).toBeVisible();
  await logout(page);
});
