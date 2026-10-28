"use client";
import { useCallback, useEffect, useState } from "react";
import { usePathname, useRouter } from "next/navigation";
import { ChevronDown, RotateCcw } from "lucide-react";
import { resetDemo, selectDemoCase } from "@/app/demo-actions";
import { PendingButton } from "./pending-button";

type CurrentCase = {
  caseId: string;
  preparedStateId?: string;
  displayName: string;
  summary: string;
};
type PresenterState = {
  session: CurrentCase | null;
  preparedStatesAvailable: boolean;
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
  const pathname = usePathname();
  const [current, setCurrent] = useState<CurrentCase | null>(null);
  const [state, setState] = useState<LoadState>("loading");
  const [preparedAvailable, setPreparedAvailable] = useState(true);
  const busy = state === "loading" || state === "preparing";
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/demo-session", { cache: "no-store" });
      if (!response.ok) throw new Error("Demo session unavailable");
      const presenter = (await response.json()) as PresenterState;
      setCurrent(presenter.session);
      setPreparedAvailable(presenter.preparedStatesAvailable);
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
  const startingPoint =
    preparedStates.find((item) => item.id === current?.preparedStateId)
      ?.label ?? "Original case starting point";
  return (
    <section
      aria-labelledby="demo-case-title"
      aria-busy={busy || undefined}
      className="border-b bg-muted text-sm"
    >
      <div className="mx-auto max-w-workspace space-y-3 px-4 py-3 md:px-8">
        <div aria-live="polite">
          <h2 id="demo-case-title" className="text-sm font-medium">
            {state === "loading"
              ? "Loading demo case…"
              : state === "preparing"
                ? "Preparing demonstration state…"
                : current
                  ? `Demo case: ${current.displayName}`
                  : state === "error"
                    ? "Demo case unavailable"
                    : "Select a demo case"}
          </h2>
          <p className="text-xs text-muted-foreground">
            {current
              ? startingPoint
              : "Choose Alex Example or Jordan Example in Presenter controls to begin this synthetic demonstration."}
          </p>
        </div>
        {state === "error" ? (
          <p role="alert">
            The demo storage could not be reached. Try again, or reload the
            page.
          </p>
        ) : null}
        <details
          key={`${pathname}-${current?.preparedStateId ?? current?.caseId ?? "none"}`}
          open={state === "ready" && !current}
        >
          <summary className="min-h-11 cursor-pointer content-center font-medium">
            Presenter controls
          </summary>
          <div className="mt-3 space-y-4">
            <form
              action={(data) => run(() => selectDemoCase(data))}
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
              <details className="group">
                <summary className="inline-flex min-h-11 cursor-pointer list-none items-center gap-2 rounded-md border border-input bg-card px-4 py-2 font-medium">
                  Prepared starting points
                  <ChevronDown
                    aria-hidden="true"
                    className="size-4 transition-transform group-open:rotate-180"
                  />
                </summary>
                {!preparedAvailable ? (
                  <p className="mt-3 text-xs text-muted-foreground">
                    Prepared starting points are available only with the mock
                    provider. Restart the server with LLM_PROVIDER=mock to use
                    them.
                  </p>
                ) : (
                  <>
                    <p className="mt-3 text-xs text-muted-foreground">
                      DEMONSTRATIVE — NOT CLINICALLY VALIDATED. Synthetic
                      presentation states. Loading replaces this browser&apos;s
                      selected case.
                    </p>
                    <form
                      action={(data) => run(() => selectDemoCase(data))}
                      aria-label="Choose prepared starting point"
                      className="mt-3 flex flex-col gap-2 md:flex-row md:flex-wrap"
                    >
                      {preparedStates.map(({ id, label }) => (
                        <PendingButton
                          key={id}
                          name="caseId"
                          value={id}
                          aria-pressed={current?.preparedStateId === id}
                          disabled={busy}
                          variant={
                            current?.preparedStateId === id
                              ? "default"
                              : "outline"
                          }
                        >
                          {label}
                        </PendingButton>
                      ))}
                    </form>
                  </>
                )}
              </details>
            ) : null}
            {current ? (
              <>
                <p className="text-xs text-muted-foreground">
                  {current.summary}. Shared by the patient and physician views.
                </p>
                <form
                  action={() => run(resetDemo)}
                  aria-describedby="demo-reset-help"
                >
                  <PendingButton variant="ghost" disabled={busy}>
                    <RotateCcw aria-hidden="true" />
                    Reset demo
                  </PendingButton>
                  <p
                    id="demo-reset-help"
                    className="text-xs text-muted-foreground"
                  >
                    Restores this browser&apos;s selected starting point.
                  </p>
                </form>
              </>
            ) : null}
          </div>
        </details>
      </div>
    </section>
  );
}
