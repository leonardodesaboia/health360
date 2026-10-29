import { execFile } from "node:child_process";
import { promisify } from "node:util";
import {
  test as base,
  expect,
  type BrowserContext,
  type Page,
} from "@playwright/test";
import { z } from "zod";

const execute = promisify(execFile);
async function run(script: string, ...args: string[]) {
  return (
    await execute(
      process.execPath,
      ["--conditions=react-server", "--import", "tsx", script, ...args],
      { encoding: "utf8", timeout: 60000, windowsHide: true },
    )
  ).stdout;
}
const snapshotSchema = z.object({
  status: z.string(),
  profiles: z.array(
    z.object({ version: z.number(), age: z.number().nullable() }),
  ),
  analyses: z.array(
    z.object({
      status: z.string(),
      failureReason: z.string().optional(),
      profileVersion: z.number(),
      proposalCount: z.number(),
    }),
  ),
  reviews: z.number(),
  plans: z.array(
    z.object({ id: z.string(), version: z.number() }).passthrough(),
  ),
  eventKinds: z.array(z.string()),
});
type DemoFixture = {
  track(context: BrowserContext): Promise<string>;
  inspect(token: string): Promise<z.infer<typeof snapshotSchema>>;
  fail(token: string, variant: string): Promise<z.infer<typeof snapshotSchema>>;
  reviewed(): Promise<{ token: string; planId: string }>;
};
export const test = base.extend<{ demo: DemoFixture }>({
  demo: async ({ context }, provideDemo) => {
    if (
      !process.env.TEST_DATABASE_URL ||
      process.env.DATABASE_URL !== process.env.TEST_DATABASE_URL
    )
      throw new Error(
        "Acceptance browser and fixtures require the same disposable database",
      );
    if (process.env.LLM_PROVIDER && process.env.LLM_PROVIDER !== "mock")
      throw new Error(
        "Acceptance journeys require mock provider mode; live calls are outside this suite",
      );
    const tokens = new Set<string>();
    const track = async (browser: BrowserContext) => {
      const token = (await browser.cookies()).find(
        (cookie) => cookie.name === "h360_demo_session",
      )?.value;
      if (!token)
        throw new Error("A selected synthetic case cookie is required");
      tokens.add(token);
      return token;
    };
    try {
      await provideDemo({
        track,
        inspect: async (token) =>
          snapshotSchema.parse(
            JSON.parse(
              await run(
                "tests/e2e/acceptance/fixture-runner.ts",
                "inspect",
                token,
              ),
            ),
          ),
        fail: async (token, variant) =>
          snapshotSchema.parse(
            JSON.parse(
              await run(
                "tests/e2e/acceptance/fixture-runner.ts",
                "fail-analysis",
                token,
                variant,
              ),
            ),
          ),
        reviewed: async () => {
          const result = z
            .object({ token: z.string(), planId: z.string() })
            .parse(
              JSON.parse(
                await run("tests/support/history-session.ts", "create"),
              ),
            );
          tokens.add(result.token);
          return result;
        },
      });
    } finally {
      const token = (await context.cookies()).find(
        (cookie) => cookie.name === "h360_demo_session",
      )?.value;
      if (token) tokens.add(token);
      for (const ownedToken of tokens)
        await run(
          "tests/e2e/acceptance/fixture-runner.ts",
          "cleanup",
          ownedToken,
        );
    }
  },
});
export { expect };

/** Server actions run claim, mock provider and completion transactions; allow for load. */
export const afterAction = { timeout: 30000 };

const patientExplanations: Record<string, string> = {
  "Start your health intake":
    "Answer questions about this synthetic case. You can choose ‘I don't know’ when unsure.",
  "Continue your health intake":
    "Your draft is saved in this browser. Confirm your answers to save a profile for this demo case.",
  "Ready for analysis":
    "Your confirmed information is saved. Start a preliminary analysis; any proposals still require physician review.",
  "Waiting for analysis":
    "An analysis request is pending. Check for the latest recorded status. No plan is published by this step.",
  "Retry the analysis":
    "This attempt did not produce reviewable proposals. Retry with your saved information. A successful analysis still requires physician review.",
  "Answer the requested questions":
    "More information is needed before a new analysis and physician review can continue. Unknown answers stay unknown.",
  "Waiting for the demo reviewer":
    "Your preliminary analysis is ready for review. A demo reviewer must decide on every proposal and finalize the review before a plan can appear. No completion time is promised.",
  "Review has started":
    "The review is in progress. Your plan appears only after the demo reviewer finalizes the decisions. No completion time is promised.",
  "Your reviewed demonstration plan":
    "This plan contains only decisions from the finalized demonstration review. Demo reviewer decisions are not clinical validation.",
  "Update your information":
    "Confirm your updated answers. They need another analysis and physician review. Your earlier reviewed plan stays in history.",
};

