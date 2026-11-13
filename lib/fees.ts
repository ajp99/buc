import type { Lang } from "./i18n";
import { todayIST } from "./dates";

const MONTH_RE = /^\d{4}-(0[1-9]|1[0-2])$/;

export function isMonth(value: unknown): value is string {
  return typeof value === "string" && MONTH_RE.test(value);
}

export function currentMonthIST(now = new Date()): string {
  return todayIST(now).slice(0, 7);
}

export function shiftMonth(month: string, delta: number): string {
  const [y, m] = month.split("-").map(Number);
  const d = new Date(Date.UTC(y, m - 1 + delta, 1));
  return d.toISOString().slice(0, 7);
}

/** "November 2026" / "नवंबर 2026". */
export function formatMonth(month: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(new Date(`${month}-01T00:00:00Z`));
}

/** Rupees with Indian digit grouping; paise only when non-zero. */
export function formatINR(amount: number | string, lang: Lang): string {
  const value = Number(amount);
  return new Intl.NumberFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    style: "currency",
    currency: "INR",
    minimumFractionDigits: Number.isInteger(value) ? 0 : 2,
    maximumFractionDigits: 2,
  }).format(value);
}
