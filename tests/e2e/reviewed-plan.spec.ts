import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
const execute = promisify(execFile);

test("direct patient plan URL does not expose preliminary proposals without a session", async ({
  page,
}) => {
  await page.goto("/patient/plan");
  await expect(
    page.getByRole("heading", { name: "Preventive follow-up" }),
  ).toBeVisible();
  await expect(
    page.getByRole("main").getByRole("heading", {
      name: "Select a demonstration case",
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Selected actions" }),
  ).toHaveCount(0);
  await expect(
    page.getByText("DEMONSTRATIVE — NOT CLINICALLY VALIDATED", {
      exact: false,
    }),
  ).toBeVisible();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
  await page.getByRole("link", { name: "Choose a demo case" }).focus();
  await expect(
    page.getByRole("link", { name: "Choose a demo case" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/patient#demo-case-title$/);
});

for (const state of ["reviewed", "pending"] as const) {
  test(`persisted ${state} cycle respects the patient publication boundary`, async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(120_000);
    if (!baseURL) throw new Error("The configured application URL is required");
    const run = async (...args: string[]) =>
      (
        await execute(
          process.execPath,
          [
            "--conditions=react-server",
            "--import",
            "tsx",
            "tests/support/plan-session.ts",
            ...args,
          ],
          { encoding: "utf8", timeout: 60_000 },
        )
      ).stdout;
    const token = (await run("create", state)).trim();
    try {
      await context.addCookies([
        {
          name: "h360_demo_session",
          value: token,
          url: baseURL,
          httpOnly: true,
          sameSite: "Lax",
        },
      ]);
      await page.goto("/patient/plan");
      if (state === "reviewed") {
        await expect(
          page.getByRole("heading", { name: "Selected actions" }),
        ).toBeVisible();
        await expect(
          page.getByText("Reviewed action wording", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Revised redundancy wording", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Reviewed information request", { exact: true }),
        ).toBeVisible();
        await expect(
          page.getByText("Rejected proposal", { exact: true }),
        ).toHaveCount(0);
        await expect(
          page.getByText("Unmodified proposal", { exact: true }),
        ).toHaveCount(0);
        await page.reload();
        await expect(
          page.getByText("Reviewed action wording", { exact: true }),
        ).toBeVisible();
      } else {
        await expect(
          page.getByRole("heading", {
            name: "Review has started",
            exact: true,
          }),
        ).toBeVisible();
        await expect(
          page.getByText("Reviewed action wording", { exact: true }),
        ).toHaveCount(0);
      }
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
    } finally {
      await run("remove", token);
    }
  });
}
