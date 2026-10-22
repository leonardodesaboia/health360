import Link from "next/link";
import { ArrowRight, FileText, Check, Circle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import { demoPatient } from "@/features/patients/fixtures";

export default function PatientHome() {
  return (
    <ContentContainer>
      <PageHeader
        eyebrow="Meu acompanhamento"
        title="Olá, Marina"
        description="Aqui você acompanha as etapas da sua avaliação preventiva."
      />
      <Surface className="grid gap-8 md:grid-cols-[1fr_auto] md:items-center">
        <div>
          <StatusIndicator status={demoPatient.status} />
          <h2 className="mt-5">Seu histórico é o ponto de partida</h2>
          <p className="mt-2 max-w-form text-sm text-muted-foreground">
            Neste exemplo, as informações de Marina Exemplo estão organizadas
            para uma futura revisão. Nenhuma análise clínica foi executada.
          </p>
          <Button asChild className="mt-6">
            <Link href="/patient/intake">
              Consultar meu histórico
              <ArrowRight aria-hidden="true" />
            </Link>
          </Button>
        </div>
        <div className="hidden size-20 items-center justify-center rounded-xl bg-secondary text-primary md:flex">
          <FileText aria-hidden="true" className="size-8" />
        </div>
      </Surface>
      <section aria-labelledby="journey-title">
        <h2 id="journey-title">Como funciona o acompanhamento</h2>
        <ol className="mt-6 grid gap-6 md:grid-cols-3">
          {[
            [
              "01",
              "Seu histórico",
              "Informações que você compartilha para contextualizar a avaliação.",
            ],
            [
              "02",
              "Revisão médica",
              "Propostas preliminares precisam ser avaliadas por um médico.",
            ],
            [
              "03",
              "Seu plano",
              "As próximas ações só ficam disponíveis após a revisão.",
            ],
          ].map(([number, title, description], i) => (
            <li key={number} className="border-t-2 pt-4">
              <span className="flex items-center gap-2 text-xs font-medium text-muted-foreground">
                {i === 0 ? (
                  <Check aria-hidden="true" className="size-4 text-primary" />
                ) : (
                  <Circle aria-hidden="true" className="size-3" />
                )}
                ETAPA {number}
              </span>
              <h3 className="mt-3">{title}</h3>
              <p className="mt-2 text-sm text-muted-foreground">
                {description}
              </p>
            </li>
          ))}
        </ol>
      </section>
      <Notice title="Sobre este exemplo">
        Marina Exemplo é uma pessoa fictícia. Os estados e registros ilustram a
        interface e não representam uma avaliação ou aprovação médica.
      </Notice>
    </ContentContainer>
  );
}
