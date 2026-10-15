import { test, expect, boot, view, KL } from "./fixtures.js";

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

async function startQibla(page, expectedState = "waiting") {
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
    expectedState,
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

test("relative-only or absent sensor data keeps waiting without pretending to be live", async ({
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
    "waiting",
  );
  await expect(page.locator("#qiblaStatus")).toContainText(/bacaan/i);
  await expect(page.locator("#qiblaAngle")).toHaveText("292.5°");
  await expect(page.locator("#qiblaAlignment")).toBeHidden();
  await expect(page.locator("#qiblaStopBtn")).toBeVisible();
});

async function webkitPermission(page, permission = "granted") {
  await page.addInitScript(
    ({ result, coords }) => {
      window.__compassPermissions = [];
      // Simulate a standard GPS position along with the Safari sensor samples.
      // Windows Playwright WebKit's native geolocation override currently emits
      // microseconds, while the Geolocation API's timestamp contract is milliseconds.
      // Production timestamp validation must remain strict instead of accommodating
      // that runner artifact. No synthetic coordinates leave the mocked network.
      window.__compassWatches = new Set();
      let watchId = 0;
      const position = () => ({ coords, timestamp: Date.now() });
      Object.defineProperties(navigator.geolocation, {
        getCurrentPosition: {
          configurable: true,
          value: (success) => queueMicrotask(() => success(position())),
        },
        watchPosition: {
          configurable: true,
          value: (success) => {
            const id = ++watchId;
            window.__compassWatches.add(id);
            queueMicrotask(() => {
              if (window.__compassWatches.has(id)) success(position());
            });
            return id;
          },
        },
        clearWatch: {
          configurable: true,
          value: (id) => window.__compassWatches.delete(id),
        },
      });
      const Orientation =
        window.DeviceOrientationEvent || class extends Event {};
      Object.defineProperty(Orientation, "requestPermission", {
        configurable: true,
        value: async (absolute) => {
          window.__compassPermissions.push({
            absolute,
            active: navigator.userActivation?.isActive,
          });
          return result;
        },
      });
      if (!window.DeviceOrientationEvent)
        window.DeviceOrientationEvent = Orientation;
    },
    { result: permission, coords: KL },
  );
}

async function webkitSample(
  page,
  heading,
  { accuracy = 5, beta = 0, gamma = 0 } = {},
) {
  await page.evaluate(
    (sample) => {
      // Synthetic Safari property contract, deliberately independent of a
      // DeviceOrientationEvent constructor or the runner's physical sensors.
      const event = new Event("deviceorientation");
      Object.defineProperties(
        event,
        Object.fromEntries(
          Object.entries({
            webkitCompassHeading: sample.heading,
            webkitCompassAccuracy: sample.accuracy,
            absolute: false,
            alpha: null,
            beta: sample.beta,
            gamma: sample.gamma,
          }).map(([key, value]) => [key, { value }]),
        ),
      );
      window.dispatchEvent(event);
    },
    { heading, accuracy, beta, gamma },
  );
}

async function screenRotation(page, angle) {
  await page.evaluate((value) => {
    Object.defineProperty(screen.orientation, "angle", {
      configurable: true,
      value,
    });
    screen.orientation.dispatchEvent(new Event("change"));
  }, angle);
}

async function needleAngle(page, id = "qiblaNeedle") {
  return page
    .locator(`#${id}`)
    .evaluate((element) =>
      Number(element.style.transform.match(/[-\d.]+/)?.[0]),
    );
}

test.describe("WebKit compass contract with simulated iPhone sensors", () => {
  // WebKit supports geolocation but rejects Chromium's magnetometer permission
  // descriptor. The sensor permission prompt is simulated separately above.
  test.use({
    permissions: ["geolocation"],
    viewport: { width: 390, height: 844 },
  });

  test("late permission-granted readings stay live through handheld tilt, rotation and north wrap", async ({
    page,
  }) => {
    await webkitPermission(page);
    await startQibla(page);
    await page.clock.fastForward(9000);
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "waiting",
    );
    await webkitSample(page, 0, { beta: 55, gamma: 15 });
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "live",
    );
    await expect(page.locator("#qiblaStatus")).toContainText(/magnet/i);
    await expect(page.locator("#qiblaNeedle")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await expect(page.locator("#qiblaDirections")).toHaveCSS(
      "transition-duration",
      "0s",
    );
    await expect(page.locator(".compass-phone-top")).toBeVisible();
    await expect(page.locator(".compass-rotate-hint")).toBeVisible();
    const north = await needleAngle(page);
    await webkitSample(page, 90);
    expect((await needleAngle(page)) - north).toBeCloseTo(-90, 5);
    await webkitSample(page, 359);
    const beforeWrap = await needleAngle(page);
    await webkitSample(page, 1);
    expect((await needleAngle(page)) - beforeWrap).toBeCloseTo(-2, 5);
    const portrait = await needleAngle(page);
    await screenRotation(page, 90);
    expect((await needleAngle(page)) - portrait).toBeCloseTo(-90, 5);
    await screenRotation(page, 270);
    const cardinal = await needleAngle(page, "qiblaDirections");
    expect(((cardinal % 360) + 360) % 360).toBeCloseTo(89, 5);
    const calls = await page.evaluate(() => window.__compassPermissions);
    expect(calls).toHaveLength(1);
    expect(calls[0].absolute).toBe(true);
    if (calls[0].active !== undefined) expect(calls[0].active).toBe(true);
  });

  test("poor accuracy pauses guidance and a later good reading resumes without another click", async ({
    page,
  }) => {
    await webkitPermission(page);
    await startQibla(page);
    await webkitSample(page, 292.54);
    await expect(page.locator("#qiblaAlignment")).toHaveAttribute(
      "data-state",
      "aligned",
    );
    await webkitSample(page, 292.54, { accuracy: -1 });
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "paused",
    );
    await expect(page.locator("#qiblaNeedle")).toBeHidden();
    await expect(page.locator("#qiblaDirections")).toBeHidden();
    await expect(page.locator("#qiblaAlignment")).toBeHidden();
    await screenRotation(page, 90);
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "paused",
    );
    await screenRotation(page, 0);
    await page.clock.fastForward(9000);
    await webkitSample(page, 292.54, { accuracy: 30 });
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "paused",
    );
    await page.clock.fastForward(9000);
    await webkitSample(page, 292.54, { beta: 55, gamma: 15 });
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "live",
    );
    await expect(page.locator("#qiblaNeedle")).toBeVisible();
    await expect(page.locator("#qiblaAlignment")).toHaveAttribute(
      "data-state",
      "aligned",
    );
    await webkitSample(page, 292.54, { accuracy: 20 });
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "live",
    );
    await expect(page.locator("#qiblaAlignment")).toHaveAttribute(
      "data-state",
      "near",
    );
    await expect(page.locator("#qiblaAccuracy")).toContainText("20");
    expect(await page.evaluate(() => window.__compassPermissions.length)).toBe(
      1,
    );
  });

  test("denied sensor permission retains an honest bearing and ignores unrequested samples", async ({
    page,
  }) => {
    await webkitPermission(page, "denied");
    await startQibla(page, "static");
    await expect(page.locator("#qiblaStatus")).toContainText(
      /Kebenaran sensor tidak diberikan/i,
    );
    await expect(page.locator(".compass-phone-top")).toBeHidden();
    await expect(page.locator(".compass-top-marker")).toBeHidden();
    await expect(page.locator(".compass-rotate-hint")).toBeHidden();
    const bearing = await needleAngle(page);
    await webkitSample(page, 292.54);
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "static",
    );
    await expect(page.locator("#qiblaAlignment")).toBeHidden();
    expect(await needleAngle(page)).toBe(bearing);
    await expect(page.locator("#compassBtn")).toBeEnabled();
  });

  test("leaving the compass or hiding the page prevents late readings from restarting guidance", async ({
    page,
  }) => {
    await webkitPermission(page);
    await startQibla(page);
    await webkitSample(page, 292.54);
    await view(page, "home");
    await webkitSample(page, 90);
    await view(page, "qibla");
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "static",
    );
    await expect(page.locator("#qiblaAlignment")).toBeHidden();
    await page.locator("#compassBtn").click();
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "waiting",
    );
    await webkitSample(page, 292.54);
    await page.evaluate(() => window.dispatchEvent(new Event("pagehide")));
    await webkitSample(page, 180);
    await expect(page.locator("#qiblaIndicator")).toHaveAttribute(
      "data-state",
      "static",
    );
    await expect(page.locator("#qiblaStopBtn")).toBeHidden();
    await expect(page.locator("#qiblaAlignment")).toBeHidden();
    expect(await page.evaluate(() => window.__compassWatches.size)).toBe(0);
  });
});
