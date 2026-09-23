import { dateKey } from "./prayer-data.js";
import {
  CALENDAR_SOURCES,
  OFFICIAL_MONTH_STARTS,
  IMPORTANT_DATES_SOURCE,
  DECLARED_DATES,
} from "./islamic-calendar-data.js";

export const MIN_GREGORIAN = "0622-07-19";
export const MAX_GREGORIAN = "9999-10-01";
export const MIN_HIJRI_YEAR = 1;
export const MAX_HIJRI_YEAR = 9665;
export const OFFICIAL_COVERAGE = Object.freeze({
  start: "2025-01-01",
  end: "2026-12-31",
  checkedAt: "2026-09-23",
});
export const MONTH_NAMES = Object.freeze({
  ms: Object.freeze([
    "Muharam",
    "Safar",
    "Rabiulawal",
    "Rabiulakhir",
    "Jamadilawal",
    "Jamadilakhir",
    "Rejab",
    "Syaaban",
    "Ramadan",
    "Syawal",
    "Zulkaedah",
    "Zulhijjah",
  ]),
  en: Object.freeze([
    "Muharram",
    "Safar",
    "Rabi al-Awwal",
    "Rabi al-Thani",
    "Jumada al-Awwal",
    "Jumada al-Thani",
    "Rajab",
    "Shaaban",
    "Ramadan",
    "Shawwal",
    "Dhul Qadah",
    "Dhul Hijjah",
  ]),
});
const DAY_MS = 86_400_000;
const EPOCH = Date.parse(`${MIN_GREGORIAN}T00:00:00Z`) / DAY_MS;
const ESTIMATED_SOURCE = Object.freeze({
  type: "estimated",
  label: "Tabular Islamic calendar (estimate)",
  url: "https://aa.usno.navy.mil/faq/islamic",
});
const officialStarts = new Map(
  OFFICIAL_MONTH_STARTS.map(([year, month, date]) => [
    `${year}-${month}`,
    Date.parse(`${date}T00:00:00Z`) / DAY_MS,
  ]),
);

function invalid(message = "Invalid calendar date.") {
  return Object.assign(new RangeError(message), { code: "INVALID_DATE" });
}
function validateMonth(year, month) {
  if (
    !Number.isInteger(year) ||
    year < MIN_HIJRI_YEAR ||
    year > MAX_HIJRI_YEAR ||
    !Number.isInteger(month) ||
    month < 1 ||
    month > 12
  )
    throw invalid();
}
function toDayNumber(date) {
  if (
    typeof date !== "string" ||
    !/^\d{4}-\d{2}-\d{2}$/.test(date) ||
    date < MIN_GREGORIAN ||
    date > MAX_GREGORIAN
  )
    throw invalid();
  const instant = new Date(`${date}T00:00:00Z`);
  if (
    !Number.isFinite(instant.getTime()) ||
    instant.toISOString().slice(0, 10) !== date
  )
    throw invalid();
  return instant.getTime() / DAY_MS;
}
function fromDayNumber(day) {
  return new Date(day * DAY_MS).toISOString().slice(0, 10);
}
/**
 * Civil/tabular Hijri fallback: Friday epoch (19 July 622 proleptic Gregorian),
 * 30-year cycle, leap years 2,5,7,10,13,16,18,21,24,26,29.
 * Never uses the host's varying Intl Islamic-calendar implementations.
 */
function monthStart(year, month) {
  return (
    officialStarts.get(`${year}-${month}`) ??
    EPOCH +
      354 * (year - 1) +
      Math.floor((3 + 11 * year) / 30) +
      Math.ceil(29.5 * (month - 1))
  );
}
function nextMonth(year, month) {
  return month === 12 ? [year + 1, 1] : [year, month + 1];
}
export function daysInHijriMonth(year, month) {
  validateMonth(year, month);
  return monthStart(...nextMonth(year, month)) - monthStart(year, month);
}
function provenance(date) {
  const source =
    date >= OFFICIAL_COVERAGE.start && date <= OFFICIAL_COVERAGE.end
      ? CALENDAR_SOURCES[Number(date.slice(0, 4))]
      : ESTIMATED_SOURCE;
  return { estimated: source.type !== "official", source };
}

