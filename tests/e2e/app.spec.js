import { test, expect, boot, chooseZone, settingsDialog, view, PENANG } from './fixtures.js';

test('automatic GPS uses the actual locality, prayer zone and reported accuracy', async ({ page, context, network }) => {
  await context.setGeolocation(PENANG);
  await boot(page, { auto: true });
  await expect(page.locator('#zoneBadge')).toHaveText('PNG01');
  await expect(page.locator('#locationName')).toHaveText('George Town');
  await expect(page.locator('#locationMeta')).toContainText('Pulau Pinang');
  await expect(page.locator('#locationCoordinates')).toContainText('35');
  await expect(page.locator('#locationCoordinates')).toContainText('5.414');
  await expect(page.locator('#locationModeBadge')).toContainText('Auto');
  await expect(page.locator('#currentLocationMap')).toHaveAttribute('href', /5\.4141.*100\.3288/);
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ws_locationMode'))).toBe('auto');
  expect(network.requests.some((url) => url.includes('bigdatacloud'))).toBe(true);
});

test('a manual selection wins over a pending GPS reply and persists on reload', async ({ page, context, network }) => {
  await context.setGeolocation(PENANG);
  let finishGps;
  const pendingGps = new Promise((resolve) => { finishGps = resolve; });
  network.beforeGpsReply = () => pendingGps;
  await boot(page, { auto: true });
  await expect.poll(() => network.gpsRequests).toBeGreaterThan(0);
  await chooseZone(page, 'SGR01');
  finishGps();
  network.beforeGpsReply = null;
  // Drain the delayed network work before asserting the final user choice.
  await page.waitForLoadState('networkidle');
  await expect(page.locator('#zoneBadge')).toHaveText('SGR01');
  await expect.poll(() => page.evaluate(() => localStorage.getItem('ws_locationMode'))).toBe('manual');
  const requestsBeforeReload = network.gpsRequests;
  await page.reload();
  await expect(page.locator('#zoneBadge')).toHaveText('SGR01');
  await expect(page.locator('#prayerGrid')).toHaveAttribute('aria-busy', 'false');
  expect(network.gpsRequests).toBe(requestsBeforeReload);
});

