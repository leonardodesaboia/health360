import Link from "next/link";
import { ContentContainer } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <ContentContainer>
      <h1>Página não encontrada</h1>
      <p>Este registro não está disponível no cenário demonstrativo.</p>
      <Button asChild>
        <Link href="/patient">Ir para o início</Link>
      </Button>
    </ContentContainer>
  );
}
