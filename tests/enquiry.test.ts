import { describe, expect, it } from "vitest";
import { enquirySchema, isLikelyBot } from "@/lib/validators/enquiry";
import { whatsappChatUrl } from "@/lib/whatsapp";

describe("enquirySchema", () => {
  it("normalizes phone and coerces standard", () => {
    expect(enquirySchema.parse({ name: " Meena ", phone: "+91 98765 43210", standard: "7", message: "" })).toEqual({
      name: "Meena",
      phone: "9876543210",
      standard: 7,
      message: "",
    });
  });
  it("rejects bad phone and standard", () => {
    const r = enquirySchema.safeParse({ name: "x", phone: "123", standard: "11" });
    expect(r.success).toBe(false);
    expect(r.error!.issues.map((i) => i.message).sort()).toEqual(["validation.phone", "validation.standard"]);
  });
});

describe("isLikelyBot", () => {
  const now = 1_000_000;
  it("flags a filled honeypot", () => {
    expect(isLikelyBot({ website: "http://spam", renderedAt: String(now - 10_000) }, now)).toBe(true);
  });
  it("flags forms submitted too fast or with a bad timestamp", () => {
    expect(isLikelyBot({ website: "", renderedAt: String(now - 500) }, now)).toBe(true);
    expect(isLikelyBot({ website: "", renderedAt: "abc" }, now)).toBe(true);
  });
  it("passes a normal submission", () => {
    expect(isLikelyBot({ website: "", renderedAt: String(now - 8_000) }, now)).toBe(false);
  });
});

describe("whatsappChatUrl", () => {
  it("opens a chat with an Indian number", () => {
    expect(whatsappChatUrl("9876543210")).toBe("https://wa.me/919876543210");
    expect(whatsappChatUrl("9876543210", "Hi")).toBe("https://wa.me/919876543210?text=Hi");
  });
});
