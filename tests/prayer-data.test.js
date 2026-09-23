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
    version: 3,
    source: "JAKIM",
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
  assert.ok(values.has("ws_month_v3_WLY01_2026-09"));
});

test("valid fresh cache avoids repeated API requests, while force explicitly refreshes", async (t) => {
  storage(t, {
    ws_month_v3_WLY01_2026_09: "legacy cache is ignored",
    "ws_month_v3_WLY01_2026-09": cacheEntry(),
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

test("a transient JAKIM network failure retries the official source only", async (t) => {
  storage(t);
  const urls = [];
  t.mock.method(globalThis, "fetch", async (url) => {
    urls.push(url);
    assert.equal(new URL(url).hostname, "www.e-solat.gov.my");
    if (urls.length === 1) throw new TypeError("Failed to fetch");
    return ok(jakim());
  });
  const result = await loadMonth("WLY01", "2026-09");
  assert.equal(result.source, "JAKIM");
  assert.deepEqual(result.days, schedule());
  assert.equal(urls.length, 2);
  assert.equal(urls[0], urls[1]);
});

test("HTTP errors and wrong-zone JAKIM data never fall back to third-party prayer times", async (t) => {
  storage(t);
  let primaryIsMalformed = false;
  t.mock.method(globalThis, "fetch", async (url) => {
    assert.equal(new URL(url).hostname, "www.e-solat.gov.my");
    return primaryIsMalformed ? ok(jakim("SGR01")) : { ok: false, status: 503 };
  });
  await assert.rejects(loadMonth("WLY01", "2026-09"));
  primaryIsMalformed = true;
  await assert.rejects(loadMonth("WLY01", "2026-09", { force: true }));
});

test("offline failure can use expired same-zone same-month data but never another zone/year", async (t) => {
  storage(t, {
    "ws_month_v3_WLY01_2026-09": cacheEntry("WLY01", "2026-09", 172800000),
  });
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  assert.equal((await loadMonth("WLY01", "2026-09")).source, "cache");
  await assert.rejects(loadMonth("SGR01", "2026-09"));
  await assert.rejects(loadMonth("WLY01", "2027-09"));
});

test("corrupt storage, mismatched metadata, and incomplete cached schedules cannot leak into display", async (t) => {
  const values = storage(t, { "ws_month_v3_WLY01_2026-09": "{broken" });
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  await assert.rejects(loadMonth("WLY01", "2026-09"));
  values.set("ws_month_v3_WLY01_2026-09", cacheEntry("SGR01"));
  await assert.rejects(loadMonth("WLY01", "2026-09"));
  const incomplete = JSON.parse(cacheEntry());
  incomplete.days.pop();
  values.set("ws_month_v3_WLY01_2026-09", JSON.stringify(incomplete));
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
  await assert.rejects(loadMonth("XYZ01", "2026-09"));
  assert.equal(request.mock.callCount(), 0);
});

test("legacy and non-JAKIM cache provenance cannot satisfy official-only prayer times", async (t) => {
  const values = storage(t, { "ws_month_v2_WLY01_2026-09": cacheEntry() });
  t.mock.method(globalThis, "fetch", async () => {
    throw new Error("offline");
  });
  await assert.rejects(loadMonth("WLY01", "2026-09"));
  const entry = JSON.parse(cacheEntry());
  entry.source = "Waktu Solat API";
  values.set("ws_month_v3_WLY01_2026-09", JSON.stringify(entry));
  await assert.rejects(loadMonth("WLY01", "2026-09"));
  delete entry.source;
  values.set("ws_month_v3_WLY01_2026-09", JSON.stringify(entry));
  await assert.rejects(loadMonth("WLY01", "2026-09"));
});

test("Kinta uses current Perak zone 2 instead of the obsolete upstream polygon code", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    ok({ zone: "PRK01", state: "PRK", district: "Kinta" }),
  );
  assert.equal(await resolveGpsZone(4.5975, 101.0901), "PRK02");
  assert.equal(
    await resolveGpsZone(4.5975, 101.0901, {
      countryCode: "MY",
      state: "Perak Darul Ridzuan",
      city: "Ipoh",
    }),
    "PRK02",
  );
});

test("country-verified coastal locality names recover missing Tawau and Semporna polygons", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 500 }));
  assert.equal(
    await resolveGpsZone(4.2443, 117.891, {
      countryCode: "MY",
      stateCode: "MY-12",
      city: "Tawau",
    }),
    "SBH04",
  );
  assert.equal(
    await resolveGpsZone(4.479, 118.6112, {
      countryCode: "MY",
      state: "Sabah",
      locality: "Semporna",
    }),
    "SBH03",
  );
});

