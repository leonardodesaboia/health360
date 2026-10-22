import type { ReactNode } from "react";
import { CircleAlert, Info, LoaderCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  statusLabels,
  type WorkflowStatus,
} from "@/features/workflow/workflow";

export function Surface({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section
      className={cn(
        "rounded-lg border bg-card p-6 text-card-foreground",
        className,
      )}
    >
      {children}
    </section>
  );
}
export function StatusIndicator({ status }: { status: WorkflowStatus }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-sm bg-secondary px-3 py-1 text-sm font-medium text-secondary-foreground">
      <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
      {statusLabels[status]}
    </span>
  );
}
export function Notice({
  title,
  children,
  tone = "information",
}: {
  title: string;
  children: ReactNode;
  tone?: "information" | "warning";
}) {
  return (
    <div
      className={cn(
        "flex gap-3 rounded-md p-4 text-sm",
        tone === "warning"
          ? "bg-warning text-warning-foreground"
          : "bg-information text-information-foreground",
      )}
    >
      <Info aria-hidden="true" className="mt-0.5 size-5 shrink-0" />
      <div>
        <p className="font-medium">{title}</p>
        <div className="mt-1 leading-relaxed">{children}</div>
      </div>
    </div>
  );
}
export function EmptyState({
  title,
  description,
  action,
}: {
  title: string;
  description: string;
  action?: ReactNode;
}) {
  return (
    <div className="rounded-lg border border-dashed bg-card px-6 py-12 text-center">
      <h2 className="text-lg">{title}</h2>
      <p className="mx-auto mt-2 max-w-form text-sm text-muted-foreground">
        {description}
      </p>
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
export function LoadingState() {
  return (
    <p
      role="status"
      className="flex items-center gap-3 p-6 text-muted-foreground"
    >
      <LoaderCircle
        aria-hidden="true"
        className="size-5 motion-safe:animate-spin"
      />
      Carregando informações…
    </p>
  );
}
export function ErrorState({ retry }: { retry: ReactNode }) {
  return (
    <div role="alert" className="space-y-4 rounded-lg border p-6">
      <CircleAlert aria-hidden="true" className="text-destructive" />
      <h2>Não foi possível carregar esta página</h2>
      <p className="text-muted-foreground">Tente novamente para continuar.</p>
      {retry}
    </div>
  );
}
export function InformationGap({ items }: { items: string[] }) {
  return (
    <Notice tone="warning" title="Informações a confirmar">
      <ul className="list-inside list-disc space-y-1">
        {items.map((item) => (
          <li key={item}>{item}</li>
        ))}
      </ul>
      <p className="mt-2">
        Informação ausente não significa ausência de condição.
      </p>
    </Notice>
  );
}
export function EvidenceDetails() {
  return (
    <details className="rounded-md border p-4 text-sm">
      <summary className="min-h-11 cursor-pointer content-center font-medium">
        Consultar evidências e origem
      </summary>
      <p className="mt-3 text-muted-foreground">
        Nenhuma evidência clínica foi carregada nesta etapa. Referências e
        regras deverão ter identificador, versão e revisão médica documentados
        antes do uso.
      </p>
    </details>
  );
}
