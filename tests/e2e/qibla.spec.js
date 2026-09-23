import { test, expect, boot, view } from "./fixtures.js";

test.use({
  permissions: ["geolocation", "accelerometer", "gyroscope", "magnetometer"],
});

async function orient(page, heading, absolute = true) {
  await page.evaluate(
    ({ heading, absolute }) => {
      window.dispatchEvent(
        new DeviceOrientationEvent(
          absolute ? "deviceorientationabsolute" : "deviceorientation",
          {
            absolute,
            alpha: (360 - heading) % 360,
            beta: 0,
            gamma: 0,
          },
        ),
      );
    },
    { heading, absolute },
  );
}

async function startQibla(page) {
  await page.addInitScript(() => {
    // Headless Chromium can emit all-null hardware events at arbitrary times.
    // These tests supply their own sensor samples; keep native GPS/permissions
    // but prevent the test runner's hardware from racing those samples.
    for (const name of ["deviceorientationabsolute", "deviceorientation"]) {
      window.addEventListener(
        name,
        (event) => {
          if (event.isTrusted) event.stopImmediatePropagation();
        },
        true,
      );
    }
  });
  // Native geolocation timestamps use the browser's actual clock. Keep Qibla's
  // freshness validation real while the schedule/calendar tests control dates.
  await page.clock.setSystemTime(new Date());
  await boot(page);
  await view(page, "qibla");
  await page.locator("#compassBtn").click();
  await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
    "data-state",
    "waiting",
  );
  await expect(page.locator("#qiblaAngle")).toHaveText("292.5°");
}

test("absolute orientation turns the needle, confirms alignment and stops cleanly", async ({
  page,
}) => {
  await startQibla(page);
  await expect(page.locator("#qiblaDistance")).toContainText(/\d/);
  await orient(page, 0);
  await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
    "data-state",
    "live",
  );
  const north = await page
    .locator("#qiblaNeedle")
    .evaluate((element) => element.style.transform);
  await orient(page, 90);
  await expect
    .poll(() =>
      page
        .locator("#qiblaNeedle")
        .evaluate((element) => element.style.transform),
    )
    .not.toBe(north);
  await expect
    .poll(() =>
      page
        .locator("#qiblaDirections")
        .evaluate((element) => element.style.transform),
    )
    .toBe("rotate(-90deg)");
  await orient(page, 292.54);
  await expect(page.locator("#qiblaAlignment")).toHaveAttribute(
    "data-state",
    "aligned",
  );
  await expect(page.locator("#qiblaAlignment")).toBeVisible();
  await page.locator("#qiblaStopBtn").click();
  await expect(page.locator("#qiblaIndicator")).not.toHaveAttribute(
    "data-state",
    "live",
  );
  const stopped = await page
    .locator("#qiblaNeedle")
    .evaluate((element) => element.style.transform);
  await expect(page.locator("#qiblaDirections")).toHaveCSS(
    "transform",
    "matrix(1, 0, 0, 1, 0, 0)",
  );
  await orient(page, 180);
  expect(
    await page
      .locator("#qiblaNeedle")
      .evaluate((element) => element.style.transform),
  ).toBe(stopped);
  await expect(page.locator("#compassBtn")).toBeEnabled();
});

test("relative-only or absent sensor data falls back to an honest static bearing", async ({
  page,
}) => {
  await startQibla(page);
  await orient(page, 292.54, false);
  await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
    "data-state",
    "waiting",
  );
  await page.clock.fastForward(9_000);
  await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
    "data-state",
    "static",
  );
  await expect(page.locator("#qiblaStatus")).toContainText(
    /tidak mengikut putaran telefon/i,
  );
  await expect(page.locator("#qiblaStatus")).toContainText(/Tiada bacaan/i);
  await expect(page.locator("#qiblaAngle")).toHaveText("292.5°");
});
