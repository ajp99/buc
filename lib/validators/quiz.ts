import { z } from "zod";
import { istInputToIso } from "@/lib/dates";

const text = (max: number) =>
  z.string().trim().min(1, "validation.required").max(max, "validation.tooLong");

const istDateTime = z.string().transform((v, ctx) => {
  const iso = istInputToIso(v);
  if (!iso) {
    ctx.addIssue({ code: "custom", message: "validation.dateTime" });
    return z.NEVER;
  }
  return iso;
});

const checkbox = z.preprocess((v) => v === "on" || v === "true" || v === true, z.boolean());

export const quizSchema = z
  .object({
    subject_id: z.uuid("validation.required"),
    title: text(150),
    description: z.string().trim().max(2000, "validation.tooLong").default(""),
    opens_at: istDateTime,
    closes_at: istDateTime,
    show_answers_after_submit: checkbox,
  })
  .refine((q) => q.closes_at > q.opens_at, { path: ["closes_at"], message: "validation.closeAfterOpen" });

const option = text(300);

export const questionSchema = z
  .object({
    question_text: text(1000),
    option_0: option,
    option_1: option,
    option_2: option,
    option_3: option,
    correct_option: z.coerce.number("validation.correctOption").int().min(0, "validation.correctOption").max(3, "validation.correctOption"),
    marks: z.coerce.number("validation.marks").int("validation.marks").min(1, "validation.marks").max(100, "validation.marks"),
  })
  .transform(({ option_0, option_1, option_2, option_3, ...rest }) => ({
    question_text: rest.question_text,
    options: [option_0, option_1, option_2, option_3],
    correct_option: rest.correct_option,
    marks: rest.marks,
  }));
