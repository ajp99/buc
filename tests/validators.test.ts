import { describe, expect, it } from "vitest";
import { batchSchema, studentCreateSchema, studentUpdateSchema, subjectSchema } from "@/lib/validators/admin";
import { fromZod } from "@/lib/actions/result";

describe("batchSchema", () => {
  it("accepts standards 5-10 and coerces form strings", () => {
    expect(batchSchema.parse({ name: " Std 6 ", standard: "6" })).toEqual({ name: "Std 6", standard: 6 });
  });
  it("rejects standards outside 5-10", () => {
    expect(batchSchema.safeParse({ name: "x", standard: "4" }).success).toBe(false);
    expect(batchSchema.safeParse({ name: "x", standard: "11" }).success).toBe(false);
  });
});

describe("subjectSchema", () => {
  it("requires a batch and name", () => {
    expect(subjectSchema.safeParse({ batch_id: "", name: "Maths" }).success).toBe(false);
  });
});

describe("studentCreateSchema", () => {
  const valid = {
    full_name: "Asha",
    phone: "+91 98765 43210",
    parent_phone: "98765 43211",
    batch_id: "6b2b6d4e-7c1f-4d65-9a3e-1b2c3d4e5f60",
    monthly_fee: "800",
    password: "secret123",
  };

  it("normalizes phones and coerces the fee", () => {
    const parsed = studentCreateSchema.parse(valid);
    expect(parsed.phone).toBe("9876543210");
    expect(parsed.parent_phone).toBe("9876543211");
    expect(parsed.monthly_fee).toBe(800);
  });

  it("maps errors to i18n keys per field", () => {
    const result = studentCreateSchema.safeParse({ ...valid, phone: "123", password: "short" });
    expect(result.success).toBe(false);
    const state = fromZod(result.error!);
    expect(state.fieldErrors).toEqual({ phone: "validation.phone", password: "validation.password" });
  });
});

describe("studentUpdateSchema", () => {
  it("reads the is_active checkbox", () => {
    const base = { full_name: "A", parent_phone: "9876543210", batch_id: "6b2b6d4e-7c1f-4d65-9a3e-1b2c3d4e5f60", monthly_fee: "0" };
    expect(studentUpdateSchema.parse({ ...base, is_active: "on" }).is_active).toBe(true);
    expect(studentUpdateSchema.parse(base).is_active).toBe(false);
  });
});
