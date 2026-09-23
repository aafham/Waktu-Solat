import {
  getNextCelebration,
  getUpcomingEvents,
  MONTH_NAMES,
} from "./islamic-calendar.js";
import { dateKey, TIME_ZONE } from "./prayer-data.js";

/** Calendar countdowns use Malaysia civil midnight, never an inferred sunset. */
export function countdownParts(targetDate, now = new Date()) {
  const target = Date.parse(`${targetDate}T00:00:00+08:00`);
  if (!Number.isFinite(target) || !Number.isFinite(now.getTime()))
    throw new RangeError("Invalid countdown date.");
  const seconds = Math.max(0, Math.ceil((target - now.getTime()) / 1000));
  return {
    days: Math.floor(seconds / 86400),
    hours: Math.floor((seconds % 86400) / 3600),
    minutes: Math.floor((seconds % 3600) / 60),
    seconds: seconds % 60,
    today: targetDate === dateKey(now),
  };
}

const copy = {
  ms: {
    today: "Hari ini",
    estimated: "Anggaran hisab",
    official: "Takwim terbitan JAKIM",
    declaration: "Tertakluk kepada pengisytiharan rasmi Malaysia",
    future: "Bertukar secara automatik mengikut takwim",
    unavailable: "Tarikh acara belum tersedia",
  },
  en: {
    today: "Today",
    estimated: "Calculated estimate",
    official: "Published JAKIM calendar",
    declaration: "Subject to Malaysia’s official declaration",
    future: "Updates automatically with the calendar",
    unavailable: "Event date is unavailable",
  },
};

export function createEventCountdown({ getLanguage = () => "ms" } = {}) {
  const element = (id) => document.getElementById(id);
  let metadataKey = "",
    selected = null;
  function tick(now = new Date(), force = false) {
    const language = getLanguage() === "en" ? "en" : "ms";
    const text = copy[language];
    const key = `${dateKey(now)}|${language}`;
    if (force || metadataKey !== key) {
      metadataKey = key;
      selected = getNextCelebration(now);
      if (!selected) {
        element("eventCountdownName").textContent = "—";
        element("eventCountdownStatus").textContent = text.unavailable;
        element("eventCountdownLink").disabled = true;
        return;
      }
      element("eventCountdownLink").disabled = false;
      element("eventCountdownName").textContent = selected.name[language];
      const format = (date, options) =>
        new Intl.DateTimeFormat(language === "ms" ? "ms-MY" : "en-GB", {
          timeZone: TIME_ZONE,
          ...options,
        }).format(new Date(`${date}T12:00:00+08:00`));
      const hijri = selected.hijri;
      element("eventCountdownDate").textContent =
        `${hijri.day} ${MONTH_NAMES[language][hijri.month - 1]} ${hijri.year} H · ${format(selected.date, { day: "numeric", month: "long", year: "numeric" })}`;
      const status = [
        selected.date === dateKey(now) ? text.today : text.future,
        selected.estimated ? text.estimated : text.official,
      ];
      if (selected.subjectToAnnouncement) status.push(text.declaration);
      element("eventCountdownStatus").textContent = status.join(" · ");
      element("eventCountdownStatus").dataset.estimated = String(
        selected.estimated,
      );
      element("eventCountdownUpcoming").replaceChildren(
        ...getUpcomingEvents(now, 4)
          .filter(
            (event) => event.id !== selected.id || event.date !== selected.date,
          )
          .slice(0, 3)
          .map((event) => {
            const item = document.createElement("li");
            const title = document.createElement("strong");
            title.textContent = event.name[language];
            const date = document.createElement("span");
            date.textContent = `${format(event.date, { day: "numeric", month: "short" })}${event.estimated ? " *" : ""}`;
            item.append(title, date);
            return item;
          }),
      );
    }
    if (!selected) return;
    const parts = countdownParts(selected.date, now);
    for (const name of ["days", "hours", "minutes", "seconds"]) {
      const id = `eventCountdown${name[0].toUpperCase()}${name.slice(1)}`;
      const value = String(parts[name]).padStart(2, "0");
      if (element(id).textContent !== value) element(id).textContent = value;
    }
  }
  return { tick, targetDate: () => selected?.date || null };
}
