import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import {
  InformationGap,
  Notice,
  Surface,
} from "@/components/shared/primitives";
import { demoPatient, demoProfile } from "@/features/patients/fixtures";
export default function Intake() {
  return (
    <ContentContainer width="form">
      <PageHeader
        eyebrow="Histórico de saúde"
        title="Informações do exemplo"
        description="Referência de apresentação do histórico. O preenchimento e o salvamento serão implementados em uma próxima etapa."
      />
      <Notice title="Somente leitura">
        Não insira dados pessoais reais. Esta página apresenta apenas
        informações sintéticas.
      </Notice>
      <Surface>
        <h2>Perfil demonstrativo</h2>
        <dl className="mt-6 space-y-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Nome fictício</dt>
            <dd className="mt-1 font-medium">{demoPatient.displayName}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Idade no cenário</dt>
            <dd className="mt-1">{demoProfile.age} anos</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">
              Hábitos · Informação declarada
            </dt>
            <dd className="mt-1">{demoProfile.habits[0].value}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Medicamentos</dt>
            <dd className="mt-1">Não informado</dd>
          </div>
        </dl>
      </Surface>
      <InformationGap items={demoProfile.missingInformation} />
      <Button variant="outline" asChild>
        <Link href="/patient">Voltar ao início</Link>
      </Button>
    </ContentContainer>
  );
}
