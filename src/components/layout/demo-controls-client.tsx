"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { RotateCcw } from "lucide-react";
import { resetDemo, selectDemoCase } from "@/app/demo-actions";
import { PendingButton } from "./pending-button";

type CurrentCase = { caseId: string; displayName: string; summary: string };
type LoadState = "loading" | "ready" | "error";

/** Reads the session client-side so shell routes stay static (and keep real 404 statuses). */
export function DemoControlsClient({
  cases,
}: {
  cases: { id: string; displayName: string }[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<CurrentCase | null>(null);
  const [state, setState] = useState<LoadState>("loading");

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/demo-session", { cache: "no-store" });
      if (!response.ok) throw new Error("Demo session unavailable");
      setCurrent((await response.json()) as CurrentCase | null);
      setState("ready");
    } catch {
      setState("error");
    }
  }, []);

  useEffect(() => {
    // Initial session read on mount; the network result arrives asynchronously.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void refresh();
  }, [refresh]);

  async function run(action: () => Promise<void>) {
    try {
      await action();
    } catch {
      setState("error");
      return;
    }
    await refresh();
    router.refresh();
  }

  return (
    <section
      aria-labelledby="demo-case-title"
      aria-busy={state === "loading" || undefined}
      className="border-b bg-muted text-sm"
    >
      <div className="mx-auto flex max-w-workspace flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-8">
        <div className="w-full min-w-0 md:w-auto md:flex-1" aria-live="polite">
          <h2 id="demo-case-title" className="text-sm font-medium">
            {state === "loading"
              ? "Loading demo case…"
              : state === "error"
                ? "Demo case unavailable"
                : current
                  ? `Demo case: ${current.displayName}`
                  : "Select a demo case"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {state === "error"
              ? "The demo storage could not be reached. Try again, or reload the page."
              : current
                ? `${current.summary}. Shared by the patient and physician views.`
                : "Load one fictional patient into both the patient and physician views."}
          </p>
        </div>
        <form
          action={(formData) => run(() => selectDemoCase(formData))}
          aria-label="Choose demo case"
          className="flex flex-wrap gap-2"
        >
          {cases.map(({ id, displayName }) => {
            const selected = current?.caseId === id;
            return (
              <PendingButton
                key={id}
                name="caseId"
                value={id}
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                disabled={state === "loading"}
              >
                {displayName}
              </PendingButton>
            );
          })}
        </form>
        {current ? (
          <form action={() => run(resetDemo)}>
            <PendingButton variant="ghost">
              <RotateCcw aria-hidden="true" />
              Reset demo
            </PendingButton>
          </form>
        ) : null}
      </div>
    </section>
  );
}
