import type { Lang } from "./i18n";

// Dates are handled as "YYYY-MM-DD" strings in India time; the class runs on IST.
const TZ = "Asia/Kolkata";

export function todayIST(now = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", { timeZone: TZ }).format(now);
}

export function addDays(date: string, days: number): string {
  const d = new Date(`${date}T00:00:00Z`);
  d.setUTCDate(d.getUTCDate() + days);
  return d.toISOString().slice(0, 10);
}

export function isOverdue(dueDate: string, today = todayIST()): boolean {
  return dueDate < today;
}

/** "Sat, 14 Nov" / Hindi equivalent, for a YYYY-MM-DD date. */
export function formatDate(date: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    weekday: "short",
    day: "numeric",
    month: "short",
    timeZone: "UTC",
  }).format(new Date(`${date}T00:00:00Z`));
}

/** Date and time for a timestamp, in IST. */
export function formatDateTime(iso: string, lang: Lang): string {
  return new Intl.DateTimeFormat(lang === "hi" ? "hi-IN" : "en-IN", {
    day: "numeric",
    month: "short",
    hour: "numeric",
    minute: "2-digit",
    timeZone: TZ,
  }).format(new Date(iso));
}

const IST_OFFSET_MS = 330 * 60 * 1000;

/** A <input type="datetime-local"> value, read as India time, to an ISO timestamp. */
export function istInputToIso(value: string): string | null {
  if (!/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/.test(value)) return null;
  const ms = Date.parse(`${value}:00Z`);
  return Number.isNaN(ms) ? null : new Date(ms - IST_OFFSET_MS).toISOString();
}

/** An ISO timestamp to a datetime-local value in India time. */
export function isoToIstInput(iso: string): string {
  return new Date(Date.parse(iso) + IST_OFFSET_MS).toISOString().slice(0, 16);
}
