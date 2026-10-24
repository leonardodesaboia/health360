"use client";

import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function AnalyzeButton({ retry = false }: { retry?: boolean }) {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending
        ? "Analyzing current information…"
        : retry
          ? "Retry analysis"
          : "Analyze current profile"}
    </Button>
  );
}
