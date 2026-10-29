import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
const execute = promisify(execFile);

test("a patient completes reassessment intake and runs a new analysis while plan v1 remains", async ({
  page,
  context,
  baseURL,
}, testInfo) => {
  await page.setViewportSize({
    width: testInfo.project.name === "desktop" ? 1440 : 390,
    height: 900,
  });
  test.setTimeout(180_000);
  if (!baseURL) throw new Error("Application URL required");
  const run = async (...args: string[]) =>
    (
      await execute(
        process.execPath,
        [
          "--conditions=react-server",
          "--import",
          "tsx",
          "tests/support/history-session.ts",
          ...args,
        ],
        { encoding: "utf8", timeout: 60000 },
      )
    ).stdout;
  const fixture = z
    .object({ token: z.string() })
    .parse(JSON.parse(await run("create")));
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
    await page.goto("/patient/history");
    await page.getByRole("button", { name: "Update my information" }).click();
    await expect(
      page.getByLabel("Age in the synthetic scenario", { exact: true }),
    ).toHaveValue("50");
    await page
      .getByLabel("Age in the synthetic scenario", { exact: true })
      .fill("61");
    await page
      .getByRole("button", { name: "Save and continue", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save and continue", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save and continue", exact: true })
      .click();
    await page
      .getByRole("button", { name: "Save and continue", exact: true })
      .click();
    await page
      .getByLabel(
        "I confirm these synthetic answers and want to save my profile.",
      )
      .check();
    await page
      .getByRole("button", { name: "Confirm and save profile" })
      .click();
    await expect(page).toHaveURL(/\/patient\/analysis$/);
    await page.getByRole("button", { name: "Analyze current profile" }).click();
    await expect(
      page.getByText("More information needed", { exact: true }),
    ).toBeVisible();
    await page.goto("/patient/plan");
    const next = page.getByRole("region", {
      name: "What happens next",
      exact: true,
    });
    await expect(
      next.getByRole("link", {
        name: "Answer missing information",
        exact: true,
      }),
    ).toHaveAttribute("href", "/patient/clarification");
    await expect(page.getByRole("main")).toContainText(
      "New evaluation in progress. Plan version 1 below is from an earlier review.",
    );
    await expect(
      page.getByText("Previous reviewed plan", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Reviewed action wording", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
    await page.screenshot({
      path: testInfo.outputPath("previous-plan-current-evaluation.png"),
      fullPage: true,
    });
    await run("assert-intake", fixture.token);
  } finally {
    await run("remove", fixture.token);
  }
});
