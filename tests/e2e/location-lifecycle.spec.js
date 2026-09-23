import { test, expect, boot, chooseZone, KL, PENANG } from "./fixtures.js";

function pauseGps(network) {
  let release;
  const pending = new Promise((resolve) => {
    release = resolve;
  });
  network.beforeGpsReply = () => pending;
  return () => {
    network.beforeGpsReply = null;
    release();
  };
}

test("closing a pending GPS dialog restores the previous manual zone and clears partial coordinates", async ({
  page,
  context,
  network,
}) => {
  await boot(page);
  await chooseZone(page, "SGR01");
  await context.setGeolocation(PENANG);
  const release = pauseGps(network);
  await page.locator("#manualToggle").click();
  await page.locator("#detectBtn").click();
  await expect(page.locator("#locationCoordinates")).toContainText("5.41410");
  await expect(page.locator("#prayerZoneName")).toContainText(
    "lokasi belum disahkan",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#locationDialog")).not.toBeVisible();
  await expect(page.locator("#locationCoordinates")).toBeHidden();
  await expect(page.locator("#currentLocationMap")).toBeHidden();
  await expect(page.locator("#locationModeBadge")).toHaveText("Zon manual");
  await expect(page.locator("#locationMeta")).toContainText("Pilihan anda");
  release();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#zoneBadge")).toHaveText("SGR01");
  await expect(page.locator("#prayerZoneName")).not.toContainText(
    "belum disahkan",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("ws_locationMode")),
  ).toBe("manual");
  await expect(page.locator("#locateBtn")).toBeEnabled();
});

test("cancelling a GPS retry restores the previously confirmed automatic location", async ({
  page,
  context,
  network,
}) => {
  await context.setGeolocation(PENANG);
  await boot(page, { auto: true });
  await expect(page.locator("#locationName")).toHaveText("George Town");
  await expect(page.locator("#locationFeedback")).toHaveAttribute(
    "data-state",
    "success",
  );
  await context.setGeolocation(KL);
  const release = pauseGps(network);
  await page.locator("#manualToggle").click();
  await page.locator("#detectBtn").click();
  await expect(page.locator("#locationCoordinates")).toContainText("3.13900");
  await page.keyboard.press("Escape");
  release();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#zoneBadge")).toHaveText("PNG01");
  await expect(page.locator("#locationName")).toHaveText("George Town");
  await expect(page.locator("#locationCoordinates")).toContainText("5.41410");
  await expect(page.locator("#prayerZoneName")).not.toContainText(
    "belum disahkan",
  );
  await expect(page.locator("#locationFeedback")).toHaveAttribute(
    "data-state",
    "success",
  );
  expect(
    await page.evaluate(() => localStorage.getItem("ws_locationMode")),
  ).toBe("auto");
});

test("an outside-Malaysia reading stays visible while the previous JAKIM schedule is explicitly unconfirmed", async ({
  page,
  context,
}) => {
  await boot(page);
  await chooseZone(page, "SGR01");
  await context.setGeolocation({
    latitude: 1.3521,
    longitude: 103.8198,
    accuracy: 40,
  });
  await context.route("https://api.bigdatacloud.net/**", (route) =>
    route.fulfill({
      json: {
        latitude: 1.3521,
        longitude: 103.8198,
        countryCode: "SG",
        countryName: "Singapore",
        principalSubdivision: "Singapore",
        principalSubdivisionCode: "SG-01",
        city: "Singapore",
        locality: "Singapore",
        localityInfo: { administrative: [] },
      },
    }),
  );
  await page.locator("#manualToggle").click();
  await page.locator("#detectBtn").click();
  await expect(page.locator("#locationFeedback")).toHaveAttribute(
    "data-state",
    "error",
  );
  await page.keyboard.press("Escape");
  await expect(page.locator("#locationName")).toHaveText("Singapore");
  await expect(page.locator("#locationCoordinates")).toContainText(
    "1.35210, 103.81980",
  );
  await expect(page.locator("#currentLocationMap")).toHaveAttribute(
    "href",
    /1\.3521.*103\.8198/,
  );
  await expect(page.locator("#zoneBadge")).toHaveText("SGR01");
  await expect(page.locator("#prayerZoneName")).toContainText(
    "lokasi belum disahkan",
  );
  await expect(page.locator("#locationFeedbackText")).toContainText(
    "Tiada zon Malaysia",
  );
  await expect(page.locator("#locationFeedbackText")).toContainText(
    "masih untuk zon SGR01",
  );
  await expect(page.locator("#locationModeBadge")).toHaveText("Auto dijeda");
  await expect(page.locator("#locateBtn")).toBeEnabled();
});

test("page lifecycle interruption clears busy and retries immediately on persisted foreground", async ({
  page,
  context,
  network,
}) => {
  const release = pauseGps(network);
  await boot(page, { auto: true });
  await expect.poll(() => network.gpsRequests).toBeGreaterThan(0);
  await expect(page.locator("#locateBtn")).toBeDisabled();
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    ),
  );
  await expect(page.locator("#locateBtn")).toBeEnabled();
  await expect(page.locator("#prayerZoneName")).toContainText(
    "lokasi belum disahkan",
  );
  await context.setGeolocation(PENANG);
  network.beforeGpsReply = null;
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  await expect(page.locator("#zoneBadge")).toHaveText("PNG01");
  await expect(page.locator("#locationName")).toHaveText("George Town");
  await expect(page.locator("#locationFeedback")).toHaveAttribute(
    "data-state",
    "success",
  );
  release();
  await page.waitForLoadState("networkidle");
  await expect(page.locator("#zoneBadge")).toHaveText("PNG01");
  await expect(page.locator("#locateBtn")).toBeEnabled();
  expect(network.gpsRequests).toBeGreaterThanOrEqual(3);
});

test("manual selection after page suspension is preserved on foreground", async ({
  page,
  network,
}) => {
  const release = pauseGps(network);
  await boot(page, { auto: true });
  await expect.poll(() => network.gpsRequests).toBeGreaterThan(0);
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pagehide", { persisted: true }),
    ),
  );
  await chooseZone(page, "SGR01");
  const requests = network.gpsRequests;
  await page.evaluate(() =>
    window.dispatchEvent(
      new PageTransitionEvent("pageshow", { persisted: true }),
    ),
  );
  release();
  await page.waitForLoadState("networkidle");
  expect(network.gpsRequests).toBe(requests);
  await expect(page.locator("#zoneBadge")).toHaveText("SGR01");
  await expect(page.locator("#locationCoordinates")).toBeHidden();
  await expect(page.locator("#locationModeBadge")).toHaveText("Zon manual");
  expect(
    await page.evaluate(() => localStorage.getItem("ws_locationMode")),
  ).toBe("manual");
});