export async function assertPatientGuidance(
  page: Page,
  expected: {
    heading: string;
    actor: "You" | "System" | "Demo reviewer";
    action: string;
    kind: "link" | "button";
    stages: [string, string, string, string];
  },
) {
  await expect(page.getByText("Patient view", { exact: true })).toBeVisible();
  const next = page.getByRole("region", {
    name: "What happens next",
    exact: true,
  });
  await expect(
    next.getByRole("heading", { name: expected.heading, exact: true }),
  ).toBeVisible();
  await expect(
    next.getByText(`Next: ${expected.actor}`, { exact: true }),
  ).toBeVisible();
  const explanation = patientExplanations[expected.heading];
  if (!explanation)
    throw new Error("An explicit expected patient explanation is required");
  await expect(next.getByText(explanation, { exact: true })).toBeVisible();
  await expect(
    next.getByRole(expected.kind, { name: expected.action, exact: true }),
  ).toBeVisible();
  await expect(next.locator("button, a")).toHaveCount(1);
  const disclosure = page.getByText("View evaluation steps", { exact: true });
  let opened = false;
  if (await disclosure.isVisible()) {
    const details = disclosure.locator("..");
    if ((await details.getAttribute("open")) === null) {
      await disclosure.click();
      opened = true;
    }
  }
  const progress = page
    .getByRole("list", { name: "Evaluation progress", exact: true })
    .filter({ visible: true });
  await expect(progress.getByRole("listitem")).toHaveText(expected.stages);
  if (opened) await disclosure.click();
}

export async function selectCase(
  page: Page,
  name: "Alex Example" | "Jordan Example",
) {
  await page.goto("/patient");
  await expect(page.locator("#demo-case-title")).toHaveText(
    /^(Select a demo case|Demo case:)/,
  );
  const controls = page
    .locator("details")
    .filter({ has: page.locator("summary", { hasText: "Presenter controls" }) })
    .first();
  if ((await controls.getAttribute("open")) === null)
    await page.getByText("Presenter controls", { exact: true }).click();
  await page
    .getByRole("form", { name: "Choose demo case" })
    .getByRole("button", { name, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: `Demo case: ${name}`, exact: true }),
  ).toBeVisible({ timeout: 15000 });
}

/** Real browser intake; no profile or analysis fixture is substituted for this journey. */
export async function completeFirstIntake(
  page: Page,
  { age = "50" }: { age?: string | null } = {},
) {
  await page.goto("/patient/intake");
  const ageUnknown = page.getByLabel(
    "I don't know — age in the synthetic scenario",
    { exact: true },
  );
  if (age === null) await ageUnknown.check();
  else
    await page
      .getByLabel("Age in the synthetic scenario", { exact: true })
      .fill(age);
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Clinical history", exact: true }),
  ).toBeVisible();
  for (const control of await page.getByRole("combobox").all())
    await control.selectOption("no");
  await page
    .getByRole("checkbox", { name: /I don't know.*current medications/ })
    .uncheck();
  await page
    .getByLabel("Current medications (enter None if none)", { exact: true })
    .fill("None");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Habits", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Currently smoking", { exact: true })
    .selectOption("no");
  await page
    .getByLabel("Regular physical activity", { exact: true })
    .selectOption("yes");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Previous exams", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Previous colorectal screening", { exact: true })
    .selectOption("NEVER_SCREENED");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review answers", exact: true }),
  ).toBeVisible();
  await page
    .getByRole("button", { name: "Edit basic information", exact: true })
    .click();
  if (age === null) await expect(ageUnknown).toBeChecked();
  else
    await expect(
      page.getByLabel("Age in the synthetic scenario", { exact: true }),
    ).toHaveValue(age);
  for (const heading of [
    "Clinical history",
    "Habits",
    "Previous exams",
    "Review answers",
  ]) {
    await page
      .getByRole("button", { name: "Save and continue", exact: true })
      .click();
    await expect(
      page.getByRole("heading", { name: heading, exact: true }),
    ).toBeVisible();
  }
  await page
    .getByLabel(
      "I confirm these synthetic answers and want to save my profile.",
      { exact: true },
    )
    .check();
  await page
    .getByRole("button", { name: "Confirm and save profile", exact: true })
    .click();
  await expect(page).toHaveURL(/\/patient\/analysis$/, afterAction);
  await assertPatientGuidance(page, {
    heading: "Ready for analysis",
    actor: "You",
    action: "Analyze current profile",
    kind: "button",
    stages: [
      "IntakeComplete",
      "AnalysisCurrent",
      "Physician reviewWaiting",
      "PlanWaiting",
    ],
  });
}

