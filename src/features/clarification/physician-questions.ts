import { fields, type FieldId } from "../health-intake/contracts";
import type { ClarificationQuestion } from "./questions";

type PhysicianQuestion = {
  proposalId: string;
  question: string;
  targetField?: string;
};
export type FreeClarificationQuestion = { id: string; label: string };

export function selectPhysicianQuestions(requests: PhysicianQuestion[]) {
  const questions: ClarificationQuestion[] = [];
  const freeQuestions: FreeClarificationQuestion[] = [];
  const unsupported: string[] = [];
  const sorted = [...requests].sort((a, b) =>
    a.proposalId.localeCompare(b.proposalId, "en-US"),
  );
  const bindings = sorted.map((request, index) => {
    if (!request.targetField) {
      const id = `physician-${index}`;
      freeQuestions.push({ id, label: request.question });
      return { ...request, answerId: id, freeText: true as const };
    }
    const definition = fields.find((field) => field.id === request.targetField);
    if (!definition) unsupported.push(request.targetField);
    else {
      const existing = questions.find((q) => q.id === definition.id);
      if (existing) existing.label += ` ${request.question}`;
      else questions.push({ ...definition, label: request.question });
    }
    return {
      ...request,
      answerId: request.targetField as FieldId,
      freeText: false as const,
    };
  });
  return { questions, freeQuestions, unsupported, bindings };
}
