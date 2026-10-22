import Link from "next/link";
import { ArrowUpRight } from "lucide-react";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Notice, StatusIndicator } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { demoPatient, demoReview } from "@/features/patients/fixtures";
export default function Queue() {
  return (
    <ContentContainer width="workspace">
      <PageHeader
        eyebrow="Ambiente médico"
        title="Fila de revisões"
        description="Contexto organizado para apoiar a revisão. Todos os registros abaixo são fictícios."
      />
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="hidden grid-cols-[2fr_1fr_2fr_auto] gap-4 border-b bg-muted px-6 py-3 text-xs font-medium text-muted-foreground md:grid">
          <span>Paciente</span>
          <span>Registro do exemplo</span>
          <span>Etapa administrativa</span>
          <span>Ação</span>
        </div>
        <article className="grid items-center gap-4 p-6 md:grid-cols-[2fr_1fr_2fr_auto]">
          <div>
            <h2 className="text-base">{demoPatient.displayName}</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              Cenário sintético · Perfil v1
            </p>
          </div>
          <p className="text-sm tabular-nums">
            <span className="md:sr-only">Registro: </span>
            {demoReview.submittedAt}
          </p>
          <div>
            <StatusIndicator status={demoPatient.status} />
          </div>
          <Button asChild variant="outline">
            <Link href={`/doctor/reviews/${demoReview.id}`}>
              Abrir revisão
              <ArrowUpRight aria-hidden="true" />
            </Link>
          </Button>
        </article>
      </div>
      <Notice title="Workspace de referência">
        A fila ilustra uma organização futura do trabalho. Não há análise
        executada, decisão persistida ou validação clínica neste ambiente.
      </Notice>
    </ContentContainer>
  );
}
