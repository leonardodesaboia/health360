"use client";
import { ErrorState } from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
export default function Error({ retry }: { retry: () => void }) {
  return (
    <div className="mx-auto max-w-form p-6">
      <ErrorState retry={<Button onClick={retry}>Try again</Button>} />
    </div>
  );
}
