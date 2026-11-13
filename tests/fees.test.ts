import { describe, expect, it } from "vitest";
import { currentMonthIST, formatINR, formatMonth, isMonth, shiftMonth } from "@/lib/fees";

describe("fee month helpers", () => {
  it("uses the India month", () => {
    // 31 Oct 20:00 UTC is already 1 Nov in India.
    expect(currentMonthIST(new Date("2026-10-31T20:00:00Z"))).toBe("2026-11");
  });
  it("shifts across years", () => {
    expect(shiftMonth("2026-12", 1)).toBe("2027-01");
    expect(shiftMonth("2026-01", -1)).toBe("2025-12");
  });
  it("validates YYYY-MM", () => {
    expect(isMonth("2026-11")).toBe(true);
    expect(isMonth("2026-13")).toBe(false);
    expect(isMonth("../etc")).toBe(false);
  });
  it("formats month names in both languages", () => {
    expect(formatMonth("2026-11", "en")).toBe("November 2026");
    expect(formatMonth("2026-11", "hi")).toBe("नवंबर 2026");
  });
});

describe("formatINR", () => {
  it("uses Indian grouping and drops zero paise", () => {
    expect(formatINR(125000, "en")).toBe("₹1,25,000");
    expect(formatINR("800.00", "en")).toBe("₹800");
    expect(formatINR(800.5, "en")).toBe("₹800.50");
  });
});
