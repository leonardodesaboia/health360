import {
  healthProfileSchema,
  patientSchema,
  previousExaminationSchema,
} from "./contracts";

/** Entirely invented fixtures. Never substitute real patient information. */
export const demoPatient = patientSchema.parse({
  id: "synthetic-patient-01",
  displayName: "Marina Example",
  synthetic: true,
  status: "MEDICAL_REVIEW_PENDING",
});
export const demoProfile = healthProfileSchema.parse({
  id: "synthetic-profile-01",
  patientId: demoPatient.id,
  version: 1,
  age: 46,
  personalHistory: [{ value: "Not provided", provenance: "PATIENT_REPORTED" }],
  familyHistory: [{ value: null, provenance: "PATIENT_REPORTED" }],
  medications: [{ value: null, provenance: "PATIENT_REPORTED" }],
  habits: [{ value: "Occasional walks", provenance: "PATIENT_REPORTED" }],
  missingInformation: ["Previous examination date", "Family history"],
  examinationIds: ["synthetic-exam-01"],
  updatedAt: "2026-10-20T14:00:00Z",
});
export const demoExamination = previousExaminationSchema.parse({
  id: "synthetic-exam-01",
  patientId: demoPatient.id,
  name: "Patient-reported examination",
  performedAt: null,
  result: { value: null, provenance: "PATIENT_REPORTED" },
  notes: "Fictional record; type, date and result are unconfirmed.",
});
export const demoReview = {
  id: "demo-review-01",
  patientId: demoPatient.id,
  submittedAt: "2026-10-20T14:00:00Z",
  analysisLabel: "Demonstration structure · no analysis performed",
} as const;
