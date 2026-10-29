"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";
import { Notice, Surface } from "@/components/shared/primitives";
import { NextStepPanel } from "@/components/shared/workflow-guidance";
import type { WorkflowPresentation } from "@/features/workflow/presentation";

export function AnalyzeButton({
  model,
  error,
}: {
  model: WorkflowPresentation;
  error?: boolean;
}) {
  const { pending } = useFormStatus();
  return (
    <div aria-busy={pending} className="space-y-4">
      {pending ? (
        <Surface>
          <div
            role="region"
            aria-labelledby="analysis-next-step"
            aria-describedby="analysis-next-step-description"
          >
            <h2 id="analysis-next-step">What happens next</h2>
            <p
              id="analysis-next-step-description"
              role="status"
              className="mt-4 text-sm"
            >
              Analysis requested. Waiting for the server response.
            </p>
            <p className="mt-3 text-sm text-muted-foreground">
              Last recorded status: {model.label}
            </p>
            <Button type="submit" disabled className="mt-4">
              Analyzing current information…
            </Button>
          </div>
        </Surface>
      ) : (
        <>
          <p className="text-sm text-muted-foreground">{model.label}</p>
          {error && (
            <Notice
              title="We could not confirm the analysis result"
              tone="warning"
            >
              Check the latest recorded status before trying again. No
              completion is assumed.
            </Notice>
          )}
          <NextStepPanel
            model={model}
            id="analysis-next-step"
            taskAction={<Button type="submit">{model.primary.label}</Button>}
          />
        </>
      )}
    </div>
  );
}
