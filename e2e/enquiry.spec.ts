import { expect, test } from "@playwright/test";
import { adminPassword, login } from "./helpers";

test("visitor enquiry reaches the admin inbox; bot submissions don't", async ({ page }) => {
  const tag = String(Date.now()).slice(-6);
  const name = `Parent ${tag}`;
  const botName = `Bot ${tag}`;

  // Landing page links to the form.
  await page.goto("/");
  await page.getByRole("link", { name: "Admission enquiry" }).click();
  await expect(page).toHaveURL(/\/enquiry$/);

  await page.getByLabel("Parent or student name").fill(name);
  await page.getByLabel("Mobile number").fill("12345");
  await page.getByLabel("Standard", { exact: true }).selectOption({ label: "Standard 7" });
  await page.waitForTimeout(2100); // the form rejects submissions made within 2s of loading
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Enter a valid 10-digit mobile number.")).toBeVisible();
  await page.getByLabel("Mobile number").fill("98765 43210");
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Thank you! We'll call you soon.")).toBeVisible();

  // A bot that fills the hidden honeypot sees "success" but nothing is stored.
  await page.goto("/enquiry");
  await page.getByLabel("Parent or student name").fill(botName);
  await page.getByLabel("Mobile number").fill("9876543210");
  await page.getByLabel("Standard", { exact: true }).selectOption({ label: "Standard 8" });
  await page.locator('input[name="website"]').fill("http://spam.example");
  await page.waitForTimeout(2100);
  await page.getByRole("button", { name: "Send enquiry" }).click();
  await expect(page.getByText("Thank you! We'll call you soon.")).toBeVisible();

  await login(page, "admin", adminPassword());
  await expect(page).toHaveURL(/\/admin$/);
  await page.goto("/admin/enquiries");
  const card = page.locator("[data-slot='card']", { has: page.getByRole("heading", { name }) });
  await expect(card).toContainText("Standard 7");
  await expect(page.getByRole("heading", { name: botName })).toHaveCount(0);
  await expect(card.getByRole("link", { name: "WhatsApp" })).toHaveAttribute("href", /^https:\/\/wa\.me\/919876543210\?text=/);

  await card.getByRole("button", { name: "Mark Contacted" }).click();
  await expect(page.getByRole("heading", { name })).toHaveCount(0);
  await page.goto("/admin/enquiries?status=contacted");
  await expect(page.getByRole("heading", { name })).toBeVisible();
});
