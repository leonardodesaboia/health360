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
  submitAction,
}: {
  profileVersion: number;
  analysisId: string;
  answers: IntakeAnswers;
  questions: ClarificationQuestion[];
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
  return (
    <form
      noValidate
      className="space-y-6"
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
          const values = getValues();
          const result = await submitAction({
            profileVersion,
            analysisId,
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
        {error && (
          <p role="alert" className="text-sm text-destructive">
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
