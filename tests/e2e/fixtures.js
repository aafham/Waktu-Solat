import { test as base, expect } from '@playwright/test';

export const TODAY = new Date('2026-09-23T10:00:00+08:00');
export const KL = { latitude: 3.139, longitude: 101.6869, accuracy: 35 };
export const PENANG = { latitude: 5.4141, longitude: 100.3288, accuracy: 35 };

/** Complete deterministic JAKIM months: no test contacts a real prayer API. */
export function monthPayload(year, month, zone) {
  const length = new Date(Date.UTC(year, month, 0)).getUTCDate();
  const names = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  return {
    status: 'OK!', zone,
    prayerTime: Array.from({ length }, (_, index) => ({
      date: `${String(index + 1).padStart(2, '0')}-${names[month - 1]}-${year}`,
      hijri: `1448-04-${String(index % 29 + 1).padStart(2, '0')}`,
      fajr: month === 10 ? '06:03:00' : '06:00:00',
      syuruk: '07:10:00', dhuhr: '13:15:00', asr: '16:25:00', maghrib: '19:20:00', isha: '20:30:00',
    })),
  };
}

export const test = base.extend({
  network: async ({ context }, use) => {
    const network = { offline: false, failPrayers: false, requests: [], gpsRequests: 0, beforeGpsReply: null };
    // Mock every external URL, including reverse geocoding. Simulated GPS must
    // never be sent to BigDataCloud or any other live provider.
    await context.route('https://**/*', async (route) => {
      const url = new URL(route.request().url());
      network.requests.push(url.href);
      if (network.offline) return route.abort('internetdisconnected');
      if (url.hostname === 'www.e-solat.gov.my') {
        if (network.failPrayers) return route.fulfill({ status: 503, body: 'Test provider outage' });
        const year = Number(url.searchParams.get('year') || 2026);
        const month = Number(url.searchParams.get('month') || 9);
        return route.fulfill({ json: monthPayload(year, month, url.searchParams.get('zone') || 'WLY01') });
      }
      if (url.hostname.includes('bigdatacloud')) {
        network.gpsRequests += 1;
        if (network.beforeGpsReply) await network.beforeGpsReply();
        const latitude = Number(url.searchParams.get('latitude'));
        const longitude = Number(url.searchParams.get('longitude'));
        const penang = latitude > 4;
        return route.fulfill({ json: {
          latitude, longitude,
          locality: penang ? 'George Town' : 'Bukit Bintang',
          city: penang ? 'George Town' : 'Kuala Lumpur',
          principalSubdivision: penang ? 'Pulau Pinang' : 'Kuala Lumpur',
          principalSubdivisionCode: penang ? 'MY-07' : 'MY-14',
          countryCode: 'MY', countryName: 'Malaysia',
          localityInfo: { administrative: [
            { name: 'Malaysia', order: 2 },
            { name: penang ? 'Pulau Pinang' : 'Kuala Lumpur', order: 4 },
            { name: penang ? 'George Town' : 'Kuala Lumpur', order: 6 },
          ] },
        } });
      }
      if (url.hostname === 'api.waktusolat.app' && url.pathname.startsWith('/zones/')) {
        network.gpsRequests += 1;
        if (network.beforeGpsReply) await network.beforeGpsReply();
        return route.fulfill({ json: { zone: Number(url.pathname.split('/')[2]) > 4 ? 'PNG01' : 'WLY01' } });
      }
      // Fonts are intentionally omitted; layout must remain usable with fallback
      // fonts and tests must not depend on third-party uptime.
      return route.abort('blockedbyclient');
    });
    await use(network);
  },
  page: async ({ page, network }, use) => {
    void network;
    const errors = [];
    page.on('pageerror', (error) => errors.push(error.message));
    await page.clock.install({ time: TODAY });
    await use(page);
    expect(errors, 'Unhandled browser JavaScript errors').toEqual([]);
  },
});

export { expect };

export async function boot(page, { auto = false, path = '/', settings = {} } = {}) {
  if (!auto || Object.keys(settings).length) {
    await page.addInitScript((values) => {
      if (sessionStorage.getItem('e2ePreferencesSeeded')) return;
      for (const [key, value] of Object.entries(values)) localStorage.setItem(key, value);
      sessionStorage.setItem('e2ePreferencesSeeded', '1');
    }, { ...(auto ? {} : { ws_locationMode: 'manual', ws_lastZone: 'WLY01' }), ...settings });
  }
  await page.goto(path);
  await expect(page.locator('#prayerGrid')).toHaveAttribute('aria-busy', 'false');
  await expect(page.locator('.prayer-card')).toHaveCount(6);
}

export async function chooseZone(page, code) {
  await page.locator('#manualToggle').click();
  await expect(page.locator('#locationDialog')).toBeVisible();
  await page.locator('#locationSearch').fill(code);
  await page.locator(`#zoneList [data-zone="${code}"]`).click();
  await expect(page.locator('#zoneBadge')).toHaveText(code);
  await expect(page.locator('#locationDialog')).not.toBeVisible();
  await expect(page.locator('#prayerGrid')).toHaveAttribute('aria-busy', 'false');
}

export async function settingsDialog(page) {
  await page.locator('.topbar .settings-trigger').click();
  await expect(page.locator('#settingsDialog')).toBeVisible();
}

export async function view(page, name) {
  const nav = await page.locator('.bottom-nav').isVisible() ? '.bottom-nav' : '.main-nav';
  await page.locator(`${nav} [data-view="${name}"]`).click();
  await expect(page.locator(`#${name}View`)).toBeVisible();
}