test("outside-country metadata is rejected before any Malaysian zone request", async (t) => {
  const request = t.mock.method(globalThis, "fetch", async () =>
    ok({ zone: "JHR02" }),
  );
  for (const countryCode of ["SG", "ID", "TH", "BN"]) {
    await assert.rejects(
      resolveGpsZone(1.3521, 103.8198, {
        countryCode,
        state: "Johor",
        city: "Johor Bahru",
      }),
      { code: "OUTSIDE_MALAYSIA" },
    );
  }
  assert.equal(request.mock.callCount(), 0);
});

test("unknown-country or unknown-state place names cannot fabricate a GPS zone", async (t) => {
  t.mock.method(globalThis, "fetch", async () => ({ ok: false, status: 500 }));
  await assert.rejects(
    resolveGpsZone(4.479, 118.6112, { locality: "Semporna", state: "Sabah" }),
    { code: "ZONE_NOT_FOUND" },
  );
  await assert.rejects(
    resolveGpsZone(4.479, 118.6112, {
      countryCode: "MY",
      locality: "Semporna",
      state: "Unknown",
    }),
    { code: "ZONE_NOT_FOUND" },
  );
});

test("exact locality matches respect state boundaries, federal territories and source naming", async (t) => {
  t.mock.method(globalThis, "fetch", async () => {
    throw new TypeError("network");
  });
  assert.equal(
    await resolveGpsZone(5.2831, 115.2308, {
      countryCode: "MY",
      state: "Federal Territory of Labuan",
      city: "Labuan",
    }),
    "WLY02",
  );
  assert.equal(
    await resolveGpsZone(3.139, 101.6869, {
      countryCode: "MY",
      stateCode: "MY-14",
      locality: "Kuala Lumpur",
    }),
    "WLY01",
  );
  assert.equal(
    await resolveGpsZone(3.0738, 101.5183, {
      countryCode: "MY",
      state: "Selangor Darul Ehsan",
      city: "Shah Alam",
    }),
    "SGR01",
  );
  await assert.rejects(
    resolveGpsZone(3.0738, 101.5183, {
      countryCode: "MY",
      state: "Johor",
      city: "Shah Alam",
    }),
    { code: "ZONE_NOT_FOUND" },
  );
});

test("conflicting locality/district matches and special-zone conflicts require manual confirmation", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    ok({ zone: "SBH06", state: "SBH", district: "Gunung Kinabalu" }),
  );
  await assert.rejects(
    resolveGpsZone(6.075, 116.558, {
      countryCode: "MY",
      state: "Sabah",
      city: "Ranau",
    }),
    { code: "AMBIGUOUS_ZONE" },
  );
  await assert.rejects(
    resolveGpsZone(4.5975, 101.0901, {
      countryCode: "MY",
      state: "Perak",
      city: "Ipoh",
      locality: "Tapah",
    }),
    { code: "AMBIGUOUS_ZONE" },
  );
});

test("broad districts cannot choose special island/highland zones and matching islands remain intact", async (t) => {
  let zone = "PHG01";
  t.mock.method(globalThis, "fetch", async () => ok({ zone }));
  assert.equal(
    await resolveGpsZone(2.79, 104.17, {
      countryCode: "MY",
      state: "Pahang",
      district: "Rompin",
    }),
    "PHG01",
  );
  zone = "PHG02";
  await assert.rejects(
    resolveGpsZone(2.79, 104.17, {
      countryCode: "MY",
      state: "Pahang",
      district: "Rompin",
    }),
    { code: "AMBIGUOUS_ZONE" },
  );
  zone = "JHR01";
  await assert.rejects(
    resolveGpsZone(2.46, 104.51, {
      countryCode: "MY",
      state: "Johor",
      district: "Mersing",
    }),
    { code: "AMBIGUOUS_ZONE" },
  );
  assert.equal(
    await resolveGpsZone(2.46, 104.51, {
      countryCode: "MY",
      state: "Johor",
      locality: "Pulau Aur",
      district: "Mersing",
    }),
    "JHR01",
  );
});

test("a same-state polygon remains usable when locality names have no exact catalog match", async (t) => {
  t.mock.method(globalThis, "fetch", async () =>
    ok({ zone: "SGR01", state: "SGR", district: "Petaling" }),
  );
  assert.equal(
    await resolveGpsZone(3.0738, 101.5183, {
      countryCode: "MY",
      state: "Selangor",
      locality: "Seksyen 7",
    }),
    "SGR01",
  );
  await assert.rejects(
    resolveGpsZone(3.0738, 101.5183, {
      countryCode: "MY",
      state: "Sabah",
      locality: "Unknown",
    }),
    { code: "AMBIGUOUS_ZONE" },
  );
});
