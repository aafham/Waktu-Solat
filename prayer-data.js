/** Prayer times are always interpreted in Malaysia time, independent of the device. */
export const TIME_ZONE = "Asia/Kuala_Lumpur";
export const PRAYER_KEYS = [
  "subuh",
  "syuruk",
  "zohor",
  "asar",
  "maghrib",
  "isyak",
];
export const OBLIGATORY_KEYS = PRAYER_KEYS.filter((key) => key !== "syuruk");

const API_KEYS = {
  subuh: "fajr",
  syuruk: "syuruk",
  zohor: "dhuhr",
  asar: "asr",
  maghrib: "maghrib",
  isyak: "isha",
};
const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
const DAY_MS = 86_400_000;
const CACHE_VERSION = 2;
const CACHE_PREFIX = "ws_month_v2_";
const inFlight = new Map();
const dateFormatter = new Intl.DateTimeFormat("en-CA", {
  timeZone: TIME_ZONE,
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
});
const timeFormatter = new Intl.DateTimeFormat("en-GB", {
  timeZone: TIME_ZONE,
  hour: "2-digit",
  minute: "2-digit",
  hourCycle: "h23",
});

export function dateKey(now = new Date()) {
  const parts = Object.fromEntries(
    dateFormatter.formatToParts(now).map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
}

function validDateKey(key) {
  if (typeof key !== "string" || !/^\d{4}-\d{2}-\d{2}$/.test(key)) return false;
  const date = new Date(`${key}T00:00:00Z`);
  return (
    Number.isFinite(date.getTime()) && date.toISOString().slice(0, 10) === key
  );
}

export function addDays(key, days) {
  if (!validDateKey(key) || !Number.isInteger(days))
    throw new Error("Tarikh tidak sah.");
  return new Date(Date.parse(`${key}T00:00:00Z`) + days * DAY_MS)
    .toISOString()
    .slice(0, 10);
}

export function normalizeTime(value, expectedDate) {
  if (typeof value === "number" && Number.isFinite(value) && value > 0) {
    const instant = new Date(value * 1000);
    if (
      !Number.isFinite(instant.getTime()) ||
      (expectedDate && dateKey(instant) !== expectedDate)
    ) {
      throw new Error("Tarikh waktu solat tidak sepadan.");
    }
    return timeFormatter.format(instant);
  }
  const match =
    typeof value === "string" &&
    value.match(/^(\d{1,2}):(\d{2})(?::(\d{2}))?$/);
  if (
    !match ||
    Number(match[1]) > 23 ||
    Number(match[2]) > 59 ||
    Number(match[3] || 0) > 59
  ) {
    throw new Error("Waktu solat tidak sah.");
  }
  return `${match[1].padStart(2, "0")}:${match[2]}`;
}

export function formatTime(time, format = "12") {
  if (!time) return "—";
  const normalized = normalizeTime(time);
  if (String(format) === "24") return normalized;
  const [hour, minute] = normalized.split(":");
  return `${Number(hour) % 12 || 12}:${minute} ${Number(hour) < 12 ? "AM" : "PM"}`;
}

function normalizeZone(zone) {
  const code = String(zone || "")
    .trim()
    .toUpperCase();
  if (!/^[A-Z]{3}\d{2}$/.test(code)) throw new Error("Kod zon tidak sah.");
  return code;
}

function monthLength(monthKey) {
  if (
    typeof monthKey !== "string" ||
    !/^\d{4}-(0[1-9]|1[0-2])$/.test(monthKey) ||
    !validDateKey(`${monthKey}-01`)
  ) {
    throw new Error("Bulan tidak sah.");
  }
  const [year, month] = monthKey.split("-").map(Number);
  return new Date(Date.UTC(year, month, 0)).getUTCDate();
}

function parseApiDate(value) {
  if (validDateKey(value)) return value;
  const match =
    typeof value === "string" &&
    value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (!match) throw new Error("Tarikh API tidak sah.");
  const month =
    MONTHS.findIndex((name) => name.toLowerCase() === match[2].toLowerCase()) +
    1;
  const key = `${match[3]}-${String(month).padStart(2, "0")}-${match[1].padStart(2, "0")}`;
  if (!validDateKey(key)) throw new Error("Tarikh API tidak sah.");
  return key;
}

/** Reject incomplete, mixed-month, duplicate-date, and invalid schedules before display/cache. */
export function validateMonthDays(days, monthKey) {
  const count = monthLength(monthKey);
  if (!Array.isArray(days) || days.length !== count)
    throw new Error("Jadual bulan tidak lengkap.");
  const result = days
    .map((day) => {
      if (
        !day ||
        !validDateKey(day.date) ||
        !day.date.startsWith(`${monthKey}-`)
      )
        throw new Error("Bulan jadual tidak sepadan.");
      const times = Object.fromEntries(
        PRAYER_KEYS.map((key) => [
          key,
          normalizeTime(day.times?.[key], day.date),
        ]),
      );
      if (
        PRAYER_KEYS.some(
          (key, index) =>
            index > 0 && times[key] <= times[PRAYER_KEYS[index - 1]],
        )
      ) {
        throw new Error("Susunan waktu solat tidak sah.");
      }
      return {
        date: day.date,
        hijri: typeof day.hijri === "string" ? day.hijri : "",
        times,
      };
    })
    .sort((a, b) => a.date.localeCompare(b.date));
  if (
    result.some(
      (day, index) =>
        day.date !== `${monthKey}-${String(index + 1).padStart(2, "0")}`,
    )
  ) {
    throw new Error("Tarikh jadual berulang atau tidak lengkap.");
  }
  return result;
}

/** Normalize the two verified API response formats to a single browser-facing contract. */
export function normalizeMonth(payload, zone, monthKey) {
  const code = normalizeZone(zone);
  monthLength(monthKey);
  if (!payload || normalizeZone(payload.zone) !== code)
    throw new Error("Zon jadual tidak sepadan.");
  let days;
  if (Array.isArray(payload.prayerTime)) {
    days = payload.prayerTime.map((day) => ({
      date: parseApiDate(day.date),
      hijri: day.hijri,
      times: Object.fromEntries(
        PRAYER_KEYS.map((key) => [key, day[API_KEYS[key]]]),
      ),
    }));
  } else if (Array.isArray(payload.prayers)) {
    const [year, month] = monthKey.split("-").map(Number);
    if (Number(payload.year) !== year || Number(payload.month_number) !== month)
      throw new Error("Bulan jadual tidak sepadan.");
    days = payload.prayers.map((day) => ({
      date: `${monthKey}-${String(day.day).padStart(2, "0")}`,
      hijri: day.hijri,
      times: Object.fromEntries(
        PRAYER_KEYS.map((key) => [key, day[API_KEYS[key]]]),
      ),
    }));
  } else {
    throw new Error("Jadual waktu solat tidak tersedia.");
  }
  return validateMonthDays(days, monthKey);
}

function readCache(zone, monthKey) {
  try {
    const entry = JSON.parse(
      globalThis.localStorage?.getItem(`${CACHE_PREFIX}${zone}_${monthKey}`) ||
        "null",
    );
    if (
      !entry ||
      entry.version !== CACHE_VERSION ||
      entry.zone !== zone ||
      entry.month !== monthKey ||
      !Number.isFinite(entry.savedAt) ||
      entry.savedAt <= 0 ||
      entry.savedAt > Date.now() + 60_000
    )
      return null;
    return {
      days: validateMonthDays(entry.days, monthKey),
      savedAt: entry.savedAt,
    };
  } catch {
    return null;
  }
}

function writeCache(zone, monthKey, days) {
  try {
    globalThis.localStorage?.setItem(
      `${CACHE_PREFIX}${zone}_${monthKey}`,
      JSON.stringify({
        version: CACHE_VERSION,
        zone,
        month: monthKey,
        savedAt: Date.now(),
        days,
      }),
    );
  } catch {
    // Private browsing and a full storage quota must not break live prayer times.
  }
}

async function fetchJson(url, timeoutMs = 8000) {
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const response = await fetch(url, {
      signal: controller.signal,
      cache: "no-store",
      headers: { Accept: "application/json" },
    });
    if (!response.ok)
      throw new Error(`Pelayan memberi respons ${response.status}.`);
    return await response.json();
  } finally {
    clearTimeout(timeout);
  }
}

