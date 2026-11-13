import { describe, expect, it } from "vitest";
import { loginEmail, normalizePhone, staffEmail, studentEmail } from "@/lib/auth/identity";

describe("normalizePhone", () => {
  it.each([
    ["9876543210", "9876543210"],
    ["+91 98765 43210", "9876543210"],
    ["919876543210", "9876543210"],
    ["098765-43210", "9876543210"],
  ])("normalizes %s", (input, expected) => {
    expect(normalizePhone(input)).toBe(expected);
  });

  it.each(["12345", "1234567890", "abcdefghij", ""])("rejects %s", (input) => {
    expect(normalizePhone(input)).toBeNull();
  });
});

describe("synthetic emails", () => {
  it("maps students and staff to separate domains", () => {
    expect(studentEmail("9876543210")).toBe("9876543210@students.tuition.local");
    expect(staffEmail(" Admin ")).toBe("admin@tuition.local");
  });

  it("picks student or staff email from the login identifier", () => {
    expect(loginEmail("+91 98765 43210")).toBe("9876543210@students.tuition.local");
    expect(loginEmail("teacher")).toBe("teacher@tuition.local");
    expect(loginEmail("bad name!")).toBeNull();
  });
});
