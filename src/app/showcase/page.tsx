import { DoctorShell } from "@/components/layout/shell";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
import { FormExample } from "@/components/shared/form-example";
import {
  EvidenceDetails,
  InformationGap,
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { workflowStatuses } from "@/features/workflow/workflow";
export default function Showcase() {
  return (
    <DoctorShell>
      <ContentContainer>
        <PageHeader
          eyebrow="Sistema de design"
          title="Biblioteca de componentes"
          description="Padrões compartilhados para uma interface clínica consistente e acessível."
        />
        <Surface>
          <h2>Ações e controles</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Variações visuais em estado desabilitado; o formulário abaixo
            demonstra uma ação funcional.
          </p>
          <div className="mt-6 flex flex-wrap gap-3">
            <Button disabled>Primária</Button>
            <Button disabled variant="outline">
              Secundária
            </Button>
            <Button disabled variant="ghost">
              Discreta
            </Button>
            <Button disabled variant="destructive">
              Destrutiva
            </Button>
          </div>
        </Surface>
        <Surface>
          <h2>Campos e validação</h2>
          <div className="mt-6">
            <FormExample />
          </div>
        </Surface>
        <Surface>
          <h2>Estados administrativos</h2>
          <div className="mt-6 flex flex-wrap gap-3">
            {workflowStatuses.map((status) => (
              <StatusIndicator key={status} status={status} />
            ))}
          </div>
        </Surface>
        <div className="space-y-4">
          <Notice title="Informação">
            As mensagens usam texto e ícones, sem depender apenas de cor.
          </Notice>
          <InformationGap items={["Informação desconhecida no cenário"]} />
          <EvidenceDetails />
        </div>
      </ContentContainer>
    </DoctorShell>
  );
}
