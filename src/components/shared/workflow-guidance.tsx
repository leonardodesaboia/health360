"use client";

import type { ReactElement } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { Check, Circle, CircleAlert } from "lucide-react";
import type { WorkflowPresentation } from "@/features/workflow/presentation";
import { Button } from "@/components/ui/button";
import { Surface } from "./primitives";

export function WorkflowRefreshButton({
  label,
}: {
  label: "Refresh status";
}): ReactElement {
  const router = useRouter();
  return <Button onClick={() => router.refresh()}>{label}</Button>;
}

export function JourneyProgress({
  model,
  id,
}: {
  model: WorkflowPresentation;
  id: string;
}): ReactElement {
  const pathname = usePathname();
  const active = model.stages.find(
    (stage) => stage.state === "current" || stage.state === "blocked",
  );
  function list(suffix: string) {
    return (
      <ol
        aria-label="Evaluation progress"
        className="grid gap-4 md:grid-cols-4"
      >
        {model.stages.map((stage) => {
          const Icon =
            stage.state === "complete"
              ? Check
              : stage.state === "blocked"
                ? CircleAlert
                : Circle;
          return (
            <li
              key={stage.id}
              aria-current={stage.state === "current" ? "step" : undefined}
              className="flex items-start gap-3"
            >
              <Icon
                aria-hidden="true"
                className="mt-1 size-5 shrink-0 text-primary"
              />
              <div>
                <p id={`${id}-${suffix}-${stage.id}`} className="font-medium">
                  {stage.label}
                </p>
                <p className="text-sm text-muted-foreground">
                  {stage.state === "not-started"
                    ? "Not started"
                    : stage.state.charAt(0).toUpperCase() +
                      stage.state.slice(1)}
                </p>
              </div>
            </li>
          );
        })}
      </ol>
    );
  }
  return (
    <section aria-labelledby={id} className="space-y-4">
      <h2 id={id}>Evaluation progress</h2>
      <p className="text-sm md:hidden">
        Current stage:{" "}
        {active?.label ??
          (model.stages.every((stage) => stage.state === "complete")
            ? "All steps recorded"
            : "Intake not started")}
      </p>
      {model.branch ? (
        <p className="text-sm font-medium">{model.branch.label}</p>
      ) : null}
      <details
        key={pathname}
        open={pathname === "/patient"}
        className="md:hidden"
      >
        <summary className="min-h-11 cursor-pointer content-center font-medium">
          View evaluation steps
        </summary>
        <div className="mt-4">{list("mobile")}</div>
      </details>
      <div className="hidden md:block">{list("desktop")}</div>
    </section>
  );
}

export function NextStepPanel({
  model,
  id,
  taskAction,
}: {
  model: WorkflowPresentation;
  id: string;
  taskAction?: ReactElement;
}): ReactElement {
  return (
    <Surface>
      <div
        role="region"
        aria-labelledby={id}
        aria-describedby={`${id}-description`}
        className="space-y-4"
      >
        <h2 id={id}>What happens next</h2>
        <h3>{model.heading}</h3>
        <p id={`${id}-description`} className="text-sm text-muted-foreground">
          {model.explanation}
        </p>
        {model.provenance && (
          <p className="text-xs text-muted-foreground">{model.provenance}</p>
        )}
        <p className="text-sm font-medium">Next: {model.actor}</p>
        {model.previousPlanMessage ? (
          <p className="text-sm">{model.previousPlanMessage}</p>
        ) : null}
        {model.primary.kind === "link" ? (
          <Button asChild>
            <Link href={model.primary.href}>{model.primary.label}</Link>
          </Button>
        ) : model.primary.kind === "refresh" ? (
          <WorkflowRefreshButton label={model.primary.label} />
        ) : (
          taskAction
        )}
      </div>
    </Surface>
  );
}
