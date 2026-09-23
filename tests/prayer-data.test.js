import test from "node:test";
import assert from "node:assert/strict";
import {
  addDays,
  dateKey,
  formatTime,
  getPrayerState,
  loadMonth,
  normalizeMonth,
  normalizeTime,
  resolveGpsZone,
  validateMonthDays,
} from "../prayer-data.js";

const times = {
  subuh: "06:00",
  syuruk: "07:10",
  zohor: "13:10",
  asar: "16:20",
  maghrib: "19:15",
  isyak: "20:25",
};
const apiKeys = {
  subuh: "fajr",
  syuruk: "syuruk",
  zohor: "dhuhr",
  asar: "asr",
  maghrib: "maghrib",
  isyak: "isha",
};

function schedule(month = "2026-09") {
  const [year, monthNumber] = month.split("-").map(Number);
  return Array.from(
    { length: new Date(Date.UTC(year, monthNumber, 0)).getUTCDate() },
    (_, index) => ({
      date: `${month}-${String(index + 1).padStart(2, "0")}`,
      hijri: "1448-03-19",
      times: { ...times },
    }),
  );
}

function jakim(zone = "WLY01", month = "2026-09") {
  const monthName = new Date(`${month}-01T00:00:00Z`).toLocaleString("en-US", {
    timeZone: "UTC",
    month: "short",
  });
  return {
    status: "OK!",
    zone,
    prayerTime: schedule(month).map((day) => ({
      date: `${day.date.slice(8)}-${monthName}-${month.slice(0, 4)}`,
      hijri: day.hijri,
      ...Object.fromEntries(
        Object.entries(apiKeys).map(([key, field]) => [
          field,
          `${day.times[key]}:00`,
        ]),
      ),
    })),
  };
}

function alternative(zone = "WLY01", month = "2026-09") {
  return {
    zone,
    year: Number(month.slice(0, 4)),
    month_number: Number(month.slice(5)),
    prayers: schedule(month).map((day) => ({
      day: Number(day.date.slice(8)),
      hijri: day.hijri,
      ...Object.fromEntries(
        Object.entries(apiKeys).map(([key, field]) => [
          field,
          Date.parse(`${day.date}T${day.times[key]}:00+08:00`) / 1000,
        ]),
      ),
    })),
  };
}

const ok = (payload) => ({ ok: true, status: 200, json: async () => payload });

function storage(t, entries = {}) {
  const original = Object.getOwnPropertyDescriptor(globalThis, "localStorage");
  const values = new Map(Object.entries(entries));
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    value: {
      getItem: (key) => values.get(key) ?? null,
      setItem: (key, value) => values.set(key, value),
    },
  });
  t.after(() => {
    if (original) Object.defineProperty(globalThis, "localStorage", original);
    else delete globalThis.localStorage;
  });
  return values;
}

function cacheEntry(zone = "WLY01", month = "2026-09", age = 0) {
  return JSON.stringify({
    version: 2,
    zone,
    month,
    days: schedule(month),
    savedAt: Date.now() - age,
  });
}

test("Malaysia date switches at 16:00 UTC and crosses year boundaries", () => {
  assert.equal(dateKey(new Date("2026-12-31T15:59:59Z")), "2026-12-31");
  assert.equal(dateKey(new Date("2026-12-31T16:00:00Z")), "2027-01-01");
  assert.equal(dateKey(new Date("2026-09-22T19:00:00-07:00")), "2026-09-23");
});

test("calendar arithmetic handles leap years, month/year rollover and rejects invalid dates", () => {
  assert.equal(addDays("2024-02-28", 1), "2024-02-29");
  assert.equal(addDays("2026-02-28", 1), "2026-03-01");
  assert.equal(addDays("2026-12-31", 1), "2027-01-01");
  assert.equal(addDays("2027-01-01", -1), "2026-12-31");
  assert.throws(() => addDays("2026-02-29", 1));
});

test("time formatting handles noon, midnight, seconds and 12/24 hour preference", () => {
  assert.equal(formatTime("00:04"), "12:04 AM");
  assert.equal(formatTime("12:04:00"), "12:04 PM");
  assert.equal(formatTime("20:04"), "8:04 PM");
  assert.equal(formatTime("6:04", "24"), "06:04");
  assert.equal(formatTime(null), "—");
  assert.throws(() => normalizeTime("24:00"));
  assert.throws(() => normalizeTime("06:60"));
  assert.throws(() => normalizeTime("06:00:99"));
});