/** Corresponding civil day, not an assertion of a local sunset or moon sighting. */
export function toHijri(date) {
  const dayNumber = toDayNumber(date);
  let year = Math.floor((30 * (dayNumber - EPOCH) + 10646) / 10631);
  while (dayNumber < monthStart(year, 1)) year--;
  while (dayNumber >= monthStart(year + 1, 1)) year++;
  let month = 1;
  while (month < 12 && dayNumber >= monthStart(year, month + 1)) month++;
  return {
    year,
    month,
    day: dayNumber - monthStart(year, month) + 1,
    ...provenance(date),
  };
}

export function toGregorian(input) {
  if (!input || typeof input !== "object") throw invalid();
  const { year, month, day } = input;
  validateMonth(year, month);
  if (!Number.isInteger(day) || day < 1 || day > daysInHijriMonth(year, month))
    throw invalid();
  const date = fromDayNumber(monthStart(year, month) + day - 1);
  return { date, ...provenance(date) };
}

const definition = (
  id,
  month,
  day,
  ms,
  en,
  descriptionMs,
  descriptionEn,
  options = {},
) =>
  Object.freeze({
    id,
    month,
    day,
    name: Object.freeze({ ms, en }),
    description: Object.freeze({ ms: descriptionMs, en: descriptionEn }),
    category: "observance",
    reference: IMPORTANT_DATES_SOURCE,
    featured: true,
    subjectToAnnouncement: false,
    ...options,
  });