async function fetchMonth(zone, monthKey, force) {
  const cached = readCache(zone, monthKey);
  // The public API asks consumers to reuse monthly data for at least 24 hours.
  if (!force && cached && Date.now() - cached.savedAt < DAY_MS) {
    return { days: cached.days, source: "cache", cached: true };
  }
  const [year, month] = monthKey.split("-").map(Number);
  const providers = [
    {
      source: "JAKIM",
      url: `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&zone=${zone}&period=month&year=${year}&month=${month}`,
    },
    {
      source: "Waktu Solat API",
      url: `https://api.waktusolat.app/v2/solat/${zone}?year=${year}&month=${month}`,
    },
  ];
  for (const provider of providers) {
    try {
      const days = normalizeMonth(
        await fetchJson(provider.url),
        zone,
        monthKey,
      );
      writeCache(zone, monthKey, days);
      return { days, source: provider.source, cached: false };
    } catch {
      // A blocked request, API outage, or invalid response should try the next source.
    }
  }
  if (cached) return { days: cached.days, source: "cache", cached: true };
  throw new Error(
    "Jadual tidak dapat dimuatkan. Semak sambungan internet dan cuba lagi.",
  );
}

export async function loadMonth(
  zone,
  monthKey = dateKey().slice(0, 7),
  { force = false } = {},
) {
  const code = normalizeZone(zone);
  monthLength(monthKey);
  const requestKey = `${code}_${monthKey}_${Boolean(force)}`;
  if (!inFlight.has(requestKey)) {
    inFlight.set(
      requestKey,
      fetchMonth(code, monthKey, force).finally(() =>
        inFlight.delete(requestKey),
      ),
    );
  }
  return inFlight.get(requestKey);
}

