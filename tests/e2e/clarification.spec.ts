import { expect, test } from "@playwright/test";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { z } from "zod";
const execute = promisify(execFile);
const run = async (...args: string[]) =>
  (
    await execute(
      process.execPath,
      [
        "--conditions=react-server",
        "--import",
        "tsx",
        "tests/support/clarification-session.ts",
        ...args,
      ],
      { encoding: "utf8", timeout: 60000 },
    )
  ).stdout;

test("clarification without a selected session exposes no questions", async ({
  page,
}) => {
  await page.goto("/patient/clarification");
  await expect(
    page.getByRole("heading", {
      name: "Confirm missing information",
      level: 1,
    }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Save answers and analyze again" }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("main").getByRole("heading", { name: "Select a demo case" }),
  ).toBeVisible();
});

for (const scenario of ["known", "unknown", "interrupted"] as const) {
  test(`clarification ${scenario} preserves versions and reruns actual analysis`, async ({
    page,
    context,
    baseURL,
  }) => {
    test.setTimeout(180000);
    if (!baseURL) throw new Error("Application URL required");
    const fixture = z
      .object({ token: z.string() })
      .parse(
        JSON.parse(
          await run(scenario === "interrupted" ? "reserve" : "create"),
        ),
      );
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
      let stalePage;
      if (scenario === "interrupted") {
        await page.goto("/patient/clarification");
        await expect(
          page.getByRole("heading", { name: "Your information is saved" }),
        ).toBeVisible();
        await page
          .getByRole("button", { name: "Continue saved analysis" })
          .click();
      } else {
        await page.goto("/patient/analysis");
        await page
          .getByRole("link", { name: "Answer missing information" })
          .click();
        const unknown = page.getByLabel(
          "I don't know — how old are you in this synthetic scenario?",
        );
        await expect(unknown).toBeChecked();
        await page.reload();
        await expect(unknown).toBeChecked();
        expect(
          await page.evaluate(
            () => document.documentElement.scrollWidth <= innerWidth,
          ),
        ).toBe(true);
        await page.screenshot({
          path: test.info().outputPath("clarification.png"),
          fullPage: true,
        });
        if (scenario === "known") {
          stalePage = await context.newPage();
          await stalePage.goto("/patient/clarification");
          await unknown.focus();
          await expect(unknown).toBeFocused();
          await page.keyboard.press("Space");
          await page
            .getByLabel("How old are you in this synthetic scenario?", {
              exact: true,
            })
            .fill("60");
        }
        await page
          .getByRole("button", { name: "Save answers and analyze again" })
          .click();
      }
      await expect(page).toHaveURL(/\/patient\/analysis$/);
      await expect(
        page.getByText(
          scenario === "unknown"
            ? "More information needed"
            : "Awaiting physician review",
          { exact: true },
        ),
      ).toBeVisible();
      if (stalePage) {
        await stalePage
          .getByRole("button", { name: "Save answers and analyze again" })
          .click();
        await expect(
          stalePage.getByRole("main").getByRole("alert"),
        ).toContainText("Your evaluation changed");
        await stalePage.close();
      }
      if (scenario === "unknown") {
        await page
          .getByRole("link", { name: "Answer missing information" })
          .click();
        await expect(
          page.getByLabel(
            "I don't know — how old are you in this synthetic scenario?",
          ),
        ).toBeChecked();
      }
      await run("assert", fixture.token, scenario);
      await page.goto("/patient/plan");
      await expect(
        page.getByRole("heading", { name: "Selected actions" }),
      ).toHaveCount(0);
    } finally {
      await run("remove", fixture.token);
    }
  });
}