export const EVENT_DEFINITIONS = Object.freeze([
  definition(
    "islamicNewYear",
    1,
    1,
    "Awal Muharam",
    "Islamic New Year",
    "Permulaan tahun Hijri, juga dikenali sebagai Maal Hijrah.",
    "The beginning of the Hijri year, also known as Maal Hijrah.",
    { category: "celebration" },
  ),
  definition(
    "tasua",
    1,
    9,
    "Hari Tasu’a",
    "Day of Tasua",
    "9 Muharam; berpuasa sehari sebelum Asyura disebut dalam hadis.",
    "9 Muharram; fasting the day before Ashura is mentioned in hadith.",
    {
      reference: {
        label: "Sahih Muslim 1134a",
        url: "https://sunnah.com/muslim:1134a",
      },
    },
  ),
  definition(
    "ashura",
    1,
    10,
    "Hari Asyura",
    "Day of Ashura",
    "10 Muharam; hari puasa sunat Asyura.",
    "10 Muharram; the voluntary fast of Ashura.",
    {
      reference: {
        label: "Mufti Wilayah — Puasa Asyura",
        url: "https://www.muftiwp.gov.my/ms/artikel/irsyad-al-hadith/3678-irsyad-al-hadith-siri-ke-413-peringkat-puasa-asyura",
      },
    },
  ),
  definition(
    "mawlid",
    3,
    12,
    "Maulidur Rasul",
    "Mawlid",
    "Hari memperingati kelahiran Nabi Muhammad SAW dalam takwim Malaysia.",
    "The commemoration of Prophet Muhammad’s birth in the Malaysian calendar.",
    { category: "celebration" },
  ),
  definition(
    "israMiraj",
    7,
    27,
    "Israk dan Mikraj",
    "Isra and Miraj",
    "Peringatan Israk dan Mikraj pada 27 Rejab dalam takwim Malaysia.",
    "Isra and Miraj is observed on 27 Rajab in the Malaysian calendar.",
  ),
  definition(
    "nisfuShaaban",
    8,
    15,
    "Nisfu Syaaban",
    "Mid-Shaaban",
    "Pertengahan Syaaban; malamnya bermula pada petang sebelumnya. Penanda ini bukan anjuran puasa khusus Nisfu Syaaban.",
    "Mid-Shaaban; its night begins the preceding evening. This marker does not prescribe a special Mid-Shaaban fast.",
    {
      featured: false,
      reference: {
        label: "Mufti Wilayah — Malam Nisfu Syaaban",
        url: "https://muftiwp.gov.my/ms/artikel/irsyad-al-hadith/1121-irsyad-al-hadith-siri-ke-70-kelebihan-malam-nisfu-sya-ban",
      },
    },
  ),
  definition(
    "startRamadan",
    9,
    1,
    "Awal Ramadan",
    "Start of Ramadan",
    "Permulaan bulan Ramadan dan ibadah puasa.",
    "The beginning of Ramadan and its fasting observance.",
    { subjectToAnnouncement: true },
  ),
  definition(
    "nuzulQuran",
    9,
    17,
    "Nuzul al-Quran",
    "Nuzul al-Quran",
    "Peringatan penurunan al-Quran pada 17 Ramadan dalam takwim Malaysia.",
    "The commemoration of the revelation of the Quran on 17 Ramadan in the Malaysian calendar.",
  ),
  definition(
    "lastTenRamadan",
    9,
    21,
    "Sepuluh malam terakhir Ramadan",
    "Last ten nights of Ramadan",
    "Cari Lailatulqadar pada malam ganjil dalam sepuluh malam terakhir. Malam 21 bermula selepas Maghrib pada hari 20; tiada satu tarikh Lailatulqadar dipastikan.",
    "Seek Laylat al-Qadr on the odd nights of the last ten nights. Night 21 begins after sunset on day 20; no single date of Laylat al-Qadr is asserted.",
    {
      featured: false,
      untilMonthEnd: true,
      reference: {
        label: "Sahih al-Bukhari 2017",
        url: "https://sunnah.com/bukhari:2017",
      },
    },
  ),
  definition(
    "eidFitr",
    10,
    1,
    "Hari Raya Aidilfitri",
    "Eid al-Fitr",
    "Hari Raya Puasa pada 1 Syawal selepas bulan Ramadan.",
    "The celebration on 1 Shawwal following Ramadan.",
    { category: "celebration", subjectToAnnouncement: true },
  ),
  definition(
    "sixShawwal",
    10,
    2,
    "Pilihan enam hari puasa Syawal",
    "Choose six fasting days in Shawwal",
    "Pilih mana-mana enam hari selepas Aidilfitri dalam bulan Syawal, berturut-turut atau berasingan; bukan enam tarikh tetap.",
    "Choose any six days after Eid within Shawwal, consecutively or separately; these are not six fixed dates.",
    {
      featured: false,
      untilMonthEnd: true,
      reference: {
        label: "Mufti Wilayah — Puasa Enam Syawal",
        url: "https://www.muftiwp.gov.my/en/artikel/al-kafi-li-al-fatawi/3502-al-kafi-1298-niat-untuk-puasa-enam-syawal-jika-tiada-open-house",
      },
    },
  ),
  definition(
    "startDhulHijjah",
    12,
    1,
    "Awal Zulhijjah",
    "Start of Dhul Hijjah",
    "Permulaan bulan Zulhijjah dalam takwim Hijri.",
    "The beginning of Dhul Hijjah in the Hijri calendar.",
  ),
  definition(
    "firstNineDhulHijjah",
    12,
    1,
    "Puasa awal Zulhijjah",
    "Early Dhul Hijjah fasting",
    "Puasa sunat pada 1–9 Zulhijjah bagi yang tidak menunaikan haji; 10 Zulhijjah ialah hari raya yang dilarang berpuasa.",
    "Voluntary fasting on 1–9 Dhul Hijjah for non-pilgrims; fasting on the Eid day, 10 Dhul Hijjah, is prohibited.",
    {
      featured: false,
      untilDay: 9,
      reference: {
        label: "Sunan Abi Dawud 2437",
        url: "https://sunnah.com/abudawud:2437",
      },
    },
  ),
  definition(
    "tarwiyah",
    12,
    8,
    "Hari Tarwiyah",
    "Day of Tarwiyah",
    "Penanda perjalanan haji pada 8 Zulhijjah, bukan anjuran puasa khusus Tarwiyah. Tarikh haji sebenar mengikut pihak berkuasa Arab Saudi.",
    "A pilgrimage milestone on 8 Dhul Hijjah, not a prescription for a special Tarwiyah fast. Actual Hajj dates follow the Saudi authorities.",
    {
      reference: {
        label: "Sahih Muslim 1218a",
        url: "https://sunnah.com/muslim:1218a",
      },
    },
  ),
  definition(
    "arafah",
    12,
    9,
    "Hari Arafah (Malaysia)",
    "Day of Arafah (Malaysia)",
    "Puasa sunat 9 Zulhijjah bagi yang tidak menunaikan haji, mengikut tarikh Malaysia. Wukuf jemaah di Arafah mengikut pengisytiharan Arab Saudi.",
    "Voluntary fasting on the Malaysian 9 Dhul Hijjah for non-pilgrims. Pilgrims’ standing at Arafah follows the Saudi announcement.",
    {
      reference: {
        label: "Mufti Wilayah — Tarikh Puasa Arafah",
        url: "https://www.muftiwp.gov.my/ms/artikel/irsyad-hukum/edisi-haji-korban/5329-irsyad-al-fatwa-haji-dan-korban-siri-ke-61-polemik-masyarakat-terhadap-penentuan-hari-wukuf-di-arafah",
      },
    },
  ),
  definition(
    "eidAdha",
    12,
    10,
    "Hari Raya Aidiladha",
    "Eid al-Adha",
    "Hari Raya Korban pada 10 Zulhijjah.",
    "The Festival of Sacrifice on 10 Dhul Hijjah.",
    { category: "celebration", subjectToAnnouncement: true },
  ),
  definition(
    "muzdalifah",
    12,
    10,
    "Malam Muzdalifah (haji)",
    "Night at Muzdalifah (Hajj)",
    "Selepas Arafah pada petang 9 Zulhijjah, jemaah menuju Muzdalifah untuk malam 10 Zulhijjah. Jadual jemaah mengikut tarikh Arab Saudi.",
    "After Arafah on the evening of 9 Dhul Hijjah, pilgrims go to Muzdalifah for the night of 10 Dhul Hijjah. Pilgrims follow Saudi dates.",
    {
      featured: false,
      reference: {
        label: "Sahih Muslim 1218a",
        url: "https://sunnah.com/muslim:1218a",
      },
    },
  ),
  definition(
    "nahar",
    12,
    10,
    "Hari Nahar (haji)",
    "Day of Nahr (Hajj)",
    "Penanda 10 Zulhijjah bagi amalan haji seperti melontar Jamrah Aqabah dan korban. Aturan amalan serta tarikh jemaah mengikut bimbingan haji di Arab Saudi.",
    "The 10 Dhul Hijjah milestone for rites including stoning Jamrah Aqabah and sacrifice. Pilgrims follow their Hajj guidance and Saudi dates.",
    {
      featured: false,
      reference: {
        label: "Sahih Muslim 1218a",
        url: "https://sunnah.com/muslim:1218a",
      },
    },
  ),
  ...[11, 12, 13].map((day) =>
    definition(
      `tashriq${day}`,
      12,
      day,
      `Hari Tasyrik (${day} Zulhijjah)`,
      `Day of Tashriq (${day} Dhul Hijjah)`,
      "Hari makan, minum dan mengingati Allah; puasa umumnya dilarang. Pengecualian tertentu bagi jemaah haji perlu dirujuk kepada pembimbing haji.",
      "Days of eating, drinking and remembering Allah; fasting is generally prohibited. Pilgrims should refer specific Hajj exceptions to their guide.",
      {
        featured: false,
        reference: {
          label: "Sahih Muslim 1141a",
          url: "https://sunnah.com/muslim:1141a",
        },
      },
    ),
  ),
]);

