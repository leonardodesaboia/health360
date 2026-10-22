import Link from "next/link";
import { notFound } from "next/navigation";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import {
  EvidenceDetails,
  InformationGap,
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import {
  demoExamination,
  demoPatient,
  demoProfile,
  demoReview,
} from "@/features/patients/fixtures";
// Only the known synthetic case exists in this foundation. Resolve unknown IDs before streaming.
export const dynamicParams = false;
export function generateStaticParams() {
  return [{ reviewId: demoReview.id }];
}
export default async function Review({
  params,
}: {
  params: Promise<{ reviewId: string }>;
}) {
  const { reviewId } = await params;
  if (reviewId !== demoReview.id) notFound();
  return (
    <ContentContainer width="workspace">
      <PageHeader
        eyebrow="Revisão clínica · Cenário sintético"
        title={demoPatient.displayName}
        description="46 anos · Perfil v1 · Informações declaradas, sem confirmação clínica"
        action={
          <Button variant="outline" asChild>
            <Link href="/doctor">Voltar à fila</Link>
          </Button>
        }
      />
      <Notice
        tone="warning"
        title="Estrutura demonstrativa, sem análise clínica"
      >
        Nenhuma proposta ou evidência médica foi gerada. Os controles de decisão
        estão indisponíveis nesta etapa.
      </Notice>
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Surface>
            <h2>Contexto da paciente</h2>
            <dl className="mt-6 divide-y text-sm">
              <div className="pb-4">
                <dt className="text-muted-foreground">
                  Histórico pessoal · Declarado
                </dt>
                <dd className="mt-1">Não informado</dd>
              </div>
              <div className="py-4">
                <dt className="text-muted-foreground">Hábitos · Declarado</dt>
                <dd className="mt-1">{demoProfile.habits[0].value}</dd>
              </div>
              <div className="py-4">
                <dt className="text-muted-foreground">Medicamentos</dt>
                <dd className="mt-1">Desconhecidos</dd>
              </div>
              <div className="pt-4">
                <dt className="text-muted-foreground">
                  Exames anteriores · Declarado
                </dt>
                <dd className="mt-1">{demoExamination.name}</dd>
                <dd className="mt-1 text-muted-foreground">
                  {demoExamination.notes}
                </dd>
              </div>
            </dl>
          </Surface>
          <InformationGap items={demoProfile.missingInformation} />
        </div>
        <div className="space-y-6">
          <Surface>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2>Propostas para revisão</h2>
              <StatusIndicator status={demoPatient.status} />
            </div>
            <p className="my-6 text-sm text-muted-foreground">
              Este espaço receberá propostas preliminares com critérios,
              justificativas e incertezas rastreáveis. Nenhum conteúdo clínico
              está disponível.
            </p>
            <EvidenceDetails />
          </Surface>
          <Surface>
            <h2>Decisão médica</h2>
            <p
              id="decision-note"
              className="mt-3 text-sm text-muted-foreground"
            >
              O registro de decisões será implementado com justificativa,
              identificação do revisor e versão da análise. A publicação exigirá
              revisão concluída.
            </p>
            <div
              className="mt-6 flex flex-wrap gap-3"
              aria-describedby="decision-note"
            >
              <Button disabled>Aprovar</Button>
              <Button disabled variant="outline">
                Modificar
              </Button>
              <Button disabled variant="outline">
                Rejeitar
              </Button>
            </div>
            <p className="mt-4 text-xs text-muted-foreground">
              Indisponível no protótipo de interface.
            </p>
          </Surface>
        </div>
      </div>
    </ContentContainer>
  );
}
