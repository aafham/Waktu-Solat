import * as calendar from "./islamic-calendar.js";
import {
  MUHAMMAD_REFERENCE,
  FASTING_REFERENCES,
  HAJJ_REFERENCES,
} from "./islamic-references.js";

const escape = (value) =>
  String(value ?? "").replace(
    /[&<>"']/g,
    (character) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        character
      ],
  );
const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const civilDate = (date = new Date()) => {
  const parts = Object.fromEntries(
    new Intl.DateTimeFormat("en-CA", {
      timeZone: "Asia/Kuala_Lumpur",
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    })
      .formatToParts(date)
      .map(({ type, value }) => [type, value]),
  );
  return `${parts.year}-${parts.month}-${parts.day}`;
};
const utcDate = (date) => new Date(`${date}T12:00:00Z`);
const shiftDate = (date, amount) => {
  const value = utcDate(date);
  value.setUTCDate(value.getUTCDate() + amount);
  return value.toISOString().slice(0, 10);
};

const messages = {
  ms: {
    heading: "Kalendar Hijrah",
    eyebrow: "KALENDAR ISLAM",
    intro: "Tarikh, hari penting dan panduan amalan dalam satu tempat.",
    previous: "Bulan Hijrah sebelumnya",
    next: "Bulan Hijrah seterusnya",
    today: "Hari ini",
    month: "Bulan Hijrah",
    year: "Tahun Hijrah",
    go: "Pergi",
    weekdays: ["Isn", "Sel", "Rab", "Kha", "Jum", "Sab", "Ahd"],
    weekdayNames: [
      "Isnin",
      "Selasa",
      "Rabu",
      "Khamis",
      "Jumaat",
      "Sabtu",
      "Ahad",
    ],
    estimate: "Anggaran",
    official: "Rujukan rasmi",
    mixedMonth: "Bulan ini mengandungi tarikh anggaran.",
    officialMonth: "Tarikh bulan ini berpandukan takwim rasmi yang tersedia.",
    estimateNote:
      "Tarikh di luar liputan takwim rasmi dikira dengan kalendar Hijrah sivil dan ditandakan “Anggaran”. Ia boleh berbeza daripada takwim tempatan.",
    selected: "TARIKH PILIHAN",
    noEvent: "Tiada peringatan tersenarai pada tarikh ini.",
    inMonth: "Dalam bulan ini",
    noMonthEvent: "Tiada peringatan tersenarai untuk bulan ini.",
    event: "Peringatan",
    celebration: "Perayaan",
    announcement: "Tertakluk kepada pengumuman rasmi",
    source: "Sumber tarikh",
    details: "Butiran tarikh",
    todayLegend: "Hari ini",
    eventLegend: "Hari dengan peringatan",
    keyboard: "Gunakan kekunci anak panah untuk memilih tarikh.",
    annual: "Hari penting sepanjang tahun",
    annualIntro:
      "Perayaan dan hari penting bagi tahun Hijrah yang sedang dipaparkan.",
    showAnnual: "Lihat senarai setahun",
    hideAnnual: "Senarai setahun",
    annualFilter: "Jenis peringatan",
    allEvents: "Semua peringatan",
    celebrations: "Perayaan",
    observances: "Hari dan amalan Islam",
    emptyFilter: "Tiada peringatan sepadan.",
    scope:
      "Senarai ini merangkumi perayaan dan peringatan yang lazim dirujuk di Malaysia. Ia bukan senarai setiap tradisi Islam atau pengesahan cuti umum.",
    converterEyebrow: "TARIKH YANG BERMAKNA",
    converterTitle: "Penukar tarikh",
    converterIntro: "Semak hari lahir, pernikahan atau tarikh pilihan anda.",
    gregorianToHijri: "Masihi → Hijrah",
    hijriToGregorian: "Hijrah → Masihi",
    gregorianDate: "Tarikh Masihi",
    hijriDate: "Tarikh Hijrah",
    day: "Hari",
    convertHijri: "Tukar tarikh",
    convertGregorian: "Tukar tarikh",
    viewDate: "Lihat dalam kalendar",
    invalidGregorian:
      "Masukkan tarikh Masihi yang sah dalam julat yang disokong.",
    invalidHijri:
      "Tarikh Hijrah tidak sah. Semak tahun dan jumlah hari dalam bulan tersebut; sesetengah bulan mempunyai 29 hari.",
    missingGregorian: "Pilih tarikh Masihi terlebih dahulu.",
    range: "Julat penukaran",
    boundaryTitle: "Tentang tarikh waktu malam",
    boundary:
      "Penukaran ini menggunakan hari kalendar yang bermula pada 00:00. Dalam amalan Islam, malam bermula selepas Maghrib. Untuk peristiwa selepas Maghrib, semak juga hari Hijrah berikutnya.",
    jumpError: "Pilih bulan dan tahun Hijrah dalam julat yang disokong.",
    noCalendar: "Tarikh ini di luar julat kalendar yang disokong.",
    jumpCalendar: "Kalendar",
    jumpConverter: "Penukar tarikh",
    jumpFasting: "Puasa & haji",
    jumpMuhammad: "Nabi Muhammad ﷺ",
    sections: "Bahagian kalendar Islam",
    fastingTitle: "Puasa pada tarikh ini",
    obligatory: "Puasa Ramadan",
    prohibited: "Hari larangan berpuasa",
    recommended: "Puasa sunat / peluang amalan",
    fastingNone: "Tiada penandaan puasa khusus",
    fastingLegend: "Puasa sunat",
    prohibitedLegend: "Larangan puasa",
    guideEyebrow: "AMALAN DENGAN RUJUKAN",
    guideTitle: "Puasa & haji",
    guideIntro: "Panduan ringkas dengan dalil dan rujukan.",
    fastingGuides: "Panduan puasa",
    hajjGuides: "Hari-hari haji",
    evidence: "Dalil & rujukan",
    muhammadEyebrow: "SIRAH & DALIL",
    muhammadTitle: "Nabi Muhammad ﷺ",
    muhammadIntro: "Kelahiran Baginda dan peringatan Maulidur Rasul.",
    prophetBirth: "Maklumat kelahiran",
    quranReference: "Rujukan al-Quran",
    readEvidence: "Baca dalil & rujukan",
    accuracyTitle: "Tentang ketepatan tarikh",
    conversionNotes: "Ketepatan tarikh & waktu selepas Maghrib",
    directionLabel: "Arah penukaran tarikh",
    useToday: "Guna hari ini",
    enterDate: "Pilih tarikh anda",
    resultHint: "Hasil penukaran akan muncul di sini.",
    resultHelp: "Pilih tarikh, kemudian tekan Tukar tarikh.",
    resultLabel: "HASIL PENUKARAN",
    window: "Tempoh amalan",
  },
  en: {
    heading: "Hijri calendar",
    eyebrow: "ISLAMIC CALENDAR",
    intro: "Dates, important days and a guide to Islamic practices.",
    previous: "Previous Hijri month",
    next: "Next Hijri month",
    today: "Today",
    month: "Hijri month",
    year: "Hijri year",
    go: "Go",
    weekdays: ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"],
    weekdayNames: [
      "Monday",
      "Tuesday",
      "Wednesday",
      "Thursday",
      "Friday",
      "Saturday",
      "Sunday",
    ],
    estimate: "Estimated",
    official: "Official reference",
    mixedMonth: "This month includes estimated dates.",
    officialMonth:
      "Dates in this month follow the available official calendar.",
    estimateNote:
      "Dates outside the official calendar coverage use the civil Hijri calendar and are marked “Estimated”. They may differ from local calendars.",
    selected: "SELECTED DATE",
    noEvent: "No observance from this list falls on the selected date.",
    inMonth: "This month",
    noMonthEvent: "No observances are listed for this month.",
    event: "Observance",
    celebration: "Celebration",
    announcement: "Subject to official announcement",
    source: "Date source",
    details: "Date details",
    todayLegend: "Today",
    eventLegend: "Day with an observance",
    keyboard: "Use the arrow keys to choose a date.",
    annual: "Important days this year",
    annualIntro:
      "Celebrations and important days in the Hijri year currently displayed.",
    showAnnual: "Explore the full year",
    hideAnnual: "The full year",
    annualFilter: "Observance type",
    allEvents: "All observances",
    celebrations: "Celebrations",
    observances: "Islamic days and practices",
    emptyFilter: "No matching observances.",
    scope:
      "This list covers celebrations and observances commonly referenced in Malaysia. It is not a list of every Islamic tradition or confirmation of public holidays.",
    converterEyebrow: "DATES THAT MATTER",
    converterTitle: "Date converter",
    converterIntro:
      "Look up a birthday, wedding or any date that matters to you.",
    gregorianToHijri: "Gregorian → Hijri",
    hijriToGregorian: "Hijri → Gregorian",
    gregorianDate: "Gregorian date",
    hijriDate: "Hijri date",
    day: "Day",
    convertHijri: "Convert date",
    convertGregorian: "Convert date",
    viewDate: "Show in calendar",
    invalidGregorian:
      "Enter a valid Gregorian date within the supported range.",
    invalidHijri:
      "This Hijri date is invalid. Check the year and the number of days in the month; some months have 29 days.",
    missingGregorian: "Choose a Gregorian date first.",
    range: "Conversion range",
    boundaryTitle: "About dates after sunset",
    boundary:
      "This conversion uses calendar days beginning at 00:00. In Islamic practice, the night begins after Maghrib. For events after Maghrib, also check the following Hijri day.",
    jumpError: "Choose a Hijri month and year within the supported range.",
    noCalendar: "This date is outside the supported calendar range.",
    jumpCalendar: "Calendar",
    jumpConverter: "Date converter",
    jumpFasting: "Fasting & Hajj",
    jumpMuhammad: "Prophet Muhammad ﷺ",
    sections: "Islamic calendar sections",
    fastingTitle: "Fasting on this date",
    obligatory: "Ramadan fasting",
    prohibited: "Day when fasting is prohibited",
    recommended: "Recommended fasting / opportunity",
    fastingNone: "No specific fasting marker",
    fastingLegend: "Recommended fast",
    prohibitedLegend: "Fasting prohibited",
    guideEyebrow: "PRACTICES WITH SOURCES",
    guideTitle: "Fasting & Hajj",
    guideIntro: "A concise guide with evidence and references.",
    fastingGuides: "Fasting guide",
    hajjGuides: "Days of Hajj",
    evidence: "Evidence & sources",
    muhammadEyebrow: "LIFE & SOURCES",
    muhammadTitle: "Prophet Muhammad ﷺ",
    muhammadIntro: "His birth and the observance of Mawlid.",
    prophetBirth: "Birth information",
    quranReference: "Quran references",
    readEvidence: "Read evidence & sources",
    accuracyTitle: "About date accuracy",
    conversionNotes: "Date accuracy & times after Maghrib",
    directionLabel: "Date conversion direction",
    useToday: "Use today",
    enterDate: "Choose your date",
    resultHint: "Your converted date will appear here.",
    resultHelp: "Choose a date, then select Convert date.",
    resultLabel: "CONVERTED DATE",
    window: "Period of practice",
  },
};

