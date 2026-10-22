import { expect, test } from "@playwright/test";

const routes = [
  ["/patient", "Olá, Marina"],
  ["/patient/intake", "Informações do exemplo"],
  ["/patient/plan", "Acompanhamento preventivo"],
  ["/doctor", "Fila de revisões"],
  ["/doctor/reviews/demo-review-01", "Marina Exemplo"],
  ["/showcase", "Biblioteca de componentes"],
];
for (const [route, title] of routes) {
  test(`${route} renders without overflow or runtime errors`, async ({
    page,
  }) => {
    const errors: string[] = [];
    page.on("pageerror", (error) => errors.push(error.message));
    await page.goto(route);
    await expect(
      page.getByRole("heading", { name: title, exact: true, level: 1 }),
    ).toBeVisible();
    await expect(
      page.getByText("Ambiente demonstrativo", { exact: true }),
    ).toBeVisible();
    expect(
      await page.evaluate(
        () => document.documentElement.scrollWidth <= window.innerWidth,
      ),
    ).toBe(true);
    expect(errors).toEqual([]);
  });
}
test("patient and doctor navigation and review boundary", async ({ page }) => {
  await page.goto("/patient");
  await page.getByRole("link", { name: "Consultar meu histórico" }).click();
  await expect(page).toHaveURL(/\/patient\/intake$/);
  await page.getByRole("link", { name: "Meu plano", exact: true }).click();
  await expect(
    page.getByRole("heading", {
      name: "Nenhum plano disponível neste exemplo",
    }),
  ).toBeVisible();
  await page.getByRole("link", { name: /Ver como médico/ }).click();
  await page.getByRole("link", { name: "Abrir revisão" }).click();
  await expect(
    page.getByRole("button", { name: "Aprovar", exact: true }),
  ).toBeDisabled();
  await page.getByText("Consultar evidências e origem").click();
  await expect(
    page.getByText(/Nenhuma evidência clínica foi carregada/),
  ).toBeVisible();
  await page.getByRole("link", { name: "Voltar à fila" }).click();
  await expect(page).toHaveURL(/\/doctor$/);
});
test("skip link receives keyboard focus and reaches main", async ({ page }) => {
  await page.goto("/patient");
  await page.keyboard.press("Tab");
  await expect(
    page.getByRole("link", { name: "Pular para o conteúdo" }),
  ).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(page.getByRole("main")).toBeFocused();
});
test("showcase validates accessibly without persisting data", async ({
  page,
}) => {
  await page.goto("/showcase");
  await page.getByRole("button", { name: "Validar exemplo" }).click();
  await expect(
    page
      .getByRole("alert")
      .filter({ hasText: "Use pelo menos dois caracteres." }),
  ).toBeVisible();
  await expect(page.getByLabel("Texto de exemplo")).toBeFocused();
  await page.getByLabel("Texto de exemplo").fill("Exemplo sintético");
  await page.getByRole("button", { name: "Validar exemplo" }).click();
  await expect(page.getByRole("status")).toHaveText(
    "Formato válido. O texto não foi salvo.",
  );
  await page.reload();
  await expect(page.getByLabel("Texto de exemplo")).toHaveValue("");
});
test("unknown review does not disclose another fixture", async ({ page }) => {
  const response = await page.goto("/doctor/reviews/unknown");
  expect(response?.status()).toBe(404);
  await expect(
    page.getByRole("heading", { name: "Página não encontrada" }),
  ).toBeVisible();
});
