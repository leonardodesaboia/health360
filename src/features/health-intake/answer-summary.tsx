import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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
            <div className="flex items-center gap-2">
              <span className="rounded-sm bg-muted px-2 py-0.5 text-xs font-semibold text-muted-foreground tabular-nums">
                0{index + 1}
              </span>
              <h3>{step.title}</h3>
            </div>
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
          <dl className="grid gap-3 pt-1 text-sm sm:grid-cols-2">
            {fields
              .filter(
                (field) =>
                  step.fields.includes(field.id) &&
                  isVisible(field.id, answers),
              )
              .map((field) => {
                const rawValue = answers[field.id];
                const isUnknown = rawValue === null;
                const displayValue =
                  field.options?.find(([value]) => value === rawValue)?.[1] ??
                  (field.id === "examDate"
                    ? formatExaminationDate(rawValue)
                    : field.id === "examApproximateDate"
                      ? formatExaminationDate(null, rawValue)
                      : answerLabel(rawValue));
                return (
                  <div
                    key={field.id}
                    className="rounded-md border bg-background p-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <dt className="text-xs text-muted-foreground">
                        {field.label}
                      </dt>
                      <span
                        className={cn(
                          "shrink-0 rounded-sm px-1.5 py-0.5 text-[11px] font-medium",
                          isUnknown
                            ? "bg-warning text-warning-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {isUnknown ? "Unknown (null)" : "Patient-reported"}
                      </span>
                    </div>
                    <dd className="mt-1.5 font-semibold break-words tabular-nums">
                      {displayValue}
                    </dd>
                  </div>
                );
              })}
          </dl>
        </section>
      ))}
    </div>
  );
}
