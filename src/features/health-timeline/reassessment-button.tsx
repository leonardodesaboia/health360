"use client";
import { useFormStatus } from "react-dom";
import { Button } from "@/components/ui/button";

export function ReassessmentButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending ? "Opening your update…" : "Update my information"}
    </Button>
  );
}