/** Return real schedule events only: no guessed next-day time when tomorrow is missing. */
export function getPrayerState(days, now = new Date()) {
  const timestamp = now.getTime();
  if (!Number.isFinite(timestamp)) throw new Error("Tarikh tidak sah.");
  const today = dateKey(now);
  const yesterday = addDays(today, -1);
  const tomorrow = addDays(today, 1);
  const events = [];
  let sunrise = null;
  for (const day of Array.isArray(days) ? days : []) {
    if (
      !day ||
      !validDateKey(day.date) ||
      day.date < yesterday ||
      day.date > tomorrow
    )
      continue;
    for (const key of PRAYER_KEYS) {
      try {
        const time = normalizeTime(day.times?.[key], day.date);
        const eventTime = Date.parse(`${day.date}T${time}:00+08:00`);
        if (key === "syuruk") {
          if (day.date === today) sunrise = eventTime;
        } else {
          events.push({ key, date: day.date, time, timestamp: eventTime });
        }
      } catch {
        // Malformed individual entries are not usable countdown events.
      }
    }
  }
  events.sort((a, b) => a.timestamp - b.timestamp);
  const previous =
    events
      .filter(
        (event) =>
          event.timestamp <= timestamp && timestamp - event.timestamp < DAY_MS,
      )
      .at(-1) || null;
  const next = events.find((event) => event.timestamp > timestamp) || null;
  // Subuh ends at sunrise; the next obligatory prayer remains Zohor.
  const current =
    previous?.key === "subuh" && sunrise !== null && timestamp >= sunrise
      ? null
      : previous;
  const progress =
    previous && next
      ? Math.min(
          1,
          Math.max(
            0,
            (timestamp - previous.timestamp) /
              (next.timestamp - previous.timestamp),
          ),
        )
      : 0;
  return { next, current, progress };
}

export async function resolveGpsZone(lat, lon) {
  if (
    typeof lat !== "number" ||
    typeof lon !== "number" ||
    !Number.isFinite(lat) ||
    !Number.isFinite(lon) ||
    Math.abs(lat) > 90 ||
    Math.abs(lon) > 180
  ) {
    throw new Error("Koordinat lokasi tidak sah.");
  }
  const payload = await fetchJson(
    `https://api.waktusolat.app/zones/${lat}/${lon}`,
  );
  return normalizeZone(payload?.zone);
}
