import test from "node:test";
import assert from "node:assert/strict";
import {
  MIN_GREGORIAN,
  MAX_GREGORIAN,
  MIN_HIJRI_YEAR,
  MAX_HIJRI_YEAR,
  MONTH_NAMES,
  toHijri,
  toGregorian,
  daysInHijriMonth,
  getHijriMonth,
  getDayInfo,
  getEventsForHijriYear,
  getUpcomingEvents,
  getNextCelebration,
} from "../islamic-calendar.js";
import { OFFICIAL_MONTH_STARTS } from "../islamic-calendar-data.js";

const tuple = ({ year, month, day }) => ({ year, month, day });
const at = (date, time = "12:00:00") => new Date(`${date}T${time}+08:00`);

test("all 25 published JAKIM month anchors agree in both conversion directions", () => {
  assert.equal(OFFICIAL_MONTH_STARTS.length, 25);
  for (const [year, month, date] of OFFICIAL_MONTH_STARTS) {
    assert.deepEqual(tuple(toHijri(date)), { year, month, day: 1 }, date);
    assert.equal(toGregorian({ year, month, day: 1 }).date, date);
    assert.equal(toHijri(date).estimated, false);
  }
});

test("published Malaysian dates override tabular dates and retain the matching source year", () => {
  assert.deepEqual(tuple(toHijri("2026-09-23")), {
    year: 1448,
    month: 4,
    day: 11,
  });
  assert.deepEqual(tuple(toHijri("2026-02-19")), {
    year: 1447,
    month: 9,
    day: 1,
  });
  assert.equal(
    toGregorian({ year: 1446, month: 10, day: 1 }).date,
    "2025-03-31",
  );
  assert.match(toHijri("2025-12-31").source.url, /2025/);
  assert.match(toHijri("2026-01-01").source.url, /2026/);
  assert.equal(toHijri("2026-12-31").source.type, "official");
  assert.equal(toHijri("2027-01-01").source.type, "estimated");
  assert.equal(toHijri("2024-12-31").estimated, true);
});

test("every official day and neighboring fallback days round-trip without duplication or omission", () => {
  const start = Date.parse("2024-11-01T00:00:00Z");
  const end = Date.parse("2027-02-28T00:00:00Z");
  const seen = new Set();
  for (let instant = start; instant <= end; instant += 86400000) {
    const date = new Date(instant).toISOString().slice(0, 10);
    const hijri = toHijri(date);
    const id = `${hijri.year}-${hijri.month}-${hijri.day}`;
    assert.equal(seen.has(id), false, id);
    seen.add(id);
    assert.equal(toGregorian(hijri).date, date);
  }
});

test("all supported civil and Islamic epoch boundaries are reversible", () => {
  assert.deepEqual(tuple(toHijri(MIN_GREGORIAN)), {
    year: MIN_HIJRI_YEAR,
    month: 1,
    day: 1,
  });
  assert.equal(
    toGregorian({
      year: MAX_HIJRI_YEAR,
      month: 12,
      day: daysInHijriMonth(MAX_HIJRI_YEAR, 12),
    }).date,
    MAX_GREGORIAN,
  );
  assert.equal(toGregorian(toHijri(MAX_GREGORIAN)).date, MAX_GREGORIAN);
  assert.equal(toHijri(MIN_GREGORIAN).estimated, true);
  assert.equal(getNextCelebration(at(MIN_GREGORIAN)).date, MIN_GREGORIAN);
});

test("birthdays, Gregorian leap days and distant future dates convert offline deterministically", () => {
  for (const date of [
    "1900-03-01",
    "1957-08-31",
    "1986-07-09",
    "2000-02-29",
    "2024-02-29",
    "2032-02-29",
    "2400-02-29",
    "9999-01-01",
  ]) {
    assert.equal(toGregorian(toHijri(date)).date, date);
    assert.equal(toHijri(date).estimated, true);
  }
  // Civil/tabular date, deliberately distinct from a country-specific sighting calendar.
  assert.equal(
    toGregorian({ year: 1445, month: 9, day: 1 }).date,
    "2024-03-11",
  );
});

test("all navigable month lengths are 29 or 30 and each final day reverses", () => {
  for (const year of [
    1, 2, 29, 30, 31, 1400, 1445, 1446, 1447, 1448, 1449, 1500, 9665,
  ]) {
    for (let month = 1; month <= 12; month++) {
      const length = daysInHijriMonth(year, month);
      assert.ok([29, 30].includes(length), `${year}-${month}: ${length}`);
      assert.deepEqual(
        tuple(toHijri(toGregorian({ year, month, day: length }).date)),
        { year, month, day: length },
      );
    }
  }
  assert.equal(daysInHijriMonth(1, 12), 29);
  assert.equal(daysInHijriMonth(2, 12), 30);
});

