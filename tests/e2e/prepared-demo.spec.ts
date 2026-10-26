import { expect, test, type Page } from "@playwright/test";

const preparedNames: Record<string, string> = {
  "alex-review": "Alex — physician review",
  "jordan-review": "Jordan — possible redundancy review",
  "alex-plan-v1": "Alex — reviewed plan v1",
  "alex-analysis-failed": "Alex — analysis failed, ready to retry",
};

const preparedButton = (page: Page, id: string) =>
  page.getByRole("button", {
    name: preparedNames[id],
    exact: true,
    includeHidden: true,
  });

async function loadPrepared(page: Page, id: string) {
  await page.getByText("Prepared starting points", { exact: true }).click();
  await preparedButton(page, id).click();
}

for (const state of [
  { id: "alex-review", patient: "Alex Example", path: /\/doctor$/ },
  { id: "jordan-review", patient: "Jordan Example", path: /\/doctor$/ },
  { id: "alex-plan-v1", patient: "Alex Example", path: /\/patient\/plan$/ },
  {
    id: "alex-analysis-failed",
    patient: "Alex Example",
    path: /\/patient\/analysis$/,
  },
]) {
  test(`${state.id} renders its producer-built starting screen after selection and refresh`, async ({
    page,
  }) => {
    test.setTimeout(60000);
    await page.goto("/patient");
    await loadPrepared(page, state.id);
    await expect(page).toHaveURL(state.path, { timeout: 30000 });
    await expect(
      page.getByRole("heading", {
        name: `Demo case: ${state.patient}`,
        exact: true,
      }),
    ).toBeVisible();
    await expect(preparedButton(page, state.id)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await page.reload();
    await expect(preparedButton(page, state.id)).toHaveAttribute(
      "aria-pressed",
      "true",
    );
    await expect(
      page.getByText(/DEMONSTRATIVE — NOT CLINICALLY VALIDATED/).first(),
    ).toBeVisible();
    if (state.id === "alex-plan-v1") {
      await expect(page.getByRole("main")).toContainText(
        "Reviewed demonstration plan",
      );
      await expect(page.getByRole("main")).toContainText("Plan version: 1");
      await page.getByRole("link", { name: "History", exact: true }).click();
      await expect(
        page.getByRole("button", {
          name: "Update my information",
          exact: true,
        }),
      ).toBeEnabled();
    } else if (state.id === "alex-analysis-failed") {
      await expect(
        page.getByRole("button", { name: "Retry analysis", exact: true }),
      ).toBeVisible();
      await page
        .getByRole("button", { name: "Retry analysis", exact: true })
        .click();
      await expect(page.getByRole("main")).toContainText(
        "The preliminary analysis is awaiting physician review.",
        { timeout: 30000 },
      );
    } else {
      const queue = page.getByRole("main");
      await expect(queue).toContainText(state.patient);
      await expect(queue).toContainText("Awaiting physician review");
      await queue
        .getByRole("link", { name: "Open review", exact: true })
        .filter({ visible: true })
        .click();
      await expect(
        page.getByRole("region", { name: "Physician decisions", exact: true }),
      ).toBeVisible();
      await expect(
        page.getByLabel("Decision for proposal 1", { exact: true }),
      ).toHaveValue("PENDING");
      await expect(
        page.getByRole("button", { name: "Finalize review", exact: true }),
      ).toBeDisabled();
      if (state.id === "jordan-review")
        await expect(page.getByRole("main")).toContainText(
          "Possible redundant test",
        );
    }
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= innerWidth,
      ),
    ).toBe(true);
  });
}

test("prepared reset rebuilds the selected starting point and keyboard controls remain usable", async ({
  page,
}) => {
  test.setTimeout(60000);
  await page.goto("/patient");
  const menu = page.getByText("Prepared starting points", { exact: true });
  await menu.focus();
  await expect(menu).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(preparedButton(page, "alex-review")).toBeEnabled();
  await page.keyboard.press("Tab");
  await expect(preparedButton(page, "alex-review")).toBeFocused();
  for (let index = 0; index < 3; index++) await page.keyboard.press("Tab");
  await expect(preparedButton(page, "alex-analysis-failed")).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page).toHaveURL(/\/patient\/analysis$/, { timeout: 30000 });
  await page
    .getByRole("button", { name: "Retry analysis", exact: true })
    .click();
  await expect(page.getByRole("main")).toContainText(
    "awaiting physician review",
    { timeout: 30000 },
  );
  await page.getByRole("button", { name: "Reset demo", exact: true }).click();
  await expect(
    page.getByRole("button", { name: "Retry analysis", exact: true }),
  ).toBeVisible({ timeout: 30000 });
  await expect(preparedButton(page, "alex-analysis-failed")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