export function getEventsForHijriYear(year) {
  validateMonth(year, 1);
  return EVENT_DEFINITIONS.map((event) => {
    const hijri = { year, month: event.month, day: event.day };
    const converted = toGregorian(hijri);
    const declared = DECLARED_DATES[`${event.id}:${year}`];
    return {
      ...event,
      hijri,
      ...converted,
      ...(event.untilMonthEnd || event.untilDay
        ? {
            endDay: event.untilDay || daysInHijriMonth(year, event.month),
            endDate: toGregorian({
              year,
              month: event.month,
              day: event.untilDay || daysInHijriMonth(year, event.month),
            }).date,
          }
        : {}),
      ...(declared
        ? { source: declared.source, subjectToAnnouncement: false }
        : {}),
    };
  }).sort((a, b) => a.date.localeCompare(b.date));
}

function fastingInfo(date, hijri, events) {
  const reason = (
    id,
    nameMs,
    nameEn,
    descriptionMs,
    descriptionEn,
    label,
    url,
  ) => ({
    id,
    name: { ms: nameMs, en: nameEn },
    description: { ms: descriptionMs, en: descriptionEn },
    reference: { label, url },
  });
  const { month, day } = hijri;
  if ((month === 10 && day === 1) || (month === 12 && day === 10)) {
    return {
      status: "prohibited",
      reasons: [
        reason(
          "eidNoFast",
          "Larangan puasa pada hari raya",
          "No fasting on Eid",
          "Puasa dilarang pada Aidilfitri dan Aidiladha.",
          "Fasting is prohibited on Eid al-Fitr and Eid al-Adha.",
          "Sahih al-Bukhari 1990",
          "https://sunnah.com/bukhari:1990",
        ),
      ],
    };
  }
  if (month === 12 && day >= 11 && day <= 13) {
    const event = events.find((event) => event.id === `tashriq${day}`);
    return { status: "prohibited", reasons: [event] };
  }
  if (month === 9) {
    return {
      status: "obligatory",
      reasons: [
        reason(
          "ramadanFast",
          "Puasa Ramadan",
          "Ramadan fasting",
          "Puasa Ramadan bagi mereka yang diwajibkan berpuasa; rukhsah terpakai mengikut keadaan.",
          "Ramadan fasting for those obliged to fast; applicable exemptions depend on individual circumstances.",
          "Al-Quran 2:183–185",
          "https://quran.com/2/183-185",
        ),
      ],
    };
  }
  const reasons = [];
  for (const id of [
    "tasua",
    "ashura",
    "arafah",
    "sixShawwal",
    "firstNineDhulHijjah",
  ]) {
    const event = events.find((event) => event.id === id);
    if (event) reasons.push(event);
  }
  const weekday = new Date(`${date}T00:00:00Z`).getUTCDay();
  if (weekday === 1 || weekday === 4) {
    reasons.push(
      reason(
        "mondayThursday",
        "Puasa Isnin / Khamis",
        "Monday / Thursday fasting",
        "Puasa sunat Isnin dan Khamis; bagi penghujung Syaaban, ikuti hukum kebiasaan puasa dan keadaan diri.",
        "Voluntary Monday and Thursday fasting; in late Shaaban, follow the rulings on habitual fasting and your circumstances.",
        "Jami’ at-Tirmidhi 747",
        "https://sunnah.com/tirmidhi:747",
      ),
    );
  }
  if (day >= 13 && day <= 15) {
    reasons.push(
      reason(
        "whiteDays",
        "Puasa hari putih",
        "White-days fasting",
        "Puasa sunat pada 13, 14 dan 15 bulan Hijri, kecuali hari yang dilarang berpuasa.",
        "Voluntary fasting on Hijri days 13, 14 and 15, excluding days when fasting is prohibited.",
        "Sunan Abi Dawud 2449",
        "https://sunnah.com/abudawud:2449",
      ),
    );
  }
  return { status: reasons.length ? "recommended" : "none", reasons };
}

