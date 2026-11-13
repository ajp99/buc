import { expect, test } from "@playwright/test";
import { addDays, todayIST } from "../lib/dates";
import { adminPassword, DEV_PASSWORD, login, logout } from "./helpers";

test("content reaches the right batch; materials open only for that batch", async ({ page }) => {
  const tag = String(Date.now()).slice(-6);
  const notice = `Holiday ${tag}`;
  const hw = `Std6 HW ${tag}`;
  const mat = `Std6 notes ${tag}`;
  const coMat = `Std9 coteacher notes ${tag}`;

  // Admin posts an all-batch announcement, std 6 homework and std 6 material.
  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);

  await page.goto("/admin/announcements");
  await page.getByLabel("Title").fill(notice);
  await page.getByLabel("Message").fill("No class on Friday.");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: notice })).toBeVisible();

  await page.goto("/admin/homework");
  await page.getByLabel("Batch and subject").selectOption({ label: "Standard 6 · Maths" });
  await page.getByLabel("Title").fill(hw);
  await page.getByLabel("Due date").fill(addDays(todayIST(), 2));
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("heading", { name: hw })).toBeVisible();

  await page.goto("/admin/materials");
  await page.getByLabel("Batch and subject").selectOption({ label: "Standard 6 · Maths" });
  await page.getByLabel("Title").fill(mat);
  await page.getByLabel(/^Link/).fill("http://insecure.example.com");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByText("Enter a full link starting with https://")).toBeVisible();
  await page.getByLabel(/^Link/).fill("https://example.com/std6-notes");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("link", { name: mat })).toBeVisible();
  await logout(page);

  // Co-teacher can add materials.
  await login(page, "coteacher", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/staff$/);
  await page.goto("/staff/materials");
  await page.getByLabel("Batch and subject").selectOption({ label: "Standard 9 · Maths" });
  await page.getByLabel("Title").fill(coMat);
  await page.getByLabel(/^Link/).fill("https://example.com/std9-notes");
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page.getByRole("link", { name: coMat })).toBeVisible();
  await logout(page);

  // Std 6 student sees everything for std 6, and the material redirect works.
  await login(page, "9000000006", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: notice })).toBeVisible();
  await expect(page.getByRole("heading", { name: hw })).toBeVisible();
  await page.goto("/app/materials");
  const link = page.getByRole("link", { name: new RegExp(mat) });
  await expect(link).toBeVisible();
  await expect(page.getByText(coMat)).toHaveCount(0);
  const href = (await link.getAttribute("href"))!;
  const res = await page.request.get(href, { maxRedirects: 0 });
  expect(res.status()).toBe(302);
  expect(res.headers()["location"]).toBe("https://example.com/std6-notes");
  await logout(page);

  // Std 9 student sees the all-batch notice but not std 6 work, and the std 6 material 404s.
  await login(page, "9000000009", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  await expect(page.getByRole("heading", { name: notice })).toBeVisible();
  await expect(page.getByRole("heading", { name: hw })).toHaveCount(0);
  const denied = await page.request.get(href, { maxRedirects: 0 });
  expect(denied.status()).toBe(404);
  await logout(page);
});
