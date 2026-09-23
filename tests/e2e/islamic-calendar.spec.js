import { test, expect, boot, settingsDialog, view } from "./fixtures.js";

async function jumpToHijriMonth(page, month, year) {
  await page.locator("#hijriJumpMonth").selectOption(String(month));
  await page.locator("#hijriJumpYear").fill(String(year));
  await page.locator('#hijriJumpForm button[type="submit"]').click();
}

async function convertHijri(page, day, month, year) {
  await page.locator("#hijriDirectionTab").click();
  await expect(page.locator("#hijriDirectionTab")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("#gregorianConvertPanel")).toBeHidden();
  await expect(page.locator("#hijriConvertPanel")).toBeVisible();
  await page.locator("#hijriInputDay").fill(String(day));
  await page.locator("#hijriInputMonth").selectOption(String(month));
  await page.locator("#hijriInputYear").fill(String(year));
  await page.locator("#hijriConvertBtn").click();
}

async function countdownSeconds(page) {
  const values = await page
    .locator(
      "#eventCountdownDays, #eventCountdownHours, #eventCountdownMinutes, #eventCountdownSeconds",
    )
    .allTextContents();
  expect(values).toHaveLength(4);
  expect(values.every((value) => /^\d+$/.test(value))).toBe(true);
  const [days, hours, minutes, seconds] = values.map(Number);
  expect(hours).toBeLessThan(24);
  expect(minutes).toBeLessThan(60);
  expect(seconds).toBeLessThan(60);
  return days * 86400 + hours * 3600 + minutes * 60 + seconds;
}

test("Hijri calendar navigates complete Malaysia months and selects published observances", async ({
  page,
}) => {
  await boot(page, { path: "/#kalendar" });
  await expect(page.locator("#calendarView")).toBeVisible();
  await expect(page.locator("#hijriMonthTitle")).toHaveText(
    /Rabiulakhir.*1448/i,
  );
  await expect(page.locator("#hijriSelectedDate")).toContainText(
    /11.*Rabiulakhir.*1448/i,
  );
  await page.locator("#hijriPrevMonth").click();
  await expect(page.locator("#hijriMonthTitle")).toHaveText(
    /Rabiulawal.*1448/i,
  );
  await page.locator("#hijriNextMonth").click();
  await page.locator("#hijriNextMonth").click();
  await expect(page.locator("#hijriMonthTitle")).toHaveText(
    /Jamadilawal.*1448/i,
  );
  await page.locator("#hijriToday").click();
  await expect(page.locator("#hijriMonthTitle")).toHaveText(
    /Rabiulakhir.*1448/i,
  );
  await expect(
    page.locator('#hijriGrid button[data-date="2026-09-23"]'),
  ).toHaveAttribute("aria-pressed", "true");

  // The JAKIM 2026 calendar fixes Ramadan at 19 February–20 March and
  // Aidilfitri at 21 March; these assertions do not import the calendar engine.
  await jumpToHijriMonth(page, 9, 1447);
  await expect(page.locator("#hijriMonthTitle")).toHaveText(/Ramadan.*1447/i);
  await expect(
    page.locator('#hijriGrid button[data-date="2026-02-19"]'),
  ).toBeVisible();
  await expect(
    page.locator('#hijriGrid button[data-date="2026-03-20"]'),
  ).toBeVisible();
  await page.locator('#hijriGrid button[data-date="2026-02-19"]').click();
  await expect(page.locator("#hijriDayEvents")).toContainText(/Awal Ramadan/i);
  await expect(page.locator("#islamicMonthEvents")).toContainText(/Nuzul/i);
  await expect(page.locator("#islamicYearEvents")).toContainText(/Aidilfitri/i);
  await page.locator("#hijriNextMonth").click();
  await expect(page.locator("#hijriMonthTitle")).toHaveText(/Syawal.*1447/i);
  await page.locator('#hijriGrid button[data-date="2026-03-21"]').click();
  await expect(page.locator("#hijriSelectedDate")).toContainText(
    /1.*Syawal.*1447/i,
  );
  await expect(page.locator("#hijriDayEvents")).toContainText(/Aidilfitri/i);
});

