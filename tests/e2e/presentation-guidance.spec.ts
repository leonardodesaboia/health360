import { expect, test } from "@playwright/test";

test("selected identity and demo role stay visible with keyboard-operable presenter controls", async ({
  page,
}, info) => {
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 390 : 1440,
    height: 900,
  });
  await page.goto("/patient");
  const summary = page.getByText("Presenter controls", { exact: true });
  await expect(
    page.getByRole("button", { name: "Alex Example", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "Alex Example", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Demo case: Alex Example", exact: true }),
  ).toBeVisible();
  await expect(page.getByText("Patient view", { exact: true })).toBeVisible();
  await expect(
    page.getByText("Demo navigation only; no sign-in or authorization.", {
      exact: true,
    }),
  ).toBeVisible();
  await expect(
    page.getByText(/DEMONSTRATIVE — NOT CLINICALLY VALIDATED/).first(),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset demo", exact: true }),
  ).toBeHidden();
  await summary.focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Reset demo", exact: true }),
  ).toBeVisible();
  const box = await summary.boundingBox();
  expect(box?.height).toBeGreaterThanOrEqual(44);
  await page.keyboard.press("Space");
  await expect(
    page.getByRole("button", { name: "Reset demo", exact: true }),
  ).toBeHidden();
  await page.getByRole("link", { name: /View as physician/ }).click();
  await expect(
    page.getByText("Physician view · Demo reviewer", { exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Demo case: Alex Example", exact: true }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Reset demo", exact: true }),
  ).toBeHidden();
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});

test("journey semantics and refresh preserve the recorded review state without a write", async ({
  page,
}, info) => {
  await page.setViewportSize({
    width: info.project.name === "mobile" ? 390 : 1440,
    height: 900,
  });
  await page.goto("/showcase");
  if (info.project.name === "mobile") {
    await expect(
      page.getByText("Current stage: Physician review", { exact: true }),
    ).toBeVisible();
    const disclosure = page.getByText("View evaluation steps", { exact: true });
    await disclosure.focus();
    await page.keyboard.press("Enter");
  }
  const list = page.getByRole("list", { name: "Evaluation progress" });
  await expect(list).toBeVisible();
  await expect(list.getByRole("listitem")).toHaveCount(4);
  await expect(list.locator('[aria-current="step"]')).toHaveCount(1);
  await expect(list.locator('[aria-current="step"]')).toContainText(
    "Physician review",
  );
  await expect(list.getByRole("listitem").nth(3)).toContainText("Waiting");
  const next = page.getByRole("region", {
    name: "What happens next",
    exact: true,
  });
  await expect(next).toContainText("Next: Demo reviewer");
  await expect(next.getByRole("button")).toHaveCount(1);
  const writes: string[] = [];
  page.on("request", (request) => {
    if (request.method() !== "GET") writes.push(request.method());
  });
  const read = page.waitForRequest(
    (request) =>
      request.url().includes("/showcase") && request.method() === "GET",
  );
  await next
    .getByRole("button", { name: "Refresh status", exact: true })
    .click();
  await read;
  await expect(next).toContainText("Waiting for the demo reviewer");
  expect(writes).toEqual([]);
  await page.screenshot({
    path: info.outputPath("workflow-guidance.png"),
    fullPage: true,
  });
});

test("session read errors remain visible outside closed presenter controls", async ({
  page,
}) => {
  await page.route("**/api/demo-session", (route) =>
    route.fulfill({ status: 503, body: "unavailable" }),
  );
  await page.goto("/patient");
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "The demo storage could not be reached" }),
  ).toContainText("The demo storage could not be reached");
  await expect(
    page.getByRole("button", { name: "Alex Example", exact: true }),
  ).toBeHidden();
});

test("presenter QA: desktop case, prepared and reset controls share one row", async ({
  page,
}, info) => {
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.route("**/api/demo-session", (route) =>
    route.fulfill({
      json: {
        session: {
          caseId: "first-screening",
          displayName: "Alex Example",
          summary: "Synthetic case",
        },
        preparedStatesAvailable: true,
      },
    }),
  );
  await page.goto("/showcase");
  await expect(page.locator("#demo-case-title")).toHaveText(
    "Demo case: Alex Example",
  );
  await page.getByText("Presenter controls", { exact: true }).click();
  const caseButton = await page
    .getByRole("button", { name: "Alex Example", exact: true })
    .boundingBox();
  const prepared = await page
    .getByText("Prepared starting points", { exact: true })
    .boundingBox();
  const reset = await page
    .getByRole("button", { name: "Reset demo", exact: true })
    .boundingBox();
  expect(caseButton).not.toBeNull();
  expect(prepared?.y).toBe(caseButton?.y);
  expect(reset?.y).toBe(caseButton?.y);
  await page.screenshot({
    path: info.outputPath("presenter-controls.png"),
    fullPage: true,
  });
});

test("presenter QA: a prepared reset explains the mock-provider requirement", async ({
  page,
}) => {
  await page.route("**/api/demo-session", (route) =>
    route.fulfill({
      json: {
        session: {
          caseId: "first-screening",
          preparedStateId: "alex-review",
          displayName: "Alex Example",
          summary: "Synthetic prepared case",
        },
        preparedStatesAvailable: false,
      },
    }),
  );
  await page.goto("/showcase");
  await expect(page.locator("#demo-case-title")).toHaveText(
    "Demo case: Alex Example",
  );
  await page.getByText("Presenter controls", { exact: true }).click();
  let submissions = 0;
  page.on("request", (request) => {
    if (request.method() === "POST") submissions++;
  });
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText: "This prepared starting point requires the mock provider",
    }),
  ).toBeVisible();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Select Alex Example or Jordan Example" }),
  ).toBeVisible();
  expect(submissions).toBe(0);
  await page.getByText("Presenter controls", { exact: true }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText: "This prepared starting point requires the mock provider",
    }),
  ).toBeVisible();
});

test("presenter QA: developer showcase remains URL-only", async ({ page }) => {
  await page.goto("/doctor");
  await expect(
    page.getByRole("link", { name: "Components", exact: true }),
  ).toHaveCount(0);
  await expect(
    page.getByRole("link", { name: "Component library", exact: true }),
  ).toHaveCount(0);
  await page.goto("/showcase");
  await expect(
    page.getByRole("heading", { name: "Component library", level: 1 }),
  ).toBeVisible();
});

test("presenter QA: reset refreshes stale provider capability after failure", async ({
  page,
}) => {
  let reads = 0;
  await page.route("**/api/demo-session", (route) =>
    route.fulfill({
      json: {
        session: {
          caseId: "first-screening",
          preparedStateId: "alex-review",
          displayName: "Alex Example",
          summary: "Synthetic prepared case",
        },
        preparedStatesAvailable: ++reads === 1,
      },
    }),
  );
  await page.route("**/showcase", (route) =>
    route.request().method() === "POST"
      ? route.fulfill({ status: 503, body: "unavailable" })
      : route.continue(),
  );
  await page.goto("/showcase");
  await expect(page.locator("#demo-case-title")).toHaveText(
    "Demo case: Alex Example",
  );
  await page.getByText("Presenter controls", { exact: true }).click();
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(
    page.getByRole("alert").filter({
      hasText: "This prepared starting point requires the mock provider",
    }),
  ).toBeVisible();
  expect(reads).toBe(2);
  await expect(page.locator("#demo-case-title")).toHaveText(
    "Demo case: Alex Example",
  );
});