test("JAKIM strings and alternative API epoch seconds normalize to identical schedules", () => {
  assert.deepEqual(normalizeMonth(jakim(), "wly01", "2026-09"), schedule());
  assert.deepEqual(
    normalizeMonth(alternative(), "WLY01", "2026-09"),
    schedule(),
  );
  assert.equal(
    normalizeMonth(jakim("WLY01", "2024-02"), "WLY01", "2024-02").length,
    29,
  );
});

test("API validation rejects wrong zone, wrong year/month, and timestamps from another date", () => {
  assert.throws(() => normalizeMonth(jakim("SGR01"), "WLY01", "2026-09"));
  assert.throws(() => normalizeMonth(jakim(), "WLY01", "2027-09"));
  assert.throws(() => normalizeMonth(alternative(), "WLY01", "2026-10"));
  const invalid = alternative();
  invalid.prayers[0].fajr += 86400;
  assert.throws(() => normalizeMonth(invalid, "WLY01", "2026-09"));
});

test("month validation rejects missing dates, duplicate dates, invalid dates and wrong prayer order", () => {
  assert.throws(() => validateMonthDays(schedule().slice(1), "2026-09"));
  const duplicated = schedule();
  duplicated[1].date = duplicated[0].date;
  assert.throws(() => validateMonthDays(duplicated, "2026-09"));
  const badDate = schedule();
  badDate[0].date = "2026-09-31";
  assert.throws(() => validateMonthDays(badDate, "2026-09"));
  const badTimes = schedule();
  badTimes[0].times.maghrib = "01:00";
  assert.throws(() => validateMonthDays(badTimes, "2026-09"));
});

test("at Subuh, next prayer is Zohor and Syuruk ends the Subuh current state", () => {
  const during = getPrayerState(
    schedule(),
    new Date("2026-09-23T06:00:00+08:00"),
  );
  assert.equal(during.current.key, "subuh");
  assert.equal(during.next.key, "zohor");
  assert.equal(during.progress, 0);
  const afterSunrise = getPrayerState(
    schedule(),
    new Date("2026-09-23T07:10:00+08:00"),
  );
  assert.equal(afterSunrise.current, null);
  assert.equal(afterSunrise.next.key, "zohor");
  assert.ok(afterSunrise.progress > 0 && afterSunrise.progress < 1);
});

test("countdown handles exact prayer transition and an overseas device timezone", () => {
  const state = getPrayerState(schedule(), new Date("2026-09-23T05:10:00Z"));
  assert.equal(state.current.key, "zohor");
  assert.equal(state.next.key, "asar");
  assert.equal(state.next.timestamp, Date.parse("2026-09-23T16:20:00+08:00"));
});

test("before Subuh, previous Isyak remains current when yesterday is available", () => {
  const state = getPrayerState(
    schedule(),
    new Date("2026-09-23T04:00:00+08:00"),
  );
  assert.equal(state.current.key, "isyak");
  assert.equal(state.current.date, "2026-09-22");
  assert.equal(state.next.key, "subuh");
  assert.equal(state.next.date, "2026-09-23");
});

test("month/year boundary uses tomorrow real data and never repeats today Subuh", () => {
  const days = [...schedule("2026-12"), ...schedule("2027-01")];
  days.find((day) => day.date === "2027-01-01").times.subuh = "06:03";
  const state = getPrayerState(days, new Date("2026-12-31T21:00:00+08:00"));
  assert.equal(state.next.date, "2027-01-01");
  assert.equal(state.next.time, "06:03");
  const missing = getPrayerState(
    schedule("2026-12"),
    new Date("2026-12-31T21:00:00+08:00"),
  );
  assert.equal(missing.next, null);
  assert.equal(missing.current.key, "isyak");
  assert.deepEqual(getPrayerState([], new Date()), {
    current: null,
    next: null,
    progress: 0,
  });
});

test("loadMonth requests explicit period, normalizes response and caches by zone and year-month", async (t) => {
  const values = storage(t);
  t.mock.method(globalThis, "fetch", async (url, options) => {
    assert.match(url, /zone=WLY01&period=month&year=2026&month=9/);
    assert.ok(options.signal instanceof AbortSignal);
    return ok(jakim());
  });
  const result = await loadMonth("wly01", "2026-09");
  assert.equal(result.source, "JAKIM");
  assert.equal(result.cached, false);
  assert.deepEqual(result.days, schedule());
  assert.ok(values.has("ws_month_v2_WLY01_2026-09"));
});

test("valid fresh cache avoids repeated API requests, while force explicitly refreshes", async (t) => {
  storage(t, {
    ws_month_v2_WLY01_2026_09: "legacy cache is ignored",
    "ws_month_v2_WLY01_2026-09": cacheEntry(),
  });
  const request = t.mock.method(globalThis, "fetch", async () => ok(jakim()));
  assert.equal((await loadMonth("WLY01", "2026-09")).source, "cache");
  assert.equal(request.mock.callCount(), 0);
  assert.equal(
    (await loadMonth("WLY01", "2026-09", { force: true })).source,
    "JAKIM",
  );
  assert.equal(request.mock.callCount(), 1);
});

