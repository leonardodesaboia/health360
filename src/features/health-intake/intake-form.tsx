"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Input } from "@/components/ui/input";
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

const patientId = "demo-patient-01";
export function IntakeForm() {
  const [step, setStep] = useState(0);
  const [ready, setReady] = useState(false);
  const [busy, setBusy] = useState(true);
  const [error, setError] = useState("");
  const [status, setStatus] = useState("");
  const revision = useRef(0);
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
      const draft = await createDraftRepository(window.localStorage).load(
        patientId,
      );
      reset(draft?.answers ?? initialAnswers);
      revision.current = draft?.revision ?? 0;
      setStep(draft?.step ?? 0);
      setStatus(
        draft
          ? "Saved draft restored."
          : "Start with the synthetic scenario only.",
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
  }, [reset]);
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
        patientId,
        getValues(),
        target,
        revision.current,
      );
      revision.current = saved.revision;
      setStatus("Draft saved in this browser only.");
      setError("");
      setStep(target);
      if (target !== step)
        requestAnimationFrame(() => heading.current?.focus());
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
  return (
    <>
      <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED">
        Use synthetic answers only. Drafts stay in this browser and are not
        shared with the physician or a database. Unknown information is not a
        negative answer.
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
      ) : (
        <form
          noValidate
          onChange={() =>
            setStatus("Unsaved changes. Save this draft before leaving.")
          }
          onSubmit={async (event) => {
            event.preventDefault();
            if (await trigger(steps[step].fields, { shouldFocus: true }))
              await save(Math.min(step + 1, steps.length - 1));
          }}
          className="space-y-6"
        >
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Step {step + 1} of {steps.length}
            </p>
            <progress
              aria-label="Intake progress"
              value={step + 1}
              max={steps.length}
              className="h-2 w-full accent-primary"
            />
          </div>
          <Surface>
            <h2 ref={heading} tabIndex={-1}>
              {steps[step].title}
            </h2>
            <div className="mt-6 space-y-6">
              {fields
                .filter(
                  (field) =>
                    steps[step].fields.includes(field.id) &&
                    isVisible(field.id, answers),
                )
                .map((field) => (
                  <Controller
                    key={field.id}
                    name={field.id}
                    control={control}
                    render={({ field: input }) => (
                      <div>
                        <label
                          htmlFor={field.id}
                          className="block text-sm font-medium"
                        >
                          {field.label}
                        </label>
                        {field.kind === "choice" ? (
                          <select
                            {...input}
                            id={field.id}
                            value={
                              input.value === null ? "unknown" : input.value
                            }
                            onChange={(e) =>
                              input.onChange(
                                e.target.value === "unknown"
                                  ? null
                                  : e.target.value,
                              )
                            }
                            aria-invalid={!!errors[field.id]}
                            aria-describedby={
                              errors[field.id] ? `${field.id}-error` : undefined
                            }
                            className="mt-2 min-h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
                          >
                            <option value="">Choose an answer</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                            <option value="unknown">I don&apos;t know</option>
                          </select>
                        ) : (
                          <>
                            <Input
                              {...input}
                              id={field.id}
                              type={field.kind === "age" ? "number" : "text"}
                              value={input.value ?? ""}
                              disabled={input.value === null}
                              min={field.kind === "age" ? 0 : undefined}
                              max={field.kind === "age" ? 120 : undefined}
                              maxLength={120}
                              aria-invalid={!!errors[field.id]}
                              aria-describedby={
                                errors[field.id]
                                  ? `${field.id}-error`
                                  : undefined
                              }
                              className="mt-2"
                            />
                            <label className="mt-2 flex min-h-11 items-center gap-3 text-sm">
                              <input
                                type="checkbox"
                                checked={input.value === null}
                                onChange={(event) =>
                                  input.onChange(
                                    event.target.checked ? null : "",
                                  )
                                }
                                className="size-5 accent-primary"
                              />
                              I don&apos;t know — {field.label.toLowerCase()}
                            </label>
                          </>
                        )}
                        {errors[field.id] && (
                          <p
                            id={`${field.id}-error`}
                            role="alert"
                            className="mt-2 text-sm text-destructive"
                          >
                            {errors[field.id]?.message}
                          </p>
                        )}
                      </div>
                    )}
                  />
                ))}
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
                ? "Validate and save draft"
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
          </div>
          <p role="status" className="text-sm text-muted-foreground">
            {busy ? "Saving..." : status}
          </p>
          <p className="text-sm text-muted-foreground">
            This first slice saves a draft. Habits, previous exams, confirmation
            and profile creation follow in the next intake step of development.
          </p>
        </form>
      )}
    </>
  );
}
