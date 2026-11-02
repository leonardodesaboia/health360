"use client";
import { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Check, ChevronDown, RotateCcw, Users } from "lucide-react";
import { resetDemo, selectDemoCase } from "@/app/demo-actions";
import { cn } from "@/lib/utils";
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
      <div className="mx-auto flex max-w-workspace flex-wrap items-center justify-between gap-x-6 gap-y-2 px-4 py-2.5 md:px-8">
        <div className="min-w-0 flex-1" aria-live="polite">
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

        <div className="group relative flex items-center justify-end">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute right-0 inline-flex min-h-9 items-center gap-1 rounded-full border border-transparent bg-transparent px-2.5 text-xs font-medium text-muted-foreground opacity-100 transition-opacity duration-150 group-focus-within:opacity-0 group-hover:opacity-0"
          >
            <Users aria-hidden="true" className="size-4 shrink-0" />
            <ChevronDown aria-hidden="true" className="size-3 shrink-0" />
          </span>

          <div className="flex flex-wrap items-center gap-1.5 rounded-lg border border-transparent bg-transparent p-1 opacity-0 transition-all duration-150 group-focus-within:border-border group-focus-within:bg-card group-focus-within:opacity-100 group-focus-within:shadow-sm group-hover:border-border group-hover:bg-card group-hover:opacity-100 group-hover:shadow-sm">
            <form
              action={(formData) => run(() => selectDemoCase(formData))}
              aria-label="Choose demo case"
              className="flex flex-wrap gap-1"
            >
              {cases.map(({ id, displayName }) => {
                const selected = current?.caseId === id;
                return (
                  <PendingButton
                    key={id}
                    name="caseId"
                    value={id}
                    variant="ghost"
                    aria-pressed={selected}
                    disabled={state === "loading"}
                    className={cn(
                      "min-h-8 gap-1.5 px-2.5 py-1 text-xs font-medium",
                      selected && "bg-secondary text-secondary-foreground",
                    )}
                  >
                    <span>{displayName}</span>
                    {selected && (
                      <Check
                        aria-hidden="true"
                        className="size-3.5 text-primary"
                      />
                    )}
                  </PendingButton>
                );
              })}
            </form>
            {current ? (
              <form action={() => run(resetDemo)}>
                <PendingButton
                  variant="ghost"
                  className="min-h-8 px-2.5 py-1 text-xs text-muted-foreground"
                >
                  <RotateCcw aria-hidden="true" className="size-3.5" />
                  Reset demo
                </PendingButton>
              </form>
            ) : null}
          </div>
        </div>
      </div>
    </section>
  );
}