/** A local-only calendar UI. Personal dates are never saved or sent to a server. */
export function createCalendarView({ getLanguage = () => "ms" } = {}) {
  const host = document.getElementById("calendarContent");
  if (!host)
    return {
      render() {},
      tick() {},
      showDate() {
        return false;
      },
      destroy() {},
    };
  const minimum = calendar.MIN_GREGORIAN || "0622-07-19";
  const maximum = calendar.MAX_GREGORIAN || "9999-10-01";
  const minimumYear = calendar.MIN_HIJRI_YEAR || 1;
  const maximumYear = calendar.MAX_HIJRI_YEAR || 9665;
  const lang = () => (getLanguage() === "en" ? "en" : "ms");
  const t = (key) => messages[lang()][key];
  const monthName = (month) => calendar.MONTH_NAMES[lang()][month - 1];
  const formatHijri = ({ year, month, day }) =>
    `${day} ${monthName(month)} ${year} H`;
  const formatGregorian = (
    date,
    options = { day: "numeric", month: "long", year: "numeric" },
  ) =>
    new Intl.DateTimeFormat(lang() === "ms" ? "ms-MY" : "en-GB", {
      timeZone: "UTC",
      ...options,
    }).format(utcDate(date));
  const today = civilDate();
  const initialDate =
    today < minimum ? minimum : today > maximum ? maximum : today;
  const initial = calendar.toHijri(initialDate);
  const state = {
    today,
    date: initialDate,
    year: initial.year,
    month: initial.month,
    monthDays: [],
    annualOpen: false,
    filter: "all",
    jumpError: "",
    direction: "gregorian",
    conversionNotesOpen: false,
    accuracyOpen: false,
    openReferences: [],
    inputs: {
      gregorianInput: initialDate,
      hijriInputDay: String(initial.day),
      hijriInputMonth: String(initial.month),
      hijriInputYear: String(initial.year),
    },
    fromGregorian: { ...initial, date: initialDate },
    fromHijri: {
      ...calendar.toGregorian(initial),
      hijri: { year: initial.year, month: initial.month, day: initial.day },
    },
    gregorianError: "",
    hijriError: "",
  };
  const $ = (id) => host.querySelector(`#${id}`);
  const eventName = (event) => event.name?.[lang()] || event.id;
  const badge = (record) =>
    `<span class="ic-badge ${record?.estimated === false ? "ic-official" : "ic-estimated"}">${t(record?.estimated === false ? "official" : "estimate")}</span>`;
  const sourceLink = (record) => {
    const source = record?.source;
    return source?.url && /^https?:\/\//.test(source.url)
      ? `<a href="${escape(source.url)}" target="_blank" rel="noopener">${escape(source.label || t("source"))}${icon("arrow")}</a>`
      : `<span>${escape(source?.label || t("estimate"))}</span>`;
  };
  const sourceLine = (record) =>
    `<div class="ic-provenance">${badge(record)}${sourceLink(record)}</div>`;
  const monthOptions = (selected) =>
    calendar.MONTH_NAMES[lang()]
      .map(
        (name, index) =>
          `<option value="${index + 1}"${Number(selected) === index + 1 ? " selected" : ""}>${escape(name)}</option>`,
      )
      .join("");
  const referenceLinks = (sources = []) =>
    `<div class="ic-reference-links">${sources
      .filter((source) => /^https?:\/\//.test(source?.url))
      .map(
        (source) =>
          `<a href="${escape(source.url)}" target="_blank" rel="noopener">${escape(source.label)}${icon("arrow")}</a>`,
      )
      .join("")}</div>`;

  function eventDetails(event) {
    return `<article class="ic-event-detail"><span class="ic-event-category">${t(event.category === "celebration" ? "celebration" : event.category === "window" ? "window" : "event")}</span><h4>${escape(eventName(event))}</h4>${event.description?.[lang()] ? `<p>${escape(event.description[lang()])}</p>` : ""}${event.endDate ? `<p class="ic-event-window">${escape(formatGregorian(event.date))} – ${escape(formatGregorian(event.endDate))}</p>` : ""}${event.subjectToAnnouncement ? `<p class="ic-announcement">${t("announcement")}</p>` : ""}${event.reference ? referenceLinks([event.reference]) : ""}${sourceLine(event)}</article>`;
  }

  function eventButton(event, annual = false) {
    return `<button type="button" class="ic-event-link" data-calendar-date="${escape(event.date)}"><span class="ic-event-number">${event.hijri.day}<small>${escape(monthName(event.hijri.month))}</small></span><span><strong>${escape(eventName(event))}</strong><small>${escape(formatGregorian(event.date))}${event.endDate ? " – " + escape(formatGregorian(event.endDate)) : ""}</small>${annual ? badge(event) : ""}</span>${icon("chevron")}</button>`;
  }

  function renderGrid() {
    const offset = (utcDate(state.monthDays[0].date).getUTCDay() + 6) % 7;
    const cells = Array(offset).fill(null).concat(state.monthDays);
    while (cells.length % 7) cells.push(null);
    const weeks = Array.from({ length: cells.length / 7 }, (_, index) =>
      cells.slice(index * 7, index * 7 + 7),
    );
    return `<table class="ic-grid" id="hijriGrid" role="grid" aria-labelledby="hijriMonthTitle" aria-describedby="hijriGridHelp"><thead><tr>${t(
      "weekdays",
    )
      .map(
        (day, index) =>
          `<th scope="col" aria-label="${t("weekdayNames")[index]}">${day}</th>`,
      )
      .join("")}</tr></thead><tbody>${weeks
      .map(
        (week) =>
          `<tr>${week
            .map((day) => {
              if (!day) return '<td class="ic-empty"></td>';
              const selected = day.date === state.date;
              const isToday = day.date === state.today;
              const events = day.events || [];
              const fasting = day.fasting?.status || "none";
              const label = `${formatHijri(day.hijri)} · ${formatGregorian(day.date)}${events.length ? " · " + events.map(eventName).join(", ") : ""}${fasting !== "none" ? " · " + t(fasting) : ""}${day.estimated ? " · " + t("estimate") : ""}`;
              return `<td${selected ? ' aria-selected="true"' : ""}><button type="button" class="ic-day${isToday ? " ic-is-today" : ""}${selected ? " ic-selected" : ""}" data-date="${day.date}" data-fasting="${fasting}" tabindex="${selected ? "0" : "-1"}" aria-label="${escape(label)}" aria-pressed="${selected}"${isToday ? ' aria-current="date"' : ""}><span class="ic-hijri-number">${day.hijri.day}</span><span class="ic-gregorian-number">${escape(formatGregorian(day.date, { day: "numeric", month: "short" }))}</span><span class="ic-day-markers" aria-hidden="true"><span class="ic-event-dot${events.length ? " ic-has-event" : ""}"></span>${["recommended", "prohibited", "obligatory"].includes(fasting) ? `<span class="ic-fasting-dot ic-fasting-${fasting}"></span>` : ""}</span></button></td>`;
            })
            .join("")}</tr>`,
      )
      .join("")}</tbody></table>`;
  }

  function conversionOutput(result, direction) {
    if (!result) return "";
    const isHijri = direction === "hijri";
    const day = isHijri ? result.day : utcDate(result.date).getUTCDate();
    const month = isHijri
      ? monthName(result.month)
      : formatGregorian(result.date, { month: "long" });
    const year = isHijri
      ? `${result.year} H`
      : formatGregorian(result.date, { year: "numeric" });
    const secondary = isHijri
      ? formatGregorian(result.date, {
          weekday: "long",
          day: "numeric",
          month: "long",
          year: "numeric",
        })
      : formatHijri(result.hijri);
    return `<div class="ic-result-top"><p class="ic-result-caption">${t(isHijri ? "hijriDate" : "gregorianDate")}</p>${badge(result)}</div>
      <div class="ic-result-date"><span>${day}</span><strong>${escape(month)}<small>${escape(year)}</small></strong></div>
      <p class="ic-result-equivalent">${escape(secondary)}</p>
      <div class="ic-result-source">${sourceLink(result)}</div>
      <button type="button" class="ic-result-action" data-calendar-date="${escape(result.date)}">${t("viewDate")}${icon("arrow")}</button>`;
  }

  function resultArea(result, direction) {
    const id =
      direction === "hijri" ? "hijriConvertResult" : "gregorianConvertResult";
    return `<div class="ic-result-area"><div id="${id}" class="ic-conversion-result" role="status" aria-live="polite"${result ? "" : " hidden"}>${conversionOutput(result, direction)}</div>
      <div id="${id}Placeholder" class="ic-result-placeholder"${result ? " hidden" : ""}>${icon("calendar")}<strong>${t("resultHint")}</strong><p>${t("resultHelp")}</p></div></div>`;
  }

  function renderConverters() {
    const isGregorian = state.direction === "gregorian";
    return `<section class="ic-converter" aria-labelledby="islamicConverterTitle">
      <div class="ic-section-heading"><div><p class="ic-eyebrow">${t("converterEyebrow")}</p><h2 id="islamicConverterTitle">${t("converterTitle")}</h2><p>${t("converterIntro")}</p></div><span class="ic-section-icon" aria-hidden="true">${icon("calendar")}</span></div>
      <div class="ic-converter-tabs" role="tablist" aria-label="${t("directionLabel")}">
        <button type="button" role="tab" id="gregorianDirectionTab" data-convert-direction="gregorian" aria-controls="gregorianConvertPanel" aria-selected="${isGregorian}" tabindex="${isGregorian ? 0 : -1}">${t("gregorianToHijri")}</button>
        <button type="button" role="tab" id="hijriDirectionTab" data-convert-direction="hijri" aria-controls="hijriConvertPanel" aria-selected="${!isGregorian}" tabindex="${isGregorian ? -1 : 0}">${t("hijriToGregorian")}</button>
      </div>
      <div id="gregorianConvertPanel" class="ic-converter-panel" role="tabpanel" aria-labelledby="gregorianDirectionTab"${isGregorian ? "" : " hidden"}>
        <form id="gregorianConvertForm" class="ic-convert-form" novalidate>
          <div class="ic-form-heading"><h3>${t("enterDate")}</h3><button type="button" class="ic-text-button" data-converter-today="gregorian">${t("useToday")}</button></div>
          <label for="gregorianInput">${t("gregorianDate")}</label>
          <input id="gregorianInput" type="date" required min="${minimum}" max="${maximum}" value="${escape(state.inputs.gregorianInput)}" aria-describedby="calendarSupportedRange gregorianConvertError">
          <p id="gregorianConvertError" class="ic-error" role="alert"${state.gregorianError ? "" : " hidden"}>${escape(state.gregorianError)}</p>
          <button type="submit" class="primary" id="gregorianConvertBtn">${t("convertHijri")}${icon("arrow")}</button>
        </form>${resultArea(state.fromGregorian, "hijri")}
      </div>
      <div id="hijriConvertPanel" class="ic-converter-panel" role="tabpanel" aria-labelledby="hijriDirectionTab"${isGregorian ? " hidden" : ""}>
        <form id="hijriConvertForm" class="ic-convert-form" novalidate>
          <div class="ic-form-heading"><h3>${t("enterDate")}</h3><button type="button" class="ic-text-button" data-converter-today="hijri">${t("useToday")}</button></div>
          <div class="ic-hijri-fields"><div><label for="hijriInputDay">${t("day")}</label><input id="hijriInputDay" type="number" inputmode="numeric" required min="1" max="30" value="${escape(state.inputs.hijriInputDay)}" aria-describedby="hijriConvertError"></div>
          <div><label for="hijriInputMonth">${t("month")}</label><select id="hijriInputMonth" aria-describedby="hijriConvertError">${monthOptions(state.inputs.hijriInputMonth)}</select></div>
          <div><label for="hijriInputYear">${t("year")}</label><input id="hijriInputYear" type="number" inputmode="numeric" required min="${minimumYear}" max="${maximumYear}" value="${escape(state.inputs.hijriInputYear)}" aria-describedby="calendarSupportedRange hijriConvertError"></div></div>
          <p id="hijriConvertError" class="ic-error" role="alert"${state.hijriError ? "" : " hidden"}>${escape(state.hijriError)}</p>
          <button type="submit" class="primary" id="hijriConvertBtn">${t("convertGregorian")}${icon("arrow")}</button>
        </form>${resultArea(state.fromHijri, "gregorian")}
      </div>
      <details id="calendarConversionNotes" class="ic-conversion-notes"${state.conversionNotesOpen ? " open" : ""}><summary>${icon("moon")}<span>${t("conversionNotes")}</span>${icon("chevron")}</summary><div><p>${t("estimateNote")}</p><p id="calendarSupportedRange" class="ic-range">${t("range")}: ${escape(formatGregorian(minimum))} – ${escape(formatGregorian(maximum))} · ${minimumYear}–${maximumYear} H</p><strong>${t("boundaryTitle")}</strong><p>${t("boundary")}</p></div></details>
    </section>`;
  }

  function renderAnnual() {
    let events = calendar.getEventsForHijriYear(state.year);
    if (state.filter !== "all")
      events = events.filter((event) =>
        state.filter === "celebration"
          ? event.category === "celebration"
          : event.category !== "celebration",
      );
    return events.length
      ? events.map((event) => eventButton(event, true)).join("")
      : `<p class="ic-empty-copy">${t("emptyFilter")}</p>`;
  }

  function renderJumpLinks() {
    return `<nav class="ic-section-nav" aria-label="${t("sections")}">${[
      ["islamicMonthSection", "jumpCalendar"],
      ["islamicConverterSection", "jumpConverter"],
      ["islamicFastingSection", "jumpFasting"],
      ["islamicMuhammadSection", "jumpMuhammad"],
    ]
      .map(
        ([id, label]) =>
          `<button type="button" data-calendar-section="${id}">${t(label)}</button>`,
      )
      .join("")}</nav>`;
  }

  function renderFasting(day) {
    const fasting = day.fasting;
    if (!fasting || fasting.status === "none") return "";
    return `<section id="hijriFastingInfo" class="ic-fasting-info ic-fasting-info-${fasting.status}" data-status="${fasting.status}" aria-labelledby="hijriFastingTitle"><p class="ic-eyebrow">${t("fastingTitle")}</p><h4 id="hijriFastingTitle">${t(fasting.status)}</h4><ul>${(fasting.reasons || []).map((reason) => `<li><strong>${escape(reason.name?.[lang()] || reason.id)}</strong>${reason.description?.[lang()] ? `<p>${escape(reason.description[lang()])}</p>` : ""}${reason.reference ? referenceLinks([reason.reference]) : ""}</li>`).join("")}</ul></section>`;
  }

  function renderReferenceCard(entry, prefix) {
    const id = `${prefix}-${entry.id}`;
    return `<details class="ic-reference-card" data-reference-id="${escape(id)}"${state.openReferences.includes(id) ? " open" : ""}><summary><span>${escape(entry.name?.[lang()] || entry.id)}</span>${icon("chevron")}</summary><div class="ic-reference-body"><p>${escape(entry.note?.[lang()] || "")}</p>${referenceLinks(entry.sources)}</div></details>`;
  }

  function renderGuides() {
    return `<section id="islamicFastingSection" class="ic-guide-card" aria-labelledby="islamicFastingTitle" tabindex="-1"><div class="ic-section-heading"><div><p class="ic-eyebrow">${t("guideEyebrow")}</p><h2 id="islamicFastingTitle">${t("guideTitle")}</h2><p>${t("guideIntro")}</p></div>${icon("moon")}</div><div class="ic-guide-columns"><div><h4 class="ic-guide-label">${t("fastingGuides")}</h4>${FASTING_REFERENCES.map((entry) => renderReferenceCard(entry, "fasting")).join("")}</div><div><h4 class="ic-guide-label">${t("hajjGuides")}</h4>${HAJJ_REFERENCES.map((entry) => renderReferenceCard(entry, "hajj")).join("")}</div></div></section>`;
  }

  function renderMuhammad() {
    const prophet = MUHAMMAD_REFERENCE;
    const id = `prophet-${prophet.id}`;
    return `<section id="islamicMuhammadSection" class="ic-muhammad-card" aria-labelledby="islamicMuhammadTitle" tabindex="-1">
      <div class="ic-section-heading"><div><p class="ic-eyebrow">${t("muhammadEyebrow")}</p><h2 id="islamicMuhammadTitle">${t("muhammadTitle")}</h2><p>${t("muhammadIntro")}</p></div><span class="ic-section-icon" aria-hidden="true">${icon("moon")}</span></div>
      <div class="ic-birth-summary"><p class="ic-reference-caption">${t("prophetBirth")}</p><p class="ic-birth-note">${escape(prophet.birth[lang()])}</p></div>
      <details class="ic-reference-card ic-muhammad-reference" data-reference-id="${escape(id)}"${state.openReferences.includes(id) ? " open" : ""}><summary><span>${t("readEvidence")}</span>${icon("chevron")}</summary><div class="ic-reference-body"><p>${escape(prophet.note[lang()])}</p><p class="ic-reference-caption">${t("quranReference")}</p>${referenceLinks(prophet.quran)}<p class="ic-reference-caption">${t("evidence")}</p>${referenceLinks(prophet.sources)}</div></details>
    </section>`;
  }

  function readInputs() {
    for (const id of Object.keys(state.inputs))
      if ($(id)) state.inputs[id] = $(id).value;
    if ($("islamicYearPanel")) state.annualOpen = $("islamicYearPanel").open;
    if ($("calendarConversionNotes"))
      state.conversionNotesOpen = $("calendarConversionNotes").open;
    if ($("calendarAccuracyNote"))
      state.accuracyOpen = $("calendarAccuracyNote").open;
    state.openReferences = Array.from(
      host.querySelectorAll("[data-reference-id][open]"),
      (element) => element.dataset.referenceId,
    );
  }

  function render() {
    readInputs();
    if (state.gregorianError)
      state.gregorianError = t(
        state.inputs.gregorianInput ? "invalidGregorian" : "missingGregorian",
      );
    if (state.hijriError) state.hijriError = t("invalidHijri");
    if (state.jumpError) state.jumpError = t("jumpError");
    const focused = host.contains(document.activeElement)
      ? {
          id: document.activeElement.id,
          date: document.activeElement.dataset.date,
        }
      : null;
    state.monthDays = calendar.getHijriMonth(state.year, state.month);
    if (!state.monthDays.length) return;
    let selected = state.monthDays.find((day) => day.date === state.date);
    if (!selected) {
      selected = state.monthDays[0];
      state.date = selected.date;
    }
    const monthEvents = calendar
      .getEventsForHijriYear(state.year)
      .filter((event) => event.hijri.month === state.month);
    const monthEstimated = state.monthDays.some((day) => day.estimated);
    const annualCount = calendar.getEventsForHijriYear(state.year).length;
    host.innerHTML = `<div class="ic-view"><div class="ic-intro"><div><p class="ic-eyebrow">${t("eyebrow")}</p><h1 id="calendarHeading">${t("heading")}</h1><p>${t("intro")}</p></div><span class="ic-intro-mark" aria-hidden="true">${icon("moon")}</span></div><details id="calendarAccuracyNote" class="ic-accuracy-note"${state.accuracyOpen ? " open" : ""}><summary>${icon("calendar")}<span>${t("accuracyTitle")}</span>${icon("chevron")}</summary><p>${t("estimateNote")}</p></details><div class="ic-layout"><section class="ic-calendar-card" aria-labelledby="hijriMonthTitle"><div class="ic-month-toolbar"><div><p class="ic-eyebrow">${state.year} H</p><h2 id="hijriMonthTitle">${escape(monthName(state.month))} ${state.year} H</h2><p class="ic-month-range">${escape(formatGregorian(state.monthDays[0].date, { day: "numeric", month: "short", year: "numeric" }))} – ${escape(formatGregorian(state.monthDays.at(-1).date, { day: "numeric", month: "short", year: "numeric" }))}</p></div><div class="ic-month-actions"><button type="button" id="hijriPrevMonth" class="icon-button" aria-label="${t("previous")}"${state.year === minimumYear && state.month === 1 ? " disabled" : ""}>${icon("chevron")}</button><button type="button" id="hijriToday" class="secondary">${t("today")}</button><button type="button" id="hijriNextMonth" class="icon-button" aria-label="${t("next")}"${state.year === maximumYear && state.month === 12 ? " disabled" : ""}>${icon("chevron")}</button></div></div><form id="hijriJumpForm" class="ic-jump" novalidate><div><label for="hijriJumpMonth">${t("month")}</label><select id="hijriJumpMonth">${monthOptions(state.month)}</select></div><div><label for="hijriJumpYear">${t("year")}</label><input id="hijriJumpYear" type="number" inputmode="numeric" required min="${minimumYear}" max="${maximumYear}" value="${state.year}" aria-describedby="hijriJumpError"></div><button type="submit" class="secondary">${t("go")}</button><p id="hijriJumpError" class="ic-error" role="alert"${state.jumpError ? "" : " hidden"}>${escape(state.jumpError)}</p></form>${renderGrid()}<div class="ic-grid-legend"><span><i class="ic-legend-today"></i>${t("todayLegend")}</span><span><i class="ic-legend-event"></i>${t("eventLegend")}</span>${badge({ estimated: monthEstimated })}</div><p class="ic-grid-note">${t(monthEstimated ? "mixedMonth" : "officialMonth")}</p><p id="hijriGridHelp" class="sr-only">${t("keyboard")}</p></section><aside class="ic-date-panel" aria-label="${t("details")}"><div class="ic-selected-heading"><p class="ic-eyebrow">${t("selected")}</p><h3 id="hijriSelectedDate">${escape(formatHijri(selected.hijri))}</h3><p id="hijriSelectedGregorian">${escape(formatGregorian(selected.date, { weekday: "long", day: "numeric", month: "long", year: "numeric" }))}</p>${sourceLine(selected)}</div><div id="hijriDayEvents">${selected.events?.length ? selected.events.map(eventDetails).join("") : `<p class="ic-empty-copy">${t("noEvent")}</p>`}</div><div class="ic-month-events"><h4>${t("inMonth")}</h4><div id="islamicMonthEvents">${monthEvents.length ? monthEvents.map((event) => eventButton(event)).join("") : `<p class="ic-empty-copy">${t("noMonthEvent")}</p>`}</div></div></aside></div>${renderConverters()}<section class="ic-annual-card" aria-labelledby="islamicAnnualTitle"><div class="ic-section-heading"><div><p class="ic-eyebrow">${state.year} H</p><h2 id="islamicAnnualTitle">${t("annual")}</h2><p>${t("annualIntro")}</p></div><span class="ic-count">${annualCount}</span></div><details id="islamicYearPanel"${state.annualOpen ? " open" : ""}><summary>${t("showAnnual")}${icon("chevron")}</summary><div class="ic-year-filter"><label for="islamicEventFilter">${t("annualFilter")}</label><select id="islamicEventFilter"><option value="all"${state.filter === "all" ? " selected" : ""}>${t("allEvents")}</option><option value="celebration"${state.filter === "celebration" ? " selected" : ""}>${t("celebrations")}</option><option value="observance"${state.filter === "observance" ? " selected" : ""}>${t("observances")}</option></select></div><div id="islamicYearEvents" class="ic-year-events">${renderAnnual()}</div></details><p class="ic-scope-note">${t("scope")}</p></section></div>`;
    host
      .querySelector(".ic-intro")
      .insertAdjacentHTML("afterend", renderJumpLinks());
    const monthSection = host.querySelector(".ic-layout");
    monthSection.id = "islamicMonthSection";
    monthSection.tabIndex = -1;
    const converterSection = host.querySelector(".ic-converter");
    converterSection.id = "islamicConverterSection";
    converterSection.tabIndex = -1;
    host
      .querySelector(".ic-annual-card")
      .insertAdjacentHTML("afterend", renderGuides() + renderMuhammad());
    host
      .querySelector(".ic-selected-heading")
      .insertAdjacentHTML("afterend", renderFasting(selected));
    host
      .querySelector(".ic-grid-legend")
      .insertAdjacentHTML(
        "beforeend",
        `<span><i class="ic-fasting-dot ic-fasting-recommended"></i>${t("fastingLegend")}</span><span><i class="ic-fasting-dot ic-fasting-obligatory"></i>${t("obligatory")}</span><span><i class="ic-fasting-dot ic-fasting-prohibited"></i>${t("prohibitedLegend")}</span>`,
      );
    updateConversionResults();
    if (focused?.id) $(focused.id)?.focus({ preventScroll: true });
    else if (focused?.date)
      host
        .querySelector(`[data-date="${state.date}"]`)
        ?.focus({ preventScroll: true });
  }

  function selectDate(date, focus = false) {
    try {
      const hijri = calendar.toHijri(date);
      state.date = date;
      state.year = hijri.year;
      state.month = hijri.month;
      state.jumpError = "";
      render();
      if (focus) host.querySelector(`[data-date="${date}"]`)?.focus();
      return true;
    } catch {
      return false;
    }
  }

  function navigateMonth(offset) {
    const index = (state.year - 1) * 12 + state.month - 1 + offset;
    const year = Math.floor(index / 12) + 1;
    if (year < minimumYear || year > maximumYear) return;
    state.year = year;
    state.month = (((index % 12) + 12) % 12) + 1;
    state.jumpError = "";
    state.date = calendar.getHijriMonth(state.year, state.month)[0].date;
    render();
  }

  function updateConversionResults() {
    for (const [id, result, direction] of [
      ["hijriConvertResult", state.fromGregorian, "hijri"],
      ["gregorianConvertResult", state.fromHijri, "gregorian"],
    ]) {
      $(id).hidden = !result;
      $(`${id}Placeholder`).hidden = Boolean(result);
      $(id).innerHTML = conversionOutput(result, direction);
      const hijri = direction === "hijri" ? result : result?.hijri;
      for (const key of ["day", "month", "year"]) {
        if (hijri?.[key] != null) $(id).dataset[key] = String(hijri[key]);
        else delete $(id).dataset[key];
      }
      if (result?.date) $(id).dataset.date = result.date;
      else delete $(id).dataset.date;
    }
    for (const [id, error, fields] of [
      ["gregorianConvertError", state.gregorianError, ["gregorianInput"]],
      [
        "hijriConvertError",
        state.hijriError,
        ["hijriInputDay", "hijriInputMonth", "hijriInputYear"],
      ],
    ]) {
      $(id).textContent = error;
      $(id).hidden = !error;
      fields.forEach((field) =>
        $(field).setAttribute("aria-invalid", String(Boolean(error))),
      );
    }
  }

  function onSubmit(event) {
    const id = event.target.id;
    if (
      !["hijriJumpForm", "gregorianConvertForm", "hijriConvertForm"].includes(
        id,
      )
    )
      return;
    event.preventDefault();
    readInputs();
    if (id === "hijriJumpForm") {
      const year = Number($("hijriJumpYear").value),
        month = Number($("hijriJumpMonth").value);
      if (
        !Number.isInteger(year) ||
        year < minimumYear ||
        year > maximumYear ||
        month < 1 ||
        month > 12
      ) {
        state.jumpError = t("jumpError");
        $("hijriJumpError").textContent = state.jumpError;
        $("hijriJumpError").hidden = false;
        $("hijriJumpYear").setAttribute("aria-invalid", "true");
        return;
      }
      state.year = year;
      state.month = month;
      state.date = calendar.getHijriMonth(year, month)[0].date;
      state.jumpError = "";
      render();
      return;
    }
    if (id === "gregorianConvertForm") {
      state.gregorianError = "";
      state.fromGregorian = null;
      const date = state.inputs.gregorianInput;
      try {
        if (!date) throw new Error("missing");
        state.fromGregorian = { ...calendar.toHijri(date), date };
      } catch {
        state.gregorianError = t(
          date ? "invalidGregorian" : "missingGregorian",
        );
      }
    } else {
      state.hijriError = "";
      state.fromHijri = null;
      const hijri = {
        day: Number(state.inputs.hijriInputDay),
        month: Number(state.inputs.hijriInputMonth),
        year: Number(state.inputs.hijriInputYear),
      };
      try {
        state.fromHijri = { ...calendar.toGregorian(hijri), hijri };
      } catch {
        state.hijriError = t("invalidHijri");
      }
    }
    updateConversionResults();
  }

  function setDirection(direction, focus = false) {
    if (!["gregorian", "hijri"].includes(direction)) return;
    state.direction = direction;
    for (const value of ["gregorian", "hijri"]) {
      const active = direction === value;
      $(`${value}DirectionTab`).setAttribute("aria-selected", String(active));
      $(`${value}DirectionTab`).tabIndex = active ? 0 : -1;
      $(`${value}ConvertPanel`).hidden = !active;
    }
    if (focus) $(`${direction}DirectionTab`).focus();
  }

  function useToday(direction) {
    const now = civilDate();
    const date = now < minimum ? minimum : now > maximum ? maximum : now;
    const hijri = calendar.toHijri(date);
    if (direction === "gregorian") {
      state.inputs.gregorianInput = date;
      $("gregorianInput").value = date;
      state.fromGregorian = { ...hijri, date };
      state.gregorianError = "";
    } else {
      for (const [field, value] of [
        ["hijriInputDay", hijri.day],
        ["hijriInputMonth", hijri.month],
        ["hijriInputYear", hijri.year],
      ]) {
        state.inputs[field] = String(value);
        $(field).value = String(value);
      }
      state.fromHijri = { ...calendar.toGregorian(hijri), hijri };
      state.hijriError = "";
    }
    updateConversionResults();
  }

  function onClick(event) {
    const button = event.target.closest("button");
    if (!button || !host.contains(button)) return;
    if (button.dataset.convertDirection)
      setDirection(button.dataset.convertDirection);
    else if (button.dataset.converterToday)
      useToday(button.dataset.converterToday);
    else if (button.dataset.calendarSection) {
      const section = $(button.dataset.calendarSection);
      section?.scrollIntoView({ block: "start", behavior: "auto" });
      section?.focus({ preventScroll: true });
    } else if (button.dataset.date) selectDate(button.dataset.date);
    else if (button.dataset.calendarDate)
      selectDate(button.dataset.calendarDate, true);
    else if (button.id === "hijriPrevMonth") navigateMonth(-1);
    else if (button.id === "hijriNextMonth") navigateMonth(1);
    else if (button.id === "hijriToday") selectDate(civilDate());
  }

  function onInput(event) {
    const id = event.target.id;
    if (!(id in state.inputs)) return;
    state.inputs[id] = event.target.value;
    if (id === "gregorianInput") {
      state.fromGregorian = null;
      state.gregorianError = "";
    } else {
      state.fromHijri = null;
      state.hijriError = "";
    }
    updateConversionResults();
  }

  function onChange(event) {
    if (event.target.id === "islamicEventFilter") {
      state.filter = event.target.value;
      $("islamicYearEvents").innerHTML = renderAnnual();
    } else if (
      event.target.id in state.inputs &&
      state.inputs[event.target.id] !== event.target.value
    ) {
      // Input already handled live changes. Replacing content again on blur can
      // detach the next button or accordion before its click completes.
      onInput(event);
    }
  }

  function onKey(event) {
    if (event.target.dataset.convertDirection) {
      const keys = {
        ArrowLeft: state.direction === "gregorian" ? "hijri" : "gregorian",
        ArrowRight: state.direction === "gregorian" ? "hijri" : "gregorian",
        Home: "gregorian",
        End: "hijri",
      };
      if (keys[event.key]) {
        event.preventDefault();
        setDirection(keys[event.key], true);
      }
      return;
    }
    const date = event.target.dataset.date;
    if (!date) return;
    const weekday = (utcDate(date).getUTCDay() + 6) % 7;
    const amount = {
      ArrowLeft: -1,
      ArrowRight: 1,
      ArrowUp: -7,
      ArrowDown: 7,
      Home: -weekday,
      End: 6 - weekday,
    }[event.key];
    if (amount !== undefined) {
      event.preventDefault();
      selectDate(shiftDate(date, amount), true);
    } else if (event.key === "PageUp" || event.key === "PageDown") {
      event.preventDefault();
      navigateMonth(event.key === "PageUp" ? -1 : 1);
      host.querySelector(`[data-date="${state.date}"]`)?.focus();
    }
  }

  host.addEventListener("click", onClick);
  host.addEventListener("submit", onSubmit);
  host.addEventListener("input", onInput);
  host.addEventListener("change", onChange);
  host.addEventListener("keydown", onKey);
  function tick(now = new Date()) {
    const date = civilDate(now);
    if (date !== state.today) {
      state.today = date;
      render();
    }
  }
  function destroy() {
    host.removeEventListener("click", onClick);
    host.removeEventListener("submit", onSubmit);
    host.removeEventListener("input", onInput);
    host.removeEventListener("change", onChange);
    host.removeEventListener("keydown", onKey);
  }
  render();
  return { render, tick, showDate: (date) => selectDate(date), destroy };
}
