import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";

// Axe must read resting colors, not a mid-transition frame; globals.css disables
// transitions under prefers-reduced-motion, so the contrast rule stays unchanged.
test.use({ reducedMotion: "reduce" });

test("main demo routes have no serious or critical axe violations", async ({
  page,
}) => {
  for (const route of [
    "/patient",
    "/patient/intake",
    "/patient/profile",
    "/patient/plan",
    "/doctor",
    "/showcase",
  ]) {
    await page.goto(route);
    await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    const { violations } = await new AxeBuilder({ page }).analyze();
    expect(
      violations.filter(({ impact }) =>
        ["serious", "critical"].includes(impact ?? ""),
      ),
      `Accessibility violations on ${route}`,
    ).toEqual([]);
  }
});

test("selected case controls and evaluation guidance remain accessible when expanded", async ({
  page,
}) => {
  await page.goto("/patient");
  await page.getByRole("button", { name: "Alex Example", exact: true }).click();
  await expect(
    page.getByRole("heading", { name: "Demo case: Alex Example", exact: true }),
  ).toBeVisible();
  await page.getByText("Presenter controls", { exact: true }).focus();
  await page.keyboard.press("Enter");
  await expect(
    page.getByRole("button", { name: "Reset demo", exact: true }),
  ).toBeVisible();
  const { violations } = await new AxeBuilder({ page }).analyze();
  expect(
    violations.filter(({ impact }) =>
      ["serious", "critical"].includes(impact ?? ""),
    ),
  ).toEqual([]);
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
});