test("date converter matches the official Malaysia Eid date in both directions", async ({
  page,
}) => {
  await boot(page, { path: "/#kalendar" });
  await expect(page.locator("#gregorianDirectionTab")).toHaveAttribute(
    "aria-selected",
    "true",
  );
  await expect(page.locator("#gregorianConvertPanel")).toBeVisible();
  await expect(page.locator("#hijriConvertPanel")).toBeHidden();
  await page.locator("#gregorianInput").fill("2026-03-21");
  await page.locator("#gregorianConvertBtn").click();
  await expect(page.locator("#hijriConvertResult")).toContainText(
    /1.*Syawal.*1447/i,
  );
  await expect(page.locator("#gregorianConvertError")).not.toBeVisible();
  await convertHijri(page, 1, 10, 1447);
  await expect(page.locator("#gregorianConvertResult")).toContainText(
    /21.*Mac.*2026/i,
  );
  await expect(page.locator("#hijriConvertError")).not.toBeVisible();
  await page.locator("#gregorianDirectionTab").click();
  await expect(page.locator("#hijriConvertPanel")).toBeHidden();
  await expect(page.locator("#gregorianInput")).toHaveValue("2026-03-21");
  await expect(page.locator("#hijriConvertResult")).toContainText(
    /1.*Syawal.*1447/i,
  );
});

test("leap-day birthdays round-trip and invalid Hijri dates never silently roll forward", async ({
  page,
}) => {
  await boot(page, { path: "/#kalendar" });
  await page.locator("#gregorianInput").fill("2024-02-29");
  await page.locator("#gregorianConvertBtn").click();
  const result = page.locator("#hijriConvertResult");
  await expect(result).toBeVisible();
  await expect(page.locator("#gregorianConvertError")).not.toBeVisible();
  const date = await result.evaluate((element) => ({
    day: Number(element.dataset.day),
    month: Number(element.dataset.month),
    year: Number(element.dataset.year),
  }));
  expect(date.year).toBe(1445);
  expect(date.month).toBe(8);
  expect(date.day).toBeGreaterThanOrEqual(18);
  expect(date.day).toBeLessThanOrEqual(20);
  await convertHijri(page, date.day, date.month, date.year);
  await expect(page.locator("#gregorianConvertResult")).toContainText(
    /29.*Februari.*2024/i,
  );

  // Published Syawal 1447 has 29 days (21 March–18 April), so day 30
  // must fail instead of becoming 1 Zulkaedah.
  await convertHijri(page, 30, 10, 1447);
  await expect(page.locator("#hijriConvertError")).toBeVisible();
  await expect(page.locator("#hijriConvertError")).toHaveAttribute(
    "role",
    "alert",
  );
  await expect(page.locator("#gregorianConvertResult")).not.toBeVisible();
  await convertHijri(page, 31, 9, 1447);
  await expect(page.locator("#hijriConvertError")).toBeVisible();
  await page.locator("#gregorianDirectionTab").click();
  await page.locator("#gregorianInput").fill("");
  await page.locator("#gregorianConvertBtn").click();
  await expect(page.locator("#gregorianConvertError")).toBeVisible();
  await expect(page.locator("#hijriConvertResult")).not.toBeVisible();
});

test("Ramadan countdown prioritizes Eid, updates live, and opens its calendar date", async ({
  page,
}) => {
  await page.clock.setSystemTime(new Date("2026-03-01T10:00:00+08:00"));
  await boot(page);
  await expect(page.locator("#eventCountdownName")).toContainText(
    /Aidilfitri/i,
  );
  await expect(page.locator("#eventCountdownDate")).toContainText(
    /21.*Mac.*2026/i,
  );
  const before = await countdownSeconds(page);
  expect(before).toBeGreaterThan(19 * 86400 + 13 * 3600 + 59 * 60);
  expect(before).toBeLessThanOrEqual(19 * 86400 + 14 * 3600);
  await page.clock.runFor(2100);
  const after = await countdownSeconds(page);
  expect(before - after).toBeGreaterThanOrEqual(2);
  expect(before - after).toBeLessThanOrEqual(5);
  await page.locator("#eventCountdownLink").click();
  await expect(page.locator("#calendarView")).toBeVisible();
  await expect(page.locator("#hijriSelectedDate")).toContainText(
    /1.*Syawal.*1447/i,
  );
  await expect(page.locator("#hijriDayEvents")).toContainText(/Aidilfitri/i);
});

test("the nearest Islamic New Year reaches today at Malaysia midnight and advances the following day", async ({
  page,
}) => {
  await page.clock.setSystemTime(new Date("2026-06-16T23:59:56+08:00"));
  await boot(page);
  await expect(page.locator("#eventCountdownName")).toContainText(
    /Muharam|Hijrah/i,
  );
  await expect(page.locator("#eventCountdownDate")).toContainText(
    /17.*Jun.*2026/i,
  );
  await page.clock.setSystemTime(new Date("2026-06-17T00:00:01+08:00"));
  await page.clock.runFor(1100);
  await expect(page.locator("#eventCountdownStatus")).toContainText(
    /Hari ini/i,
  );
  expect(await countdownSeconds(page)).toBe(0);
  await page.clock.setSystemTime(new Date("2026-06-18T00:00:01+08:00"));
  await page.clock.runFor(1100);
  await expect(page.locator("#eventCountdownName")).not.toContainText(
    /Muharam|Hijrah/i,
  );
  expect(await countdownSeconds(page)).toBeGreaterThan(0);
});

