import { z } from "zod";

const text = (max: number) =>
  z.string().trim().min(1, "validation.required").max(max, "validation.tooLong");

const subjectId = z.uuid("validation.required");

export const announcementSchema = z.object({
  title: text(150),
  body: text(4000),
  // Empty select value means "All batches".
  target_batch_id: z.preprocess((v) => (v === "" || v == null ? null : v), z.uuid("validation.invalid").nullable()),
});

export const homeworkSchema = z.object({
  subject_id: subjectId,
  title: text(150),
  description: z.string().trim().max(4000, "validation.tooLong").default(""),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, "validation.date"),
});

export const materialSchema = z.object({
  subject_id: subjectId,
  title: text(150),
  type: z.enum(["pdf", "image", "link"], "validation.invalid"),
  url: z.url({ protocol: /^https$/, error: "validation.url" }).max(2000, "validation.tooLong"),
});
