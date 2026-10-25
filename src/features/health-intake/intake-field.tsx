"use client";
import { useController, type Control, type FieldError } from "react-hook-form";
import { CircleHelp } from "lucide-react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import { type IntakeAnswers, type fields } from "./contracts";

export function IntakeField({
  definition,
  control,
  error,
}: {
  definition: (typeof fields)[number];
  control: Control<IntakeAnswers>;
  error?: FieldError;
}) {
  const { field: input } = useController({ control, name: definition.id });
  const help = error ? `${definition.id}-error` : undefined;
  const isUnknown = input.value === null;
  const choiceOptions = definition.options ?? [
    ["yes", "Yes"],
    ["no", "No"],
  ];

  return (
    <div className="rounded-lg border bg-background p-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <label htmlFor={definition.id} className="block text-sm font-medium">
          {definition.label}
        </label>
        <span
          className={cn(
            "rounded-sm px-2 py-0.5 text-xs font-medium",
            isUnknown
              ? "bg-warning text-warning-foreground"
              : "bg-muted text-muted-foreground",
          )}
        >
          {isUnknown
            ? "Unknown (null · not negative)"
            : "Provenance: Patient-reported"}
        </span>
      </div>

      {definition.kind === "choice" ? (
        <>
          <select
            {...input}
            id={definition.id}
            value={input.value === null ? "unknown" : input.value}
            onChange={(event) =>
              input.onChange(
                event.target.value === "unknown" ? null : event.target.value,
              )
            }
            aria-invalid={!!error}
            aria-describedby={help}
            className="mt-2 min-h-11 w-full rounded-md border border-input bg-card px-3 py-2 text-base"
          >
            <option value="">Choose an answer</option>
            {choiceOptions.map(([value, label]) => (
              <option key={value} value={value}>
                {label}
              </option>
            ))}
            <option value="unknown">I don&apos;t know</option>
          </select>

          <div
            role="group"
            aria-label={`Quick selection for ${definition.label}`}
            className="mt-2.5 flex flex-wrap items-center gap-2"
          >
            {choiceOptions.map(([value, label]) => {
              const selected = input.value === value;
              return (
                <button
                  key={value}
                  type="button"
                  onClick={() => input.onChange(value)}
                  className={cn(
                    "inline-flex min-h-11 items-center rounded-md border px-3.5 py-1.5 text-xs font-medium transition-colors",
                    selected
                      ? "border-primary bg-primary text-primary-foreground"
                      : "bg-card text-foreground hover:bg-muted",
                  )}
                >
                  {label}
                </button>
              );
            })}
            <button
              type="button"
              onClick={() => input.onChange(null)}
              className={cn(
                "inline-flex min-h-11 items-center gap-1.5 rounded-md border border-dashed px-3.5 py-1.5 text-xs font-medium transition-colors",
                isUnknown
                  ? "border-warning-foreground bg-warning text-warning-foreground"
                  : "border-input bg-muted/60 text-muted-foreground hover:bg-muted hover:text-foreground",
              )}
            >
              <CircleHelp aria-hidden="true" className="size-3.5" />
              I don&apos;t know (Record as null)
            </button>
          </div>
        </>
      ) : (
        <>
          <Input
            {...input}
            id={definition.id}
            type={
              definition.kind === "age"
                ? "number"
                : definition.kind === "date"
                  ? "date"
                  : "text"
            }
            value={input.value ?? ""}
            disabled={input.value === null}
            min={definition.kind === "age" ? 0 : undefined}
            max={definition.kind === "age" ? 120 : undefined}
            maxLength={120}
            aria-invalid={!!error}
            aria-describedby={help}
            className="mt-2 bg-card tabular-nums"
          />
          <label
            className={cn(
              "mt-2.5 flex min-h-11 cursor-pointer items-center justify-between gap-3 rounded-md border border-dashed px-3.5 py-2 text-sm transition-colors",
              isUnknown
                ? "border-warning-foreground bg-warning font-medium text-warning-foreground"
                : "border-input bg-card text-muted-foreground hover:bg-muted hover:text-foreground",
            )}
          >
            <span className="flex items-center gap-2.5">
              <input
                type="checkbox"
                checked={input.value === null}
                onChange={(event) =>
                  input.onChange(event.target.checked ? null : "")
                }
                className="size-5 accent-primary"
              />
              <span>I don&apos;t know — {definition.label.toLowerCase()}</span>
            </span>
            <span className="hidden text-xs sm:inline">
              Preserves explicit uncertainty
            </span>
          </label>
        </>
      )}

      {error && (
        <p id={help} role="alert" className="mt-2 text-sm text-destructive">
          {error.message}
        </p>
      )}
    </div>
  );
}
