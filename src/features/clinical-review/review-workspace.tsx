"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  ArrowRight,
  CheckCircle2,
  ClipboardCheck,
  ExternalLink,
  FileCheck2,
  LoaderCircle,
  ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  InformationGap,
  Notice,
  StatusIndicator,
  Surface,
} from "@/components/shared/primitives";
import type {
  AIAnalysis,
  HealthProfile,
  MedicalReview,
  Patient,
  PreventivePlan,
  PreviousExamination,
  RecommendationProposal,
} from "@/features/patients/contracts";
import type { WorkflowStatus } from "@/features/workflow/workflow";
import { formatDate } from "@/lib/format";
import { cn } from "@/lib/utils";
import { submitMedicalReviewAction } from "@/server/clinical-review/actions";
import type { DecisionValue } from "@/server/clinical-review/service";
import type { DemoContext } from "@/server/clinical-rules/contracts";
import type { DemoCaseId } from "@/server/demo/contracts";

type ProposalFormState = {
  decision: DecisionValue;
  reason: string;
  revisedText: string;
};

function defaultRationaleForProposal(
  proposal: RecommendationProposal,
  decision: DecisionValue,
): string {
  if (decision === "APPROVE") {
    return proposal.category === "POSSIBLE_REDUNDANCY"
      ? "Asymptomatic average-risk synthetic patient with normal complete colonoscopy in Nov 2022; routine repeat colonoscopy is redundant before the 10-year guideline interval (2032)."
      : "Asymptomatic average-risk synthetic patient aged 50 with no prior colorectal screening; approve preventive screening discussion per USPSTF 2021.";
  }
  if (decision === "MODIFY") {
    return proposal.category === "POSSIBLE_REDUNDANCY"
      ? "Clarified patient-facing explanation of the 10-year colonoscopy interval and alarm symptom precautions."
      : "Adjusted patient-facing wording to present colorectal screening options clearly for the follow-up plan.";
  }
  if (decision === "REJECT") {
    return "Proposal excluded from the published patient plan after demonstration physician review.";
  }
  return "Additional patient confirmation is required before finalizing this screening recommendation.";
}

