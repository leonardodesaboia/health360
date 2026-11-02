"use client";
import { useController, type Control, type FieldError } from "react-hook-form";
import { Input } from "@/components/ui/input";
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
  return (
    <div className="border-b pb-6 last:border-0 last:pb-0">
      <label htmlFor={definition.id} className="block text-sm font-medium">
        {definition.label}
      </label>
      {definition.kind === "choice" ? (
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
          {(
            definition.options ?? [
              ["yes", "Yes"],
              ["no", "No"],
            ]
          ).map(([value, label]) => (
            <option key={value} value={value}>
              {label}
            </option>
          ))}
          <option value="unknown">I don&apos;t know</option>
        </select>
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
          <label className="mt-3 flex min-h-11 cursor-pointer items-center gap-3 rounded-md border border-dashed border-input bg-background px-4 py-2 text-sm">
            <input
              type="checkbox"
              checked={input.value === null}
              onChange={(event) =>
                input.onChange(event.target.checked ? null : "")
              }
              className="size-5 accent-primary"
            />
            I don&apos;t know — {definition.label.toLowerCase()}
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
