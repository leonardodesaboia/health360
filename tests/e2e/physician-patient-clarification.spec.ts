import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
import AxeBuilder from "@axe-core/playwright";
const execute = promisify(execFile);
// Axe must read resting colors, not a mid-transition frame; globals.css disables
// transitions under prefers-reduced-motion, so the contrast rule stays unchanged.
test.use({ reducedMotion: "reduce" });
const run = async (...args: string[]) =>
  (
    await execute(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        "tests/support/physician-patient-session.ts",
        ...args,
      ],
      { encoding: "utf8", timeout: 60000, windowsHide: true },
    )
  ).stdout;

for (const kind of ["bounded", "free-text"] as const)
  test(`physician ${kind} CLARIFY reaches the patient and a fresh review`, async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(180000);
    if (!baseURL) throw new Error("Application URL required");
    const fixture = z
      .object({ token: z.string(), workspaceId: z.string() })
      .parse(JSON.parse(await run("create")));
    const question =
      kind === "bounded"
        ? "Please confirm your current age for this demo review."
        : "What would you like the demo reviewer to know about your follow-up?";
    try {
      await context.addCookies([
        {
          name: "h360_demo_session",
          value: fixture.token,
          url: baseURL,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await page.goto(
        `/doctor/reviews/${encodeURIComponent(fixture.workspaceId)}`,
      );
      const decisions = page.getByRole("region", {
        name: "Physician decisions",
        exact: true,
      });
      await decisions
        .getByLabel("Decision for proposal 1", { exact: true })
        .selectOption("CLARIFY");
      await decisions.getByLabel(/^Question for the patient/).fill(question);
      if (kind === "bounded")
        await decisions
          .getByLabel("Related intake question (optional)", { exact: true })
          .selectOption("age");
      await expect(decisions).toContainText(
        "Sends the question to the patient and requires updated information and a new analysis. This does not publish a plan.",
      );
      await expect(
        decisions.getByRole("button", { name: "Finalize review", exact: true }),
      ).toBeDisabled();
      const patient = await context.newPage();
      await patient.goto("/patient/clarification");
      await expect(patient.getByLabel(question, { exact: true })).toHaveCount(
        0,
      );
      await patient.goto("/patient/plan");
      await expect(
        patient.getByRole("heading", { name: "Selected actions", exact: true }),
      ).toHaveCount(0);
      await patient.close();
      await decisions
        .getByRole("button", {
          name: "Send clarification request",
          exact: true,
        })
        .click();
      await expect(decisions.getByRole("status")).toContainText(
        "Clarification requested",
      );
      await page.goto("/patient/analysis");
      await page
        .getByRole("link", { name: "Answer missing information" })
        .click();
      await expect(page.getByLabel(question, { exact: true })).toBeVisible();
      await page.reload();
      const unknown = page.getByLabel(
        `I don't know — ${kind === "bounded" ? question.toLowerCase() : question}`,
      );
      await expect(unknown).toBeVisible();
      if (kind === "free-text") {
        await expect(unknown).toBeChecked();
        await unknown.focus();
        await page.keyboard.press("Space");
      }
      await page
        .getByLabel(question, { exact: true })
        .fill(
          kind === "bounded"
            ? "61"
            : "I would like to discuss the next steps at the demo review.",
        );
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      // The shared case selector hydrates independently; wait for its loading
      // opacity to settle before measuring whole-page contrast.
      await expect(page.locator("#demo-case-title")).toHaveText(/^Demo case:/);
      await page.getByText("Presenter controls", { exact: true }).click();
      const selectedCase = page.getByRole("button", {
        name: "Alex Example",
        exact: true,
      });
      await expect(selectedCase).toBeEnabled();
      await expect(selectedCase).toHaveCSS("opacity", "1");
      const { violations } = await new AxeBuilder({ page }).analyze();
      expect(
        violations.filter((v) =>
          ["serious", "critical"].includes(v.impact ?? ""),
        ),
      ).toEqual([]);
      await page.locator("main").screenshot({
        path: test.info().outputPath(`physician-${kind}-questions.png`),
      });
      await page
        .getByRole("button", { name: "Save answers and analyze again" })
        .click();
      await expect(page).toHaveURL(/\/patient\/analysis$/);
      await expect(
        page.getByText("Awaiting physician review", { exact: true }),
      ).toBeVisible();
      const next = z
        .object({ workspaceId: z.string() })
        .parse(JSON.parse(await run("inspect", fixture.token)));
      expect(next.workspaceId).not.toBe(fixture.workspaceId);
      await page.goto(
        `/doctor/reviews/${encodeURIComponent(next.workspaceId)}`,
      );
      await expect(
        decisions.getByLabel("Decision for proposal 1", { exact: true }),
      ).toHaveValue("PENDING");
      await decisions
        .getByRole("button", { name: "Save decisions", exact: true })
        .click();
      await expect(decisions.getByRole("status")).toContainText(
        "decisions saved",
      );
      await run("assert-review", fixture.token);
    } finally {
      await run("remove", fixture.token);
    }
  });
