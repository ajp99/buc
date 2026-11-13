import { z } from "zod";
import { normalizePhone } from "@/lib/auth/identity";

const text = (max: number) =>
  z.string().trim().min(1, "validation.required").max(max, "validation.tooLong");

const phone = z
  .string()
  .transform((v, ctx) => {
    const normalized = normalizePhone(v);
    if (!normalized) {
      ctx.addIssue({ code: "custom", message: "validation.phone" });
      return z.NEVER;
    }
    return normalized;
  });

const uuid = z.uuid("validation.required");

export const batchSchema = z.object({
  name: text(60),
  standard: z.coerce.number("validation.standard").int().min(5, "validation.standard").max(10, "validation.standard"),
});

export const subjectSchema = z.object({
  batch_id: uuid,
  name: text(60),
});

const studentFields = {
  full_name: text(100),
  parent_phone: phone,
  batch_id: uuid,
  monthly_fee: z.coerce.number("validation.amount").min(0, "validation.amount").max(1_000_000, "validation.amount"),
};

export const passwordSchema = z.string().min(8, "validation.password").max(72, "validation.password");

export const studentCreateSchema = z.object({
  ...studentFields,
  phone,
  password: passwordSchema,
});

export const studentUpdateSchema = z.object({
  ...studentFields,
  is_active: z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean()),
});
