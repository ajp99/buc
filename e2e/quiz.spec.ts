import { expect, test } from "@playwright/test";
import { isoToIstInput } from "../lib/dates";
import { adminPassword, DEV_PASSWORD, login, logout } from "./helpers";

test("admin authors a quiz; std 6 student takes it once and sees graded results", async ({ page }) => {
  const title = `Fractions ${String(Date.now()).slice(-6)}`;
  const now = Date.now();

  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/quizzes");
  await page.getByLabel("Batch and subject").selectOption({ label: "Standard 6 · Maths" });
  await page.getByLabel("Title").fill(title);
  await page.getByLabel("Opens at").fill(isoToIstInput(new Date(now - 3600_000).toISOString()));
  await page.getByLabel("Closes at").fill(isoToIstInput(new Date(now + 86_400_000).toISOString()));
  await page.getByRole("button", { name: "Add" }).click();
  await expect(page).toHaveURL(/\/admin\/quizzes\/[0-9a-f-]{36}$/);
  const quizUrl = new URL(page.url()).pathname.replace("/admin", "/app");

  // Missing correct answer is rejected.
  await page.getByLabel("Question", { exact: true }).fill("1/2 + 1/2 = ?");
  for (const [i, v] of ["1", "2", "1/4", "0"].entries()) await page.getByLabel(`Option ${"ABCD"[i]}`, { exact: true }).fill(v);
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByText("Choose the correct answer.")).toBeVisible();
  await page.getByLabel("Correct answer: Option A").check();
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByRole("heading", { name: "1. 1/2 + 1/2 = ?" })).toBeVisible();

  await page.getByLabel("Question", { exact: true }).fill("Which is bigger?");
  for (const [i, v] of ["1/3", "1/2", "1/4", "1/5"].entries()) await page.getByLabel(`Option ${"ABCD"[i]}`, { exact: true }).fill(v);
  await page.getByLabel("Correct answer: Option B").check();
  await page.getByLabel("Marks").fill("2");
  await page.getByRole("button", { name: "Add question" }).click();
  await expect(page.getByRole("heading", { name: "2. Which is bigger?" })).toBeVisible();
  await logout(page);

  // Std 6 student: first question right, second wrong -> 1 / 3.
  await login(page, "9000000006", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  await page.goto("/app/quizzes");
  await page.getByRole("heading", { name: title }).locator("xpath=ancestor::*[@data-slot='card'][1]").getByRole("link", { name: "Start quiz" }).click();
  await expect(page).toHaveURL(quizUrl);
  await page.getByRole("radiogroup", { name: "1. 1/2 + 1/2 = ?" }).getByLabel("A. 1", { exact: true }).check();
  await page.getByRole("radiogroup", { name: "2. Which is bigger?" }).getByLabel("C. 1/4").check();
  await page.getByRole("button", { name: "Submit answers" }).click();
  await expect(page.getByText("Your score: 1 / 3")).toBeVisible();
  await expect(page.getByText("Correct answer: B. 1/2")).toBeVisible();

  // No second attempt: revisiting shows the result, not the form.
  await page.goto(quizUrl);
  await expect(page.getByText("Your score: 1 / 3")).toBeVisible();
  await expect(page.getByRole("button", { name: "Submit answers" })).toHaveCount(0);
  await logout(page);

  // Another batch can't open it.
  await login(page, "9000000009", DEV_PASSWORD);
  await expect(page).toHaveURL(/\/app$/);
  const res = await page.goto(quizUrl);
  expect(res?.status()).toBe(404);
  await page.goto("/app");
  await logout(page);

  // Admin sees the score in results.
  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto(quizUrl.replace("/app", "/admin"));
  await expect(page.getByRole("row", { name: /Asha Verma/ })).toContainText("1 / 3");
});
