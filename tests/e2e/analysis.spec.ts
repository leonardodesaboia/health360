import { test, expect } from "@playwright/test";
import {
  test as journeyTest,
  selectCase,
  completeFirstIntake,
} from "./acceptance/helpers";

journeyTest(
  "pending analysis reports the request without completing a stage; refresh never writes",
  async ({ page, context, demo }, testInfo) => {
    await page.setViewportSize({
      width: testInfo.project.name === "desktop" ? 1440 : 390,
      height: 900,
    });
    journeyTest.setTimeout(180000);
    await selectCase(page, "Alex Example");
    const token = await demo.track(context);
    await completeFirstIntake(page);
    await demo.fail(token, "timeout");
    await page.reload();
    let release!: () => void;
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    await page.route("**/patient/analysis", async (route) => {
      if (route.request().method() === "POST") await gate;
      await route.continue();
    });
    try {
      await page
        .getByRole("button", { name: "Retry analysis", exact: true })
        .click();
      await expect(
        page.getByRole("button", {
          name: "Analyzing current information…",
          exact: true,
        }),
      ).toBeDisabled();
      await expect(page.getByRole("status")).toContainText(
        "Analysis requested. Waiting for the server response.",
      );
      await expect(
        page.getByText("Last recorded status: Analysis not completed", {
          exact: true,
        }),
      ).toBeVisible();
      await expect(
        page.getByRole("heading", { name: "Retry the analysis", exact: true }),
      ).toHaveCount(0);
      const disclosure = page.getByText("View evaluation steps", {
        exact: true,
      });
      if (await disclosure.isVisible()) await disclosure.click();
      await expect(
        page
          .getByRole("list", { name: "Evaluation progress", exact: true })
          .filter({ visible: true })
          .getByRole("listitem"),
      ).toHaveText([
        "IntakeComplete",
        "AnalysisBlocked",
        "Physician reviewWaiting",
        "PlanWaiting",
      ]);
      if (await disclosure.isVisible()) await disclosure.click();
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      await page.screenshot({
        path: testInfo.outputPath("analysis-request-pending.png"),
        fullPage: true,
      });
      expect((await demo.inspect(token)).status).toBe("ANALYSIS_FAILED");
    } finally {
      release();
    }
    await expect(
      page.getByRole("heading", {
        name: "Waiting for the demo reviewer",
        exact: true,
      }),
    ).toBeVisible({ timeout: 30000 });
    const before = await demo.inspect(token);
    let writes = 0;
    page.on("request", (request) => {
      if (request.method() === "POST") writes++;
    });
    const refreshed = page.waitForRequest(
      (request) =>
        request.method() === "GET" &&
        new URL(request.url()).pathname === "/patient/analysis" &&
        request.headers()["rsc"] === "1",
    );
    await page
      .getByRole("button", { name: "Refresh status", exact: true })
      .click();
    await refreshed;
    await expect(
      page.getByRole("heading", {
        name: "Waiting for the demo reviewer",
        exact: true,
      }),
    ).toBeVisible();
    expect(await demo.inspect(token)).toEqual(before);
    expect(writes).toBe(0);
  },
);

test("analysis status without a demo session offers no analysis or proposals", async ({
  page,
}) => {
  await page.goto("/patient/analysis");
  await expect(
    page.getByRole("heading", { name: "Analysis status" }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("main")
      .getByText("DEMONSTRATIVE — NOT CLINICALLY VALIDATED", { exact: true }),
  ).toBeVisible();
  await expect(page.getByRole("main")).toContainText(
    "Choose Alex Example or Jordan Example in Presenter controls to begin this synthetic demonstration.",
  );
  await expect(
    page.getByRole("button", { name: /Analyze|Retry analysis/ }),
  ).toHaveCount(0);
  await expect(page.getByText(/proposal:|recommendation:/i)).toHaveCount(0);
});

test("analysis error query never exposes raw provider errors", async ({
  page,
}) => {
  await page.goto("/patient/analysis?error=1");
  await expect(page.getByRole("main")).toContainText(
    "We could not confirm the analysis result",
  );
  await expect(page.getByRole("main")).not.toContainText(
    /database|stack|OPENAI_API_KEY/i,
  );
  await expect(
    page.getByRole("button", { name: /Analyze|Retry analysis/ }),
  ).toHaveCount(0);
});
