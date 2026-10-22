import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
export function ContentContainer({
  children,
  width = "patient",
}: {
  children: ReactNode;
  width?: "patient" | "workspace" | "form";
}) {
  return (
    <div
      className={cn("mx-auto w-full space-y-8 px-4 py-8 md:px-8 md:py-12", {
        "max-w-patient": width === "patient",
        "max-w-workspace": width === "workspace",
        "max-w-form": width === "form",
      })}
    >
      {children}
    </div>
  );
}
export function PageHeader({
  eyebrow,
  title,
  description,
  action,
}: {
  eyebrow: string;
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <header className="flex flex-wrap items-end justify-between gap-4">
      <div className="max-w-form">
        <p className="mb-3 text-sm font-medium text-muted-foreground">
          {eyebrow}
        </p>
        <h1>{title}</h1>
        <p className="mt-3 text-muted-foreground">{description}</p>
      </div>
      {action}
    </header>
  );
}
