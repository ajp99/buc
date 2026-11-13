import { Field } from "@/components/forms/action-form";
import { SubjectSelect } from "@/components/forms/subject-select";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { isoToIstInput } from "@/lib/dates";

type T = (key: string, vars?: Record<string, string | number>) => string;

export type QuizValues = {
  subject_id: string;
  title: string;
  description: string;
  opens_at: string;
  closes_at: string;
  show_answers_after_submit: boolean;
};

/** Quiz detail inputs, shared by the create and edit forms. */
export function QuizFields({ t, subjects, quiz }: { t: T; subjects: { id: string; label: string }[]; quiz?: QuizValues }) {
  return (
    <>
      <Field name="subject_id" label={t("content.batchSubject")}>
        <SubjectSelect options={subjects} defaultValue={quiz?.subject_id} />
      </Field>
      <Field name="title" label={t("content.title")}>
        <Input id="title" name="title" defaultValue={quiz?.title} required />
      </Field>
      <Field name="description" label={t("quiz.description")}>
        <Textarea id="description" name="description" rows={3} defaultValue={quiz?.description} />
      </Field>
      <div className="grid gap-4 sm:grid-cols-2">
        <Field name="opens_at" label={t("quiz.opensAt")}>
          <Input id="opens_at" name="opens_at" type="datetime-local" defaultValue={quiz && isoToIstInput(quiz.opens_at)} required />
        </Field>
        <Field name="closes_at" label={t("quiz.closesAt")}>
          <Input id="closes_at" name="closes_at" type="datetime-local" defaultValue={quiz && isoToIstInput(quiz.closes_at)} required />
        </Field>
      </div>
      <p className="-mt-2 text-sm text-muted-foreground">{t("quiz.timesIst")}</p>
      <label className="flex min-h-11 items-center gap-3">
        <input
          type="checkbox"
          name="show_answers_after_submit"
          defaultChecked={quiz?.show_answers_after_submit ?? true}
          className="size-5 accent-primary"
        />
        {t("quiz.showAnswers")}
      </label>
    </>
  );
}