test("CORS/network failure at JAKIM falls back to validated alternative API", async (t) => {
  storage(t);
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    if (url.includes("e-solat.gov.my")) throw new TypeError("Failed to fetch");
    return ok(alternative());
  });
  const result = await loadMonth("WLY01", "2026-09");
  assert.equal(result.source, "Waktu Solat API");
  assert.deepEqual(result.days, schedule());
  assert.equal(urls.length, 2);
  assert.match(urls[1], /\/v2\/solat\/WLY01\?year=2026&month=9/);
});

test("HTTP error and malformed primary data both trigger fallback", async (t) => {
  storage(t);
  let primaryIsMalformed = false;
  t.mock.method(globalThis, "fetch", async (url) => {
    if (!url.includes("e-solat.gov.my")) return ok(alternative());
    return primaryIsMalformed ? ok(jakim("SGR01")) : { ok: false, status: 503 };
  });
  assert.equal((await loadMonth("WLY01", "2026-09")).source, "Waktu Solat API");
  primaryIsMalformed = true;
  assert.equal(
    (await loadMonth("WLY01", "2026-09", { force: true })).source,
    "Waktu Solat API",
  );
});

test("offline failure can use expired same-zone same-month data but never another zone/year", async (t) => {
  storage(t, {
    "ws_month_v2_WLY01_2026-09": cacheEntry("WLY01", "2026-09", 172800000),
  });
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  assert.equal((await loadMonth("WLY01", "2026-09")).source, "cache");
  await assert.rejects(loadMonth("SGR01", "2026-09"));
  await assert.rejects(loadMonth("WLY01", "2027-09"));
});

test("corrupt storage, mismatched metadata, and incomplete cached schedules cannot leak into display", async (t) => {
  const values = storage(t, { "ws_month_v2_WLY01_2026-09": "{broken" });
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  await assert.rejects(loadMonth("WLY01", "2026-09"));
  values.set("ws_month_v2_WLY01_2026-09", cacheEntry("SGR01"));
  await assert.rejects(loadMonth("WLY01", "2026-09"));
  const incomplete = JSON.parse(cacheEntry());
  incomplete.days.pop();
  values.set("ws_month_v2_WLY01_2026-09", JSON.stringify(incomplete));
  await assert.rejects(loadMonth("WLY01", "2026-09"));
});

test("blocked localStorage cannot stop successful live API data", async (t) => {
  storage(t);
  Object.defineProperty(globalThis, "localStorage", {
    configurable: true,
    get() {
      throw new Error("SecurityError");
    },
  });
  t.mock.method(globalThis, "fetch", async () => ok(jakim()));
  assert.equal((await loadMonth("WLY01", "2026-09")).source, "JAKIM");
});

test("simultaneous requests for same zone/month share one network request", async (t) => {
  storage(t);
  let complete;
  const pending = new Promise((resolve) => {
    complete = resolve;
  });
  const request = t.mock.method(globalThis, "fetch", async () => {
    await pending;
    return ok(jakim());
  });
  const first = loadMonth("WLY01", "2026-09");
  const second = loadMonth("WLY01", "2026-09");
  complete();
  const [firstResult, secondResult] = await Promise.all([first, second]);
  assert.deepEqual(firstResult, secondResult);
  assert.equal(request.mock.callCount(), 1);
});

test("GPS uses dedicated zone endpoint and rejects invalid coordinates/response", async (t) => {
  let invalid = false;
  const request = t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(url, "https://api.waktusolat.app/zones/3.139/101.6869");
    return ok({ zone: invalid ? null : "WLY01" });
  });
  assert.equal(await resolveGpsZone(3.139, 101.6869), "WLY01");
  invalid = true;
  await assert.rejects(resolveGpsZone(3.139, 101.6869));
  await assert.rejects(resolveGpsZone(91, 101));
  await assert.rejects(resolveGpsZone(NaN, 101));
  assert.equal(request.mock.callCount(), 2);
});

test("invalid zone/month input does not issue a request", async (t) => {
  const request = t.mock.method(globalThis, "fetch", async () => {
    throw new Error("Should not fetch");
  });
  await assert.rejects(loadMonth("WLY01&zone=SGR01", "2026-09"));
  await assert.rejects(loadMonth("WLY01", "2026-13"));
  assert.equal(request.mock.callCount(), 0);
});
