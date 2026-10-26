import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import AxeBuilder from "@axe-core/playwright";
import {
  test as base,
  expect,
  type Locator,
  type Page,
} from "@playwright/test";
import { z } from "zod";

const seededSchema = z.object({
  workspaceId: z.string(),
  cookieName: z.string(),
});
type ReviewCase = z.infer<typeof seededSchema> & { token: string };
type CaseId = "first-screening" | "repeat-screening";
function fixture(mode: string, token: string, caseId: CaseId) {
  return execFileSync(
    process.execPath,
    [
      "--conditions=react-server",
      "--import",
      "tsx",
      resolve("tests/e2e/review-fixture.ts"),
      mode,
    ],
    {
      env: {
        ...process.env,
        REVIEW_TEST_TOKEN: token,
        REVIEW_TEST_CASE: caseId,
      },
      encoding: "utf8",
      windowsHide: true,
    },
  );
}
async function provideCase(
  caseId: CaseId,
  provideReviewCase: (value: ReviewCase) => Promise<void>,
) {
  const token = randomBytes(32).toString("base64url");
  try {
    const seeded = seededSchema.parse(
      JSON.parse(fixture("seed-real", token, caseId)),
    );
    await provideReviewCase({ ...seeded, token });
  } finally {
    fixture("cleanup", token, caseId);
  }
}
const test = base.extend<{ reviewCase: ReviewCase; repeatCase: ReviewCase }>({
  reviewCase: [
    async ({ baseURL }, provideReviewCase) => {
      if (!baseURL) throw new Error("The configured loopback URL is required");
      await provideCase("first-screening", provideReviewCase);
    },
    { timeout: 60000 },
  ],
  repeatCase: [
    async ({ baseURL }, provideReviewCase) => {
      if (!baseURL) throw new Error("The configured loopback URL is required");
      await provideCase("repeat-screening", provideReviewCase);
    },
    { timeout: 60000 },
  ],
});
// Saves commit a serialized Postgres transaction and re-render the workspace. On a
// shared, I/O-loaded Docker host the commit fsync can stall for several seconds;
// the UI correctly stays in "Saving review…" and then completes, so committed
// results get more than the 5 s default assertion timeout.
const committed = { timeout: 30_000 };
test.describe.configure({ timeout: 120_000 });
// Axe must read resting colors, not a mid-transition frame; globals.css disables
// transitions under prefers-reduced-motion, so the contrast rule stays unchanged.
test.use({ reducedMotion: "reduce" });
async function openReview(page: Page, baseURL: string, reviewCase: ReviewCase) {
  await page.context().addCookies([
    {
      name: reviewCase.cookieName,
      value: reviewCase.token,
      url: baseURL,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto(
    "/doctor/reviews/" + encodeURIComponent(reviewCase.workspaceId),
  );
  const region = page.getByRole("region", {
    name: "Physician decisions",
    exact: true,
  });
  await expect(region).toBeVisible();
  return region;
}
async function save(region: Locator) {
  await region
    .getByRole("button", { name: "Save decisions", exact: true })
    .click();
  await expect(region.getByRole("status")).toContainText(
    "decisions saved",
    committed,
  );
}
async function finalize(region: Locator) {
  await region
    .getByRole("button", { name: "Finalize review", exact: true })
    .click();
  await expect(region.getByRole("status")).toContainText(
    "review finalized and reviewed plan published",
    committed,
  );
  await expect(
    region.getByLabel("Decision for proposal 1", { exact: true }),
  ).toBeDisabled();
}

test("pending drafts survive refresh and only explicit approval finalization publishes a plan", async ({
  page,
  baseURL,
  reviewCase,
}, testInfo) => {
  const region = await openReview(page, baseURL!, reviewCase);
  const decision = region.getByLabel("Decision for proposal 1", {
    exact: true,
  });
  await expect(decision).toHaveValue("PENDING");
  await expect(
    region.getByRole("button", { name: "Finalize review", exact: true }),
  ).toBeDisabled();
  await save(region);
  await page.reload();
  await expect(decision).toHaveValue("PENDING");
  await expect(region).toContainText("Review v1");
  const history = page.getByRole("list", { name: "Decision history" });
  await expect(
    history.getByText("Review v1 · Draft — not finalized", { exact: true }),
  ).toBeVisible();
  await expect(history).toContainText("Demo reviewer (demo-physician)");
  await expect(page.getByRole("main")).toContainText(
    "demo reviewer — not a real clinician",
  );
  await decision.selectOption("APPROVE");
  await expect(
    region.getByRole("button", { name: "Finalize review", exact: true }),
  ).toBeEnabled();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("physician-decisions.png"),
    fullPage: true,
  });
  await finalize(region);
  await expect(decision).toHaveValue("APPROVE");
  await page.reload();
  await expect(region).toContainText("Review v2");
  await expect(
    region.getByRole("button", { name: "Finalize review", exact: true }),
  ).toBeDisabled();
  await expect(decision).toBeDisabled();
  await page.goto("/patient/plan");
  const plan = page.getByRole("main");
  await expect(
    plan.getByText("Reviewed demonstration plan", { exact: true }),
  ).toBeVisible();
  await expect(
    plan.getByText("Demonstrative review item", { exact: true }),
  ).toBeVisible();
});

test("modification requires reason and revised text and publishes only the revised redundancy", async ({
  page,
  baseURL,
  repeatCase,
}) => {
  const region = await openReview(page, baseURL!, repeatCase);
  await expect(
    page.getByRole("main").getByText(/^Possible redundant test/),
  ).toBeVisible();
  const decision = region.getByLabel("Decision for proposal 1", {
    exact: true,
  });
  await decision.selectOption("MODIFY");
  const reason = region.getByLabel(/^Reason for proposal 1/);
  const revised = region.getByLabel(/^Revised text for proposal 1/);
  await region
    .getByRole("button", { name: "Save decisions", exact: true })
    .click();
  await expect(reason).toBeFocused();
  expect(
    await reason.evaluate(
      (node: HTMLTextAreaElement) => node.validity.valueMissing,
    ),
  ).toBe(true);
  await reason.fill(
    "Demonstrative revision of the supplied synthetic wording.",
  );
  await revised.fill("Demonstrative revised redundancy wording");
  await save(region);
  await expect(decision).toHaveValue("MODIFY");
  await page.reload();
  await expect(decision).toHaveValue("MODIFY");
  await expect(reason).toHaveValue(
    "Demonstrative revision of the supplied synthetic wording.",
  );
  await expect(revised).toHaveValue("Demonstrative revised redundancy wording");
  await expect(region).toContainText("Review v1");
  await finalize(region);
  await page.goto("/patient/plan");
  const plan = page.getByRole("main");
  await expect(
    plan.getByText("Demonstrative revised redundancy wording", { exact: true }),
  ).toBeVisible();
  await expect(
    plan.getByText("Demonstrative review item", { exact: true }),
  ).toHaveCount(0);
});

test("rejection requires a reason and never publishes the rejected proposal", async ({
  page,
  baseURL,
  reviewCase,
}) => {
  const region = await openReview(page, baseURL!, reviewCase);
  await region
    .getByLabel("Decision for proposal 1", { exact: true })
    .selectOption("REJECT");
  const reason = region.getByLabel(/^Reason for proposal 1/);
  await region
    .getByRole("button", { name: "Finalize review", exact: true })
    .click();
  await expect(reason).toBeFocused();
  expect(
    await reason.evaluate(
      (node: HTMLTextAreaElement) => node.validity.valueMissing,
    ),
  ).toBe(true);
  await reason.fill(
    "Demonstrative rejection; this is not a clinical decision.",
  );
  await finalize(region);
  await expect(
    region.getByLabel("Decision for proposal 1", { exact: true }),
  ).toHaveValue("REJECT");
  await page.reload();
  await expect(reason).toHaveValue(
    "Demonstrative rejection; this is not a clinical decision.",
  );
  await expect(
    region.getByLabel("Decision for proposal 1", { exact: true }),
  ).toHaveValue("REJECT");
  await page.goto("/patient/plan");
  const plan = page.getByRole("main");
  await expect(
    plan.getByText("Reviewed demonstration plan", { exact: true }),
  ).toBeVisible();
  await expect(
    plan.getByText("No actions were selected in this review.", { exact: true }),
  ).toBeVisible();
  await expect(
    plan.getByText("Demonstrative review item", { exact: true }),
  ).toHaveCount(0);
});

test("clarification remains incomplete after refresh and cannot publish a plan", async ({
  page,
  baseURL,
  reviewCase,
}) => {
  const region = await openReview(page, baseURL!, reviewCase);
  const decision = region.getByLabel("Decision for proposal 1", {
    exact: true,
  });
  await decision.selectOption("CLARIFY");
  await region
    .getByLabel(/^Reason for proposal 1/)
    .fill("Confirm the reported synthetic information.");
  await expect(
    region.getByRole("button", { name: "Finalize review", exact: true }),
  ).toBeDisabled();
  const question = region.getByLabel(/^Question for the patient/);
  await expect(question).toHaveAttribute("required", "");
  await question.fill("What colorectal screening have you had before?");
  await region
    .getByLabel("Related intake question (optional)", { exact: true })
    .selectOption("priorScreening");
  await region
    .getByRole("button", { name: "Save decisions", exact: true })
    .click();
  await expect(region.getByRole("status")).toContainText(
    "Clarification requested",
    committed,
  );
  await expect(decision).toHaveValue("CLARIFY");
  await expect(decision).toBeDisabled();
  await page.reload();
  await expect(decision).toHaveValue("CLARIFY");
  await expect(decision).toBeDisabled();
  await expect(region).toContainText("a new analysis are required");
  const history = page.getByRole("list", { name: "Decision history" });
  await expect(
    history.getByText("Review v1 · Draft — not finalized", { exact: true }),
  ).toBeVisible();
  await expect(history).toContainText(
    "Question for the patient: What colorectal screening have you had before?",
  );
  await page.goto("/patient/plan");
  const plan = page.getByRole("main");
  await expect(
    plan.getByRole("heading", {
      name: "More information is needed",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    plan.getByText("Demonstrative review item", { exact: true }),
  ).toHaveCount(0);
  await expect(
    plan.getByRole("heading", { name: "Selected actions", exact: true }),
  ).toHaveCount(0);
});

test("a competing tab receives safe failure feedback and retains its unsaved input", async ({
  page,
  baseURL,
  reviewCase,
}) => {
  const first = await openReview(page, baseURL!, reviewCase);
  const otherPage = await page.context().newPage();
  try {
    const second = await openReview(otherPage, baseURL!, reviewCase);
    await first
      .getByLabel("Decision for proposal 1", { exact: true })
      .selectOption("APPROVE");
    await save(first);
    const competing = second.getByLabel("Decision for proposal 1", {
      exact: true,
    });
    const reason = second.getByLabel(/^Reason for proposal 1/);
    await competing.selectOption("REJECT");
    await reason.fill("Competing synthetic draft");
    await second
      .getByRole("button", { name: "Save decisions", exact: true })
      .click();
    await expect(second.getByRole("alert")).toContainText(
      "Reload to check current versions",
      committed,
    );
    await expect(reason).toHaveValue("Competing synthetic draft");
    await expect(competing).toHaveValue("REJECT");
    await otherPage.reload();
    await expect(competing).toHaveValue("APPROVE");
    await expect(reason).toHaveValue("");
    await expect(second).toContainText("Review v1");
  } finally {
    await otherPage.close();
  }
});
