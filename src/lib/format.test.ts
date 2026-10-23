import { expect, it } from "vitest";
import { formatDate, formatNumber } from "./format";
import { statusLabels } from "../features/workflow/workflow";
import { demoPatient, demoProfile } from "../features/patients/fixtures";

it("formats dates in US English without shifting a date across time zones", () => {
  expect(formatDate("2026-10-20T00:00:00Z")).toBe("Oct 20, 2026");
});

it("formats numbers with US English grouping and decimal separators", () => {
  expect(formatNumber(1234.5)).toBe("1,234.5");
});

it("keeps review pending and unknown clinical information explicit in English", () => {
  expect(statusLabels.MEDICAL_REVIEW_PENDING).toBe("Awaiting physician review");
  expect(statusLabels.ANALYSIS_FAILED).toBe("Analysis not completed");
  expect(demoPatient.displayName).toBe("Marina Example");
  expect(demoProfile.missingInformation).toContain("Previous examination date");
  expect(demoProfile.familyHistory[0].value).toBeNull();
});