test("invalid, impossible and out-of-range dates are rejected without silent normalization", () => {
  for (const date of [
    "2026-02-29",
    "1900-02-29",
    "2026-04-31",
    "2026-00-01",
    "2026-13-01",
    "2026-1-1",
    "2026-01-00",
    "0622-07-18",
    "9999-10-02",
    "",
    null,
  ]) {
    assert.throws(() => toHijri(date), { code: "INVALID_DATE" });
  }
  for (const value of [
    null,
    {},
    { year: 1447, month: 0, day: 1 },
    { year: 1447, month: 13, day: 1 },
    { year: 1447, month: 10, day: 30 },
    { year: 1447, month: 9, day: 31 },
    { year: 1447, month: 9, day: 0 },
    { year: 0, month: 1, day: 1 },
    { year: 9666, month: 1, day: 1 },
    { year: "1447", month: 9, day: 1 },
  ]) {
    assert.throws(() => toGregorian(value), { code: "INVALID_DATE" });
  }
});

test("full month grids expose every civil day and attach correct observances", () => {
  const ramadan = getHijriMonth(1447, 9);
  assert.equal(ramadan.length, 30);
  assert.equal(ramadan[0].date, "2026-02-19");
  assert.equal(ramadan.at(-1).date, "2026-03-20");
  assert.ok(ramadan[16].events.some((event) => event.id === "nuzulQuran"));
  assert.equal(ramadan[16].date, "2026-03-07");
  assert.ok(ramadan.every((day) => !day.estimated && day.hijri.month === 9));
  assert.equal(MONTH_NAMES.ms.length, 12);
  assert.equal(MONTH_NAMES.en.length, 12);
});

test("important events agree with the JAKIM 2026 table and the actual Eid proclamation", () => {
  const events = [
    ...getEventsForHijriYear(1447),
    ...getEventsForHijriYear(1448),
  ];
  const expected = {
    israMiraj: "2026-01-17",
    startRamadan: "2026-02-19",
    nuzulQuran: "2026-03-07",
    eidFitr: "2026-03-21",
    startDhulHijjah: "2026-05-18",
    eidAdha: "2026-05-27",
    islamicNewYear: "2026-06-17",
    mawlid: "2026-08-25",
  };
  for (const [id, date] of Object.entries(expected)) {
    const event = events.find(
      (event) => event.id === id && event.date === date,
    );
    assert.ok(event, `${id}: ${date}`);
    assert.equal(event.estimated, false);
    assert.ok(
      event.name.ms &&
        event.name.en &&
        event.description.ms &&
        event.description.en,
    );
  }
  const eid = events.find(
    (event) => event.id === "eidFitr" && event.hijri.year === 1447,
  );
  assert.equal(eid.subjectToAnnouncement, false);
  assert.match(eid.source.url, /dmedia\.penerangan\.gov\.my/);
  assert.equal(
    events.find(
      (event) => event.id === "startRamadan" && event.hijri.year === 1447,
    ).subjectToAnnouncement,
    true,
  );
});

test("Ramadan prioritizes Eid while retaining Nuzul in the upcoming event list", () => {
  const now = at("2026-02-25");
  assert.equal(getNextCelebration(now).id, "eidFitr");
  assert.equal(getNextCelebration(now).date, "2026-03-21");
  assert.ok(
    getUpcomingEvents(now, 5).some((event) => event.id === "nuzulQuran"),
  );
});

test("event today lasts until Malaysian midnight and then moves to the next occasion", () => {
  assert.equal(getNextCelebration(at("2026-03-21", "23:59:59")).id, "eidFitr");
  assert.notEqual(
    getNextCelebration(at("2026-03-22", "00:00:00")).id,
    "eidFitr",
  );
  assert.equal(
    getNextCelebration(new Date("2026-06-16T16:00:00Z")).id,
    "islamicNewYear",
  );
  assert.equal(
    getNextCelebration(new Date("2026-06-16T16:00:00Z")).date,
    "2026-06-17",
  );
});

test("upcoming events cross Hijri and Gregorian years and never mark unverified 2027 dates official", () => {
  const events = getUpcomingEvents(at("2026-12-31"), 15);
  assert.equal(events.length, 15);
  assert.ok(events.every((event) => event.date >= "2026-12-31"));
  assert.ok(events.every((event) => event.estimated));
  assert.ok(
    events.every(
      (event, index) => !index || event.date >= events[index - 1].date,
    ),
  );
  assert.deepEqual(getUpcomingEvents(at("2026-12-31"), 0), []);
  assert.equal(getNextCelebration(at(MAX_GREGORIAN)), null);
  assert.throws(() => getUpcomingEvents(new Date("invalid")), {
    code: "INVALID_DATE",
  });
  assert.throws(() => getUpcomingEvents(at("2026-01-01"), -1), {
    code: "INVALID_DATE",
  });
});

