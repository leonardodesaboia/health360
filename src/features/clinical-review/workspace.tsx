import {
  InformationGap,
  Notice,
  Surface,
} from "@/components/shared/primitives";
import { formatDate } from "@/lib/format";
import { safeEvidenceUrl, type ReviewWorkspace } from "./reader";

const provenanceLabels = {
  PATIENT_REPORTED: "Patient-reported",
  SYSTEM_STRUCTURED: "System-structured",
  RULE_GENERATED: "Rule-generated",
  AI_GENERATED: "AI-generated",
  PHYSICIAN_REVIEWED: "Physician-reviewed",
};

const categories = {
  PREVENTIVE_OPPORTUNITY: "Preventive opportunity",
  POSSIBLE_REDUNDANCY: "Possible redundant test",
  CLARIFICATION: "Clarification",
};

export function WorkspaceReader({ workspace }: { workspace: ReviewWorkspace }) {
  const { profile, analysis, context, examinations, stale } = workspace;
  return (
    <>
      <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED" tone="warning">
        Synthetic data. AI-generated proposals are preliminary and require
        physician review. A demo reviewer does not provide clinical validation.
      </Notice>
      {stale && (
        <Notice title="Stale analysis" tone="warning">
          Newer information exists. Decisions must use the current profile,
          context and analysis versions.
        </Notice>
      )}
      {analysis.status === "BLOCKED" && (
        <Notice title="Analysis blocked" tone="warning">
          This analysis cannot be finalized or published.
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
            <h3 className="mt-6">Previous examinations</h3>
            {examinations.length ? (
              examinations.map((exam) => (
                <div key={exam.id} className="mt-4 space-y-1 text-sm">
                  <p className="font-medium">{exam.name}</p>
                  <p>
                    Date:{" "}
                    {exam.performedAt
                      ? formatDate(exam.performedAt)
                      : "Unknown"}
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
            <h2>AI-structured summary</h2>
            <p className="mt-3 text-sm">{analysis.summary}</p>
            <p className="mt-3 text-xs text-muted-foreground">
              AI-generated · Analysis v{analysis.version} · Profile v
              {analysis.profileVersion} · Context v{analysis.contextVersion} ·
              Prompt v{analysis.promptVersion}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {analysis.provider} / {analysis.model} ·{" "}
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
                items={analysis.uncertainties}
                empty="No additional uncertainty recorded; this is not clinical confirmation."
              />
              <TextList
                items={analysis.reviewQuestions}
                empty="No review questions recorded."
              />
            </details>
          </Surface>
          <Surface>
            <h2>Proposals for review</h2>
            <p className="mt-3 text-sm text-muted-foreground">
              Preliminary proposals, awaiting physician review.
            </p>
            {!analysis.proposals.length && (
              <p className="mt-4 text-sm">No proposals available.</p>
            )}
            {analysis.proposals.map((proposal) => (
              <article className="mt-6 border-t pt-6" key={proposal.id}>
                <p className="text-xs text-muted-foreground">
                  {categories[proposal.category]} · AI-generated explanation
                </p>
                <h3 className="mt-2">{proposal.title}</h3>
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
                  <p className="mt-3 font-medium">Data considered</p>
                  <TextList
                    items={proposal.consideredData}
                    empty="No considered data recorded."
                  />
                  <p className="mt-3 font-medium">
                    Uncertainty and limitations
                  </p>
                  <TextList
                    items={proposal.uncertainties}
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
                    const url = safeEvidenceUrl(source?.sourceUrl ?? null);
                    return (
                      <div className="mt-3 space-y-2 break-words" key={id}>
                        <p>
                          {source?.title ?? id} ·{" "}
                          {source
                            ? `Evidence v${source.version}`
                            : "Version unknown"}
                        </p>
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
