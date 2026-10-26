"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ChevronDown, RotateCcw } from "lucide-react";
import { resetDemo, selectDemoCase } from "@/app/demo-actions";
import { PendingButton } from "./pending-button";

type CurrentCase = {
  caseId: string;
  preparedStateId?: string;
  displayName: string;
  summary: string;
};
type LoadState = "loading" | "preparing" | "ready" | "error";

/** Reads the session client-side so shell routes stay static (and keep real 404 statuses). */
export function DemoControlsClient({
  cases,
  preparedStates = [],
}: {
  cases: { id: string; displayName: string }[];
  preparedStates?: { id: string; label: string }[];
}) {
  const router = useRouter();
  const [current, setCurrent] = useState<CurrentCase | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const busy = state === "loading" || state === "preparing";

  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/demo-session", { cache: "no-store" });
      if (!response.ok) throw new Error("Demo session unavailable");
      const selected = (await response.json()) as CurrentCase | null;
      setCurrent(selected);
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

  async function run(action: () => Promise<string | null>) {
    setState("preparing");
    try {
      const destination = await action();
      await refresh();
      if (destination) router.push(destination);
      router.refresh();
    } catch {
      setState("error");
    }
  }

  return (
    <section
      aria-labelledby="demo-case-title"
      aria-busy={busy || undefined}
      className="border-b bg-muted text-sm"
    >
      <div className="mx-auto flex max-w-workspace flex-wrap items-center gap-x-6 gap-y-3 px-4 py-3 md:px-8">
        <div className="w-full min-w-0 md:w-auto md:flex-1" aria-live="polite">
          <h2 id="demo-case-title" className="text-sm font-medium">
            {state === "loading"
              ? "Loading demo case…"
              : state === "preparing"
                ? "Preparing demonstration state…"
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
            const selected =
              (current?.preparedStateId ?? current?.caseId) === id;
            return (
              <PendingButton
                key={id}
                name="caseId"
                value={id}
                variant={selected ? "default" : "outline"}
                aria-pressed={selected}
                disabled={busy}
              >
                {displayName}
              </PendingButton>
            );
          })}
        </form>
        {preparedStates.length ? (
          <details className="group w-full">
            <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-card px-4 py-2 font-medium">
              Prepared starting points
              <ChevronDown
                aria-hidden="true"
                className="size-4 transition-transform group-open:rotate-180"
              />
            </summary>
            <p className="mt-3 text-xs text-muted-foreground">
              DEMONSTRATIVE — NOT CLINICALLY VALIDATED. Synthetic presentation
              states. Loading replaces this browser&apos;s selected case.
            </p>
            <form
              action={(formData) => run(() => selectDemoCase(formData))}
              aria-label="Choose prepared starting point"
              className="mt-3 flex flex-col gap-2 md:flex-row md:flex-wrap"
            >
              {preparedStates.map(({ id, label }) => {
                const selected = current?.preparedStateId === id;
                return (
                  <PendingButton
                    key={id}
                    name="caseId"
                    value={id}
                    aria-pressed={selected}
                    disabled={busy}
                    variant={selected ? "default" : "outline"}
                  >
                    {label}
                  </PendingButton>
                );
              })}
            </form>
          </details>
        ) : null}
        {current ? (
          <form action={() => run(resetDemo)}>
            <PendingButton variant="ghost" disabled={busy}>
              <RotateCcw aria-hidden="true" />
              Reset demo
            </PendingButton>
          </form>
        ) : null}
      </div>
    </section>
  );
}