function makeDay(date, hijri, events) {
  const activeEvents = events.filter(
    (event) => event.date <= date && date <= (event.endDate || event.date),
  );
  return {
    date,
    hijri,
    ...provenance(date),
    events: activeEvents,
    fasting: fastingInfo(date, hijri, activeEvents),
  };
}

/** Voluntary fasts are separate from annual occasions and never drive the hero countdown. */
export function getDayInfo(date) {
  const { year, month, day } = toHijri(date);
  const hijri = { year, month, day };
  return makeDay(date, hijri, getEventsForHijriYear(year));
}

export function getHijriMonth(year, month) {
  validateMonth(year, month);
  const events = getEventsForHijriYear(year).filter(
    (event) => event.month === month,
  );
  return Array.from({ length: daysInHijriMonth(year, month) }, (_, index) => {
    const hijri = { year, month, day: index + 1 };
    const converted = toGregorian(hijri);
    return makeDay(converted.date, hijri, events);
  });
}

function currentDate(now) {
  if (!(now instanceof Date) || !Number.isFinite(now.getTime()))
    throw invalid();
  // Intl may render years before 1000 without the four digits required by inputs.
  const [year, month, day] = dateKey(now).split("-");
  const date = `${year.padStart(4, "0")}-${month}-${day}`;
  toDayNumber(date);
  return date;
}

/** Includes today's observances for the whole Malaysian civil day. */
export function getUpcomingEvents(now = new Date(), limit = 3) {
  if (!Number.isInteger(limit) || limit < 0 || limit > 100)
    throw invalid("Invalid event limit.");
  const date = currentDate(now);
  const current = toHijri(date);
  const events = [];
  for (
    let year = current.year;
    year <= MAX_HIJRI_YEAR && events.length < limit;
    year++
  ) {
    events.push(
      ...getEventsForHijriYear(year).filter((event) => event.date >= date),
    );
  }
  return events.slice(0, limit);
}

/** Ramadan keeps Eid prominent; Nuzul al-Quran remains in upcoming events. */
export function getNextCelebration(now = new Date()) {
  const date = currentDate(now);
  const current = toHijri(date);
  if (current.month === 9)
    return getEventsForHijriYear(current.year).find(
      (event) => event.id === "eidFitr",
    );
  for (let year = current.year; year <= MAX_HIJRI_YEAR; year++) {
    const event = getEventsForHijriYear(year).find(
      (event) => event.featured && event.date >= date,
    );
    if (event) return event;
  }
  return null;
}
