export type QuizStatus = "upcoming" | "open" | "submitted" | "missed";

export function quizStatus(
  quiz: { opens_at: string; closes_at: string },
  attempted: boolean,
  now = new Date(),
): QuizStatus {
  if (attempted) return "submitted";
  const t = now.getTime();
  if (t < Date.parse(quiz.opens_at)) return "upcoming";
  if (t > Date.parse(quiz.closes_at)) return "missed";
  return "open";
}
