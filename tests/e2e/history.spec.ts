import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
const execute = promisify(execFile);

test("history navigation explains the missing session without revealing any records", async ({
  page,
}) => {
  await page.goto("/patient");
  await page.getByRole("link", { name: "History", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Your follow-up history" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Select a demonstration case" }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Update my information" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "History", exact: true }),
  ).toHaveAttribute("aria-current", "page");
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Go to Home" }).focus();
  await expect(page.getByRole("link", { name: "Go to Home" })).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/patient$/);
});

test("a persisted reassessment preserves the old plan and publishes a separately reviewed version", async ({
  page,
  context,
  baseURL,
}) => {
  test.setTimeout(180_000);
  if (!baseURL) throw new Error("The configured application URL is required");
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
        { encoding: "utf8", timeout: 60_000 },
      )
    ).stdout;
  const fixture = z
    .object({ token: z.string(), planId: z.string() })
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
    await expect(
      page.getByRole("link", { name: "View plan version 1" }),
    ).toBeVisible();
    await page.getByRole("button", { name: "Update my information" }).click();
    await expect(page).toHaveURL(/\/patient\/intake$/);
    await page.goto("/patient/plan");
    await expect(
      page.getByText("Previous reviewed plan", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Reviewed action wording", { exact: true }),
    ).toBeVisible();
    await page.goto("/patient/history");
    await expect(
      page.getByText("Reassessment requested", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByRole("link", { name: "Continue updating information" }),
    ).toBeVisible();
    await run("complete", fixture.token);
    await page.reload();
    await expect(
      page.getByRole("link", { name: "View plan version 2" }),
    ).toBeVisible();
    await page.getByRole("link", { name: "View plan version 1" }).click();
    await expect(
      page.getByRole("heading", { name: "Plan version 1" }),
    ).toBeVisible();
    await expect(
      page.getByText(
        "This earlier plan has been preserved. It reflects the information and review recorded for that version.",
        { exact: true },
      ),
    ).toBeVisible();
    await expect(
      page.getByText("Reviewed action wording", { exact: true }),
    ).toBeVisible();
    await expect(
      page.getByText("Updated reviewed action wording", { exact: true }),
    ).toHaveCount(0);
    await page.getByRole("link", { name: "Back to history" }).click();
    await page.getByRole("link", { name: "View plan version 2" }).click();
    await expect(
      page.getByText("Updated reviewed action wording", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  } finally {
    await run("remove", fixture.token);
  }
});

test("a direct historical plan URL cannot read a plan without its selected dataset", async ({
  page,
}) => {
  await page.goto("/patient/history/another-dataset-plan");
  await expect(
    page.getByRole("heading", { name: "Page not found" }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Selected actions" }),
  ).toHaveCount(0);
});
