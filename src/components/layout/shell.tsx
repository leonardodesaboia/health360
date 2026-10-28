import Link from "next/link";
import type { ReactNode } from "react";
import { Activity, ArrowLeftRight, ShieldCheck } from "lucide-react";
import { DemoControls } from "./demo-controls";
import { Navigation } from "./navigation";

export function DemoBanner() {
  return (
    <div className="border-b bg-secondary px-4 py-2 text-center text-xs leading-relaxed text-secondary-foreground">
      <strong>Demonstration environment</strong> · Synthetic data ·
      DEMONSTRATIVE — NOT CLINICALLY VALIDATED · Do not use for real care
    </div>
  );
}

export function BrandLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      aria-label="Health360 — home"
      className="flex items-center gap-2 text-xl font-semibold tracking-tight"
    >
      <Activity aria-hidden="true" className="size-7 text-primary" />
      health<span className="-ml-2 font-normal text-primary">360</span>
    </Link>
  );
}

function AppShell({
  children,
  role,
}: {
  children: ReactNode;
  role: "patient" | "doctor";
}) {
  return (
    <>
      <a
        href="#main-content"
        className="sr-only z-50 rounded-md bg-primary p-3 text-primary-foreground focus:not-sr-only focus:fixed focus:top-2 focus:left-2"
      >
        Skip to content
      </a>
      <DemoBanner />
      <header className="border-b bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-workspace flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <BrandLink href={role === "patient" ? "/patient" : "/doctor"} />
          <p className="text-sm font-medium">
            {role === "patient"
              ? "Patient view"
              : "Physician view · Demo reviewer"}
          </p>
          <Link
            href={role === "patient" ? "/doctor" : "/patient"}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border px-3 text-xs font-medium hover:bg-navigation-hover"
          >
            <ArrowLeftRight aria-hidden="true" className="size-4" />
            {role === "patient" ? "View as physician" : "View as patient"}
            <span className="sr-only">
              {" "}
              — demonstration switching, without authorization
            </span>
          </Link>
        </div>
        <div className="mx-auto max-w-workspace px-4 pb-3 md:px-8">
          <p className="mb-3 text-xs text-muted-foreground">
            Demo navigation only; no sign-in or authorization.
          </p>
          <Navigation role={role} />
        </div>
      </header>
      <DemoControls />
      <main id="main-content" tabIndex={-1}>
        {children}
      </main>
      <footer className="mx-auto flex max-w-workspace flex-wrap items-center justify-between gap-3 border-t px-4 py-6 text-xs text-muted-foreground md:px-8">
        <p className="flex items-center gap-2">
          <ShieldCheck aria-hidden="true" className="size-4" />
          Technical prototype. Clinical decisions require physician review.
        </p>
      </footer>
    </>
  );
}
export function PatientShell({ children }: { children: ReactNode }) {
  return <AppShell role="patient">{children}</AppShell>;
}
export function DoctorShell({ children }: { children: ReactNode }) {
  return <AppShell role="doctor">{children}</AppShell>;
}
