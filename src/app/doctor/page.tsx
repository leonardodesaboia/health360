import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  EmptyState,
  Notice,
  StatusIndicator,
} from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import { workspaceId } from "@/features/clinical-review/reader";
import { getReviewQueue } from "@/server/clinical-review/reader";

export const dynamic = "force-dynamic";

export default async function Queue() {
  const rows = await getReviewQueue();
  return (
    <ContentContainer width="workspace">
      <PageHeader
        eyebrow="Physician workspace"
        title="Review queue"
        description="Current analyses for your selected synthetic demonstration case."
      />
      {rows.length ? (
        <>
          <div className="hidden overflow-hidden rounded-lg border bg-card md:block">
            <table className="w-full text-left text-sm">
              <caption className="sr-only">
                Synthetic analyses for physician review
              </caption>
              <thead className="border-b bg-muted text-xs text-muted-foreground">
                <tr>
                  {[
                    "Patient",
                    "Analysis time (UTC)",
                    "Administrative stage",
                    "Action",
                  ].map((label) => (
                    <th
                      className="px-6 py-3 font-medium"
                      scope="col"
                      key={label}
                    >
                      {label}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {rows.map((row) => (
                  <tr key={workspaceId(row.analysis)}>
                    <td className="p-6">
                      <p className="font-medium">{row.patient.displayName}</p>
                      <p className="text-xs text-muted-foreground">
                        Synthetic · Profile v{row.analysis.profileVersion}
                      </p>
                    </td>
                    <td className="p-6 tabular-nums">
                      <time dateTime={row.analysis.createdAt}>
                        {analysisTime(row.analysis.createdAt)}
                      </time>
                    </td>
                    <td className="p-6">
                      <StatusIndicator status={row.workflowStatus} />
                      {row.stale && <p className="mt-2">Stale analysis</p>}
                      {row.analysis.status === "BLOCKED" && (
                        <p className="mt-2">Analysis blocked</p>
                      )}
                    </td>
                    <td className="p-6">
                      <OpenReview id={workspaceId(row.analysis)} />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <ul className="space-y-4 md:hidden">
            {rows.map((row) => (
              <li
                key={workspaceId(row.analysis)}
                className="space-y-4 rounded-lg border bg-card p-6"
              >
                <h2 className="text-base">{row.patient.displayName}</h2>
                <p className="text-sm tabular-nums">
                  Analysis time (UTC):{" "}
                  <time dateTime={row.analysis.createdAt}>
                    {analysisTime(row.analysis.createdAt)}
                  </time>
                </p>
                <StatusIndicator status={row.workflowStatus} />
                {row.stale && <p className="text-sm">Stale analysis</p>}
                {row.analysis.status === "BLOCKED" && (
                  <p className="text-sm">Analysis blocked</p>
                )}
                <div>
                  <OpenReview id={workspaceId(row.analysis)} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          title="No analyses to review"
          description="Select a demonstration case and complete its analysis to populate this queue."
          action={
            <Button asChild variant="outline">
              <Link href="/patient">Go to demonstration case</Link>
            </Button>
          }
        />
      )}
      <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED">
        Synthetic data only. All proposals require explicit physician review
        before a patient plan can be published.
      </Notice>
    </ContentContainer>
  );
}

function OpenReview({ id }: { id: string }) {
  return (
    <Button asChild variant="outline">
      <Link href={`/doctor/reviews/${encodeURIComponent(id)}`}>
        Open review
      </Link>
    </Button>
  );
}

function analysisTime(timestamp: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
    timeZone: "UTC",
  }).format(new Date(timestamp));
}
