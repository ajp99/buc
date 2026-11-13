"use client";

import { useState, useTransition } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useT } from "@/components/i18n-provider";
import { submitQuiz } from "@/lib/actions/quiz";
import { cn } from "@/lib/utils";

export type TakerQuestion = { id: string; question_text: string; options: string[]; marks: number };

export function QuizTaker({ quizId, questions }: { quizId: string; questions: TakerQuestion[] }) {
  const t = useT();
  const [answers, setAnswers] = useState<Record<string, number>>({});
  const [error, setError] = useState<string>();
  const [pending, startTransition] = useTransition();
  const answered = Object.keys(answers).length;

  function onSubmit(event: React.FormEvent) {
    event.preventDefault();
    const unanswered = questions.length - answered;
    if (unanswered > 0 && !window.confirm(t("quiz.confirmUnanswered", { count: unanswered }))) return;
    startTransition(async () => {
      const result = await submitQuiz(quizId, answers);
      setError(result?.error);
    });
  }

  return (
    <form onSubmit={onSubmit} className="grid gap-4">
      <Alert>
        <AlertDescription>{t("quiz.oneAttempt")}</AlertDescription>
      </Alert>
      {questions.map((q, i) => (
        <Card key={q.id}>
          <CardHeader>
            <CardTitle id={`q-${q.id}`}>{`${i + 1}. ${q.question_text}`}</CardTitle>
            <p className="text-sm text-muted-foreground">{`${t("quiz.marks")}: ${q.marks}`}</p>
          </CardHeader>
          <CardContent>
            <div role="radiogroup" aria-labelledby={`q-${q.id}`} className="grid gap-2">
              {q.options.map((opt, idx) => {
                const checked = answers[q.id] === idx;
                return (
                  <label
                    key={idx}
                    className={cn(
                      "flex min-h-12 cursor-pointer items-center gap-3 rounded-lg border px-3 py-2",
                      checked ? "border-primary bg-accent" : "hover:bg-muted",
                    )}
                  >
                    <input
                      type="radio"
                      name={q.id}
                      value={idx}
                      checked={checked}
                      onChange={() => setAnswers((a) => ({ ...a, [q.id]: idx }))}
                      className="size-5 shrink-0 accent-primary"
                    />
                    <span>{`${String.fromCharCode(65 + idx)}. ${opt}`}</span>
                  </label>
                );
              })}
            </div>
          </CardContent>
        </Card>
      ))}
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{t(error)}</AlertDescription>
        </Alert>
      )}
      <div className="sticky bottom-16 z-10 flex flex-wrap items-center justify-between gap-3 rounded-xl border bg-background p-3 shadow-sm md:bottom-4">
        <span className="text-sm">{t("quiz.answered", { answered, total: questions.length })}</span>
        <Button type="submit" disabled={pending}>
          {pending ? t("quiz.submitting") : t("quiz.submit")}
        </Button>
      </div>
    </form>
  );
}
