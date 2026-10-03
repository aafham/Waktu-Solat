import { test, expect, boot, view, settingsDialog } from "./fixtures.js";

async function jumpMonth(page, month, year) {
  await page.locator("#monthJumpMonth").selectOption(String(month));
  await page.locator("#monthJumpYear").fill(String(year));
  await page.locator("#monthJumpSubmit").click();
}

test("October opens with actual JAKIM Malay date abbreviations", async ({
  page,
  network,
}) => {
  await page.clock.setSystemTime(new Date("2026-10-03T10:00:00+08:00"));
  await boot(page);
  await expect(page.locator("#dateNumber")).toHaveText("3");
  await expect(page.locator("#dateMonth")).toContainText("Oktober");
  await expect(page.locator(".prayer-time").first()).toHaveText("6:03AM");
  await expect(page.locator("#nextPrayerName")).toHaveText("Zohor");
  await expect(page.locator("#retryBtn")).not.toBeVisible();
  await view(page, "schedule");
  await expect(page.locator("#monthTitle")).toContainText("Oktober 2026");
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
  expect(network.prayerRequests.map((request) => request.monthKey)).toContain(
    "2026-10",
  );
});

test("monthly navigation loads October, November and December without stale rows", async ({
  page,
  network,
}) => {
  await page.clock.setSystemTime(new Date("2026-10-03T10:00:00+08:00"));
  await boot(page, { path: "/#jadual" });
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
  await page.locator("#nextMonth").click();
  await expect(page.locator("#monthTitle")).toContainText("November 2026");
  await expect(page.locator("#monthBody tr")).toHaveCount(30);
  await page.locator("#nextMonth").click();
  await expect(page.locator("#monthTitle")).toContainText("Disember 2026");
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
  await page.locator("#thisMonth").click();
  await expect(page.locator("#monthTitle")).toContainText("Oktober 2026");
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
  expect(network.prayerRequests.map((request) => request.monthKey)).toEqual(
    expect.arrayContaining(["2026-10", "2026-11", "2026-12"]),
  );
});

test("month and year picker loads the requested year and leap February", async ({
  page,
  network,
}) => {
  await page.clock.setSystemTime(new Date("2026-10-03T10:00:00+08:00"));
  await boot(page, { path: "/#jadual" });
  await jumpMonth(page, 1, 2027);
  await expect(page.locator("#monthTitle")).toContainText("Januari 2027");
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
  await jumpMonth(page, 2, 2028);
  await expect(page.locator("#monthTitle")).toContainText("Februari 2028");
  await expect(page.locator("#monthBody tr")).toHaveCount(29);
  await expect(
    page.locator("#monthBody tr").last().locator("td").first(),
  ).toContainText("29");
  expect(network.prayerRequests.map((request) => request.monthKey)).toEqual(
    expect.arrayContaining(["2027-01", "2028-02"]),
  );
});