test('favorites can be saved, reopened and removed', async ({ page }) => {
  await boot(page);
  await chooseZone(page, 'SGR01');
  await page.locator('#favoriteBtn').click();
  await expect(page.locator('#favoriteBtn')).toHaveAttribute('aria-pressed', 'true');
  await page.reload();
  await expect(page.locator('#favoriteBtn')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('#manualToggle').click();
  await expect(page.locator('#favoriteZones [data-zone="SGR01"]')).toBeVisible();
  await page.keyboard.press('Escape');
  await page.locator('#favoriteBtn').click();
  await expect(page.locator('#favoriteBtn')).toHaveAttribute('aria-pressed', 'false');
  await page.locator('#manualToggle').click();
  await expect(page.locator('#favoritesSection')).not.toBeVisible();
  await expect.poll(() => page.evaluate(() => JSON.parse(localStorage.getItem('ws_favorites')))).toEqual([]);
});

test('monthly controls load complete preceding, following and current months', async ({ page, network }) => {
  await boot(page, { path: '/#jadual' });
  await expect(page.locator('#monthBody tr')).toHaveCount(30);
  await page.locator('#prevMonth').click();
  await expect(page.locator('#monthBody tr')).toHaveCount(31);
  await expect(page.locator('#monthTitle')).toContainText('Ogos');
  await page.locator('#nextMonth').click();
  await expect(page.locator('#monthTitle')).toContainText('September');
  await page.locator('#nextMonth').click();
  await expect(page.locator('#monthTitle')).toContainText('Oktober');
  await expect(page.locator('#monthBody tr')).toHaveCount(31);
  await page.locator('#thisMonth').click();
  await expect(page.locator('#monthTitle')).toContainText('September');
  await expect(page.locator('#monthBody tr')).toHaveCount(30);
  const months = network.requests.filter((url) => url.includes('e-solat.gov.my')).map((url) => Number(new URL(url).searchParams.get('month')));
  expect(months).toEqual(expect.arrayContaining([8, 9, 10]));
});

test('English, 12/24-hour time and theme settings persist across reload', async ({ page }) => {
  await boot(page);
  await expect(page.locator('.prayer-time').first()).toHaveText('6:00AM');
  await settingsDialog(page);
  await page.locator('[data-lang="en"]').click();
  await page.locator('[data-format="24"]').click();
  await page.locator('#themeToggle').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.prayer-name').first()).toHaveText('Fajr');
  await expect(page.locator('.prayer-time').first()).toHaveText('06:00');
  await expect(page.locator('body')).toHaveClass(/dark/);
  await page.reload();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');
  await expect(page.locator('.prayer-time').first()).toHaveText('06:00');
  await expect(page.locator('body')).toHaveClass(/dark/);
  await settingsDialog(page);
  await expect(page.locator('[data-lang="en"]')).toHaveAttribute('aria-pressed', 'true');
  await expect(page.locator('[data-format="24"]')).toHaveAttribute('aria-pressed', 'true');
  await page.locator('[data-format="12"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('.prayer-time').first()).toHaveText('6:00AM');
});

test('dialogs restore focus, Escape cancels them, and skip preserves the selected route', async ({ page }) => {
  await boot(page, { path: '/#jadual' });
  await page.locator('#manualToggle').click();
  await expect(page.locator('#locationSearch')).toBeFocused();
  await page.keyboard.press('Escape');
  await expect(page.locator('#locationDialog')).not.toBeVisible();
  await expect(page.locator('#manualToggle')).toBeFocused();
  await settingsDialog(page);
  await page.keyboard.press('Escape');
  await expect(page.locator('.topbar .settings-trigger')).toBeFocused();
  await page.locator('.skip-link').focus();
  await page.keyboard.press('Enter');
  await expect(page).toHaveURL(/#jadual$/);
  await expect(page.locator('#main')).toBeFocused();
  await expect(page.locator('#scheduleView')).toBeVisible();
});

for (const width of [320, 390, 1440]) {
  test(`navigation and content stay usable without page overflow at ${width}px`, async ({ page }) => {
    await page.setViewportSize({ width, height: width < 600 ? 844 : 1000 });
    await boot(page);
    const mobile = width < 600;
    if (mobile) await expect(page.locator('.bottom-nav')).toBeVisible();
    else await expect(page.locator('.bottom-nav')).not.toBeVisible();
    for (const name of ['home', 'schedule', 'qibla']) {
      await view(page, name);
      await expect.poll(() => page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
      if (mobile) {
        for (const button of await page.locator('.bottom-nav button').all()) await expect(button).toBeInViewport();
        const bottom = await page.locator('.bottom-nav').evaluate((element) => element.getBoundingClientRect().bottom);
        expect(bottom).toBeLessThanOrEqual(845);
      }
    }
    if (mobile) {
      await page.locator('.bottom-nav .settings-trigger').click();
      await expect(page.locator('#settingsDialog')).toBeVisible();
      await page.keyboard.press('Escape');
      await expect(page.locator('.bottom-nav .settings-trigger')).toBeFocused();
    }
  });
}

test('Malaysia month boundary uses real next-month data in a different device timezone', async ({ page }) => {
  await page.clock.setSystemTime(new Date('2026-09-30T21:00:00+08:00'));
  await boot(page, { path: '/#jadual' });
  await expect(page.locator('#monthBody tr')).toHaveCount(30);
  await expect(page.locator('#nextPrayerTime')).toContainText('6:03 AM');
  await settingsDialog(page);
  await page.locator('[data-lang="en"]').click();
  await page.locator('[data-format="24"]').click();
  await page.keyboard.press('Escape');
  await expect(page.locator('#monthBody tr')).toHaveCount(30);
  expect(await page.locator('#monthBody tr td:first-child').allTextContents()).toHaveLength(30);
  await view(page, 'home');
  await expect(page.locator('#nextPrayerName')).toHaveText('Fajr');
  await expect(page.locator('#nextPrayerTime')).toHaveText('06:03 · Tomorrow');
  await expect(page.locator('#countdownValue')).toHaveText(/09:0[23]:\d\d/);
  await page.clock.setSystemTime(new Date('2026-10-01T00:01:00+08:00'));
  await page.clock.runFor(1_100);
  await expect(page.locator('#dateNumber')).toHaveText('1');
  await expect(page.locator('#dateMonth')).toContainText('October');
  await expect(page.locator('#nextPrayerTime')).toHaveText('06:03');
});

test('denied GPS gives an actionable message and manual zone selection still works', async ({ page, context, baseURL }) => {
  const cdp = await context.newCDPSession(page);
  const { targetInfo } = await cdp.send('Target.getTargetInfo');
  await cdp.send('Browser.setPermission', {
    permission: { name: 'geolocation' }, setting: 'denied', origin: baseURL,
    browserContextId: targetInfo.browserContextId,
  });
  await boot(page, { auto: true });
  await expect(page.locator('#locationFeedbackText')).toContainText(/tetapan pelayar/i);
  await expect(page.locator('#locateBtn')).toBeEnabled();
  await chooseZone(page, 'SGR01');
  await expect(page.locator('#zoneBadge')).toHaveText('SGR01');
  await view(page, 'qibla');
  await page.locator('#compassBtn').click();
  await expect(page.locator('#qiblaIndicator')).toHaveAttribute('data-state', 'error');
  await expect(page.locator('#qiblaStatus')).toContainText(/tetapan pelayar/i);
  await expect(page.locator('#compassBtn')).toBeEnabled();
});

test.describe('offline app and data cache', () => {
  test.use({ serviceWorkers: 'allow' });

  test('cached schedules reopen offline, unsaved months fail clearly, and reconnect recovers', async ({ page, context, network }) => {
    await boot(page);
    await page.evaluate(() => navigator.serviceWorker.ready);
    await expect.poll(() => page.evaluate(() => Boolean(navigator.serviceWorker.controller))).toBe(true);
    network.offline = true;
    await context.setOffline(true);
    await page.reload();
    await expect(page.locator('.prayer-time').first()).toHaveText('6:00AM');
    await expect(page.locator('#statusText')).toContainText('offline');
    await view(page, 'schedule');
    await expect(page.locator('#monthBody tr')).toHaveCount(30);
    await page.locator('#nextMonth').click();
    await expect(page.locator('#monthStatus')).toContainText('tidak dapat dimuatkan');
    await expect(page.locator('#monthRetry')).toBeVisible();
    await expect(page.locator('#monthBody tr')).toHaveCount(0);
    network.offline = false;
    await context.setOffline(false);
    await expect(page.locator('#monthBody tr')).toHaveCount(31);
    await expect(page.locator('#monthRetry')).not.toBeVisible();
  });
});

test('initial provider failure is recoverable through the retry control', async ({ page, network }) => {
  network.failPrayers = true;
  await boot(page);
  await expect(page.locator('#retryBtn')).toBeVisible();
  await expect(page.locator('#statusText')).toContainText('tidak dapat dimuatkan');
  await expect(page.locator('#nextPrayerName')).toHaveText('—');
  network.failPrayers = false;
  await page.locator('#retryBtn').click();
  await expect(page.locator('#retryBtn')).not.toBeVisible();
  await expect(page.locator('.prayer-time').first()).toHaveText('6:00AM');
});
