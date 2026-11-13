import { expect, test } from "@playwright/test";
import { adminPassword, login, logout } from "./helpers";

test("admin creates a student who can sign in, then removes them", async ({ page }) => {
  const phone = `7${String(Date.now()).slice(-9)}`;
  const name = `E2E Student ${phone.slice(-4)}`;

  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);

  // Duplicate standard is rejected with a friendly error.
  await page.goto("/admin/batches");
  await page.getByLabel("Standard").fill("9");
  await page.getByLabel("Batch name").fill("Dup");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("This already exists.")).toBeVisible();

  await page.goto("/admin/students");
  await page.getByLabel("Full name").fill(name);
  await page.getByLabel("Login phone").fill(phone);
  await page.getByLabel("Parent phone").fill(phone);
  await page.getByLabel("Batch").selectOption({ label: "Standard 9" });
  await page.getByLabel("Monthly fee").fill("1000");
  await page.getByLabel("Initial password").fill("short");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Password must be 8 to 72 characters.")).toBeVisible();
  // Inputs survive a validation error.
  await expect(page.getByLabel("Full name")).toHaveValue(name);

  await page.getByLabel("Initial password").fill("student-pass");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("cell", { name })).toBeVisible();
  await logout(page);

  await login(page, phone, "student-pass");
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: `Welcome, ${name}` })).toBeVisible();
  await logout(page);

  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/students");
  page.once("dialog", (d) => d.accept());
  await page.getByRole("row", { name: new RegExp(name) }).getByRole("button", { name: "Remove" }).click();
  await expect(page.getByRole("cell", { name })).toHaveCount(0);
  await logout(page);

  await login(page, phone, "student-pass");
  await expect(page.getByText("This account isn't linked to an active student.")).toBeVisible();
});
