import Link from "next/link";
import type { ReactNode } from "react";
import { ArrowLeftRight, ShieldCheck } from "lucide-react";
import { DemoControls } from "./demo-controls";
import { Navigation } from "./navigation";

function Health360BrandLogo() {
  return (
    <span className="inline-flex items-center gap-2.5">
      <svg
        viewBox="0 0 44 44"
        fill="none"
        xmlns="http://www.w3.org/2000/svg"
        aria-hidden="true"
        className="size-8 shrink-0"
      >
        <defs>
          <linearGradient
            id="h360-ribbon-top"
            x1="6"
            y1="6"
            x2="34"
            y2="28"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#38D3F9" />
            <stop offset="100%" stopColor="#0E8AC4" />
          </linearGradient>
          <linearGradient
            id="h360-ribbon-bottom"
            x1="8"
            y1="18"
            x2="36"
            y2="40"
            gradientUnits="userSpaceOnUse"
          >
            <stop offset="0%" stopColor="#19B5E0" />
            <stop offset="100%" stopColor="#085E8C" />
          </linearGradient>
        </defs>
        <path
          d="M27.5 6.5C17.5 4.5 8 11.5 8 21.5C8 26.5 11 30.5 15.5 32C12.5 28.5 12.5 22.5 16.5 18C20.5 13.5 27.5 12.5 32.5 15C32 10.5 30.5 7.1 27.5 6.5Z"
          fill="url(#h360-ribbon-top)"
        />
        <path
          d="M15.5 32C19.5 36.8 27.5 38.5 32.5 34.5C36.5 31.2 36.2 24.5 32.5 20.5C30.5 26.5 24.5 29.5 18.5 28.5C15.5 28 13.5 26.5 12.5 24.5C12.2 27.5 13.5 30.2 15.5 32Z"
          fill="url(#h360-ribbon-bottom)"
        />
        <circle cx="25.5" cy="21.5" r="7.5" fill="#081521" />
      </svg>
      <span className="text-xl font-bold tracking-tight">
        <span className="text-sidebar-foreground">health</span>
        <span className="text-brand-cyan">360</span>
      </span>
    </span>
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
      <div className="border-b bg-muted px-4 py-2 text-center text-xs leading-relaxed text-muted-foreground">
        <strong>Demonstration environment</strong> · Synthetic data ·
        DEMONSTRATIVE — NOT CLINICALLY VALIDATED · Do not use for real care
      </div>
      <header className="border-b-2 border-brand-cyan bg-sidebar text-sidebar-foreground">
        <div className="mx-auto flex max-w-workspace flex-wrap items-center justify-between gap-4 px-4 py-4 md:px-8">
          <Link
            href={role === "patient" ? "/patient" : "/doctor"}
            aria-label="Health360 — home"
            className="flex items-center gap-2 text-xl font-semibold tracking-tight text-sidebar-foreground"
          >
            <Health360BrandLogo />
          </Link>
          <p className="hidden text-xs text-muted-foreground lg:block">
            {role === "patient"
              ? "Your preventive follow-up · AI organizes · Science grounds · The physician decides"
              : "Physician workspace · AI organizes · Science grounds · The physician decides"}
          </p>
          <Link
            href={role === "patient" ? "/doctor" : "/patient"}
            className="inline-flex min-h-11 items-center gap-2 rounded-md border bg-secondary px-3 text-xs font-medium text-secondary-foreground hover:bg-navigation-hover"
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
        <Link
          href="/showcase"
          className="inline-flex min-h-11 items-center underline underline-offset-4"
        >
          Component library
        </Link>
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