test("Eids and every Tashriq day override white days and Monday/Thursday fasting", () => {
  for (let year = 1445; year <= 1455; year++) {
    for (const [month, day] of [
      [10, 1],
      [12, 10],
      [12, 11],
      [12, 12],
      [12, 13],
    ]) {
      const info = getDayInfo(toGregorian({ year, month, day }).date);
      assert.equal(info.fasting.status, "prohibited");
      assert.equal(info.fasting.reasons.length, 1);
      assert.ok(
        info.fasting.reasons.every(
          (reason) =>
            !["whiteDays", "mondayThursday", "sixShawwal"].includes(reason.id),
        ),
      );
    }
  }
  const zulhijjah = getHijriMonth(1447, 12);
  assert.equal(zulhijjah[12].fasting.status, "prohibited");
  assert.ok(
    zulhijjah[13].fasting.reasons.some((reason) => reason.id === "whiteDays"),
  );
});

test("Ramadan fasts are obligatory rather than relabelled as optional weekly or white-day fasts", () => {
  for (const day of getHijriMonth(1447, 9)) {
    assert.equal(day.fasting.status, "obligatory");
    assert.deepEqual(
      day.fasting.reasons.map((reason) => reason.id),
      ["ramadanFast"],
    );
  }
});

test("six Shawwal fasting is a selectable window after Eid rather than six invented fixed dates", () => {
  const month = getHijriMonth(1447, 10);
  assert.equal(month[0].fasting.status, "prohibited");
  for (const day of month.slice(1)) {
    assert.ok(day.events.some((event) => event.id === "sixShawwal"));
    assert.ok(day.fasting.reasons.some((event) => event.id === "sixShawwal"));
  }
  const event = month[1].events.find((event) => event.id === "sixShawwal");
  assert.equal(event.date, "2026-03-22");
  assert.equal(event.endDate, month.at(-1).date);
  assert.match(event.description.en, /any six days/);
});

test("last-ten-night guidance spans the remaining Ramadan days without inventing a fixed Qadr date", () => {
  const month = getHijriMonth(1447, 9);
  assert.ok(!month[19].events.some((event) => event.id === "lastTenRamadan"));
  assert.ok(
    month
      .slice(20)
      .every((day) =>
        day.events.some((event) => event.id === "lastTenRamadan"),
      ),
  );
  const event = month[20].events.find((event) => event.id === "lastTenRamadan");
  assert.match(event.description.en, /Night 21 begins after sunset on day 20/);
  assert.match(event.description.en, /no single date/);
  assert.ok(
    !getEventsForHijriYear(1447).some((event) =>
      /^laylat.*qadr$/i.test(event.id),
    ),
  );
});

test("Arafah uses the Malaysian date for non-pilgrims and Hajj milestones preserve the Saudi-date distinction", () => {
  const events = getEventsForHijriYear(1447);
  const arafah = events.find((event) => event.id === "arafah");
  assert.equal(arafah.date, "2026-05-26");
  assert.match(arafah.description.en, /non-pilgrims/);
  assert.match(arafah.description.en, /Saudi announcement/);
  assert.ok(
    getDayInfo(arafah.date).fasting.reasons.some(
      (reason) => reason.id === "arafah",
    ),
  );
  assert.equal(events.find((event) => event.id === "tarwiyah").hijri.day, 8);
  assert.match(
    events.find((event) => event.id === "tarwiyah").description.en,
    /not a prescription for a special/,
  );
  for (const id of ["muzdalifah", "nahar"]) {
    const event = events.find((event) => event.id === id);
    assert.equal(event.hijri.day, 10);
    assert.match(event.description.en, /Saudi dates/);
  }
  assert.ok(
    getDayInfo(
      toGregorian({ year: 1447, month: 12, day: 8 }).date,
    ).fasting.reasons.some((reason) => reason.id === "firstNineDhulHijjah"),
  );
});

test("Nisfu is an observance without a unique prescribed fast, while white days retain their own evidence", () => {
  const info = getDayInfo(toGregorian({ year: 1447, month: 8, day: 15 }).date);
  assert.ok(info.events.some((event) => event.id === "nisfuShaaban"));
  assert.ok(!info.fasting.reasons.some((event) => event.id === "nisfuShaaban"));
  assert.ok(info.fasting.reasons.some((event) => event.id === "whiteDays"));
  for (const reason of info.fasting.reasons)
    assert.match(reason.reference.url, /^https:\/\//);
});

test("weekly optional fasts and secondary rites never displace the next major celebration", () => {
  // Monday with no annual observance: fasting planner marks it, hero does not.
  const info = getDayInfo("2026-09-28");
  assert.ok(
    info.fasting.reasons.some((reason) => reason.id === "mondayThursday"),
  );
  assert.ok(
    !getEventsForHijriYear(1448).some((event) => event.id === "mondayThursday"),
  );
  const next = getNextCelebration(at("2026-05-28"));
  assert.equal(next.id, "islamicNewYear");
  assert.equal(next.featured, true);
  assert.ok(
    getUpcomingEvents(at("2026-05-28"), 5).some(
      (event) => event.id === "tashriq11",
    ),
  );
  assert.equal(getNextCelebration(at("2026-06-18")).id, "tasua");
  assert.equal(getNextCelebration(at("2026-06-26")).id, "ashura");
  assert.equal(getNextCelebration(at("2026-05-19")).id, "tarwiyah");
  assert.equal(getNextCelebration(at("2026-05-26")).id, "arafah");
});
