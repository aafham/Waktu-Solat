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

test("the first service-worker claim preserves the page and a later update reloads it once", async ({
  page,
}) => {
  // Exercise the application's real controllerchange handler without replacing
  // the worker script on the shared server or involving Chromium's SW cache.
  await page.addInitScript(() => {
    const loads = Number(sessionStorage.getItem("e2eWorkerPageLoads") || 0) + 1;
    sessionStorage.setItem("e2eWorkerPageLoads", String(loads));
    const worker = new EventTarget();
    worker.controller = sessionStorage.getItem("e2eWorkerClaimed") ? {} : null;
    worker.register = async () => ({
      update: async () => {
        const updates =
          Number(sessionStorage.getItem("e2eWorkerUpdateChecks") || 0) + 1;
        sessionStorage.setItem("e2eWorkerUpdateChecks", String(updates));
      },
    });
    Object.defineProperty(navigator, "serviceWorker", {
      configurable: true,
      value: worker,
    });
  });
  let documentRequests = 0;
  page.on("request", (request) => {
    if (request.isNavigationRequest() && request.frame() === page.mainFrame()) {
      documentRequests += 1;
    }
  });
  await boot(page);
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("e2eWorkerUpdateChecks")),
    )
    .toBe("1");

  await page.evaluate(() => {
    window.firstClaimDocument = "still here";
    sessionStorage.setItem("e2eWorkerClaimed", "true");
    navigator.serviceWorker.controller = { scriptURL: "first-worker.js" };
    navigator.serviceWorker.dispatchEvent(new Event("controllerchange"));
  });
  await page.clock.runFor(1100);
  await page.waitForLoadState("networkidle");
  expect(
    await page.evaluate(() => sessionStorage.getItem("e2eWorkerPageLoads")),
  ).toBe("1");
  expect(await page.evaluate(() => window.firstClaimDocument)).toBe(
    "still here",
  );
  expect(documentRequests).toBe(1);

  const navigation = page.waitForEvent("framenavigated", {
    predicate: (frame) => frame === page.mainFrame(),
  });
  await page.evaluate(() => {
    const worker = navigator.serviceWorker;
    worker.controller = { scriptURL: "updated-worker.js" };
    // Duplicate notifications during takeover must not cause a reload loop.
    for (let index = 0; index < 3; index += 1) {
      worker.dispatchEvent(new Event("controllerchange"));
    }
  });
  await navigation;
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#prayerGrid")).toHaveAttribute(
    "aria-busy",
    "false",
  );
  expect(
    await page.evaluate(() => sessionStorage.getItem("e2eWorkerPageLoads")),
  ).toBe("2");
  expect(await page.evaluate(() => window.firstClaimDocument)).toBeUndefined();
  expect(documentRequests).toBe(2);
  await expect
    .poll(() =>
      page.evaluate(() => sessionStorage.getItem("e2eWorkerUpdateChecks")),
    )
    .toBe("2");
});
