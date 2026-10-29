import { AnalysisStatus } from "@/features/analysis/analysis-status";
import { analyzeAndShowStatus } from "@/server/analysis/actions";
import { getAnalysisPageState } from "@/server/analysis/read";

export default async function AnalysisPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const [state, params] = await Promise.all([
    getAnalysisPageState(),
    searchParams,
  ]);
  if (state.unavailable) throw new Error("Evaluation could not be loaded");
  return (
    <AnalysisStatus
      status={state.status}
      error={params.error === "1"}
      analyzeAction={analyzeAndShowStatus}
    />
  );
}
