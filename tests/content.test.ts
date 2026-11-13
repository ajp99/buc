import { describe, expect, it } from "vitest";
import { addDays, formatDate, isOverdue, todayIST } from "@/lib/dates";
import { whatsappShareUrl } from "@/lib/whatsapp";
import { announcementSchema, homeworkSchema, materialSchema } from "@/lib/validators/content";

const SUBJECT = "6b2b6d4e-7c1f-4d65-9a3e-1b2c3d4e5f60";

describe("whatsappShareUrl", () => {
  it("encodes the text into a wa.me link", () => {
    expect(whatsappShareUrl("Test on Monday & Tuesday\nBring notes")).toBe(
      "https://wa.me/?text=Test%20on%20Monday%20%26%20Tuesday%0ABring%20notes",
    );
  });
});

describe("dates", () => {
  it("uses the India date, not UTC", () => {
    // 20:00 UTC on 13 Nov is 01:30 IST on 14 Nov.
    expect(todayIST(new Date("2026-11-13T20:00:00Z"))).toBe("2026-11-14");
  });
  it("adds days across month ends", () => {
    expect(addDays("2026-11-28", 5)).toBe("2026-12-03");
  });
  it("flags past due dates as overdue", () => {
    expect(isOverdue("2026-11-13", "2026-11-14")).toBe(true);
    expect(isOverdue("2026-11-14", "2026-11-14")).toBe(false);
  });
  it("formats in English and Hindi", () => {
    expect(formatDate("2026-11-14", "en")).toBe("Sat, 14 Nov");
    expect(formatDate("2026-11-14", "hi")).toContain("नव॰");
  });
});

describe("content validators", () => {
  it("treats an empty target batch as all batches", () => {
    expect(announcementSchema.parse({ title: "Holiday", body: "No class", target_batch_id: "" }).target_batch_id).toBeNull();
  });
  it("requires a valid due date", () => {
    expect(homeworkSchema.safeParse({ subject_id: SUBJECT, title: "Ex 1", description: "", due_date: "14/11/2026" }).success).toBe(false);
    expect(homeworkSchema.parse({ subject_id: SUBJECT, title: "Ex 1", due_date: "2026-11-14" }).description).toBe("");
  });
  it("only accepts https material links", () => {
    const base = { subject_id: SUBJECT, title: "Notes", type: "pdf" };
    expect(materialSchema.safeParse({ ...base, url: "https://drive.google.com/file/d/abc/view" }).success).toBe(true);
    expect(materialSchema.safeParse({ ...base, url: "http://example.com" }).success).toBe(false);
    expect(materialSchema.safeParse({ ...base, url: "javascript:alert(1)" }).success).toBe(false);
    expect(materialSchema.safeParse({ ...base, type: "video", url: "https://x.com" }).success).toBe(false);
  });
});