test("month picker preserves drafts and localizes visible validation when language changes", async ({
  page,
  network,
}) => {
  await page.clock.setSystemTime(new Date("2026-10-03T10:00:00+08:00"));
  await boot(page, { path: "/#jadual" });
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
  await page.locator("#monthJumpMonth").selectOption("2");
  await page.locator("#monthJumpYear").fill("2028");
  await settingsDialog(page);
  await page.locator('[data-lang="en"]').click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#monthJumpMonth")).toHaveValue("2");
  await expect(page.locator("#monthJumpMonth option:checked")).toHaveText(
    "February",
  );
  await expect(page.locator("#monthJumpYear")).toHaveValue("2028");
  await expect(page.locator("#monthTitle")).toContainText("October 2026");
  expect(
    network.prayerRequests.map((request) => request.monthKey),
  ).not.toContain("2028-02");

  await settingsDialog(page);
  await page.locator('[data-lang="ms"]').click();
  await page.keyboard.press("Escape");
  await page.locator("#monthJumpYear").fill("10000");
  await page.locator("#monthJumpSubmit").click();
  await expect(page.locator("#monthJumpError")).toContainText(
    "Pilih bulan dan masukkan tahun antara 1900 hingga 9999.",
  );
  await expect(page.locator("#monthJumpYear")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await settingsDialog(page);
  await page.locator('[data-lang="en"]').click();
  await page.keyboard.press("Escape");
  await expect(page.locator("#monthJumpMonth")).toHaveValue("2");
  await expect(page.locator("#monthJumpYear")).toHaveValue("10000");
  await expect(page.locator("#monthJumpYear")).toHaveAttribute(
    "aria-invalid",
    "true",
  );
  await expect(page.locator("#monthJumpError")).toBeVisible();
  await expect(page.locator("#monthJumpError")).toHaveText(
    "Choose a month and enter a year from 1900 to 9999.",
  );
  await expect(page.locator("#monthTitle")).toContainText("October 2026");
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
});

test("a wrong-year JAKIM response cannot appear under the requested future year", async ({
  page,
  network,
}) => {
  await page.clock.setSystemTime(new Date("2026-10-03T10:00:00+08:00"));
  network.prayerResponseYears.set("2027-01", 2026);
  await boot(page, { path: "/#jadual" });
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
  await jumpMonth(page, 1, 2027);
  await expect(page.locator("#monthTitle")).toContainText("Januari 2027");
  await expect(page.locator("#monthRetry")).toBeVisible();
  await expect(page.locator("#monthStatus")).not.toBeEmpty();
  await expect(page.locator("#monthBody tr")).toHaveCount(0);
  await expect(page.locator("#monthJumpYear")).toHaveValue("2027");
  // Removing the bad provider reply must recover the same requested month.
  network.prayerResponseYears.delete("2027-01");
  await page.locator("#monthRetry").click();
  await expect(page.locator("#monthTitle")).toContainText("Januari 2027");
  await expect(page.locator("#monthBody tr")).toHaveCount(31);
});

test("Malaysia midnight crosses December into January with fresh next-year data", async ({
  page,
  network,
}) => {
  await page.clock.setSystemTime(new Date("2026-12-31T21:00:00+08:00"));
  await boot(page);
  await expect(page.locator("#nextPrayerTime")).toHaveText("6:00 AM · Esok");
  expect(network.prayerRequests.map((request) => request.monthKey)).toContain(
    "2027-01",
  );
  await page.clock.setSystemTime(new Date("2027-01-01T00:01:00+08:00"));
  await page.clock.runFor(1_100);
  await expect(page.locator("#dateNumber")).toHaveText("1");
  await expect(page.locator("#dateMonth")).toContainText("Januari");
  await expect(page.locator(".prayer-time").first()).toHaveText("6:00AM");
  await expect(page.locator("#nextPrayerTime")).toHaveText("6:00 AM");
});

test("unpublished current-year data shows its requested month with a recoverable empty state", async ({
  page,
  network,
}) => {
  await page.clock.setSystemTime(new Date("2027-01-03T10:00:00+08:00"));
  network.unpublishedPrayerMonths.add("2027-01");
  await boot(page);
  await expect(page.locator("#prayerEmptyState")).toBeVisible();
  await expect(page.locator("#prayerEmptyContext")).toContainText(
    "Januari 2027",
  );
  await expect(page.locator("#prayerEmptyDescription")).toContainText("JAKIM");
  await expect(page.locator("#prayerEmptyRetry")).toBeVisible();
  await expect(page.locator("#prayerGrid")).not.toBeVisible();
  network.unpublishedPrayerMonths.delete("2027-01");
  await page.locator("#prayerEmptyRetry").click();
  await expect(page.locator("#prayerEmptyState")).not.toBeVisible();
  await expect(page.locator("#prayerGrid")).toBeVisible();
  await expect(page.locator(".prayer-time").first()).toHaveText("6:00AM");
});

for (const trigger of ["online", "visibilitychange"]) {
  test(`missing next-month data recovers on ${trigger} while today's times remain usable`, async ({
    page,
    network,
  }) => {
    await page.clock.setSystemTime(new Date("2026-09-30T21:00:00+08:00"));
    network.failedPrayerMonths.add("2026-10");
    await boot(page);
    await expect(page.locator(".prayer-time").first()).toHaveText("6:00AM");
    await expect
      .poll(
        () =>
          network.prayerRequests.filter(
            (request) => request.monthKey === "2026-10",
          ).length,
      )
      .toBeGreaterThanOrEqual(2);
    await expect(page.locator("#countdownValue")).toHaveText("--:--:--");
    await page.waitForLoadState("networkidle");
    await expect(page.locator("#nextPrayerRetry")).toBeVisible();
    await expect(page.locator("#nextPrayerRetry")).toBeEnabled();
    network.failedPrayerMonths.delete("2026-10");
    await page.evaluate((event) => {
      (event === "online" ? window : document).dispatchEvent(new Event(event));
    }, trigger);
    await expect(page.locator("#nextPrayerTime")).toHaveText("6:03 AM · Esok");
    await expect(page.locator("#countdownValue")).not.toHaveText("--:--:--");
    await expect(page.locator(".prayer-time").first()).toHaveText("6:00AM");
    await expect(page.locator("#nextPrayerRetry")).not.toBeVisible();
  });
}
