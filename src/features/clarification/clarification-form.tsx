"use client";
import Link from "next/link";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { useFormStatus } from "react-dom";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { IntakeField } from "@/features/health-intake/intake-field";
import {
  intakeSchema,
  type IntakeAnswers,
} from "@/features/health-intake/contracts";
import type { ClarificationQuestion } from "./questions";
import type { FreeClarificationQuestion } from "./physician-questions";
import type {
  ClarificationRequest,
  ClarificationActionResult,
} from "./contracts";

export function ContinueAnalysisButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Preparing analysis..." : "Continue saved analysis"}
    </Button>
  );
}

export function ClarificationForm({
  profileVersion,
  analysisId,
  answers,
  questions,
  freeQuestions = [],
  reviewId,
  reviewVersion,
  submitAction,
}: {
  profileVersion: number;
  analysisId: string;
  answers: IntakeAnswers;
  questions: ClarificationQuestion[];
  freeQuestions?: FreeClarificationQuestion[];
  reviewId?: string;
  reviewVersion?: number;
  submitAction: (
    request: ClarificationRequest,
  ) => Promise<ClarificationActionResult>;
}) {
  const router = useRouter();
  const {
    control,
    getValues,
    trigger,
    formState: { errors },
  } = useForm<IntakeAnswers>({
    resolver: zodResolver(intakeSchema),
    defaultValues: answers,
  });
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [freeAnswers, setFreeAnswers] = useState<Record<string, string | null>>(
    () => Object.fromEntries(freeQuestions.map((q) => [q.id, null])),
  );
  return (
    <form
      noValidate
      className="space-y-6 break-words"
      onSubmit={async (event) => {
        event.preventDefault();
        if (
          !(await trigger(
            questions.map((q) => q.id),
            { shouldFocus: true },
          ))
        )
          return;
        setBusy(true);
        setError("");
        try {
          if (
            Object.values(freeAnswers).some(
              (value) => value !== null && !value.trim(),
            )
          ) {
            setError("Enter your answer or choose I don't know.");
            const firstEmpty = freeQuestions.find(
              (question) =>
                freeAnswers[question.id] !== null &&
                !freeAnswers[question.id]?.trim(),
            );
            if (firstEmpty) document.getElementById(firstEmpty.id)?.focus();
            return;
          }
          const values = getValues();
          const result = await submitAction({
            profileVersion,
            analysisId,
            ...(reviewId ? { reviewId, reviewVersion } : {}),
            freeAnswers,
            answers: Object.fromEntries(
              questions.map((q) => [q.id, values[q.id]]),
            ),
          });
          setError(
            result.status === "STALE"
              ? "Your evaluation changed. Reload the questions before answering again."
              : result.status === "INVALID"
                ? "Check your answers. Use I don't know for information you cannot confirm."
                : result.status === "NO_SESSION"
                  ? "Select a demo case before answering these questions."
                  : "Your answers could not be processed. Check the analysis status before retrying.",
          );
        } catch {
          setError(
            "Your answers could not be processed. Check the analysis status before retrying.",
          );
        } finally {
          setBusy(false);
        }
      }}
    >
      <p className="text-sm text-muted-foreground">
        These questions cover missing patient-reported information only. Choose
        I don&apos;t know whenever you cannot confirm an answer. Saved answers
        create a new profile version and another preliminary analysis.
      </p>
      <fieldset disabled={busy} className="space-y-6">
        <legend className="sr-only">Missing information</legend>
        {questions.map((question) => (
          <IntakeField
            key={question.id}
            definition={question}
            control={control}
            error={errors[question.id]}
          />
        ))}
        {freeQuestions.map((question) => (
          <div key={question.id}>
            <label htmlFor={question.id} className="block text-sm font-medium">
              {question.label}
            </label>
            <textarea
              id={question.id}
              rows={3}
              maxLength={2000}
              disabled={freeAnswers[question.id] === null}
              value={freeAnswers[question.id] ?? ""}
              onChange={(event) =>
                setFreeAnswers((current) => ({
                  ...current,
                  [question.id]: event.target.value,
                }))
              }
              aria-invalid={Boolean(
                error &&
                freeAnswers[question.id] !== null &&
                !freeAnswers[question.id]?.trim(),
              )}
              aria-describedby={`${question.id}-help${error ? " clarification-feedback" : ""}`}
              className="mt-2 min-h-28 w-full rounded-md border border-input bg-card px-3 py-2 text-base focus-visible:ring-2 focus-visible:ring-ring focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50"
            />
            <p
              id={`${question.id}-help`}
              className="mt-2 text-sm text-muted-foreground"
            >
              Answer this specific demo review question only. Your words stay
              patient-reported and are not inferred into clinical facts.
            </p>
            <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={freeAnswers[question.id] === null}
                onChange={(event) =>
                  setFreeAnswers((current) => ({
                    ...current,
                    [question.id]: event.target.checked ? null : "",
                  }))
                }
                className="size-5 shrink-0 accent-primary"
              />
              I don&apos;t know — {question.label}
            </label>
          </div>
        ))}
        {error && (
          <p
            id="clarification-feedback"
            role="alert"
            className="text-sm text-destructive"
          >
            {error}
          </p>
        )}
        <div className="flex flex-wrap gap-3">
          <Button type="submit">
            {busy
              ? "Saving answers and preparing analysis..."
              : "Save answers and analyze again"}
          </Button>
          <Button
            type="button"
            variant="outline"
            onClick={() => router.refresh()}
          >
            Reload questions
          </Button>
          <Button asChild variant="ghost">
            <Link href="/patient/analysis">View analysis status</Link>
          </Button>
        </div>
      </fieldset>
      {busy && (
        <p role="status" className="text-sm text-muted-foreground">
          Your earlier profile and plan remain preserved while these answers are
          processed.
        </p>
      )}
    </form>
  );
}
