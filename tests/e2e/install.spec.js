import { test, expect, boot, settingsDialog } from "./fixtures.js";

test("installation guidance is usable from phone settings when native installation is unavailable", async ({
  page,
}) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await boot(page);
  await page.locator(".bottom-nav .settings-trigger").click();
  await page.locator("#settingsDialog .install-trigger").click();
  await expect(page.locator("#settingsDialog")).not.toBeVisible();
  await expect(page.locator("#installDialog")).toBeVisible();
  await expect(page.locator("#installDialog")).toContainText(
    "Tambah ke Skrin Utama",
  );
  await expect(page.locator("#installDialog")).toContainText("tanpa internet");
  await page.keyboard.press("Escape");
  await expect(page.locator("#installDialog")).not.toBeVisible();
  await expect(page.locator(".bottom-nav")).toBeVisible();
});

test("native install prompt is consumed once and rejected prompts show recovery guidance", async ({
  page,
}) => {
  await boot(page);
  await page.evaluate(() => {
    const event = new Event("beforeinstallprompt", { cancelable: true });
    window.installAttempts = 0;
    Object.assign(event, {
      prompt: async () => {
        window.installAttempts++;
        throw new Error("Controlled install failure");
      },
      userChoice: Promise.resolve({ outcome: "dismissed" }),
    });
    window.dispatchEvent(event);
  });
  await page.locator(".install-strip .install-trigger").click();
  await expect(page.locator("#installDialog")).toBeVisible();
  await expect(page.locator("#installStatus")).toContainText(
    "Pemasangan tidak dapat dimulakan",
  );
  await page.keyboard.press("Escape");
  await settingsDialog(page);
  await page.locator("#settingsDialog .install-trigger").click();
  await expect(page.locator("#installDialog")).toBeVisible();
  await expect(page.locator("#installStatus")).toHaveText("");
  expect(await page.evaluate(() => window.installAttempts)).toBe(1);
});