test("unpublished future calendar dates are explicitly estimated", async ({
  page,
}) => {
  await page.clock.setSystemTime(new Date("2026-12-31T10:00:00+08:00"));
  await boot(page);
  await expect(page.locator("#eventCountdownDate")).toContainText("2027");
  await expect(page.locator("#eventCountdownStatus")).toContainText(
    /Anggaran/i,
  );
  await expect(page.locator("#eventCountdownStatus")).toHaveAttribute(
    "data-estimated",
    "true",
  );
  await page.locator("#eventCountdownLink").click();
  await expect(page.locator("#calendarView")).toBeVisible();
  await expect(page.locator("#hijriSelectedGregorian")).toContainText("2027");
});

test("fasting reminders exclude Eid and Tashriq even when weekly or white-day fasts coincide", async ({
  page,
}) => {
  await boot(page, { path: "/#kalendar" });
  await jumpToHijriMonth(page, 9, 1447);
  await page.locator('#hijriGrid button[data-date="2026-02-23"]').click();
  await expect(page.locator("#hijriFastingInfo")).toHaveAttribute(
    "data-status",
    "obligatory",
  );
  await expect(page.locator("#hijriFastingTitle")).toContainText("Ramadan");

  await jumpToHijriMonth(page, 10, 1447);
  await page.locator('#hijriGrid button[data-date="2026-03-21"]').click();
  await expect(page.locator("#hijriFastingInfo")).toHaveAttribute(
    "data-status",
    "prohibited",
  );
  await jumpToHijriMonth(page, 12, 1447);
  // 28 May is Thursday and 11 Zulhijah; 30 May is the 13th. Neither
  // may inherit its otherwise recommended weekly/white-day marker.
  for (const date of ["2026-05-27", "2026-05-28", "2026-05-30"]) {
    const button = page.locator(`#hijriGrid button[data-date="${date}"]`);
    await expect(button).toHaveAttribute("data-fasting", "prohibited");
    await button.click();
    await expect(page.locator("#hijriFastingInfo")).toHaveAttribute(
      "data-status",
      "prohibited",
    );
    await expect(page.locator("#hijriFastingInfo")).not.toContainText(
      /Puasa sunat Isnin|Puasa sunat Khamis|Ayyam al-Bid/,
    );
    await expect(
      page.locator('#hijriFastingInfo a[href^="https://"]'),
    ).not.toHaveCount(0);
  }
  await page.locator('#hijriGrid button[data-date="2026-05-31"]').click();
  await expect(page.locator("#hijriFastingInfo")).toHaveAttribute(
    "data-status",
    "recommended",
  );

  await page.locator('[data-calendar-section="islamicFastingSection"]').click();
  await expect(page.locator("#islamicFastingSection")).toBeFocused();
  const hajjDates = page.locator('[data-reference-id="hajj-localDates"]');
  await hajjDates.locator("summary").click();
  await expect(hajjDates.locator(".ic-reference-body")).toBeVisible();
  await expect(hajjDates).toContainText(/Arab Saudi/);
  await expect(hajjDates).toContainText(/boleh berbeza/);
  const sixDays = page.locator('[data-reference-id="fasting-sixShawwal"]');
  await sixDays.locator("summary").click();
  await expect(sixDays.locator(".ic-reference-body")).toBeVisible();
  await expect(sixDays).toContainText(/Boleh dilakukan berasingan/);
});

