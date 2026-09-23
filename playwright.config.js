import { defineConfig } from "@playwright/test";

export default defineConfig({
  testDir: "./tests/e2e",
  fullyParallel: true,
  forbidOnly: Boolean(process.env.CI),
  retries: process.env.CI ? 1 : 0,
  workers: process.env.CI ? 2 : 3,
  timeout: 30_000,
  expect: { timeout: 8_000 },
  reporter: process.env.CI ? [["github"], ["html", { open: "never" }]] : "list",
  use: {
    baseURL: "http://127.0.0.1:4173",
    browserName: "chromium",
    viewport: { width: 1440, height: 1000 },
    locale: "en-GB",
    timezoneId: "America/New_York",
    geolocation: { latitude: 3.139, longitude: 101.6869, accuracy: 35 },
    permissions: ["geolocation"],
    serviceWorkers: "block",
    colorScheme: "light",
    trace: "retain-on-failure",
    screenshot: "only-on-failure",
  },
  webServer: {
    command: "node tests/static-server.js",
    url: "http://127.0.0.1:4173",
    reuseExistingServer: !process.env.CI,
    timeout: 10_000,
  },
});
