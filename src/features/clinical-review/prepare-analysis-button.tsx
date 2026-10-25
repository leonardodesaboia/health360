"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { Sparkles, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { prepareScenarioAnalysisForReviewAction } from "@/server/clinical-review/actions";
import type { DemoCaseId } from "@/server/demo/contracts";

export function PrepareAnalysisButton({
  caseId,
  label = "Prepare scenario analysis",
  variant = "default",
}: {
  caseId?: DemoCaseId;
  label?: string;
  variant?: "default" | "outline";
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handlePrepare() {
    setError(null);
    startTransition(async () => {
      const result = await prepareScenarioAnalysisForReviewAction(caseId);
      if (result.ok && result.analysisId) {
        router.push(`/doctor/reviews/${encodeURIComponent(result.analysisId)}`);
        router.refresh();
      } else {
        setError("Could not prepare the scenario analysis. Try again.");
        router.refresh();
      }
    });
  }

  return (
    <div className="flex flex-col items-start gap-2 sm:items-end">
      <Button
        type="button"
        variant={variant}
        onClick={handlePrepare}
        disabled={isPending}
      >
        {isPending ? (
          <>
            <LoaderCircle
              aria-hidden="true"
              className="size-4 motion-safe:animate-spin"
            />
            Preparing analysis…
          </>
        ) : (
          <>
            <Sparkles aria-hidden="true" className="size-4" />
            {label}
          </>
        )}
      </Button>
      {error && (
        <p role="alert" className="text-xs text-destructive">
          {error}
        </p>
      )}
    </div>
  );
}
