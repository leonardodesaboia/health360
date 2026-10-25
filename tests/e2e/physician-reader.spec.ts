import { execFileSync } from "node:child_process";
import { randomBytes } from "node:crypto";
import { resolve } from "node:path";
import { test as base, expect } from "@playwright/test";
import { z } from "zod";

const seededSchema = z.object({
  datasetId: z.string(),
  workspaceId: z.string(),
  cookieName: z.string(),
  patientName: z.string(),
  analysisTime: z.string(),
});
type ReviewCase = z.infer<typeof seededSchema> & { token: string };
function fixture(mode: string, token: string) {
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
      env: { ...process.env, REVIEW_TEST_TOKEN: token },
      encoding: "utf8",
      windowsHide: true,
    },
  );
}
async function provideSeededCase(
  mode: string,
  provideReviewCase: (value: ReviewCase) => Promise<void>,
) {
  const token = randomBytes(32).toString("base64url");
  const seeded = seededSchema.parse(JSON.parse(fixture(mode, token)));
  try {
    await provideReviewCase({ ...seeded, token });
  } finally {
    fixture("cleanup", token);
  }
}
const test = base.extend<{
  reviewCase: ReviewCase;
  foreignCase: ReviewCase;
  staleCase: ReviewCase;
  blockedCase: ReviewCase;
}>({
  reviewCase: [
    async ({ baseURL }, provideReviewCase) => {
      if (!baseURL) throw new Error("A loopback e2e baseURL is required");
      await provideSeededCase("seed-real", provideReviewCase);
    },
    { timeout: 60000 },
  ],
  foreignCase: [
    async ({ baseURL }, provideReviewCase) => {
      if (!baseURL) throw new Error("A loopback e2e baseURL is required");
      await provideSeededCase("seed", provideReviewCase);
    },
    { timeout: 60000 },
  ],
  staleCase: [
    async ({ baseURL }, provideReviewCase) => {
      if (!baseURL) throw new Error("A loopback e2e baseURL is required");
      await provideSeededCase("seed", async (reviewCase) => {
        fixture("stale-profile", reviewCase.token);
        await provideReviewCase(reviewCase);
      });
    },
    { timeout: 60000 },
  ],
  blockedCase: [
    async ({ baseURL }, provideReviewCase) => {
      if (!baseURL) throw new Error("A loopback e2e baseURL is required");
      await provideSeededCase("seed-blocked", provideReviewCase);
    },
    { timeout: 60000 },
  ],
});

test("physician reads stored time, exact versions, unknown facts and evidence with a keyboard", async ({
  page,
  baseURL,
  reviewCase,
}, testInfo) => {
  const reader = page.getByRole("main");
  await page.context().addCookies([
    {
      name: reviewCase.cookieName,
      value: reviewCase.token,
      url: baseURL!,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto("/doctor");
  await expect(
    reader
      .getByText(reviewCase.patientName, { exact: true })
      .filter({ visible: true }),
  ).toBeVisible();
  await expect(
    reader
      .locator(`time[datetime="${reviewCase.analysisTime}"]`)
      .filter({ visible: true }),
  ).toBeVisible();
  await reader
    .getByRole("link", { name: "Open review", exact: true })
    .filter({ visible: true })
    .click();
  await expect(
    reader.getByRole("heading", { name: "Patient context", exact: true }),
  ).toBeVisible();
  await expect(
    reader
      .getByRole("listitem")
      .filter({ hasText: /^Unknown/ })
      .first(),
  ).toBeVisible();
  await expect(
    reader.getByText(
      "This is a synthetic reader fixture; no live AI analysis was performed.",
    ),
  ).toBeVisible();
  const rationale = reader.getByText("View rationale and criteria", {
    exact: true,
  });
  await rationale.focus();
  await page.keyboard.press("Enter");
  await expect(
    reader.getByText(
      "Synthetic rendering fixture only; physician review is required.",
    ),
  ).toBeVisible();
  const evidence = reader.getByText("View evidence and sources", {
    exact: true,
  });
  await evidence.focus();
  await page.keyboard.press("Enter");
  await expect(
    reader.getByRole("link", { name: "Open source: uspstf-crc-2021" }),
  ).toHaveAttribute("href", /uspreventiveservicestaskforce\.org/);
  await expect(reader.getByText(/Evidence v1/)).toBeVisible();
  await expect(
    reader.getByText("US Preventive Services Task Force · 2021", {
      exact: true,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= window.innerWidth,
    ),
  ).toBe(true);
  await page.screenshot({
    path: testInfo.outputPath("physician-reader.png"),
    fullPage: true,
  });
  await page.reload();
  await expect(
    reader.getByRole("heading", { name: reviewCase.patientName, exact: true }),
  ).toBeVisible();
});

test("foreign session cannot open another dataset workspace", async ({
  page,
  baseURL,
  reviewCase,
  foreignCase,
}) => {
  await page.context().addCookies([
    {
      name: foreignCase.cookieName,
      value: foreignCase.token,
      url: baseURL!,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto(
    `/doctor/reviews/${encodeURIComponent(reviewCase.workspaceId)}`,
  );
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Patient context" }),
  ).toHaveCount(0);
});

test("newer profile warns about staleness without replacing the analyzed profile", async ({
  page,
  baseURL,
  staleCase: reviewCase,
}) => {
  await page.context().addCookies([
    {
      name: reviewCase.cookieName,
      value: reviewCase.token,
      url: baseURL!,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto(
    `/doctor/reviews/${encodeURIComponent(reviewCase.workspaceId)}`,
  );
  await expect(page.getByText("Stale analysis", { exact: true })).toBeVisible();
  await expect(page.getByText(/System-structured profile v1/)).toBeVisible();
  await expect(page.getByText("50", { exact: true })).toBeVisible();
});

test("blocked analysis has no fallback proposals", async ({
  page,
  baseURL,
  blockedCase: blocked,
}) => {
  await page.context().addCookies([
    {
      name: blocked.cookieName,
      value: blocked.token,
      url: baseURL!,
      httpOnly: true,
      sameSite: "Lax",
    },
  ]);
  await page.goto(`/doctor/reviews/${encodeURIComponent(blocked.workspaceId)}`);
  await expect(
    page.getByText("Analysis blocked", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByText("No proposals available.", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Demonstrative review item" }),
  ).toHaveCount(0);
});
