"use client";
import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { EmptyState, Notice, Surface } from "@/components/shared/primitives";
import { AnswerSummary } from "./answer-summary";
import { createDraftRepository } from "./repository";
import { localPatientId } from "./intake-form";
import { fieldIds, type IntakeAnswers } from "./contracts";
import { formatExaminationDate, type CompletedIntake } from "./profile";
import type { HealthProfile, PreviousExamination } from "../patients/contracts";

type StoredProfile = {
  profile: HealthProfile;
  examinations: PreviousExamination[];
  answers: IntakeAnswers;
};

/**
 * With a selected demo case the server passes the stored profile (or null when none
 * exists). Without a case, the browser-only intake profile is read from local storage.
 */
export function ProfileView({ stored }: { stored?: StoredProfile | null }) {
  if (stored !== undefined)
    return (
      <>
        <ProfileNotice>
          Synthetic, patient-reported information saved to this demo case.
        </ProfileNotice>
        {stored ? <ProfileDetails {...stored} /> : <NoProfile />}
      </>
    );
  return <LocalProfileView />;
}

function ProfileNotice({ children }: { children: React.ReactNode }) {
  return (
    <Notice title="DEMONSTRATIVE — NOT CLINICALLY VALIDATED">
      {children} This is not a medical assessment or a physician-reviewed plan.
    </Notice>
  );
}

function NoProfile() {
  return (
    <EmptyState
      title="No confirmed profile yet"
      description="Complete and confirm the synthetic intake to create a profile version."
      action={
        <Button asChild>
          <Link href="/patient/intake">Complete intake</Link>
        </Button>
      }
    />
  );
}

function LocalProfileView() {
  const [profile, setProfile] = useState<CompletedIntake | null>();
  const [error, setError] = useState("");
  const load = useCallback(async () => {
    try {
      setProfile(
        await createDraftRepository(window.localStorage).latest(localPatientId),
      );
      setError("");
    } catch {
      setError(
        "The clinical profile could not be loaded from this browser. Restore storage access and retry.",
      );
    }
  }, []);
  useEffect(() => {
    let active = true;
    queueMicrotask(() => {
      if (active) void load();
    });
    return () => {
      active = false;
    };
  }, [load]);
  const answers = profile
    ? (Object.fromEntries(
        fieldIds.map((id) => [id, profile.intake.answers[id]?.value ?? null]),
      ) as IntakeAnswers)
    : null;
  return (
    <>
      <ProfileNotice>
        Synthetic, patient-reported information stored in this browser only.
      </ProfileNotice>
      {error ? (
        <div role="alert" className="space-y-3">
          <p>{error}</p>
          <Button variant="outline" onClick={() => void load()}>
            Retry profile
          </Button>
        </div>
      ) : profile === undefined ? (
        <p role="status" className="text-sm text-muted-foreground">
          Loading clinical profile…
        </p>
      ) : profile === null || !answers ? (
        <NoProfile />
      ) : (
        <ProfileDetails
          profile={profile.profile}
          examinations={profile.examinations}
          answers={answers}
        />
      )}
    </>
  );
}

function ProfileDetails({ profile, examinations, answers }: StoredProfile) {
  return (
    <>
      <Surface>
        <h2>Structured profile</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          System-structured from patient-reported answers. Software validation
          is not medical approval.
        </p>
        <dl className="mt-4 space-y-3 text-sm">
          <div>
            <dt className="text-muted-foreground">Profile version</dt>
            <dd className="tabular-nums">{profile.version}</dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Last updated</dt>
            <dd className="tabular-nums">
              {new Intl.DateTimeFormat("en-US", {
                dateStyle: "medium",
                timeStyle: "short",
                timeZone: "UTC",
              }).format(new Date(profile.updatedAt))}{" "}
              UTC
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Age (patient-reported)</dt>
            <dd>{profile.age ?? "Unknown"}</dd>
          </div>
        </dl>
      </Surface>
      <Surface>
        <h2>Patient-reported information</h2>
        <div className="mt-6">
          <AnswerSummary answers={answers} />
        </div>
      </Surface>
      <Surface>
        <h2>Previous examinations</h2>
        {examinations.length === 0 ? (
          <p className="mt-3 text-sm text-muted-foreground">
            {profile.intakeFacts?.priorScreening === "NEVER_SCREENED"
              ? "Patient reports no previous colorectal screening."
              : "Previous screening is unknown. No examination has been inferred."}
          </p>
        ) : (
          examinations.map((exam) => (
            <div key={exam.id} className="mt-4 space-y-2 text-sm">
              <h3>{exam.name}</h3>
              <p>
                Date:{" "}
                {formatExaminationDate(exam.performedAt, exam.approximateDate)}
              </p>
              <p>Result: {exam.result.value ?? "Unknown"}</p>
              <p className="text-muted-foreground">
                Patient-reported; examination details have not been
                independently verified.
              </p>
            </div>
          ))
        )}
      </Surface>
      <Surface>
        <h2>Unknown information</h2>
        {profile.missingInformation.length ? (
          <ul className="mt-3 list-inside list-disc space-y-2 text-sm">
            {profile.missingInformation.map((gap) => (
              <li key={gap}>{gap}</li>
            ))}
          </ul>
        ) : (
          <p className="mt-3 text-sm">
            All requested questions were answered. This does not establish
            clinical completeness.
          </p>
        )}
        <p className="mt-4 text-sm text-muted-foreground">
          Unknown does not mean absent or normal. A physician must review any
          future clinical proposals.
        </p>
      </Surface>
      <Button variant="outline" asChild>
        <Link href="/patient/intake">Edit intake answers</Link>
      </Button>
    </>
  );
}
