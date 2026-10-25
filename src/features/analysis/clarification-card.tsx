"use client";

import { useState, useTransition } from "react";
import { useRouter } from "next/navigation";
import { CircleHelp, CheckCircle2, LoaderCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Surface } from "@/components/shared/primitives";
import { submitClarificationAction } from "@/server/clinical-review/actions";

export function ClarificationCard() {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [examDate, setExamDate] = useState("2022-11-03");
  const [keptUnknown, setKeptUnknown] = useState(false);

  function handleProvide() {
    setKeptUnknown(false);
    startTransition(async () => {
      await submitClarificationAction("PROVIDE_DATA", examDate);
      router.refresh();
    });
  }

  function handleKeepUnknown() {
    startTransition(async () => {
      await submitClarificationAction("KEEP_UNKNOWN");
      setKeptUnknown(true);
      router.refresh();
    });
  }

  return (
    <Surface className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div>
          <p className="text-xs font-semibold tracking-wide text-primary uppercase">
            Flow C · Deterministic Clarification Loop
          </p>
          <h2 className="mt-1">Complementary information required</h2>
        </div>
        <span className="rounded-sm bg-warning px-2.5 py-1 text-xs font-medium text-warning-foreground">
          Status: Clarification required
        </span>
      </div>

      <p className="text-sm text-muted-foreground">
        An essential screening fact is currently unknown or was flagged for
        clarification during physician review. Provide the confirmed date below
        to create a new profile version and re-enter analysis, or explicitly
        keep &ldquo;I don&apos;t know&rdquo; (which safely blocks interval-based
        recommendations).
      </p>

      <div className="space-y-3 rounded-lg border bg-background p-4">
        <label
          htmlFor="clarify-exam-date"
          className="block text-sm font-medium"
        >
          When was your previous colonoscopy performed? (Or confirm scenario
          date)
        </label>
        <Input
          id="clarify-exam-date"
          type="date"
          value={examDate}
          onChange={(e) => setExamDate(e.target.value)}
          disabled={isPending}
          className="max-w-xs bg-card tabular-nums"
        />
        <div className="flex flex-wrap items-center gap-3 pt-2">
          <Button
            type="button"
            onClick={handleProvide}
            disabled={isPending || !examDate}
          >
            {isPending ? (
              <>
                <LoaderCircle
                  aria-hidden="true"
                  className="size-4 motion-safe:animate-spin"
                />
                Updating profile & re-running analysis…
              </>
            ) : (
              <>
                <CheckCircle2 aria-hidden="true" className="size-4" />
                Confirm answer & re-run analysis
              </>
            )}
          </Button>

          <Button
            type="button"
            variant="outline"
            onClick={handleKeepUnknown}
            disabled={isPending}
          >
            <CircleHelp aria-hidden="true" className="size-4" />I don&apos;t
            know (Keep unknown)
          </Button>
        </div>

        {keptUnknown && (
          <p className="pt-2 text-xs font-medium text-warning-foreground">
            Recorded as explicit unknown (null). No interval-based finding or
            plan will be fabricated while this required information remains
            unknown.
          </p>
        )}
      </div>
    </Surface>
  );
}
