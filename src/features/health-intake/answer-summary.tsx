import { Button } from "@/components/ui/button";
import { fields, isVisible, steps, type IntakeAnswers } from "./contracts";
import { answerLabel, formatExaminationDate } from "./profile";

export function AnswerSummary({
  answers,
  onEdit,
}: {
  answers: IntakeAnswers;
  onEdit?: (step: number) => void;
}) {
  return (
    <div className="space-y-6">
      {steps.slice(0, -1).map((step, index) => (
        <section
          key={step.title}
          className="space-y-3 border-b pb-6 last:border-0"
        >
          <div className="flex flex-wrap items-center justify-between gap-3">
            <h3>{step.title}</h3>
            {onEdit && (
              <Button
                type="button"
                variant="outline"
                onClick={() => onEdit(index)}
              >
                Edit {step.title.toLowerCase()}
              </Button>
            )}
          </div>
          <dl className="space-y-4 text-sm">
            {fields
              .filter(
                (field) =>
                  step.fields.includes(field.id) &&
                  isVisible(field.id, answers),
              )
              .map((field) => (
                <div key={field.id}>
                  <dt className="text-muted-foreground">{field.label}</dt>
                  <dd className="mt-1 font-medium break-words">
                    {field.options?.find(
                      ([value]) => value === answers[field.id],
                    )?.[1] ??
                      (field.id === "examDate"
                        ? formatExaminationDate(answers[field.id])
                        : field.id === "examApproximateDate"
                          ? formatExaminationDate(null, answers[field.id])
                          : answerLabel(answers[field.id]))}
                  </dd>
                </div>
              ))}
          </dl>
        </section>
      ))}
    </div>
  );
}
