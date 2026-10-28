import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
const execute = promisify(execFile);

test("a patient completes reassessment intake and runs a new analysis while plan v1 remains", async ({
  page,
  context,
  baseURL,
}) => {
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
    await expect(
      page.getByText("Previous reviewed plan", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Reviewed action wording", { exact: true }),
    ).toBeVisible();
    await run("assert-intake", fixture.token);
  } finally {
    await run("remove", fixture.token);
  }
});