export async function assertNoUnreviewedPlan(page: Page) {
  await page.goto("/patient/plan");
  await expect(
    page.getByRole("heading", { name: "Preventive follow-up", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /^(Waiting for the demo reviewer|Review has started|Retry the analysis|Answer the requested questions)$/,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Selected actions", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByText("Review supplied prevention finding", { exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("UNTRUSTED_RESPONSE_MARKER")).toHaveCount(0);
}

/** Jordan: age 60, average risk, normal complete adequately prepared colonoscopy. */
export async function completeRepeatIntake(
  page: Page,
  { examDate }: { examDate: string | null },
) {
  await page.goto("/patient/intake");
  await page
    .getByLabel("Age in the synthetic scenario", { exact: true })
    .fill("60");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Clinical history", exact: true }),
  ).toBeVisible();
  for (const control of await page.getByRole("combobox").all())
    await control.selectOption("no");
  const medicationsUnknown = page.getByRole("checkbox", {
    name: /I don't know.*current medications/,
  });
  if (await medicationsUnknown.isChecked()) await medicationsUnknown.uncheck();
  await page
    .getByLabel("Current medications (enter None if none)", { exact: true })
    .fill("None");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Habits", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Currently smoking", { exact: true })
    .selectOption("no");
  await page
    .getByLabel("Regular physical activity", { exact: true })
    .selectOption("yes");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Previous exams", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel("Previous colorectal screening", { exact: true })
    .selectOption("COLONOSCOPY");
  const precision = page.getByLabel("Previous examination date", {
    exact: true,
  });
  if (examDate === null) await precision.selectOption("unknown");
  else {
    await precision.selectOption("EXACT");
    // Unknown is the default; clearing "I don't know" enables the date input.
    await page
      .getByLabel("I don't know — exact examination date", { exact: true })
      .uncheck();
    await page
      .getByLabel("Exact examination date", { exact: true })
      .fill(examDate);
  }
  for (const label of [
    "Colonoscopy result was normal",
    "Colonoscopy reached the cecum (complete examination)",
    "Colonoscopy bowel preparation was adequate",
  ])
    await page.getByLabel(label, { exact: true }).selectOption("yes");
  await page
    .getByRole("button", { name: "Save and continue", exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: "Review answers", exact: true }),
  ).toBeVisible();
  await page
    .getByLabel(
      "I confirm these synthetic answers and want to save my profile.",
      { exact: true },
    )
    .check();
  await page
    .getByRole("button", { name: "Confirm and save profile", exact: true })
    .click();
  await expect(page).toHaveURL(/\/patient\/analysis$/, afterAction);
  await assertPatientGuidance(page, {
    heading: "Ready for analysis",
    actor: "You",
    action: "Analyze current profile",
    kind: "button",
    stages: [
      "IntakeComplete",
      "AnalysisCurrent",
      "Physician reviewWaiting",
      "PlanWaiting",
    ],
  });
}

/** Opens the only queued review in this isolated dataset and expands its details. */
export async function openPhysicianWorkspace(page: Page, patient: string) {
  await page.goto("/doctor");
  await expect(page.getByRole("main")).toContainText(patient);
  await page
    .getByRole("link", { name: /^(Start review|Continue review)$/ })
    .click();
  await expect(
    page.getByRole("heading", { name: "Proposals for review", exact: true }),
  ).toBeVisible(afterAction);
  await expect(
    page.getByText("Physician view · Demo reviewer", { exact: true }),
  ).toBeVisible();
  for (const [label, target] of [
    ["Go to proposals and evidence", "#review-proposals"],
    ["Go to physician decisions", "#physician-decisions-heading"],
  ]) {
    const jump = page.getByRole("link", { name: label, exact: true });
    await expect(jump).toHaveAttribute("href", target);
    await jump.focus();
    await page.keyboard.press("Enter");
    await expect(page.locator(target)).toBeFocused();
  }
  for (const summary of [
    "View rationale and criteria",
    "View evidence and sources",
  ])
    await page.getByText(summary, { exact: true }).first().click();
}

/** Real P0-10 controls: one decision for proposal 1, optional modification, explicit finalization. */
export async function decideAndFinalize(
  page: Page,
  patient: string,
  decision:
    { kind: "APPROVE" } | { kind: "MODIFY"; reason: string; revised: string },
) {
  await page.goto("/doctor");
  await expect(page.getByRole("main")).toContainText(patient);
  await page
    .getByRole("link", { name: /^(Start review|Continue review)$/ })
    .first()
    .click();
  const region = page.getByRole("region", {
    name: "Physician decisions",
    exact: true,
  });
  await expect(region).toBeVisible(afterAction);
  const select = region.getByLabel("Decision for proposal 1", {
    exact: true,
  });
  await expect(select).toHaveValue("PENDING");
  await expect(
    region.getByRole("button", { name: "Finalize review", exact: true }),
  ).toBeDisabled();
  await select.selectOption(decision.kind);
  if (decision.kind === "MODIFY") {
    await region.getByLabel(/^Reason for proposal 1/).fill(decision.reason);
    await region
      .getByLabel(/^Revised text for proposal 1/)
      .fill(decision.revised);
  }
  await region
    .getByRole("button", { name: "Finalize review", exact: true })
    .click();
  await expect(region.getByRole("status")).toContainText(
    "review finalized and reviewed plan published",
    afterAction,
  );
  await expect(select).toBeDisabled();
  await expect(
    page.getByText("Review finalized. Reviewed demonstration plan published.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("link", { name: "View patient plan", exact: true }),
  ).toHaveAttribute("href", "/patient/plan");
}
