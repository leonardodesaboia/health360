import type { AnalysisOutcome } from "../workflow/outcome";
import { analysisOutcome } from "../workflow/outcome";
import type { ReactNode } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  InformationGap,
  Notice,
  Surface,
} from "@/components/shared/primitives";
import { formatDate } from "@/lib/format";
import { formatExaminationDate } from "../health-intake/profile";
import {
  safeEvidenceUrl,
  reviewableProposals,
  declaredFacts,
  analysisPresentation,
  type ReviewWorkspace,
} from "./reader";

import {
  provenanceLabels,
  readableConsideredData,
  uniqueDemonstrativeLabel,
  visibleLimitations,
} from "./guidance";

const categories = {
  PREVENTIVE_OPPORTUNITY: "Preventive opportunity",
  POSSIBLE_REDUNDANCY: "Possible redundant test",
  CLARIFICATION: "Clarification",
};

export function WorkspaceReader({
  workspace,
  children,
  outcome: providedOutcome,
}: {
  workspace: ReviewWorkspace;
  children?: ReactNode;
  outcome?: AnalysisOutcome | null;
}) {
  const { profile, analysis, context, contextDetails, examinations, stale } =
    workspace;
  const proposals = reviewableProposals(analysis);
  const facts = declaredFacts(profile);
  const presentation = analysisPresentation(analysis);
  const outcome = providedOutcome ?? analysisOutcome(analysis);
  const completed = Boolean(workspace.review?.completedAt);
  const pendingCount = proposals.filter((proposal) => {
    const decision = workspace.review?.decisions.find(
      (item) => item.proposalId === proposal.id,
    )?.decision;
    return !decision || decision === "PENDING" || decision === "CLARIFY";
  }).length;
  return (
    <>
      {analysis.status !== "BLOCKED" && (
        <section aria-label="Review tasks" className="space-y-3">
          <ol className="list-inside list-decimal space-y-2 text-sm">
            <li>Check context and evidence.</li>
            <li>Decide on every proposal.</li>
            <li>Finalize to publish the reviewed demonstration plan.</li>
          </ol>
          <p className="text-sm tabular-nums">
            {pendingCount.toLocaleString("en-US")} of{" "}
            {proposals.length.toLocaleString("en-US")} proposals still need a
            decision in the recorded review.
          </p>
          <nav aria-label="Review sections" className="flex flex-wrap gap-3">
            <Button asChild variant="outline">
              <a href="#review-proposals">Go to proposals and evidence</a>
            </Button>
            <Button asChild variant="outline">
              <a href="#physician-decisions-heading">
                Go to physician decisions
              </a>
            </Button>
          </nav>
        </section>
      )}
      <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED" tone="warning">
        {analysis.status === "BLOCKED"
          ? "Synthetic data. This analysis is blocked. System and rule context are shown without an AI recommendation. A demo reviewer does not provide clinical validation."
          : completed
            ? "Synthetic data. Original AI text remains preliminary; the recorded physician decisions determine the reviewed plan. A demo reviewer does not provide clinical validation."
            : "Synthetic data. AI-generated proposals are preliminary and require physician review. A demo reviewer does not provide clinical validation."}
      </Notice>
      {stale && (
        <Notice title="Newer information exists." tone="warning">
          These decisions cannot be finalized. Return to the queue and open the
          latest analysis.
          <div className="mt-3">
            <Button asChild>
              <Link href="/doctor">Back to queue</Link>
            </Button>
          </div>
        </Notice>
      )}
      {analysis.status === "BLOCKED" && (
        <Notice
          title="This analysis cannot be reviewed or published."
          tone="warning"
        >
          <p>{outcome?.explanation}</p>
          <p className="mt-3 text-xs text-muted-foreground">
            {outcome?.provenance}
          </p>
          <p className="mt-3">
            Read-only result. There are no decisions to save or finalize.
          </p>
          <p className="mt-3">
            Demo role navigation only; no sign-in or authorization.
          </p>
          <div className="mt-3">
            <Button asChild>
              <Link href="/patient/analysis">View patient status</Link>
            </Button>
          </div>
        </Notice>
      )}
      <div className="grid items-start gap-8 lg:grid-cols-2">
        <div className="space-y-6">
          <Surface>
            <h2>Patient context</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              System-structured profile v{profile.version} · Updated{" "}
              {formatDate(profile.updatedAt)}
            </p>
            <dl className="mt-6 divide-y text-sm">
              <div className="pb-4">
                <dt className="text-muted-foreground">
                  Age · Patient-reported
                </dt>
                <dd>{profile.age ?? "Unknown"}</dd>
              </div>
              {(
                [
                  ["Personal history", profile.personalHistory],
                  ["Family history", profile.familyHistory],
                  ["Medications", profile.medications],
                  ["Habits", profile.habits],
                ] as const
              ).map(([label, items]) => (
                <div className="py-4" key={label}>
                  <dt className="text-muted-foreground">{label}</dt>
                  <dd>
                    {items.length ? (
                      <ul className="space-y-2">
                        {items.map((item, i) => (
                          <li key={i}>
                            {item.value ?? "Unknown"}{" "}
                            <span className="text-xs text-muted-foreground">
                              · {provenanceLabels[item.provenance]}
                            </span>
                          </li>
                        ))}
                      </ul>
                    ) : (
                      "Unknown"
                    )}
                  </dd>
                </div>
              ))}
            </dl>
            {facts.length > 0 && (
              <details className="mt-4 border-t pt-4 text-sm">
                <summary className="min-h-11 cursor-pointer content-center font-medium">
                  View declared screening facts
                </summary>
                <p className="mt-3 text-muted-foreground">
                  Patient-reported; unknown answers remain unknown.
                </p>
                <dl className="mt-3 space-y-3">
                  {facts.map((fact) => (
                    <div key={fact.id}>
                      <dt className="text-muted-foreground">{fact.label}</dt>
                      <dd>{fact.text}</dd>
                    </div>
                  ))}
                </dl>
              </details>
            )}
            <h3 className="mt-6">Previous examinations</h3>
            {examinations.length ? (
              examinations.map((exam) => (
                <div key={exam.id} className="mt-4 space-y-1 text-sm">
                  <p className="font-medium">{exam.name}</p>
                  <p>
                    Date:{" "}
                    {formatExaminationDate(
                      exam.performedAt,
                      exam.approximateDate,
                    )}
                  </p>
                  <p>
                    Result: {exam.result.value ?? "Unknown"} · Patient-reported
                  </p>
                  <p className="text-muted-foreground">{exam.notes}</p>
                </div>
              ))
            ) : (
              <p className="mt-3 text-sm">
                No examination information available.
              </p>
            )}
          </Surface>
          <InformationGap
            items={[
              ...new Set([
                ...profile.missingInformation,
                ...analysis.missingInformation,
              ]),
            ]}
          />
        </div>
        <div className="space-y-6">
          <Surface>
            <h2>{presentation.summaryHeading}</h2>
            <p className="mt-3 text-sm">
              {uniqueDemonstrativeLabel(
                outcome?.explanation ?? analysis.summary,
              )}
            </p>
            <p className="mt-3 text-xs text-muted-foreground">
              {presentation.summaryProvenance} · Analysis v{analysis.version} ·
              Profile v{analysis.profileVersion} · Context v
              {analysis.contextVersion} ·
              {presentation.showProvider ? "Prompt" : "Configured prompt"} v
              {analysis.promptVersion}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {presentation.showProvider && (
                <span>
                  {analysis.provider} / {analysis.model};{" "}
                </span>
              )}
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "UTC",
              }).format(new Date(analysis.createdAt))}{" "}
              UTC
            </p>
            <details className="mt-4 border-t pt-4 text-sm">
              <summary className="min-h-11 cursor-pointer content-center font-medium">
                View relevant information and uncertainty
              </summary>
              <TextList
                items={analysis.relevantInformation}
                empty="No additional relevant information recorded."
              />
              <TextList
                items={visibleLimitations(analysis.uncertainties)}
                empty="No additional uncertainty recorded; this is not clinical confirmation."
              />
              <TextList
                items={analysis.reviewQuestions}
                empty="No review questions recorded."
              />
            </details>
          </Surface>
          <Surface>
            <h2 id="review-proposals" tabIndex={-1} className="scroll-mt-6">
              Proposals for review
            </h2>
            <p className="mt-3 text-sm text-muted-foreground">
              {analysis.status === "BLOCKED"
                ? "This blocked result contains no reviewable proposals."
                : completed
                  ? "Original proposal text; see the finalized physician decisions below."
                  : "Preliminary proposals, awaiting physician review."}
            </p>
            {!proposals.length && (
              <p className="mt-4 text-sm">No proposals available.</p>
            )}
            {proposals.map((proposal) => (
              <article className="mt-6 border-t pt-6" key={proposal.id}>
                <p className="text-xs text-muted-foreground">
                  {categories[proposal.category]} ·{" "}
                  {completed
                    ? "Original preliminary proposal"
                    : "Awaiting physician review"}
                </p>
                <h3 className="mt-2">{proposal.title}</h3>
                <dl className="mt-3 space-y-1 text-xs">
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted-foreground">
                      Rule-generated
                    </dt>
                    <dd className="min-w-0 break-words tabular-nums">
                      {proposal.ruleIds.length
                        ? proposal.ruleIds
                            .map((id) => {
                              const rule = contextDetails?.rules.find(
                                (item) => item.id === id,
                              );
                              return rule
                                ? `${rule.id} v${rule.version}`
                                : `${id} (context v${context.version})`;
                            })
                            .join(", ")
                        : "No rule reference supplied"}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted-foreground">
                      Evidence
                    </dt>
                    <dd className="tabular-nums">
                      {proposal.evidenceIds.length
                        ? `${proposal.evidenceIds.length} ${proposal.evidenceIds.length === 1 ? "source" : "sources"}`
                        : "Placeholder — no source supplied"}
                    </dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted-foreground">
                      AI-generated
                    </dt>
                    <dd>Explanation wording only</dd>
                  </div>
                  <div className="flex gap-3">
                    <dt className="w-28 shrink-0 text-muted-foreground">
                      Validation
                    </dt>
                    <dd>DEMONSTRATIVE — NOT CLINICALLY VALIDATED</dd>
                  </div>
                </dl>
                <details className="mt-4 text-sm">
                  <summary className="min-h-11 cursor-pointer content-center font-medium">
                    View rationale and criteria
                  </summary>
                  <p className="mt-3">{proposal.rationale}</p>
                  <p className="mt-3 font-medium">
                    Rule-generated criteria · Context v{context.version}
                  </p>
                  <TextList
                    items={proposal.ruleIds}
                    empty="No rule references supplied."
                  />
                  {proposal.ruleIds.map((id) => {
                    const rule = contextDetails?.rules.find(
                      (item) => item.id === id,
                    );
                    return rule ? (
                      <p className="mt-3" key={id}>
                        {rule.id} · Rule v{rule.version} · Configured age range{" "}
                        {rule.minAge}–{rule.maxAge} · Routine interval{" "}
                        {rule.intervalYears} years. These demonstrative
                        parameters alone do not establish eligibility; review
                        exclusions, patient context and uncertainty.
                      </p>
                    ) : (
                      <p className="mt-3" key={id}>
                        Rule details unavailable for {id}.
                      </p>
                    );
                  })}
                  <p className="mt-3 font-medium">Data considered</p>
                  <TextList
                    items={readableConsideredData(
                      proposal.consideredData,
                      profile.intakeFacts?.priorScreening === "COLONOSCOPY",
                    )}
                    empty="No considered data recorded."
                  />
                  <p className="mt-3 font-medium">
                    Uncertainty and limitations
                  </p>
                  <TextList
                    items={visibleLimitations(
                      proposal.uncertainties,
                      proposal.category,
                    )}
                    empty="No uncertainty supplied; physician review is still required."
                  />
                </details>
                <details className="mt-3 text-sm">
                  <summary className="min-h-11 cursor-pointer content-center font-medium">
                    View evidence and sources
                  </summary>
                  {!proposal.evidenceIds.length && (
                    <p className="mt-3">
                      Evidence: placeholder — no source supplied.
                    </p>
                  )}
                  {proposal.evidenceIds.map((id) => {
                    const source = context.evidence.find((e) => e.id === id);
                    const metadata = contextDetails?.evidence.find(
                      (e) =>
                        e.id === id &&
                        e.version === source?.version &&
                        e.sourceUrl === source?.sourceUrl &&
                        e.title === source?.title,
                    );
                    const url = safeEvidenceUrl(source?.sourceUrl ?? null);
                    return (
                      <div className="mt-3 space-y-2 break-words" key={id}>
                        <p>
                          {source?.title ?? id} ·{" "}
                          {source
                            ? `Evidence v${source.version}`
                            : "Version unknown"}
                        </p>
                        <p>
                          {metadata
                            ? `${metadata.issuer} · ${metadata.year}`
                            : "Issuer and year unavailable; source metadata is unverified."}
                        </p>
                        {metadata?.evidenceStatus === "placeholder" && (
                          <p>
                            Evidence: placeholder — cannot support publication.
                          </p>
                        )}
                        {url ? (
                          <a
                            className="inline-flex min-h-11 items-center underline"
                            href={url}
                            target="_blank"
                            rel="noreferrer"
                          >
                            Open source: {id}
                          </a>
                        ) : (
                          <p>Evidence: placeholder — source unavailable.</p>
                        )}
                        <p className="text-muted-foreground">
                          Demonstrative source mapping.{" "}
                          {source?.medicallyReviewed
                            ? "Recorded as physician-reviewed; not clinical validation."
                            : "Not medically validated."}
                        </p>
                      </div>
                    );
                  })}
                </details>
              </article>
            ))}
          </Surface>
          {analysis.status !== "BLOCKED" && children}
        </div>
      </div>
    </>
  );
}

function TextList({ items, empty }: { items: string[]; empty: string }) {
  return items.length ? (
    <ul className="mt-3 list-inside list-disc space-y-2">
      {items.map((item, i) => (
        <li key={i}>{item}</li>
      ))}
    </ul>
  ) : (
    <p className="mt-3 text-muted-foreground">{empty}</p>
  );
}
