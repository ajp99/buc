import { describe, expect, it } from "vitest";
import { isoToIstInput, istInputToIso } from "@/lib/dates";
import { quizStatus } from "@/lib/quiz";
import { questionSchema, quizSchema } from "@/lib/validators/quiz";

const SUBJECT = "6b2b6d4e-7c1f-4d65-9a3e-1b2c3d4e5f60";

describe("IST datetime-local conversion", () => {
  it("reads input values as India time", () => {
    expect(istInputToIso("2026-11-14T09:30")).toBe("2026-11-14T04:00:00.000Z");
  });
  it("round-trips back to an input value", () => {
    expect(isoToIstInput("2026-11-14T04:00:00.000Z")).toBe("2026-11-14T09:30");
    expect(isoToIstInput("2026-11-13T20:00:00+00:00")).toBe("2026-11-14T01:30");
  });
  it("rejects malformed input", () => {
    expect(istInputToIso("14/11/2026 09:30")).toBeNull();
  });
});

describe("quizSchema", () => {
  const base = { subject_id: SUBJECT, title: "Unit 1", opens_at: "2026-11-14T09:00", closes_at: "2026-11-15T21:00" };

  it("converts times to ISO and reads the checkbox", () => {
    const q = quizSchema.parse({ ...base, show_answers_after_submit: "on" });
    expect(q.opens_at).toBe("2026-11-14T03:30:00.000Z");
    expect(q.show_answers_after_submit).toBe(true);
    expect(quizSchema.parse(base).show_answers_after_submit).toBe(false);
  });

  it("requires closing after opening", () => {
    const r = quizSchema.safeParse({ ...base, closes_at: "2026-11-14T08:00" });
    expect(r.success).toBe(false);
    expect(r.error!.issues[0]).toMatchObject({ path: ["closes_at"], message: "validation.closeAfterOpen" });
  });
});

describe("questionSchema", () => {
  it("collects four options and coerces numbers", () => {
    const q = questionSchema.parse({
      question_text: "2 + 2 = ?", option_0: "3", option_1: "4", option_2: "5", option_3: "22", correct_option: "1", marks: "2",
    });
    expect(q).toEqual({ question_text: "2 + 2 = ?", options: ["3", "4", "5", "22"], correct_option: 1, marks: 2 });
  });
  it("requires every option and a valid answer", () => {
    expect(questionSchema.safeParse({ question_text: "x", option_0: "a", option_1: "", option_2: "c", option_3: "d", correct_option: "0", marks: "1" }).success).toBe(false);
    expect(questionSchema.safeParse({ question_text: "x", option_0: "a", option_1: "b", option_2: "c", option_3: "d", correct_option: "4", marks: "1" }).success).toBe(false);
  });
});

describe("quizStatus", () => {
  const quiz = { opens_at: "2026-11-14T03:30:00Z", closes_at: "2026-11-15T15:30:00Z" };
  it("covers every state", () => {
    expect(quizStatus(quiz, false, new Date("2026-11-14T00:00:00Z"))).toBe("upcoming");
    expect(quizStatus(quiz, false, new Date("2026-11-14T05:00:00Z"))).toBe("open");
    expect(quizStatus(quiz, true, new Date("2026-11-14T05:00:00Z"))).toBe("submitted");
    expect(quizStatus(quiz, false, new Date("2026-11-16T00:00:00Z"))).toBe("missed");
    expect(quizStatus(quiz, true, new Date("2026-11-16T00:00:00Z"))).toBe("submitted");
  });
});
