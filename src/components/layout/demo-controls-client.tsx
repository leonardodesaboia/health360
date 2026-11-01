"use client";
import { useCallback, useEffect, useRef, useState } from "react";
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
  const [open, setOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    function handleOutsideClick(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleOutsideClick);
    return () => document.removeEventListener("mousedown", handleOutsideClick);
  }, []);

  async function run(action: () => Promise<void>) {
    setOpen(false);
    try {
      await action();
    } catch {
      setState("error");
      return;
    }
    await refresh();
    router.refresh();
  }

  const triggerLabel = current ? `Case: ${current.displayName}` : "Demo cases";

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

        <div
          ref={dropdownRef}
          className="group relative"
          onMouseEnter={() => setOpen(true)}
          onMouseLeave={() => setOpen(false)}
        >
          <button
            type="button"
            aria-haspopup="true"
            aria-expanded={open}
            title="Switch demonstration case"
            onClick={() => setOpen((prev) => !prev)}
            className={cn(
              "inline-flex min-h-9 items-center gap-0 rounded-full border border-transparent bg-transparent px-2.5 text-xs font-medium text-muted-foreground/70 transition-all duration-200 hover:min-h-10 hover:gap-2 hover:rounded-md hover:border-border hover:bg-secondary hover:px-3 hover:text-secondary-foreground focus-visible:min-h-10 focus-visible:gap-2 focus-visible:rounded-md focus-visible:border-border focus-visible:bg-secondary focus-visible:px-3 focus-visible:text-secondary-foreground",
              open &&
                "min-h-10 gap-2 rounded-md border-border bg-secondary px-3 text-secondary-foreground",
            )}
          >
            <Users
              aria-hidden="true"
              className="size-4 shrink-0 transition-transform duration-200 group-hover:scale-110"
            />
            <span
              className={cn(
                "max-w-0 overflow-hidden whitespace-nowrap opacity-0 transition-all duration-200 group-focus-within:max-w-48 group-focus-within:opacity-100 group-hover:max-w-48 group-hover:opacity-100",
                open && "max-w-48 opacity-100",
              )}
            >
              {triggerLabel}
            </span>
            <ChevronDown
              aria-hidden="true"
              className={cn(
                "size-3.5 max-w-0 shrink-0 overflow-hidden opacity-0 transition-all duration-200 group-focus-within:max-w-4 group-focus-within:opacity-100 group-hover:max-w-4 group-hover:opacity-100",
                open && "max-w-4 rotate-180 opacity-100",
              )}
            />
          </button>

          <div
            className={cn(
              "invisible absolute top-full right-0 z-50 w-56 pt-1.5 opacity-0 transition-all duration-150 group-focus-within:visible group-focus-within:opacity-100 group-hover:visible group-hover:opacity-100",
              open && "visible opacity-100",
            )}
          >
            <div className="rounded-lg border bg-card p-1.5 shadow-md">
              <p className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">
                Choose demo case
              </p>
              <form
                action={(formData) => run(() => selectDemoCase(formData))}
                aria-label="Choose demo case"
                className="flex flex-col gap-1"
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
                        "min-h-9 w-full justify-between px-2.5 py-1.5 text-xs font-medium",
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
                <form
                  action={() => run(resetDemo)}
                  className="mt-1 border-t pt-1"
                >
                  <PendingButton
                    variant="ghost"
                    className="min-h-9 w-full justify-start px-2.5 py-1.5 text-xs text-muted-foreground"
                  >
                    <RotateCcw aria-hidden="true" className="size-3.5" />
                    Reset demo
                  </PendingButton>
                </form>
              ) : null}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
