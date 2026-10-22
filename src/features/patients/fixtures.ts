import {
  healthProfileSchema,
  patientSchema,
  previousExaminationSchema,
} from "./contracts";

/** Entirely invented fixtures. Never substitute real patient information. */
export const demoPatient = patientSchema.parse({
  id: "synthetic-patient-01",
  displayName: "Marina Exemplo",
  synthetic: true,
  status: "MEDICAL_REVIEW_PENDING",
});
export const demoProfile = healthProfileSchema.parse({
  id: "synthetic-profile-01",
  patientId: demoPatient.id,
  version: 1,
  age: 46,
  personalHistory: [{ value: "Não informado", provenance: "PATIENT_REPORTED" }],
  familyHistory: [{ value: null, provenance: "PATIENT_REPORTED" }],
  medications: [{ value: null, provenance: "PATIENT_REPORTED" }],
  habits: [{ value: "Caminhadas ocasionais", provenance: "PATIENT_REPORTED" }],
  missingInformation: ["Data do exame anterior", "Histórico familiar"],
  examinationIds: ["synthetic-exam-01"],
  updatedAt: "2026-10-20T14:00:00Z",
});
export const demoExamination = previousExaminationSchema.parse({
  id: "synthetic-exam-01",
  patientId: demoPatient.id,
  name: "Exame informado pela paciente",
  performedAt: null,
  result: { value: null, provenance: "PATIENT_REPORTED" },
  notes: "Registro fictício; tipo, data e resultado não confirmados.",
});
export const demoReview = {
  id: "demo-review-01",
  patientId: demoPatient.id,
  submittedAt: "20 out. 2026",
  analysisLabel: "Estrutura demonstrativa · nenhuma análise executada",
} as const;
