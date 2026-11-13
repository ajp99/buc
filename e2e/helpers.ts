import { expect, type Page } from "@playwright/test";
import { readFileSync } from "node:fs";

export const DEV_PASSWORD = "devpass1234";

export function adminPassword(): string {
  const line = readFileSync(".env.local", "utf8").split(/\r?\n/).find((l) => l.startsWith("SEED_ADMIN_PASSWORD="));
  if (!line) throw new Error("SEED_ADMIN_PASSWORD missing from .env.local");
  return line.slice("SEED_ADMIN_PASSWORD=".length);
}

export async function login(page: Page, identifier: string, password: string, path = "/login") {
  await page.goto(path);
  await page.getByLabel(/Phone number or username|फ़ोन नंबर या यूज़रनेम/).fill(identifier);
  await page.getByLabel(/^(Password|पासवर्ड)$/).fill(password);
  await page.getByRole("button", { name: /^(Sign in|साइन इन करें)$/ }).click();
}

export async function logout(page: Page) {
  await page.getByRole("button", { name: /Sign out|साइन आउट/ }).first().click();
  await expect(page).toHaveURL(/\/login/);
}
