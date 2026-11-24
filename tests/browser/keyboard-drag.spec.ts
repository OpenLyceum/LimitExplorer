import { expect, test } from "@playwright/test";

test("the approach probes move independently and respect their side of the limit", async ({ page }) => {
  await page.goto("/?ea&screens=1");
  const left = page.getByRole("application", { name: "Left graph probe", exact: true });
  const right = page.getByRole("application", { name: "Right graph probe", exact: true });
  await left.focus();
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Tab");
  await expect(left).toBeFocused();
  await page.keyboard.press("ArrowRight");
  await expect(page.getByRole("slider", { name: "Left distance within view" })).toHaveAttribute(
    "aria-valuenow",
    "0.43",
  );
  await page.keyboard.press("Tab");
  await expect(right).toBeFocused();
  await page.keyboard.press("Shift+ArrowRight");
  await expect(page.getByRole("slider", { name: "Right distance within view" })).toHaveAttribute(
    "aria-valuenow",
    "0.455",
  );
});

test("the target and epsilon and delta bands respond along their own axes", async ({ page }) => {
  await page.goto("/?ea&screens=2");
  for (const { name, key, slider, value } of [
    { name: "Target value L", key: "ArrowUp", slider: "L", value: "0.04" },
    { name: "Epsilon band", key: "Shift+ArrowDown", slider: "ε", value: "0.49" },
    { name: "Delta band", key: "Shift+ArrowRight", slider: "δ", value: "0.401" },
  ]) {
    const handle = page.getByRole("application", { name, exact: true });
    await handle.press(key);
    await expect(page.getByRole("slider", { name: slider, exact: true })).toHaveAttribute("aria-valuenow", value);
    await expect(handle).toBeFocused();
  }
  await page.getByRole("slider", { name: "Zoom factor", exact: true }).press("End");
  const delta = page.getByRole("application", { name: "Delta band", exact: true });
  await delta.press("Shift+ArrowLeft");
  await expect(page.getByRole("slider", { name: "δ", exact: true })).toHaveAttribute("aria-valuenow", "0.4");
  await expect(delta).toBeFocused();
});
