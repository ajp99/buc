import { expect, test } from "@playwright/test";
import { adminPassword, DEV_PASSWORD, login, logout } from "./helpers";

test("admin generates and collects a month's fees; student gets a printable receipt", async ({ page }) => {
  // A far-future month so reruns don't collide with earlier data.
  const n = Math.floor(Date.now() / 1000);
  const month = `${2040 + (n % 50)}-${String((Math.floor(n / 50) % 12) + 1).padStart(2, "0")}`;

  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto(`/admin/fees?month=${month}`);
  await expect(page.getByText("No fees for this month yet.")).toBeVisible();
  await page.getByRole("button", { name: /^Generate fees for/ }).click();
  await expect(page.getByText(/Created \d+ fee entries\./)).toBeVisible();

  const row = page.getByRole("row", { name: /Asha Verma/ });
  await expect(row.getByLabel("Amount")).toHaveValue("800");
  await row.getByLabel("Amount").fill("750");
  await row.getByRole("button", { name: "Save" }).click();
  await expect(row.getByText("Saved.")).toBeVisible();
  await row.getByRole("button", { name: "Mark paid" }).click();
  await expect(row.getByText("Paid", { exact: true })).toBeVisible();
  await expect(row.getByText(/^RCPT-\d{4}-\d{4}$/)).toBeVisible();

  // Generating again creates nothing new.
  await page.getByRole("button", { name: /^Generate fees for/ }).click();
  await expect(page.getByText("Created 0 fee entries.")).toBeVisible();

  await row.getByRole("link", { name: "Receipt" }).click();
  await expect(page).toHaveURL(/\/admin\/fees\/[0-9a-f-]{36}\/receipt$/);
  await expect(page.locator("article").getByText("₹750")).toBeVisible();
  const receiptPath = new URL(page.url()).pathname.replace("/admin", "/app");
  await logout(page);

  // The student sees it as paid and can open the receipt.
  await login(page, "9000000006", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/fees");
  await expect(page.getByRole("link", { name: "View receipt" }).first()).toBeVisible();
  await page.goto(receiptPath);
  await expect(page.getByRole("heading", { name: "Fee receipt" })).toBeVisible();
  await expect(page.locator("article").getByText("Asha Verma")).toBeVisible();

  // Print view hides navigation and the print button.
  await page.emulateMedia({ media: "print" });
  await expect(page.getByRole("button", { name: "Print / Save as PDF" })).toBeHidden();
  await expect(page.getByRole("link", { name: "Homework" })).toBeHidden();
  await expect(page.locator("article").getByText("₹750")).toBeVisible();
  await page.emulateMedia({ media: "screen" });
  await logout(page);

  // Another student can't open it.
  await login(page, "9000000009", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  const res = await page.goto(receiptPath);
  expect(res?.status()).toBe(404);
});