test("Muhammad reference distinguishes sourced birth information from the Malaysian observance date", async ({
  page,
}) => {
  await boot(page, { path: "/#kalendar" });
  await page
    .locator('[data-calendar-section="islamicMuhammadSection"]')
    .click();
  await expect(page.locator("#islamicMuhammadSection")).toBeFocused();
  await expect(page.locator("#islamicMuhammadTitle")).toContainText(/Muhammad/);
  await expect(page.locator("#islamicProphetSearch")).toHaveCount(0);
  await expect(page.locator("#islamicProphetList")).toHaveCount(0);
  await expect(page).toHaveURL(/#kalendar$/);
  const muhammad = page.locator("#islamicMuhammadSection");
  await muhammad.locator("summary").click();
  await expect(muhammad.locator(".ic-birth-note")).toBeVisible();
  await expect(muhammad.locator(".ic-birth-note")).toContainText(/Isnin/);
  await expect(muhammad.locator(".ic-birth-note")).toContainText(
    /diperselisihkan/,
  );
  await expect(muhammad).toContainText(/12 Rabiulawal/);
  await expect(
    muhammad.locator('a[href="https://sunnah.com/muslim:1162e"]'),
  ).toBeVisible();
  await settingsDialog(page);
  await page.locator('[data-lang="en"]').click();
  await page.keyboard.press("Escape");
  await expect(muhammad.locator(".ic-birth-note")).toBeVisible();
  await expect(muhammad.locator(".ic-birth-note")).toContainText(/Monday/);
  await expect(muhammad.locator(".ic-birth-note")).toContainText(/disputed/);
  await expect(
    muhammad.locator('a[href^="https://quran.com/"]').first(),
  ).toBeVisible();
});

for (const width of [320, 390]) {
  test(`calendar, converters and all five mobile navigation items fit at ${width}px in both languages`, async ({
    page,
  }) => {
    await page.setViewportSize({ width, height: 844 });
    await boot(page);
    await expect(page.locator(".bottom-nav button")).toHaveCount(5);
    await view(page, "calendar");
    await expect(page.locator("#calendarHeading")).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    for (const button of await page.locator(".bottom-nav button").all())
      await expect(button).toBeInViewport();
    await settingsDialog(page);
    await page.locator('[data-lang="en"]').click();
    await page.keyboard.press("Escape");
    await expect(page.locator("html")).toHaveAttribute("lang", "en");
    await expect(page.locator('.bottom-nav [data-view="calendar"]')).toHaveText(
      "Calendar",
    );
    await expect(page.locator("#hijriToday")).toContainText(/Today/i);
    await convertHijri(page, 1, 10, 1447);
    await expect(page.locator("#gregorianConvertResult")).toContainText(
      /21.*March.*2026/i,
    );
    await page
      .locator('[data-calendar-section="islamicMuhammadSection"]')
      .click();
    await expect(page.locator("#islamicMuhammadSection")).toBeFocused();
    await page
      .locator('[data-reference-id="prophet-muhammad"] summary')
      .click();
    await expect(
      page.locator("#islamicMuhammadSection .ic-birth-note"),
    ).toBeVisible();
    await expect
      .poll(() =>
        page.evaluate(
          () => document.documentElement.scrollWidth <= window.innerWidth,
        ),
      )
      .toBe(true);
    await view(page, "home");
    await expect(page.locator("#eventCountdownStatus")).not.toContainText(
      /Anggaran|Takwim|Hari ini/,
    );
    await view(page, "calendar");
    await expect(page.locator("#gregorianConvertResult")).toContainText(
      /21.*March.*2026/i,
    );
  });
}

test.describe("offline Islamic calendar", () => {
  test.use({ serviceWorkers: "allow" });

  test("saved app reopens offline with calendar navigation, converters and event countdown", async ({
    page,
    context,
    network,
  }) => {
    await boot(page, { path: "/#kalendar" });
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect
      .poll(() =>
        page.evaluate(() => Boolean(navigator.serviceWorker.controller)),
      )
      .toBe(true);
    network.offline = true;
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator("#calendarView")).toBeVisible();
    await expect(page.locator("#hijriMonthTitle")).toHaveText(
      /Rabiulakhir.*1448/i,
    );
    await expect(page.locator("#islamicMuhammadSection")).toBeVisible();
    await page
      .locator('[data-reference-id="prophet-muhammad"] summary')
      .click();
    await expect(
      page.locator("#islamicMuhammadSection .ic-birth-note"),
    ).toBeVisible();
    await expect(
      page.locator("#islamicMuhammadSection .ic-birth-note"),
    ).toContainText(/Isnin/);
    await jumpToHijriMonth(page, 9, 1447);
    await expect(page.locator("#islamicMonthEvents")).toContainText(/Nuzul/i);
    await convertHijri(page, 1, 10, 1447);
    await expect(page.locator("#gregorianConvertResult")).toContainText(
      /21.*Mac.*2026/i,
    );
    await view(page, "home");
    await expect(page.locator("#eventCountdownName")).not.toHaveText("—");
    expect(await countdownSeconds(page)).toBeGreaterThan(0);
    await page.locator("#eventCountdownLink").click();
    await expect(page.locator("#calendarView")).toBeVisible();
    await expect(page.locator("#hijriSelectedDate")).not.toHaveText("");
  });
});