export function ReviewWorkspace({
  caseId,
  patient,
  status,
  profile,
  examinations,
  clinicalContext,
  analysis,
  existingReview,
  publishedPlan,
  isCurrentAnalysis,
}: {
  caseId: DemoCaseId;
  patient: Patient;
  status: WorkflowStatus;
  profile: HealthProfile;
  examinations: PreviousExamination[];
  clinicalContext: DemoContext;
  analysis: AIAnalysis;
  existingReview: MedicalReview | null;
  publishedPlan: PreventivePlan | null;
  isCurrentAnalysis: boolean;
}) {
  const router = useRouter();
  const [isPending, startTransition] = useTransition();
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [submissionOutcome, setSubmissionOutcome] = useState<
    "PUBLISHED" | "CLARIFICATION_REQUESTED" | null
  >(publishedPlan ? "PUBLISHED" : null);

  const initialDecisions = Object.fromEntries(
    analysis.proposals.map((proposal) => {
      const saved = existingReview?.decisions.find(
        (d) => d.proposalId === proposal.id,
      );
      const initialDecision: DecisionValue =
        saved &&
        (saved.decision === "APPROVE" ||
          saved.decision === "MODIFY" ||
          saved.decision === "REJECT" ||
          saved.decision === "CLARIFY")
          ? saved.decision
          : "APPROVE";
      return [
        proposal.id,
        {
          decision: initialDecision,
          reason:
            saved?.reason ??
            defaultRationaleForProposal(proposal, initialDecision),
          revisedText: saved?.revisedText ?? proposal.title,
        } satisfies ProposalFormState,
      ];
    }),
  ) as Record<string, ProposalFormState>;

  const [decisions, setDecisions] =
    useState<Record<string, ProposalFormState>>(initialDecisions);

  const canEdit =
    isCurrentAnalysis &&
    !publishedPlan &&
    submissionOutcome === null &&
    (status === "MEDICAL_REVIEW_PENDING" ||
      status === "MEDICAL_REVIEW_IN_PROGRESS");

  const missingItems = [
    ...new Set([...profile.missingInformation, ...analysis.missingInformation]),
  ];

  const facts = profile.intakeFacts;
  const hasAlarmSymptoms =
    facts &&
    [facts.rectalBleeding, facts.bowelChange, facts.weightLoss].includes(true);
  const hasRiskHistory =
    facts &&
    [
      facts.colorectalCancer,
      facts.polyps,
      facts.ibd,
      facts.hereditaryCancerSyndrome,
      facts.serratedPolyposis,
      facts.familyCrc,
      facts.familySyndrome,
    ].includes(true);

  function updateProposalDecision(
    proposal: RecommendationProposal,
    nextDecision: DecisionValue,
  ) {
    setDecisions((prev) => {
      const current = prev[proposal.id];
      const shouldReplaceDefaultReason =
        !current?.reason.trim() ||
        current.reason ===
          defaultRationaleForProposal(proposal, current.decision);
      return {
        ...prev,
        [proposal.id]: {
          decision: nextDecision,
          reason: shouldReplaceDefaultReason
            ? defaultRationaleForProposal(proposal, nextDecision)
            : current.reason,
          revisedText: current?.revisedText || proposal.title,
        },
      };
    });
  }

  function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setErrorMessage(null);
    startTransition(async () => {
      const payload = {
        analysisId: analysis.id,
        analysisVersion: analysis.version,
        decisions: analysis.proposals.map((proposal) => {
          const state = decisions[proposal.id];
          return {
            proposalId: proposal.id,
            decision: state.decision,
            reason: state.reason,
            revisedText: state.decision === "MODIFY" ? state.revisedText : null,
          };
        }),
      };
      const result = await submitMedicalReviewAction(payload);
      if (result.status === "PUBLISHED") {
        setSubmissionOutcome("PUBLISHED");
        router.refresh();
      } else if (result.status === "CLARIFICATION_REQUESTED") {
        setSubmissionOutcome("CLARIFICATION_REQUESTED");
        router.refresh();
      } else {
        setErrorMessage(result.message);
      }
    });
  }

  const anyClarifySelected = analysis.proposals.some(
    (p) => decisions[p.id]?.decision === "CLARIFY",
  );

  return (
    <div className="space-y-8">
      {submissionOutcome === "PUBLISHED" || publishedPlan ? (
        <div
          role="status"
          className="flex flex-wrap items-center justify-between gap-4 rounded-lg border bg-success p-5 text-success-foreground"
        >
          <div className="flex items-start gap-3">
            <CheckCircle2
              aria-hidden="true"
              className="mt-0.5 size-5 shrink-0"
            />
            <div>
              <p className="font-semibold">
                Demonstration physician review finalized · Plan published
              </p>
              <p className="mt-1 text-sm">
                Reviewed decisions have been atomically published to the
                patient&apos;s preventive plan (Profile v
                <span className="tabular-nums">{profile.version}</span> ·
                Analysis v
                <span className="tabular-nums">{analysis.version}</span>).
                Demonstration review is not clinical validation.
              </p>
            </div>
          </div>
          <Button asChild>
            <Link href="/patient/plan">
              View published patient plan
              <ArrowRight aria-hidden="true" className="size-4" />
            </Link>
          </Button>
        </div>
      ) : submissionOutcome === "CLARIFICATION_REQUESTED" ||
        status === "CLARIFICATION_REQUIRED" ? (
        <Notice tone="warning" title="Clarification requested from patient">
          This evaluation is awaiting complementary patient information before a
          preventive plan can be published.
        </Notice>
      ) : (
        <Notice title="Physician-in-the-loop review required">
          Preliminary rule and AI proposals are never shown directly to the
          patient. Verify the structured clinical context, evidence sources and
          uncertainties below before recording a final decision.
        </Notice>
      )}

      <div className="grid items-start gap-8 lg:grid-cols-2">
        {/* LEFT PANEL: PATIENT CONTEXT & PROVENANCE */}
        <div className="space-y-6">
          <Surface>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2>Patient context</h2>
              <span className="rounded-sm bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                Provenance: Patient-reported
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Scenario: <span className="font-medium">{caseId}</span> · Profile
              v<span className="tabular-nums">{profile.version}</span> · Updated{" "}
              <span className="tabular-nums">
                {formatDate(profile.updatedAt.slice(0, 10))}
              </span>
            </p>

            <dl className="mt-6 divide-y text-sm">
              <div className="pb-4">
                <dt className="text-muted-foreground">
                  Age & baseline eligibility · Patient-reported
                </dt>
                <dd className="mt-1 font-medium tabular-nums">
                  {profile.age !== null
                    ? `${profile.age} years old (Average-risk screening window: 45–75 years)`
                    : "Unknown age"}
                </dd>
              </div>

              <div className="py-4">
                <dt className="text-muted-foreground">
                  Alarm symptoms & clinical red flags · Patient-reported
                </dt>
                <dd className="mt-1">
                  {hasAlarmSymptoms
                    ? "Positive symptom reported (rectal bleeding, bowel habit change, or weight loss)"
                    : "No alarm symptoms reported (denies rectal bleeding, bowel habit change, or unexplained weight loss)"}
                </dd>
              </div>

              <div className="py-4">
                <dt className="text-muted-foreground">
                  Personal & family colorectal risk · Patient-reported
                </dt>
                <dd className="mt-1">
                  {hasRiskHistory
                    ? "Increased personal or family risk history reported"
                    : "No personal or family history of colorectal cancer, adenomatous polyps, IBD, or hereditary syndromes"}
                </dd>
              </div>

              <div className="py-4">
                <dt className="text-muted-foreground">
                  Habits & medications · Patient-reported
                </dt>
                <dd className="mt-1">
                  {profile.habits
                    .map((h) => h.value)
                    .filter(Boolean)
                    .join(" · ") ||
                    "No smoking risk reported; regular physical activity"}
                </dd>
                <dd className="mt-1 text-xs text-muted-foreground">
                  Medications:{" "}
                  {profile.medications
                    .map((m) => m.value)
                    .filter(Boolean)
                    .join(", ") || "None declared"}
                </dd>
              </div>

              <div className="pt-4">
                <dt className="text-muted-foreground">
                  Previous examinations · Patient-reported
                </dt>
                {examinations.length > 0 ? (
                  <div className="mt-2 space-y-3">
                    {examinations.map((exam) => (
                      <div
                        key={exam.id}
                        className="rounded-md border bg-muted p-3"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium">{exam.name}</span>
                          <span className="rounded-sm bg-card px-2 py-0.5 text-xs font-medium tabular-nums">
                            Date:{" "}
                            {exam.performedAt
                              ? formatDate(exam.performedAt)
                              : (exam.approximateDate ?? "Unknown")}
                          </span>
                        </div>
                        <p className="mt-1 text-xs font-medium">
                          Result: {exam.result.value ?? "Unknown"}
                          {facts?.colonoscopyComplete === true
                            ? " · Complete to cecum"
                            : ""}
                          {facts?.colonoscopyAdequatePrep === true
                            ? " · Adequate bowel preparation"
                            : ""}
                        </p>
                        <p className="mt-1 text-xs text-muted-foreground">
                          {exam.notes}
                        </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <dd className="mt-1">
                    No previous colorectal screening examination reported (
                    <span className="font-medium">NEVER_SCREENED</span>).
                  </dd>
                )}
              </div>
            </dl>
          </Surface>

          <Surface>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <h2>Structured audit trail & limitations</h2>
              <span className="rounded-sm bg-secondary px-2.5 py-1 text-xs font-medium text-secondary-foreground">
                Provenance: System-structured
              </span>
            </div>
            <p className="mt-2 text-xs text-muted-foreground">
              Facts evaluated by deterministic rule engine before LLM
              structuring (Provider: {analysis.provider} · Model:{" "}
              {analysis.model}).
            </p>
            <ul className="mt-4 list-inside list-disc space-y-1.5 text-xs text-muted-foreground tabular-nums">
              {analysis.relevantInformation.map((item, idx) => (
                <li key={idx}>{item}</li>
              ))}
            </ul>
            {analysis.uncertainties.length > 0 && (
              <div className="mt-4 border-t pt-4">
                <p className="text-xs font-medium">
                  Clinical limitations & verification requirements
                </p>
                <ul className="mt-2 list-inside list-disc space-y-1 text-xs text-muted-foreground">
                  {analysis.uncertainties.map((u, idx) => (
                    <li key={idx}>{u}</li>
                  ))}
                </ul>
              </div>
            )}
          </Surface>

          {missingItems.length > 0 && <InformationGap items={missingItems} />}
        </div>

        {/* RIGHT PANEL: AI PROPOSALS, DO NOT TEST INTELLIGENCE & PHYSICIAN DECISION */}
        <form onSubmit={handleSubmit} className="space-y-6">
          <Surface>
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h2>Proposals for review</h2>
              <StatusIndicator status={patient.status} />
            </div>
            <p className="mt-2 text-sm text-muted-foreground">
              {analysis.summary}
            </p>

            <div className="mt-6 space-y-6">
              {analysis.proposals.map((proposal) => {
                const isRedundancy =
                  proposal.category === "POSSIBLE_REDUNDANCY";
                const state = decisions[proposal.id];
                const linkedEvidence = clinicalContext.evidence.filter((ev) =>
                  proposal.evidenceIds.includes(ev.id),
                );

                return (
                  <article
                    key={proposal.id}
                    className="space-y-5 rounded-lg border bg-background p-5"
                  >
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <span
                        className={cn(
                          "inline-flex items-center gap-1.5 rounded-sm px-2.5 py-1 text-xs font-semibold",
                          isRedundancy
                            ? "bg-success text-success-foreground"
                            : "bg-secondary text-secondary-foreground",
                        )}
                      >
                        {isRedundancy ? (
                          <ShieldCheck aria-hidden="true" className="size-4" />
                        ) : (
                          <ClipboardCheck
                            aria-hidden="true"
                            className="size-4"
                          />
                        )}
                        {isRedundancy
                          ? "DO NOT TEST INTELLIGENCE · POSSIBLE REDUNDANCY"
                          : "PREVENTIVE SCREENING OPPORTUNITY"}
                      </span>
                      <span className="text-xs text-muted-foreground tabular-nums">
                        Rule: {proposal.ruleIds.join(", ")} · Provenance: Rule +
                        AI
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-semibold">
                        {proposal.title}
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        {proposal.rationale}
                      </p>
                    </div>

                    {isRedundancy && (
                      <div className="rounded-md border bg-success p-3.5 text-xs text-success-foreground">
                        <p className="font-semibold">
                          Clinical protection — Unnecessary examination filtered
                        </p>
                        <p className="mt-1">
                          A normal, complete colonoscopy with adequate bowel
                          preparation in November 2022 supports a{" "}
                          <span className="font-medium tabular-nums">
                            10-year
                          </span>{" "}
                          follow-up interval for average-risk patients. Avoiding
                          an early repeat colonoscopy protects the patient from
                          unnecessary bowel preparation, sedation and procedural
                          perforation risk, pending physician verification of
                          the original report.
                        </p>
                      </div>
                    )}

                    <details className="rounded-md border bg-card p-4 text-sm">
                      <summary className="min-h-11 cursor-pointer content-center font-medium">
                        View evidence and sources ({linkedEvidence.length})
                      </summary>
                      <div className="mt-3 space-y-3 border-t pt-3">
                        {linkedEvidence.map((source) => (
                          <div key={source.id} className="space-y-1 text-xs">
                            <p className="font-semibold">
                              {source.title} ({source.year})
                            </p>
                            <p className="text-muted-foreground">
                              Issuer: {source.issuer} · Evidence ID:{" "}
                              <span className="font-mono">{source.id}</span> (v
                              <span className="tabular-nums">
                                {source.version}
                              </span>
                              )
                            </p>
                            <p className="text-muted-foreground">
                              Validation: DEMONSTRATIVE — NOT CLINICALLY
                              VALIDATED
                            </p>
                            {source.sourceUrl && (
                              <a
                                href={source.sourceUrl}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-flex min-h-11 items-center gap-1 font-medium text-primary underline underline-offset-4"
                              >
                                Open public guideline source
                                <ExternalLink
                                  aria-hidden="true"
                                  className="size-3.5"
                                />
                              </a>
                            )}
                          </div>
                        ))}
                      </div>
                    </details>

                    {/* DECISION CONTROLS FOR THIS PROPOSAL */}
                    <fieldset
                      disabled={!canEdit || isPending}
                      className="space-y-4 border-t pt-4"
                    >
                      <legend className="text-sm font-semibold">
                        Physician decision for this proposal
                      </legend>

                      <div className="grid gap-2.5 sm:grid-cols-2">
                        {(
                          [
                            [
                              "APPROVE",
                              isRedundancy
                                ? "Approve redundancy (Keep Do Not Test)"
                                : "Approve recommendation",
                            ],
                            ["MODIFY", "Modify proposal wording"],
                            ["REJECT", "Reject and exclude from plan"],
                            ["CLARIFY", "Request patient clarification"],
                          ] as const
                        ).map(([value, label]) => {
                          const checked = state?.decision === value;
                          return (
                            <label
                              key={value}
                              className={cn(
                                "flex min-h-11 cursor-pointer items-center gap-2.5 rounded-md border px-3 py-2 text-xs font-medium transition-colors",
                                checked
                                  ? value === "APPROVE"
                                    ? "border-input bg-success text-success-foreground"
                                    : "border-input bg-secondary text-secondary-foreground"
                                  : "bg-card hover:bg-muted",
                                (!canEdit || isPending) &&
                                  "cursor-not-allowed opacity-70",
                              )}
                            >
                              <input
                                type="radio"
                                name={`decision-${proposal.id}`}
                                value={value}
                                checked={checked}
                                onChange={() =>
                                  updateProposalDecision(proposal, value)
                                }
                                className="size-4 accent-primary"
                              />
                              <span>{label}</span>
                            </label>
                          );
                        })}
                      </div>

                      {state?.decision === "MODIFY" && (
                        <div className="space-y-1.5">
                          <label
                            htmlFor={`revised-${proposal.id}`}
                            className="block text-xs font-medium"
                          >
                            Revised patient-facing wording (required for Modify)
                          </label>
                          <textarea
                            id={`revised-${proposal.id}`}
                            rows={2}
                            value={state.revisedText}
                            onChange={(e) =>
                              setDecisions((prev) => ({
                                ...prev,
                                [proposal.id]: {
                                  ...prev[proposal.id],
                                  revisedText: e.target.value,
                                },
                              }))
                            }
                            className="w-full rounded-md border border-input bg-card p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                          />
                        </div>
                      )}

                      <div className="space-y-1.5">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <label
                            htmlFor={`reason-${proposal.id}`}
                            className="block text-xs font-medium"
                          >
                            Mandatory clinical justification & audit note
                          </label>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() =>
                                setDecisions((prev) => ({
                                  ...prev,
                                  [proposal.id]: {
                                    ...prev[proposal.id],
                                    reason: defaultRationaleForProposal(
                                      proposal,
                                      state.decision,
                                    ),
                                  },
                                }))
                              }
                              className="text-xs font-medium text-primary underline underline-offset-4"
                            >
                              Reset standard clinical note
                            </button>
                          )}
                        </div>
                        <textarea
                          id={`reason-${proposal.id}`}
                          rows={2}
                          required
                          value={state?.reason ?? ""}
                          onChange={(e) =>
                            setDecisions((prev) => ({
                              ...prev,
                              [proposal.id]: {
                                ...prev[proposal.id],
                                reason: e.target.value,
                              },
                            }))
                          }
                          placeholder="Enter clinical rationale for audit record..."
                          className="w-full rounded-md border border-input bg-card p-3 text-sm focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring"
                        />
                      </div>
                    </fieldset>
                  </article>
                );
              })}
            </div>
          </Surface>

          <Surface>
            <h2>Finalize review & publication gate</h2>
            <p className="mt-2 text-sm text-muted-foreground">
              Reviewer attribution:{" "}
              <span className="font-medium text-foreground">
                Dr. Helena Rostand (Synthetic Reviewer ID:
                demo-physician-rostand)
              </span>{" "}
              · DEMONSTRATIVE — NOT CLINICALLY VALIDATED.
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              Finalizing this review records an immutable{" "}
              <span className="font-mono">MedicalReview</span> and invokes{" "}
              <span className="font-mono">publishReviewedPlan</span> inside the
              dataset transaction so the patient can view the approved plan.
            </p>

            {errorMessage && (
              <p
                role="alert"
                className="mt-4 rounded-md border border-destructive bg-card p-3 text-sm font-medium text-destructive"
              >
                {errorMessage}
              </p>
            )}

            <div className="mt-6 flex flex-wrap items-center gap-3">
              {canEdit ? (
                <Button type="submit" disabled={isPending}>
                  {isPending ? (
                    <>
                      <LoaderCircle
                        aria-hidden="true"
                        className="size-4 motion-safe:animate-spin"
                      />
                      Recording review & publishing…
                    </>
                  ) : (
                    <>
                      <FileCheck2 aria-hidden="true" className="size-4" />
                      {anyClarifySelected
                        ? "Submit clarification request"
                        : "Finalize review and publish plan"}
                    </>
                  )}
                </Button>
              ) : (
                <Button asChild variant="outline">
                  <Link href="/patient/plan">
                    Open patient preventive plan
                    <ArrowRight aria-hidden="true" className="size-4" />
                  </Link>
                </Button>
              )}

              <Button asChild variant="outline">
                <Link href="/doctor">Back to queue</Link>
              </Button>
            </div>
          </Surface>
        </form>
      </div>
    </div>
  );
}
