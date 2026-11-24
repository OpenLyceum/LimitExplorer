import { expect, test } from "@playwright/test";

test("the approach probes move toward a from their own side", async ({ page }) => {
  await page.goto("/?ea&screens=1");
  // The default function, (x² − 1)/(x − 1), is studied at a = 1; the probes start 0.45 away.
  const left = page.getByText("Left graph probe", { exact: true });
  const right = page.getByText("Right graph probe", { exact: true });
  await left.press("ArrowRight");
  await expect(page.getByText(/Left probe\s+x = 0\.57\b/)).toBeAttached();
  await right.press("ArrowLeft");
  await expect(page.getByText(/Right probe\s+x = 1\.43\b/)).toBeAttached();
  await expect(right).toBeFocused();
});

test("a prediction is judged and described", async ({ page }) => {
  await page.goto("/?ea&screens=1");
  await page.getByRole("button", { name: "Sides differ", exact: true }).press("Enter");
  await expect(page.getByText(/Not quite\. Removable discontinuity: the limit is 2\./)).toBeAttached();
  await page.getByRole("button", { name: "A number", exact: true }).press("Enter");
  await expect(page.getByText(/Right\. Removable discontinuity: the limit is 2\./)).toBeAttached();
});

test("the ε–δ sliders drive the verdict", async ({ page }) => {
  await page.goto("/?ea&screens=2");
  // x² near 1 with L = 0 and ε = 0.5 fails; with L = 1 and a small δ it holds.
  await expect(page.getByText(/Counterexample in the input band/)).toBeAttached();
  const target = page.getByRole("slider", { name: "Target L", exact: true });
  for (let i = 0; i < 20; i++) {
    await target.press("ArrowRight");
  }
  await expect(target).toHaveAttribute("aria-valuenow", "1");
  const delta = page.getByRole("slider", { name: "Input distance δ", exact: true });
  await delta.press("Home");
  await expect(page.getByText(/The inequality holds at every input/)).toBeAttached();
});
