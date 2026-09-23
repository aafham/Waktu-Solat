import {
  TIME_ZONE,
  PRAYER_KEYS,
  dateKey,
  addDays,
  formatTime,
  loadMonth,
  getPrayerState,
  resolveGpsZone,
} from "./prayer-data.js";
import { ZONE_DATA } from "./zones.js";
import { createQibla } from "./qibla.js";

const $ = (id) => document.getElementById(id);
const all = (selector) => document.querySelectorAll(selector);
const read = (key, fallback = "") => {
  try {
    return localStorage.getItem(key) ?? fallback;
  } catch {
    return fallback;
  }
};
const save = (key, value) => {
  try {
    localStorage.setItem(key, value);
  } catch {
    /* Storage is optional. */
  }
};
const zones = ZONE_DATA.flatMap(({ state, zones }) =>
  zones.map((zone) => ({ ...zone, state })),
);
const zoneMeta = (code) => zones.find((zone) => zone.code === code);
const icon = (name) =>
  `<svg class="icon" aria-hidden="true"><use href="#i-${name}"/></svg>`;
const escapeHtml = (value) =>
  String(value).replace(
    /[&<>"']/g,
    (char) =>
      ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[
        char
      ],
  );
const text = {
  ms: {
    skip: "Langkau ke kandungan",
    menu: "RUANG HARIAN ANDA",
    today: "Hari ini",
    monthly: "Jadual bulanan",
    qibla: "Arah kiblat",
    settings: "Tetapan",
    sideNote: "Luangkan sejenak. Dekatkan diri kepada-Nya.",
    madeFor: "Untuk setiap waktu, setiap hari.",
    appName: "Waktu Solat Malaysia",
    theme: "Tukar tema",
    welcome: "SELANGKAH LEBIH DEKAT",
    homeTitle: "Waktu solat hari ini",
    scheduleTitle: "Rancang waktu anda",
    qiblaTitle: "Arah kiblat anda",
    homeSubtitle: "Jaga waktu, tenangkan hati.",
    scheduleSubtitle: "Satu bulan, setiap waktu dalam pandangan.",
    qiblaSubtitle: "Di mana pun anda, temukan arah yang sama.",
    changeLocation: "Tukar lokasi",
    retry: "Cuba semula",
    nextPrayer: "SOLAT SETERUSNYA",
    timeRemaining: "Masa berbaki menuju waktu solat",
    hours: "JAM",
    minutes: "MINIT",
    seconds: "SAAT",
    todayDate: "TARIKH HARI INI",
    dailySchedule: "Jadual waktu solat",
    allTimes: "Waktu tempatan Malaysia (UTC +8)",
    viewMonthly: "Lihat bulanan",
    upNext: "Solat seterusnya",
    sunriseNote: "Syuruk menandakan berakhirnya waktu Subuh.",
    findQibla: "Satu arah, satu tujuan.",
    qiblaShortcut: "Cari arah kiblat dari lokasi anda",
    trustedTimes: "Waktu berpandukan JAKIM",
    installPitch: "Waktu solat, sentiasa dekat dengan anda.",
    install: "Pasang aplikasi",
    previousMonth: "Bulan sebelumnya",
    nextMonth: "Bulan seterusnya",
    thisMonth: "Bulan ini",
    scrollTable: "Leret jadual ke kiri atau kanan untuk melihat semua waktu.",
    towardsKaaba: "Menghadap satu arah.",
    qiblaIntro: "Dapatkan arah Kaabah berdasarkan lokasi semasa anda.",
    qiblaHelp:
      "Pegang telefon rata dan jauhkan daripada objek logam. Semak arah dengan kompas yang dipercayai jika bacaan tidak stabil.",
    trueNorth: "mengikut arah jam dari utara benar",
    dataFrom: "Sumber data",
    schedule: "Jadual",
    qiblaShort: "Kiblat",
    yourLocation: "LOKASI ANDA",
    chooseLocation: "Pilih lokasi solat",
    close: "Tutup",
    detect: "Kesan lokasi saya",
    gpsPrivacy:
      "Lokasi dikongsi dengan API Waktu Solat untuk mengenal pasti zon anda.",
    favorites: "Lokasi kegemaran",
    orChoose: "atau pilih secara manual",
    searchLocation: "Cari daerah atau kod zon",
    state: "Negeri",
    language: "Bahasa",
    darkMode: "Mod gelap",
    timeFormat: "Format waktu",
    cacheHelp:
      "Data jadual disimpan untuk kegunaan offline. Muat semula data tanpa memadam pilihan lokasi dan tetapan anda.",
    refresh: "Muat semula data",
    installHelp:
      "Dalam menu pelayar, pilih “Pasang aplikasi” atau “Tambah ke Skrin Utama”. Pada iPhone, buka dalam Safari, tekan Kongsi, kemudian Tambah ke Skrin Utama.",
    offlineHelp:
      "Jadual yang pernah dimuat boleh dibuka semula tanpa internet. Lokasi baharu dan bulan yang belum disimpan memerlukan sambungan.",
    allStates: "Semua negeri",
    searchHint: "Contoh: Shah Alam, SGR01",
    zoneResults: "zon ditemui",
    noZones: "Tiada zon ditemui. Cuba nama daerah lain.",
    defaultLocation: "Lokasi lalai",
    savedLocation: "Lokasi tersimpan",
    manualLocation: "Pilihan anda",
    gpsLocation: "Lokasi dikesan",
    saveFavorite: "Simpan lokasi kegemaran",
    removeFavorite: "Buang lokasi kegemaran",
    loading: "Memuatkan jadual waktu solat…",
    loadError:
      "Jadual tidak dapat dimuatkan. Semak sambungan internet dan cuba semula.",
    offline:
      "Anda offline. Memaparkan jadual tersimpan untuk zon dan bulan ini.",
    cached: "Jadual tersimpan · Disemak mengikut zon dan bulan",
    liveData: "Jadual bulanan",
    tomorrow: "Esok",
    current: "Waktu semasa",
    past: "Telah berlalu",
    sunrise: "Terbit matahari",
    later: "Akan datang",
    waiting: "Memuatkan",
    chooseZone: "Pilih zon anda",
    noNext: "Jadual seterusnya belum tersedia",
    nextMissing: "Waktu Subuh esok belum tersedia. Cuba muat semula data.",
    apiHijri: "Tarikh Hijrah daripada jadual API",
    estimatedHijri: "Anggaran kalendar pelayar",
    date: "Tarikh",
    monthCache: "Jadual tersimpan untuk bulan ini.",
    detecting: "Mengesan lokasi…",
    gpsDenied:
      "Lokasi tidak dibenarkan. Anda masih boleh memilih zon secara manual.",
    gpsError:
      "Lokasi tidak dapat dikesan. Cuba semula atau pilih zon secara manual.",
    gpsUnsupported:
      "Pelayar ini tidak menyokong lokasi. Sila pilih zon secara manual.",
    gpsOutside: "Tiada zon Malaysia ditemui untuk lokasi ini.",
    labels: ["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"],
  },
  en: {
    skip: "Skip to content",
    menu: "YOUR DAILY SPACE",
    today: "Today",
    monthly: "Monthly schedule",
    qibla: "Qibla direction",
    settings: "Settings",
    sideNote: "Take a moment. Draw closer to Him.",
    madeFor: "For every prayer, every day.",
    appName: "Malaysia Prayer Times",
    theme: "Change theme",
    welcome: "A LITTLE CLOSER, EVERY DAY",
    homeTitle: "Your prayer times today",
    scheduleTitle: "Make time for every prayer",
    qiblaTitle: "Find your Qibla direction",
    homeSubtitle: "Be present in prayer. Find peace in your day.",
    scheduleSubtitle: "Every prayer, for the month ahead.",
    qiblaSubtitle: "Wherever you are, find the same direction.",
    changeLocation: "Change location",
    retry: "Try again",
    nextPrayer: "NEXT PRAYER",
    timeRemaining: "Time remaining until the next prayer",
    hours: "HOURS",
    minutes: "MINUTES",
    seconds: "SECONDS",
    todayDate: "TODAY’S DATE",
    dailySchedule: "Daily prayer schedule",
    allTimes: "Malaysia local time (UTC +8)",
    viewMonthly: "View month",
    upNext: "Next prayer",
    sunriseNote: "Sunrise marks the end of Fajr.",
    findQibla: "One direction, one purpose.",
    qiblaShortcut: "Find the Qibla from your location",
    trustedTimes: "Prayer times based on JAKIM",
    installPitch: "Your prayer times, always close at hand.",
    install: "Install app",
    previousMonth: "Previous month",
    nextMonth: "Next month",
    thisMonth: "This month",
    scrollTable: "Scroll the table horizontally to see every prayer time.",
    towardsKaaba: "Towards the same direction.",
    qiblaIntro: "Find the bearing to the Kaaba using your current location.",
    qiblaHelp:
      "Hold your phone flat and away from metal objects. Check an established compass if readings are unstable.",
    trueNorth: "clockwise from true north",
    dataFrom: "Data sources",
    schedule: "Schedule",
    qiblaShort: "Qibla",
    yourLocation: "YOUR LOCATION",
    chooseLocation: "Choose prayer location",
    close: "Close",
    detect: "Detect my location",
    gpsPrivacy:
      "Your location is shared with the Waktu Solat API to identify your prayer zone.",
    favorites: "Favorite locations",
    orChoose: "or choose manually",
    searchLocation: "Search district or zone code",
    state: "State",
    language: "Language",
    darkMode: "Dark mode",
    timeFormat: "Time format",
    cacheHelp:
      "Schedules are saved for offline use. Refresh data without removing your chosen location and preferences.",
    refresh: "Refresh prayer data",
    installHelp:
      "In your browser menu, choose “Install app” or “Add to Home Screen”. On iPhone, open in Safari, tap Share, then Add to Home Screen.",
    offlineHelp:
      "Previously loaded schedules can be reopened offline. New locations and unsaved months require an internet connection.",
    allStates: "All states",
    searchHint: "For example: Shah Alam, SGR01",
    zoneResults: "zones found",
    noZones: "No zones found. Try a different district name.",
    defaultLocation: "Default location",
    savedLocation: "Saved location",
    manualLocation: "Your selected location",
    gpsLocation: "Detected location",
    saveFavorite: "Save favorite location",
    removeFavorite: "Remove favorite location",
    loading: "Loading prayer times…",
    loadError:
      "The schedule could not be loaded. Check your connection and try again.",
    offline:
      "You are offline. Showing the saved schedule for this zone and month.",
    cached: "Saved schedule · Checked against zone and month",
    liveData: "Monthly schedule",
    tomorrow: "Tomorrow",
    current: "Current prayer",
    past: "Passed",
    sunrise: "Sunrise",
    later: "Upcoming",
    waiting: "Loading",
    chooseZone: "Choose your zone",
    noNext: "Next schedule unavailable",
    nextMissing:
      "Tomorrow’s Fajr is not available yet. Try refreshing prayer data.",
    apiHijri: "Hijri date from the API schedule",
    estimatedHijri: "Browser calendar estimate",
    date: "Date",
    monthCache: "Saved schedule for this month.",
    detecting: "Detecting your location…",
    gpsDenied:
      "Location permission was denied. You can still choose a zone manually.",
    gpsError:
      "Your location could not be detected. Try again or choose a zone manually.",
    gpsUnsupported:
      "This browser does not support location. Please choose a zone manually.",
    gpsOutside: "No Malaysian prayer zone was found for this location.",
    labels: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"],
  },
};
const savedZone = read("ws_lastZone").toUpperCase();
let favorites;
try {
  const data = JSON.parse(read("ws_favorites", "[]"));
  favorites = Array.isArray(data)
    ? [...new Set(data.filter((code) => zoneMeta(code)))]
    : [];
} catch {
  favorites = [];
}
const state = {
  lang: read("ws_lang") === "en" ? "en" : "ms",
  format: read("ws_timeFormat") === "24" ? "24" : "12",
  zone: zoneMeta(savedZone) ? savedZone : "WLY01",
  locationSource: zoneMeta(savedZone) ? "savedLocation" : "defaultLocation",
  view: "home",
  days: [],
  monthDays: [],
  month: dateKey().slice(0, 7),
  source: "",
  cached: false,
  busy: false,
  error: false,
  monthBusy: false,
  monthError: false,
  monthCached: false,
  favorites,
  loadedDate: dateKey(),
  renderKey: "",
};
const t = (key) => text[state.lang][key] ?? key;
const locale = () => (state.lang === "ms" ? "ms-MY" : "en-GB");
const dateFormat = (date, options) =>
  new Intl.DateTimeFormat(locale(), { timeZone: TIME_ZONE, ...options }).format(
    date,
  );
const qibla = createQibla({ getLanguage: () => state.lang });
let dailyRequest = 0,
  monthRequest = 0,
  gpsRequest = 0,
  installPrompt = null;

function setStatus() {
  const key = state.busy
    ? "loading"
    : state.error
      ? "loadError"
      : !navigator.onLine
        ? "offline"
        : "";
  $("statusBar").hidden = !key;
  $("statusBar").classList.toggle("loading", state.busy);
  $("statusText").textContent = key ? t(key) : "";
  $("retryBtn").hidden = !state.error;
  $("prayerGrid").setAttribute("aria-busy", String(state.busy));
}
function renderLocation() {
  const zone = zoneMeta(state.zone);
  $("locationName").textContent = zone?.name || state.zone;
  $("locationName").title = zone?.name || state.zone;
  $("zoneBadge").textContent = state.zone;
  $("locationMeta").textContent =
    `${t(state.locationSource)} · ${zone?.state || "Malaysia"}`;
  const favored = state.favorites.includes(state.zone);
  $("favoriteBtn").setAttribute("aria-pressed", String(favored));
  $("favoriteBtn").setAttribute(
    "aria-label",
    t(favored ? "removeFavorite" : "saveFavorite"),
  );
  $("favoriteBtn").title = t(favored ? "removeFavorite" : "saveFavorite");
  $("manualToggle").setAttribute("aria-label", t("changeLocation"));
}
function renderDates(now = new Date()) {
  $("gregorianDate").textContent = dateFormat(now, {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  $("dateWeekday").textContent = dateFormat(now, { weekday: "long" });
  $("dateNumber").textContent = dateFormat(now, { day: "numeric" });
  // Mobile hides the large day number, so keep the date complete in this line.
  $("dateMonth").textContent = dateFormat(now, {
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  $("year").textContent = dateKey(now).slice(0, 4);
  const day = state.days.find((day) => day.date === dateKey(now));
  const hijri = day?.hijri?.match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (hijri && Number(hijri[2]) >= 1 && Number(hijri[2]) <= 12) {
    const months =
      state.lang === "ms"
        ? [
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
            "Zulhijah",
          ]
        : [
            "Muharram",
            "Safar",
            "Rabi al-Awwal",
            "Rabi al-Thani",
            "Jumada al-Awwal",
            "Jumada al-Thani",
            "Rajab",
            "Sha’ban",
            "Ramadan",
            "Shawwal",
            "Dhu al-Qidah",
            "Dhu al-Hijjah",
          ];
    $("hijriDate").textContent =
      `${Number(hijri[3])} ${months[Number(hijri[2]) - 1]} ${hijri[1]} H`;
    $("hijriSource").textContent = t("apiHijri");
  } else {
    $("hijriDate").textContent = dateFormat(now, {
      calendar: "islamic",
      day: "numeric",
      month: "long",
      year: "numeric",
    });
    $("hijriSource").textContent = t("estimatedHijri");
  }
  $("hijriDate").title = $("hijriSource").textContent;
}
function renderCards(now, prayer) {
  const today = dateKey(now);
  const day = state.days.find((day) => day.date === today);
  const icons = ["sunrise", "sunrise", "sun", "sun", "sunset", "moon"];
  $("prayerGrid").innerHTML = PRAYER_KEYS.map((key, index) => {
    const next = prayer.next?.key === key && prayer.next.date === today;
    const current =
      prayer.current?.key === key && prayer.current.date === today;
    const time = formatTime(day?.times[key], state.format);
    const [number, period] = time.split(" ");
    const passed =
      day && Date.parse(`${today}T${day.times[key]}:00+08:00`) <= now.getTime();
    const status = !day
      ? state.busy
        ? "waiting"
        : "—"
      : key === "syuruk"
        ? "sunrise"
        : next
          ? "upNext"
          : current
            ? "current"
            : passed
              ? "past"
              : "later";
    return `<article class="prayer-card${next ? " next" : ""}${current ? " current" : ""}"${next ? ' aria-label="' + escapeHtml(t("upNext")) + '"' : ""}>${icon(icons[index])}<h3 class="prayer-name">${text[state.lang].labels[index]}</h3><p class="prayer-time">${number}${period ? `<small>${period}</small>` : ""}</p><p class="prayer-status">${status === "—" ? "—" : t(status)}</p></article>`;
  }).join("");
}
function tick(force = false) {
  const now = new Date(),
    today = dateKey(now);
  $("currentTime").textContent = dateFormat(now, {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
    hour12: state.format !== "24",
  });
  if (state.loadedDate !== today) {
    state.loadedDate = today;
    renderDates(now);
    useZone(state.zone, state.locationSource);
  }
  const prayer = getPrayerState(state.days, now);
  const next = prayer.next;
  $("nextPrayerName").textContent = next
    ? text[state.lang].labels[PRAYER_KEYS.indexOf(next.key)]
    : state.busy
      ? t("waiting")
      : "—";
  $("nextPrayerTime").textContent = next
    ? `${formatTime(next.time, state.format)}${next.date !== today ? " · " + t("tomorrow") : ""}`
    : "—";
  if (next) {
    const seconds = Math.max(
      0,
      Math.ceil((next.timestamp - now.getTime()) / 1000),
    );
    const parts = [
      Math.floor(seconds / 3600),
      Math.floor((seconds % 3600) / 60),
      seconds % 60,
    ].map((v) => String(v).padStart(2, "0"));
    $("countdownValue").innerHTML = parts.join("<span>:</span>");
    $("nextPrayerNote").textContent = t("allTimes");
  } else {
    $("countdownValue").innerHTML = "--<span>:</span>--<span>:</span>--";
    $("nextPrayerNote").textContent = state.busy
      ? t("loading")
      : state.days.length
        ? t("nextMissing")
        : t("noNext");
  }
  $("prayerProgress").style.width = `${prayer.progress * 100}%`;
  const key = `${today}|${next?.key}|${next?.date}|${prayer.current?.key}|${state.busy}|${state.error}|${state.lang}|${state.format}`;
  if (force || key !== state.renderKey) {
    state.renderKey = key;
    renderCards(now, prayer);
  }
}
async function useZone(code, source = "manualLocation", force = false) {
  if (!zoneMeta(code)) return;
  const request = ++dailyRequest;
  ++monthRequest;
  state.zone = code;
  state.locationSource = source;
  state.days = [];
  state.monthDays = [];
  state.busy = true;
  state.error = false;
  state.loadedDate = dateKey();
  if (source !== "defaultLocation") save("ws_lastZone", code);
  renderLocation();
  setStatus();
  tick(true);
  renderDates();
  $("dataSource").textContent = t("loading");
  if (state.view === "schedule") showMonth(force);
  const today = dateKey(),
    month = today.slice(0, 7);
  try {
    const result = await loadMonth(code, month, { force });
    if (request !== dailyRequest) return;
    state.days = [...result.days];
    state.source = result.source;
    state.cached = result.cached;
    state.busy = false;
    $("dataSource").textContent = result.cached
      ? t("cached")
      : `${result.source} · ${t("liveData")}`;
    setStatus();
    renderDates();
    tick(true);
    // Fetch adjacent months only when needed to cover midnight and tomorrow’s Fajr.
    const neighbors = [
      addDays(today, -1).slice(0, 7),
      addDays(today, 1).slice(0, 7),
    ].filter((key) => key !== month);
    const adjacent = await Promise.allSettled(
      neighbors.map((key) => loadMonth(code, key)),
    );
    if (request !== dailyRequest) return;
    adjacent.forEach((result) => {
      if (result.status === "fulfilled")
        state.days = [...state.days, ...result.value.days];
    });
    tick(true);
  } catch {
    if (request !== dailyRequest) return;
    state.busy = false;
    state.error = true;
    state.days = [];
    $("dataSource").textContent = t("loadError");
    setStatus();
    tick(true);
  }
}
function setView(view, updateHash = true) {
  if (!["home", "schedule", "qibla"].includes(view)) view = "home";
  state.view = view;
  for (const name of ["home", "schedule", "qibla"])
    $(`${name}View`).hidden = name !== view;
  all(".main-nav [data-view],.bottom-nav [data-view]").forEach((button) => {
    const active = button.dataset.view === view;
    button.classList.toggle("active", active);
    if (active) button.setAttribute("aria-current", "page");
    else button.removeAttribute("aria-current");
  });
  $("pageTitle").innerHTML = `${escapeHtml(t(`${view}Title`))}<span>.</span>`;
  $("pageSubtitle").textContent = t(`${view}Subtitle`);
  $("breadcrumb").textContent = t(
    view === "home" ? "today" : view === "schedule" ? "monthly" : "qibla",
  );
  document.title = `${t(view === "home" ? "today" : view === "schedule" ? "monthly" : "qibla")} · ${t("appName")}`;
  if (updateHash) {
    history.pushState(
      null,
      "",
      `#${{ home: "hari-ini", schedule: "jadual", qibla: "kiblat" }[view]}`,
    );
    window.scrollTo(0, 0);
    $("main").focus({ preventScroll: true });
  }
  if (view === "schedule") showMonth();
}
function renderMonth() {
  const monthDate = new Date(`${state.month}-01T12:00:00+08:00`);
  $("monthTitle").textContent = dateFormat(monthDate, {
    month: "long",
    year: "numeric",
  });
  $("monthCaption").textContent =
    `${t("monthly")} · ${state.zone} · ${$("monthTitle").textContent}`;
  $("monthHead").innerHTML =
    `<tr><th scope="col">${t("date")}</th>${text[state.lang].labels.map((name) => `<th scope="col">${name}</th>`).join("")}</tr>`;
  $("monthBody").innerHTML = state.monthDays
    .map((day) => {
      const date = new Date(`${day.date}T12:00:00+08:00`);
      return `<tr${day.date === dateKey() ? ' class="is-today" aria-current="date"' : ""}><td>${Number(day.date.slice(-2))}<small>${escapeHtml(dateFormat(date, { weekday: "short" }))}</small></td>${PRAYER_KEYS.map((key) => `<td>${formatTime(day.times[key], state.format)}</td>`).join("")}</tr>`;
    })
    .join("");
  $("monthStatus").hidden =
    !state.monthBusy && !state.monthError && !state.monthCached;
  $("monthStatus").textContent = state.monthBusy
    ? t("loading")
    : state.monthError
      ? t("loadError")
      : state.monthCached
        ? t("monthCache")
        : "";
  $("monthRetry").hidden = !state.monthError;
  $("monthBody")
    .closest(".table-scroll")
    .setAttribute("aria-busy", String(state.monthBusy));
}
async function showMonth(force = false) {
  const request = ++monthRequest,
    zone = state.zone,
    month = state.month;
  state.monthDays = [];
  state.monthBusy = true;
  state.monthError = false;
  state.monthCached = false;
  renderMonth();
  try {
    const result = await loadMonth(zone, month, { force });
    if (request !== monthRequest) return;
    state.monthDays = result.days;
    state.monthCached = result.cached;
    state.monthBusy = false;
    renderMonth();
  } catch {
    if (request !== monthRequest) return;
    state.monthBusy = false;
    state.monthError = true;
    renderMonth();
  }
}
function changeMonth(offset) {
  const [year, month] = state.month.split("-").map(Number);
  const value = new Date(Date.UTC(year, month - 1 + offset, 1));
  state.month = value.toISOString().slice(0, 7);
  showMonth();
}
function renderZones() {
  const query = $("locationSearch").value.trim().toLocaleLowerCase();
  const selectedState = $("stateSelect").value;
  const matches = zones.filter(
    (zone) =>
      (!selectedState || zone.state === selectedState) &&
      `${zone.code} ${zone.name} ${zone.state}`
        .toLocaleLowerCase()
        .includes(query),
  );
  $("zoneCount").textContent = `${matches.length} ${t("zoneResults")}`;
  $("zoneList").innerHTML = matches.length
    ? matches
        .map(
          (zone) =>
            `<button class="zone-option" data-zone="${zone.code}"${zone.code === state.zone ? ' aria-current="true"' : ""}><span>${zone.code}</span><span><strong>${escapeHtml(zone.name)}</strong><small>${escapeHtml(zone.state)}</small></span></button>`,
        )
        .join("")
    : `<p class="muted">${t("noZones")}</p>`;
  $("favoritesSection").hidden = !state.favorites.length;
  $("favoriteZones").innerHTML = state.favorites
    .map(
      (code) =>
        `<button data-zone="${code}" title="${escapeHtml(zoneMeta(code).name)}">${code} · ${escapeHtml(zoneMeta(code).name.split(",")[0])}</button>`,
    )
    .join("");
}
function openDialog(id) {
  if (id === "locationDialog") {
    $("gpsStatus").textContent = "";
    $("locationSearch").value = "";
    $("stateSelect").value = "";
    renderZones();
  }
  $(id).showModal();
  if (id === "locationDialog") $("locationSearch").focus();
}
async function detectLocation() {
  if (!navigator.geolocation) {
    $("gpsStatus").textContent = t("gpsUnsupported");
    return;
  }
  const request = ++gpsRequest;
  $("detectBtn").disabled = true;
  $("gpsStatus").textContent = t("detecting");
  try {
    const position = await new Promise((resolve, reject) =>
      navigator.geolocation.getCurrentPosition(resolve, reject, {
        enableHighAccuracy: true,
        timeout: 12000,
        maximumAge: 0,
      }),
    );
    if (request !== gpsRequest) return;
    const code = await resolveGpsZone(
      position.coords.latitude,
      position.coords.longitude,
    );
    if (request !== gpsRequest) return;
    if (!zoneMeta(code)) {
      $("gpsStatus").textContent = t("gpsOutside");
      return;
    }
    $("locationDialog").close();
    useZone(code, "gpsLocation");
  } catch (error) {
    if (request === gpsRequest)
      $("gpsStatus").textContent = t(
        error?.code === 1 ? "gpsDenied" : "gpsError",
      );
  } finally {
    if (request === gpsRequest) $("detectBtn").disabled = false;
  }
}
function setTheme(dark) {
  document.body.classList.toggle("dark", dark);
  $("themeToggle").setAttribute("aria-checked", String(dark));
  document.querySelector('meta[name="theme-color"]').content = dark
    ? "#121c19"
    : "#174f43";
  save("ws_theme", dark ? "dark" : "light");
}
function applyLanguage() {
  document.documentElement.lang = state.lang;
  all("[data-i18n]").forEach(
    (element) => (element.textContent = t(element.dataset.i18n)),
  );
  all("[data-i18n-aria]").forEach((element) =>
    element.setAttribute("aria-label", t(element.dataset.i18nAria)),
  );
  all("[data-lang]").forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.lang === state.lang),
    ),
  );
  all("[data-format]").forEach((button) =>
    button.setAttribute(
      "aria-pressed",
      String(button.dataset.format === state.format),
    ),
  );
  $("themeToggle").setAttribute("aria-label", t("darkMode"));
  $("countdownValue").setAttribute("aria-label", t("timeRemaining"));
  $("locationSearch").placeholder = t("searchHint");
  const previousState = $("stateSelect").value;
  $("stateSelect").innerHTML =
    `<option value="">${t("allStates")}</option>${ZONE_DATA.map(({ state }) => `<option value="${escapeHtml(state)}">${escapeHtml(state)}</option>`).join("")}`;
  $("stateSelect").value = previousState;
  renderLocation();
  renderZones();
  renderDates();
  tick(true);
  setStatus();
  renderMonth();
  qibla.render();
  $("dataSource").textContent = state.busy
    ? t("loading")
    : state.error
      ? t("loadError")
      : state.cached
        ? t("cached")
        : state.source
          ? `${state.source} · ${t("liveData")}`
          : "—";
  // Update text without restarting the current month's request.
  $("pageTitle").innerHTML =
    `${escapeHtml(t(`${state.view}Title`))}<span>.</span>`;
  $("pageSubtitle").textContent = t(`${state.view}Subtitle`);
  $("breadcrumb").textContent = t(
    state.view === "home"
      ? "today"
      : state.view === "schedule"
        ? "monthly"
        : "qibla",
  );
  document.title = `${$("breadcrumb").textContent} · ${t("appName")}`;
}
async function installApp() {
  $("settingsDialog").close();
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    await prompt.prompt();
    await prompt.userChoice;
  } else openDialog("installDialog");
}
all("[data-view]").forEach((button) =>
  button.addEventListener("click", () => setView(button.dataset.view)),
);
all(".settings-trigger").forEach((button) =>
  button.addEventListener("click", () => openDialog("settingsDialog")),
);
all(".dialog-close").forEach((button) =>
  button.addEventListener("click", () => button.closest("dialog").close()),
);
all("dialog").forEach((dialog) =>
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog) {
      const rect = dialog.getBoundingClientRect();
      if (
        event.clientX < rect.left ||
        event.clientX > rect.right ||
        event.clientY < rect.top ||
        event.clientY > rect.bottom
      )
        dialog.close();
    }
  }),
);
$("locationDialog").addEventListener("close", () => {
  ++gpsRequest;
  $("detectBtn").disabled = false;
});
$("manualToggle").addEventListener("click", () => openDialog("locationDialog"));
$("locationSearch").addEventListener("input", renderZones);
$("stateSelect").addEventListener("change", renderZones);
$("locationDialog").addEventListener("click", (event) => {
  const button = event.target.closest("[data-zone]");
  if (button) {
    $("locationDialog").close();
    useZone(button.dataset.zone);
  }
});
$("detectBtn").addEventListener("click", detectLocation);
$("favoriteBtn").addEventListener("click", () => {
  state.favorites = state.favorites.includes(state.zone)
    ? state.favorites.filter((code) => code !== state.zone)
    : [...state.favorites, state.zone];
  save("ws_favorites", JSON.stringify(state.favorites));
  renderLocation();
  renderZones();
});
$("quickTheme").addEventListener("click", () =>
  setTheme(!document.body.classList.contains("dark")),
);
$("themeToggle").addEventListener("click", () =>
  setTheme(!document.body.classList.contains("dark")),
);
all("[data-lang]").forEach((button) =>
  button.addEventListener("click", () => {
    state.lang = button.dataset.lang;
    save("ws_lang", state.lang);
    applyLanguage();
  }),
);
all("[data-format]").forEach((button) =>
  button.addEventListener("click", () => {
    state.format = button.dataset.format;
    save("ws_timeFormat", state.format);
    applyLanguage();
  }),
);
$("prevMonth").addEventListener("click", () => changeMonth(-1));
$("nextMonth").addEventListener("click", () => changeMonth(1));
$("thisMonth").addEventListener("click", () => {
  state.month = dateKey().slice(0, 7);
  showMonth();
});
$("retryBtn").addEventListener("click", () =>
  useZone(state.zone, state.locationSource, true),
);
$("monthRetry").addEventListener("click", () => showMonth(true));
$("refreshData").addEventListener("click", () => {
  $("settingsDialog").close();
  useZone(state.zone, state.locationSource, true);
});
$("compassBtn").addEventListener("click", qibla.enable);
all(".install-trigger").forEach((button) =>
  button.addEventListener("click", installApp),
);
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  installPrompt = event;
});
window.addEventListener("appinstalled", () => {
  installPrompt = null;
  $("installDialog").close();
});
window.addEventListener("offline", setStatus);
window.addEventListener("online", () => {
  setStatus();
  if (state.error) useZone(state.zone, state.locationSource);
  if (state.monthError && state.view === "schedule") showMonth();
});
const viewFromHash = () =>
  ({ "#jadual": "schedule", "#kiblat": "qibla" })[location.hash] || "home";
window.addEventListener("hashchange", () => setView(viewFromHash(), false));
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  $("main").focus();
  $("main").scrollIntoView();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) tick(true);
});
setTheme(
  read("ws_theme")
    ? read("ws_theme") === "dark"
    : window.matchMedia("(prefers-color-scheme: dark)").matches,
);
applyLanguage();
setView(viewFromHash(), false);
useZone(state.zone, state.locationSource);
setInterval(tick, 1000);
if ("serviceWorker" in navigator) {
  const hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController && !reloading) {
      reloading = true;
      location.reload();
    }
  });
  navigator.serviceWorker
    .register("./service-worker.js")
    .then((registration) => registration.update())
    .catch(() => {});
}
