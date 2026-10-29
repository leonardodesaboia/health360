"use client";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import { useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Button } from "@/components/ui/button";
import { Notice, Surface } from "@/components/shared/primitives";
import {
  fields,
  initialAnswers,
  intakeSchema,
  isVisible,
  steps,
  type IntakeAnswers,
} from "./contracts";
import { createDraftRepository } from "./repository";
import { startIntakeAction, submitIntakeAction } from "./actions";
import { IntakeField } from "./intake-field";
import { AnswerSummary } from "./answer-summary";

export const localPatientId = "demo-patient-01";
export function IntakeForm({
  scope = localPatientId,
  prefill,
}: {
  scope?: string;
  prefill?: IntakeAnswers;
}) {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [confirmationError, setConfirmationError] = useState(false);
  const [completed, setCompleted] = useState(false);
  const [hasDraft, setHasDraft] = useState(false);
  const [confirming, setConfirming] = useState(false);
  const revision = useRef(0),
    profileVersion = useRef(0);
  const submissionId = useRef<string | null>(null);
  const intakeStarted = useRef(false);
  const heading = useRef<HTMLHeadingElement>(null);
  const {
    control,
    getValues,
    reset,
    trigger,
    formState: { errors },
  } = useForm<IntakeAnswers>({
    resolver: zodResolver(intakeSchema),
    defaultValues: initialAnswers,
  });
  const answers = useWatch({ control, defaultValue: initialAnswers });
  const restore = useCallback(async () => {
    try {
      const repo = createDraftRepository(window.localStorage);
      const [draft, latest] = await Promise.all([
        repo.load(scope),
        repo.latest(scope),
      ]);
      reset(draft?.answers ?? prefill ?? initialAnswers);
      setHasDraft(Boolean(draft));
      revision.current = draft?.revision ?? 0;
      profileVersion.current = latest?.profile.version ?? 0;
      submissionId.current = null;
      setConfirmed(false);
      setCompleted(false);
      setStep(draft?.step ?? 0);
      setStatus(
        draft
          ? "Your draft is saved in this browser. Confirm your answers to save a profile for this demo case."
          : "Answer with the synthetic scenario. Choose I don't know when unsure.",
      );
      setError("");
      setReady(true);
    } catch {
      setError(
        "The saved draft could not be loaded. Browser storage may be unavailable or contain an incompatible draft. Your stored data has not been replaced.",
      );
    } finally {
      setBusy(false);
    }
  }, [reset, scope, prefill]);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void restore();
    });
    return () => {
      active = false;
    };
  }, [restore]);
  async function save(target = step) {
    setBusy(true);
    try {
      const saved = await createDraftRepository(window.localStorage).save(
        scope,
        getValues(),
        target,
        revision.current,
      );
      revision.current = saved.revision;
      setHasDraft(true);
      setStatus("Draft saved in this browser only.");
      setError("");
      if (!intakeStarted.current) {
        // Administrative start transition; never blocks local drafting. A failed
        // start is retried on the next save, and submit stays fail-closed.
        intakeStarted.current = true;
        void startIntakeAction().catch(() => {
          intakeStarted.current = false;
        });
      }
      setStep(target);
      if (target !== step) {
        setConfirmed(false);
        requestAnimationFrame(() => heading.current?.focus());
      }
      return true;
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.includes("newer draft")
          ? cause.message
          : "Draft could not be saved. Keep this page open and retry. Browser storage may be unavailable.",
      );
      return false;
    } finally {
      setBusy(false);
    }
  }
  async function submit() {
    if (!confirmed) {
      setConfirmationError(true);
      document.getElementById("confirm-intake")?.focus();
      return;
    }
    if (!(await trigger(undefined, { shouldFocus: true }))) {
      const result = intakeSchema.safeParse(getValues());
      if (!result.success) {
        const field = result.error.issues[0]?.path[0];
        const target = steps.findIndex((item) =>
          item.fields.some((id) => id === field),
        );
        if (target >= 0) {
          setStep(target);
          requestAnimationFrame(() =>
            document.getElementById(String(field))?.focus(),
          );
        }
      }
      return;
    }
    setBusy(true);
    setConfirming(true);
    try {
      const repo = createDraftRepository(window.localStorage);
      submissionId.current ??= crypto.randomUUID();
      // With a demo session this persists to its dataset and redirects to analysis.
      await startIntakeAction();
      const persisted = await submitIntakeAction(
        getValues(),
        submissionId.current,
      );
      if (persisted?.status !== "NO_SESSION") {
        if (persisted?.status === "STALE")
          setError(
            "This intake was already submitted or changed elsewhere. Reload the page to see the latest status.",
          );
        return;
      }
      const result = await repo.submit(scope, {
        answers: getValues(),
        expectedRevision: revision.current,
        expectedProfileVersion: profileVersion.current,
        submissionId: submissionId.current,
      });
      revision.current = (await repo.load(scope))?.revision ?? revision.current;
      profileVersion.current = result.profile.version;
      setCompleted(true);
      setError("");
      setStatus(
        `Profile version ${result.profile.version} saved ${
          scope === localPatientId ? "in this browser" : "to this demo case"
        }.`,
      );
    } catch (cause) {
      setError(
        cause instanceof Error && cause.message.includes("newer")
          ? cause.message
          : "Intake could not be confirmed. Your previous profile remains unchanged. Retry or reload the saved draft.",
      );
    } finally {
      setConfirming(false);
      setBusy(false);
    }
  }
  return (
    <>
      <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED">
        Use synthetic answers only. Drafts stay in this browser. With a selected
        demo case, confirmed answers are saved to its demonstration dataset.
        Unknown information is not a negative answer.
      </Notice>
      {error && (
        <div role="alert" className="space-y-3 text-sm text-destructive">
          <p>{error}</p>
          <Button
            variant="outline"
            onClick={() => void restore()}
            disabled={busy}
          >
            Reload saved draft
          </Button>
        </div>
      )}
      {!ready ? (
        <p role="status">
          {busy
            ? "Loading draft..."
            : "Restore storage access, then reload the saved draft to continue."}
        </p>
      ) : completed ? (
        <Surface>
          <h2>Intake confirmed</h2>
          <p role="status" className="mt-3">
            {status}
          </p>
          <p className="mt-3 text-sm text-muted-foreground">
            The profile records your synthetic answers. It does not indicate
            analysis or medical review.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button asChild>
              <Link href="/patient/profile">View clinical profile</Link>
            </Button>
            <Button
              variant="outline"
              onClick={() => {
                setCompleted(false);
                setConfirmed(false);
                submissionId.current = null;
                setStep(0);
              }}
            >
              Edit intake answers
            </Button>
          </div>
        </Surface>
      ) : (
        <form
          noValidate
          aria-labelledby="intake-next-step"
          aria-describedby="intake-next-step-description"
          aria-busy={busy}
          onChange={() => {
            setStatus("Unsaved changes. Save this draft before leaving.");
            setConfirmed(false);
            submissionId.current = null;
          }}
          onSubmit={async (event) => {
            event.preventDefault();
            if (step === steps.length - 1) await submit();
            else if (await trigger(steps[step].fields, { shouldFocus: true }))
              await save(step + 1);
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <h2 id="intake-next-step" className="sr-only">
              What happens next
            </h2>
            <p
              id="intake-next-step-description"
              className="text-sm text-muted-foreground"
            >
              {hasDraft
                ? "Your draft is saved in this browser. Confirm your answers to save a profile for this demo case."
                : "Answer questions about this synthetic case. You can choose ‘I don't know’ when unsure."}
            </p>
            <p className="text-sm font-medium">Next: You</p>
          </div>
          <fieldset disabled={busy} className="space-y-6">
            <div className="space-y-2">
              <p className="text-sm text-muted-foreground">
                Step {step + 1} of {steps.length}
              </p>
              <div
                role="progressbar"
                aria-label="Intake questions"
                aria-valuemin={1}
                aria-valuemax={steps.length}
                aria-valuenow={step + 1}
                className="h-2 w-full overflow-hidden rounded-sm bg-muted"
              >
                <div
                  className="h-full bg-primary transition-[width]"
                  style={{ width: `${((step + 1) / steps.length) * 100}%` }}
                />
              </div>
            </div>
            <Surface>
              <h2 ref={heading} tabIndex={-1}>
                {steps[step].title}
              </h2>
              <div className="mt-6 space-y-6">
                {step === steps.length - 1 ? (
                  <>
                    <p className="text-sm text-muted-foreground">
                      Patient-reported answers. Confirm only the synthetic
                      scenario; unknown facts remain unknown.
                    </p>
                    <AnswerSummary
                      answers={getValues()}
                      onEdit={(target) => void save(target)}
                    />
                    <label className="flex min-h-11 items-center gap-3 text-sm">
                      <input
                        id="confirm-intake"
                        type="checkbox"
                        checked={confirmed}
                        onChange={(event) => {
                          event.stopPropagation();
                          setConfirmed(event.target.checked);
                          setConfirmationError(false);
                        }}
                        aria-invalid={confirmationError}
                        aria-describedby={
                          confirmationError ? "confirm-error" : undefined
                        }
                        className="size-5 shrink-0 accent-primary"
                      />
                      I confirm these synthetic answers and want to save my
                      profile.
                    </label>
                    {confirmationError && (
                      <p
                        id="confirm-error"
                        role="alert"
                        className="text-sm text-destructive"
                      >
                        Confirm your answers before saving the profile.
                      </p>
                    )}
                  </>
                ) : (
                  fields
                    .filter(
                      (field) =>
                        steps[step].fields.includes(field.id) &&
                        isVisible(field.id, answers),
                    )
                    .map((field) => (
                      <IntakeField
                        key={field.id}
                        definition={field}
                        control={control}
                        error={errors[field.id]}
                      />
                    ))
                )}
              </div>
            </Surface>
            <div className="flex flex-wrap gap-3">
              {step > 0 && (
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => void save(step - 1)}
                  disabled={busy}
                >
                  Back
                </Button>
              )}
              <Button type="submit" disabled={busy}>
                {step === steps.length - 1
                  ? "Confirm and save profile"
                  : "Save and continue"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => void save()}
                disabled={busy}
              >
                Save draft
              </Button>
              <Button variant="ghost" asChild>
                <Link href="/patient/profile">View saved profile</Link>
              </Button>
            </div>
            <p role="status" className="text-sm text-muted-foreground">
              {busy
                ? confirming
                  ? "Saving your confirmed information…"
                  : "Saving draft in this browser…"
                : status}
            </p>
          </fieldset>
        </form>
      )}
    </>
  );
}
