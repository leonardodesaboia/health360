import Link from "next/link";
import { ContentContainer } from "@/components/layout/page";
import { Button } from "@/components/ui/button";
export default function NotFound() {
  return (
    <ContentContainer>
      <h1>Page not found</h1>
      <p>This record is not available in the demonstration scenario.</p>
      <Button asChild>
        <Link href="/patient">Go to home</Link>
      </Button>
    </ContentContainer>
  );
}
