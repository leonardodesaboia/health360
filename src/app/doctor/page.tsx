import Link from "next/link";
import { ContentContainer, PageHeader } from "@/components/layout/page";
import {
  EmptyState,
  Notice,
  StatusIndicator,
} from "@/components/shared/primitives";
import { Button } from "@/components/ui/button";
import {
  workspaceId,
  type ReviewWorkspace,
} from "@/features/clinical-review/reader";
import { queueAction } from "@/features/clinical-review/guidance";
import { getReviewQueue } from "@/server/clinical-review/reader";
import { getDemoSession } from "@/server/demo/session";

export const dynamic = "force-dynamic";

export default async function Queue() {
  const rows = await getReviewQueue();
  const session = rows.length ? null : await getDemoSession();
  return (
    <ContentContainer width="workspace">
      <PageHeader
        eyebrow="Physician workspace"
        title="Review queue"
        description="Current analyses for your selected synthetic demonstration case."
      />
      <p className="text-sm text-muted-foreground">
        Review each proposal, save decisions if needed, then finalize to publish
        the reviewed demonstration plan.
      </p>
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
                      {row.stale && (
                        <p className="mt-2">Newer information exists.</p>
                      )}
                      {row.analysis.status === "BLOCKED" && (
                        <p className="mt-2">Analysis blocked</p>
                      )}
                    </td>
                    <td className="p-6">
                      <OpenReview workspace={row} />
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
                <p className="text-xs text-muted-foreground">
                  Synthetic · Profile v{row.analysis.profileVersion}
                </p>
                {row.stale && (
                  <p className="text-sm">Newer information exists.</p>
                )}
                {row.analysis.status === "BLOCKED" && (
                  <p className="text-sm">Analysis blocked</p>
                )}
                <div>
                  <OpenReview workspace={row} />
                </div>
              </li>
            ))}
          </ul>
        </>
      ) : (
        <EmptyState
          title={session ? "No analysis is ready yet" : "No demo case selected"}
          description={
            session
              ? "Complete the confirmed intake and analysis for this synthetic case before review can begin."
              : "Choose Alex Example, Jordan Example or Daniel Example in Presenter controls to begin this synthetic demonstration."
          }
          action={
            <Button asChild>
              <Link
                href={
                  session ? "/patient/analysis" : "/patient#demo-case-title"
                }
              >
                {session ? "View patient status" : "Choose a demo case"}
              </Link>
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

function OpenReview({ workspace }: { workspace: ReviewWorkspace }) {
  const label = queueAction(workspace);
  return (
    <Button
      asChild
      variant={
        label === "Start review" || label === "Continue review"
          ? "default"
          : "outline"
      }
    >
      {/* Opening a review is a workflow write; never trigger it from a prefetch. */}
      <Link
        href={`/doctor/reviews/${encodeURIComponent(workspaceId(workspace.analysis))}`}
        prefetch={false}
      >
        {label}
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
