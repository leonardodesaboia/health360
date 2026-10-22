import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  EmptyState,
  Notice,
  StatusIndicator,
} from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { demoPatient } from "@/features/patients/fixtures";
export default function Plan() {
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="Meu plano"
        title="Acompanhamento preventivo"
        description="As informações do plano só podem ser disponibilizadas depois da revisão médica."
      />
      <StatusIndicator status={demoPatient.status} />
      <EmptyState
        title="Nenhum plano disponível neste exemplo"
        description="A geração de planos e o registro de decisões ainda não fazem parte desta etapa do protótipo."
        action={
          <Button asChild variant="outline">
            <Link href="/patient">Acompanhar avaliação</Link>
          </Button>
        }
      />
      <Notice title="Histórico de versões">
        Quando os ciclos de acompanhamento forem implementados, os planos
        anteriores serão preservados aqui.
      </Notice>
    </ContentContainer>
  );
}
