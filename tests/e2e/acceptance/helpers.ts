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

export async function selectCase(
  page: Page,
  name: "Alex Example" | "Jordan Example",
) {
  await page.goto("/patient");
  await page
    .getByRole("form", { name: "Choose demo case" })
    .getByRole("button", { name, exact: true })
    .click();
  await expect(
    page.getByRole("heading", { name: `Demo case: ${name}`, exact: true }),
  ).toBeVisible({ timeout: 15000 });
}

/** Real browser intake; no profile or analysis fixture is substituted for this journey. */
export async function completeFirstIntake(page: Page) {
  await page.goto("/patient/intake");
  await page
    .getByLabel("Age in the synthetic scenario", { exact: true })
    .fill("50");
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
  await expect(
    page.getByLabel("Age in the synthetic scenario", { exact: true }),
  ).toHaveValue("50");
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
  await expect(page).toHaveURL(/\/patient\/analysis$/);
}

export async function assertNoUnreviewedPlan(page: Page) {
  await page.goto("/patient/plan");
  await expect(
    page.getByRole("heading", { name: "Preventive follow-up", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", {
      name: /^(Awaiting a reviewed plan|Plan unavailable: analysis not completed)$/,
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
