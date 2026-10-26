import { expect, test, type Page } from "@playwright/test";

const caseHeading = (page: Page, name: string) =>
  page.getByRole("heading", { name: `Demo case: ${name}`, level: 2 });

async function selectCase(page: Page, name: string) {
  const form = page.getByRole("form", { name: "Choose demo case" });
  await form.getByRole("button", { name, exact: true }).click();
  // Selection reseeds the dataset in one locked transaction; allow for slow CI/mobile runs.
  await expect(caseHeading(page, name)).toBeVisible({ timeout: 15000 });
}

test("demo selector keeps its description readable at phone and desktop widths", async ({
  page,
}, testInfo) => {
  const width = testInfo.project.name === "mobile" ? 390 : 1440;
  await page.setViewportSize({ width, height: 900 });
  await page.goto("/patient");
  const selector = page
    .getByRole("region")
    .filter({ has: page.getByRole("form", { name: "Choose demo case" }) });
  async function checkLayout() {
    const description = await selector.locator("p").boundingBox();
    const buttons = await selector
      .getByRole("form", { name: "Choose demo case" })
      .boundingBox();
    if (!description || !buttons)
      throw new Error("Demo selector must be visible");
    if (width === 390) {
      expect(description.width).toBeGreaterThan(width * 0.8);
      expect(buttons.y).toBeGreaterThanOrEqual(
        description.y + description.height,
      );
    } else {
      expect(buttons.x).toBeGreaterThanOrEqual(
        description.x + description.width,
      );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  }
  await expect(
    selector.getByRole("heading", { name: "Select a demo case", exact: true }),
  ).toBeVisible();
  await checkLayout();
  await selectCase(page, "Jordan Example");
  await checkLayout();
  await selector.screenshot({
    path: testInfo.outputPath(`demo-selector-${width}.png`),
  });
});

test("shows the select-a-case entry state without a session", async ({
  page,
}) => {
  for (const route of ["/patient", "/doctor"]) {
    await page.goto(route);
    if (route === "/patient") {
      await expect(
        page.getByRole("heading", { name: "Select a demo case", level: 1 }),
      ).toBeVisible();
      await expect(page.getByRole("heading", { name: /Hello,/ })).toHaveCount(
        0,
      );
    }
    await expect(
      page.getByRole("heading", { name: "Select a demo case", level: 2 }),
    ).toBeVisible();
    await expect(page.getByRole("button", { name: "Reset demo" })).toHaveCount(
      0,
    );
    await expect(
      page.getByText(/DEMONSTRATIVE — NOT CLINICALLY VALIDATED/).first(),
    ).toBeVisible();
  }
});

test("selected case is shared across views and survives refresh", async ({
  page,
}) => {
  await page.goto("/patient");
  await selectCase(page, "Jordan Example");
  await expect(
    page.getByRole("heading", { name: "Hello, Jordan", level: 1 }),
  ).toBeVisible();
  await expect(
    page.getByRole("button", { name: "Jordan Example", exact: true }),
  ).toHaveAttribute("aria-pressed", "true");

  await page.reload();
  await expect(caseHeading(page, "Jordan Example")).toBeVisible();

  await page.getByRole("link", { name: /View as physician/ }).click();
  await expect(page).toHaveURL(/\/doctor$/);
  await expect(caseHeading(page, "Jordan Example")).toBeVisible();
  await expect(
    page.getByText("Demonstration environment", { exact: true }),
  ).toBeVisible();
});

test("reset keeps the case and switching updates both views", async ({
  page,
}) => {
  await page.goto("/doctor");
  await selectCase(page, "Alex Example");
  await page.getByRole("button", { name: "Reset demo" }).click();
  await expect(caseHeading(page, "Alex Example")).toBeVisible();

  await selectCase(page, "Jordan Example");
  await page.goto("/patient");
  await expect(caseHeading(page, "Jordan Example")).toBeVisible();
  await expect(
    page.getByRole("heading", { name: "Hello, Jordan", level: 1 }),
  ).toBeVisible();
});
