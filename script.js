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
import { createCalendarView } from "./islamic-calendar-view.js";
import { createEventCountdown } from "./event-countdown.js";
import { toHijri, MONTH_NAMES } from "./islamic-calendar.js";
import {
  createLocationController,
  requestPosition,
  reverseGeocodePosition,
} from "./location-service.js";

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
    calendar: "Kalendar Islam",
    calendarShort: "Kalendar",
    calendarTitle: "Setiap tarikh, ada makna",
    calendarSubtitle: "Takwim Hijrah, hari istimewa dan penukar tarikh anda.",
    eventEyebrow: "MENANTI HARI ISTIMEWA",
    openCalendar: "Buka kalendar Islam",
    otherEvents: "Dalam takwim",
    days: "HARI",
    eventTimeRemaining: "Masa berbaki ke acara Islam",
    eventCountdownNote:
      "Kiraan ke 00:00 MYT pada tarikh kalendar. Hari Hijrah bermula selepas Maghrib. * Tarikh anggaran.",
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
    dataFrom: "Waktu",
    locationFrom: "Lokasi",
    schedule: "Jadual",
    qiblaShort: "Kiblat",
    yourLocation: "LOKASI ANDA",
    chooseLocation: "Pilih lokasi solat",
    close: "Tutup",
    detect: "Kesan lokasi saya",
    gpsPrivacy:
      "Koordinat GPS dikongsi dengan BigDataCloud dan API Waktu Solat untuk nama kawasan dan zon. Waktu solat daripada JAKIM.",
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
    estimatedHijri: "Anggaran hisab Hijrah",
    publishedHijri: "Takwim terbitan JAKIM",
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
    myLocation: "Lokasi saya",
    autoLocation: "Lokasi automatik",
    autoLocationHelp:
      "Semak lokasi semasa apabila aplikasi dibuka atau aktif semula. Pilihan zon manual menghentikan mod automatik.",
    autoActive: "Auto aktif",
    manualActive: "Zon manual",
    gpsResolving: "Mengenal pasti zon solat anda…",
    gpsSuccess:
      "Zon mengikut lokasi semasa. Lokasi diperiksa semula semasa aplikasi aktif.",
    gpsTimeout:
      "Lokasi mengambil masa terlalu lama. Pastikan GPS aktif, kemudian cuba lagi atau pilih zon.",
    gpsLowAccuracy:
      "Bacaan lokasi terlalu umum untuk memilih zon dengan yakin. Cuba di luar bangunan atau pilih zon secara manual.",
    gpsFallback:
      "Zon yang dipaparkan belum disahkan sebagai lokasi anda. Gunakan lokasi saya atau pilih zon.",
    gpsPermissionHelp:
      "Benarkan lokasi dalam tetapan pelayar atau pilih zon secara manual.",
    distanceKaaba: "Jarak anggaran ke Kaabah",
    realtimeQibla: "Panduan kompas masa nyata",
    qiblaStop: "Hentikan kompas",
    installFailed:
      "Pemasangan tidak dapat dimulakan. Gunakan menu pelayar untuk memasang aplikasi.",
    installed: "Aplikasi telah dipasang",
    autoPaused: "Auto dijeda",
    currentGps: "Lokasi GPS semasa",
    prayerZone: "Zon waktu JAKIM",
    unconfirmedZone: "Jadual JAKIM dipaparkan · lokasi belum disahkan",
    gpsPreviousSchedule:
      "Waktu masih untuk zon {zone}; lokasi semasa belum disahkan.",
    onMap: "Lihat lokasi pada peta",
    gpsAmbiguous:
      "Lokasi berada dalam kawasan yang mempunyai beberapa zon atau zon khas. Sahkan zon secara manual untuk waktu JAKIM yang betul.",
  },
  en: {
    skip: "Skip to content",
    menu: "YOUR DAILY SPACE",
    today: "Today",
    monthly: "Monthly schedule",
    qibla: "Qibla direction",
    settings: "Settings",
    calendar: "Islamic calendar",
    calendarShort: "Calendar",
    calendarTitle: "Every date has a meaning",
    calendarSubtitle:
      "Your Hijri calendar, important occasions and date converter.",
    eventEyebrow: "LOOKING FORWARD",
    openCalendar: "Open Islamic calendar",
    otherEvents: "On the calendar",
    days: "DAYS",
    eventTimeRemaining: "Time remaining until the Islamic occasion",
    eventCountdownNote:
      "Counts down to 00:00 MYT on the calendar date. Hijri days begin after Maghrib. * Estimated date.",
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
    dataFrom: "Prayer times",
    locationFrom: "Location",
    schedule: "Schedule",
    qiblaShort: "Qibla",
    yourLocation: "YOUR LOCATION",
    chooseLocation: "Choose prayer location",
    close: "Close",
    detect: "Detect my location",
    gpsPrivacy:
      "GPS coordinates are shared with BigDataCloud and the Waktu Solat API for place names and zones. Prayer times come from JAKIM.",
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
    estimatedHijri: "Calculated Hijri estimate",
    publishedHijri: "Published JAKIM calendar",
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
    myLocation: "My location",
    autoLocation: "Automatic location",
    autoLocationHelp:
      "Check your current location when the app opens or becomes active again. Choosing a manual zone stops automatic mode.",
    autoActive: "Auto on",
    manualActive: "Manual zone",
    gpsResolving: "Finding your prayer zone…",
    gpsSuccess:
      "Zone based on your current location. Your location is rechecked while the app is active.",
    gpsTimeout:
      "Getting your location took too long. Check that GPS is enabled, then retry or choose a zone.",
    gpsLowAccuracy:
      "This location reading is too approximate to choose a zone confidently. Try outdoors or select a zone manually.",
    gpsFallback:
      "The displayed zone has not been confirmed as your location. Use My location or choose a zone.",
    gpsPermissionHelp:
      "Allow location in your browser settings or choose a zone manually.",
    distanceKaaba: "Approximate distance to the Kaaba",
    realtimeQibla: "Real-time compass guidance",
    qiblaStop: "Stop compass",
    installFailed:
      "Installation could not start. Use your browser menu to install the app.",
    installed: "App installed",
    autoPaused: "Auto paused",
    currentGps: "Current GPS location",
    prayerZone: "JAKIM prayer zone",
    unconfirmedZone: "Displayed JAKIM schedule · location unconfirmed",
    gpsPreviousSchedule:
      "Times still use {zone}; your current location is unconfirmed.",
    onMap: "View location on map",
    gpsAmbiguous:
      "This area has multiple or special prayer zones. Confirm your zone manually for the correct JAKIM schedule.",
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
  locationMode:
    read("ws_locationMode") || (zoneMeta(savedZone) ? "manual" : "auto"),
  locationStatus: { status: "idle" },
  locationConfirmed: false,
  position: null,
  place: null,
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
const qibla = createQibla({
  getLanguage: () => state.lang,
  getPosition: requestPosition,
});
const calendarView = createCalendarView({ getLanguage: () => state.lang });
const eventCountdown = createEventCountdown({ getLanguage: () => state.lang });
let dailyRequest = 0,
  monthRequest = 0,
  installPrompt = null;
let dialogLocationSnapshot = null;
const locationController = createLocationController({
  resolveZone: resolveGpsZone,
  getPlace: (position, options) =>
    reverseGeocodePosition(position, { ...options, language: state.lang }),
  onPosition: (position, place) => {
    state.position = position;
    state.place = place;
    state.locationConfirmed = false;
    renderLocation();
  },
  onState: (status) => {
    state.locationStatus = status;
    if (status.status === "locating") state.locationConfirmed = false;
    // A completed failure keeps the real GPS reading visible for the user.
    if (status.status === "error") dialogLocationSnapshot = null;
    renderLocation();
  },
  onZone: (code) => {
    if (!zoneMeta(code))
      throw Object.assign(new Error("Unknown prayer zone"), {
        code: "outside-malaysia",
      });
    state.locationMode = "auto";
    state.locationConfirmed = true;
    save("ws_locationMode", "auto");
    dialogLocationSnapshot = null;
    if ($("locationDialog").open) $("locationDialog").close();
    if (code === state.zone && state.days.length && !state.error) {
      state.locationSource = "gpsLocation";
      save("ws_lastZone", code);
      renderLocation();
    } else useZone(code, "gpsLocation");
  },
});

function renderLocationFeedback() {
  const status = state.locationStatus;
  const busy = ["locating", "resolving"].includes(status.status);
  let key =
    status.status === "locating"
      ? "detecting"
      : status.status === "resolving"
        ? "gpsResolving"
        : "";
  if (status.status === "error") {
    key =
      status.code === 1
        ? "gpsPermissionHelp"
        : status.code === 3
          ? "gpsTimeout"
          : status.code === "low-accuracy"
            ? "gpsLowAccuracy"
            : status.code === "unsupported"
              ? "gpsUnsupported"
              : [
                    "outside-malaysia",
                    "unknown-zone",
                    "OUTSIDE_MALAYSIA",
                  ].includes(status.code)
                ? "gpsOutside"
                : status.code === "AMBIGUOUS_ZONE"
                  ? "gpsAmbiguous"
                  : "gpsError";
  } else if (status.status === "success" && state.locationMode === "auto")
    key = "gpsSuccess";
  else if (
    !busy &&
    (state.locationSource === "defaultLocation" ||
      (state.locationMode === "auto" && !state.locationConfirmed))
  )
    key = "gpsFallback";
  const message = key
    ? t(key) +
      (status.status === "error" && state.locationMode === "auto"
        ? ` ${t("gpsPreviousSchedule").replace("{zone}", state.zone)}`
        : "")
    : "";
  $("locationFeedback").hidden = !key;
  $("locationFeedback").dataset.state = status.status;
  $("locationFeedbackText").textContent = message;
  $("gpsStatus").textContent = message;
  for (const id of ["detectBtn", "locateBtn"]) {
    $(id).disabled = busy;
    $(id).setAttribute("aria-busy", String(busy));
  }
  $("locationModeBadge").textContent = t(
    state.locationMode === "auto"
      ? status.status === "error"
        ? "autoPaused"
        : "autoActive"
      : "manualActive",
  );
  $("locationModeBadge").hidden =
    state.locationSource === "defaultLocation" && !busy;
  $("autoLocationToggle").setAttribute(
    "aria-checked",
    String(state.locationMode === "auto"),
  );
  $("autoLocationToggle").setAttribute("aria-label", t("autoLocation"));
}

function chooseManualZone(code) {
  locationController.cancel();
  state.locationMode = "manual";
  state.locationStatus = { status: "idle" };
  state.locationConfirmed = false;
  state.position = null;
  state.place = null;
  dialogLocationSnapshot = null;
  save("ws_locationMode", "manual");
  $("locationDialog").close();
  useZone(code, "manualLocation");
  renderLocationFeedback();
}

function cancelDialogLocation() {
  if (!dialogLocationSnapshot) return;
  locationController.cancel();
  Object.assign(state, dialogLocationSnapshot);
  dialogLocationSnapshot = null;
  save("ws_locationMode", state.locationMode);
  renderLocation();
}

function closeDialog(dialog) {
  if (dialog.id === "locationDialog") cancelDialogLocation();
  dialog.close();
}

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
  const place = state.place;
  const actualLocation = state.position && state.locationMode === "auto";
  const placeName = place
    ? [...new Set([place.locality, place.city].filter(Boolean))].join(", ")
    : t("currentGps");
  $("locationName").textContent = actualLocation
    ? placeName || t("currentGps")
    : zone?.name || state.zone;
  $("locationName").title = $("locationName").textContent;
  $("zoneBadge").textContent = state.zone;
  $("locationMeta").textContent = actualLocation
    ? [place?.state, place?.country].filter(Boolean).join(", ") ||
      t("currentGps")
    : `${t(state.locationSource)} · ${zone?.state || "Malaysia"}`;
  $("prayerZoneName").textContent =
    `${t(state.locationMode === "auto" && !state.locationConfirmed ? "unconfirmedZone" : "prayerZone")} · ${state.zone} — ${zone?.name || "Malaysia"}`;
  $("locationCoordinates").hidden = !actualLocation;
  $("currentLocationMap").hidden = !actualLocation;
  if (actualLocation) {
    const { latitude, longitude, accuracy } = state.position.coords;
    $("locationCoordinates").textContent =
      `${latitude.toFixed(5)}, ${longitude.toFixed(5)} · GPS ±${Math.round(accuracy)} m`;
    $("currentLocationMap").href =
      `https://www.openstreetmap.org/?mlat=${latitude}&mlon=${longitude}#map=17/${latitude}/${longitude}`;
    $("currentLocationMap").textContent = t("onMap");
  }
  const favored = state.favorites.includes(state.zone);
  $("favoriteBtn").setAttribute("aria-pressed", String(favored));
  $("favoriteBtn").setAttribute(
    "aria-label",
    t(favored ? "removeFavorite" : "saveFavorite"),
  );
  $("favoriteBtn").title = t(favored ? "removeFavorite" : "saveFavorite");
  $("manualToggle").setAttribute("aria-label", t("changeLocation"));
  renderLocationFeedback();
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
    const converted = toHijri(dateKey(now));
    $("hijriDate").textContent =
      `${converted.day} ${MONTH_NAMES[state.lang][converted.month - 1]} ${converted.year} H`;
    $("hijriSource").textContent = t(
      converted.estimated ? "estimatedHijri" : "publishedHijri",
    );
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
  eventCountdown.tick(now, force);
  if (state.view === "calendar") calendarView.tick(now);
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
  if (!["home", "schedule", "qibla", "calendar"].includes(view)) view = "home";
  if (state.view === "qibla" && view !== "qibla") qibla.stop();
  state.view = view;
  document.body.classList.toggle("calendar-open", view === "calendar");
  document.body.classList.toggle("qibla-open", view === "qibla");
  document.body.classList.toggle("schedule-open", view === "schedule");
  for (const name of ["home", "schedule", "qibla", "calendar"])
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
    view === "home" ? "today" : view === "schedule" ? "monthly" : view,
  );
  document.title = `${$("breadcrumb").textContent} · ${t("appName")}`;
  if (updateHash) {
    history.pushState(
      null,
      "",
      `#${{ home: "hari-ini", schedule: "jadual", qibla: "kiblat", calendar: "kalendar" }[view]}`,
    );
    window.scrollTo(0, 0);
    $("main").focus({ preventScroll: true });
  }
  if (view === "schedule") showMonth();
  if (view === "calendar") calendarView.render();
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
  if (id === "installDialog") $("installStatus").textContent = "";
  $(id).showModal();
  if (id === "locationDialog") $("locationSearch").focus();
}
async function detectLocation({ automatic = false } = {}) {
  if (
    automatic &&
    (state.locationMode !== "auto" ||
      document.hidden ||
      state.locationStatus.code === 1)
  )
    return;
  if (!automatic) {
    if ($("locationDialog").open && !dialogLocationSnapshot) {
      dialogLocationSnapshot = {
        locationMode: state.locationMode,
        locationSource: state.locationSource,
        locationStatus: state.locationStatus,
        locationConfirmed: state.locationConfirmed,
        position: state.position,
        place: state.place,
      };
    }
    state.locationMode = "auto";
    save("ws_locationMode", "auto");
  }
  await locationController.detect({ automatic });
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
  calendarView.render();
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
        : state.view,
  );
  document.title = `${$("breadcrumb").textContent} · ${t("appName")}`;
}
async function installApp() {
  $("settingsDialog").close();
  if (
    window.matchMedia("(display-mode: standalone)").matches ||
    navigator.standalone === true
  ) {
    openDialog("installDialog");
    $("installStatus").textContent = t("installed");
    return;
  }
  if (installPrompt) {
    const prompt = installPrompt;
    installPrompt = null;
    try {
      await prompt.prompt();
      await prompt.userChoice;
    } catch {
      openDialog("installDialog");
      $("installStatus").textContent = t("installFailed");
    }
  } else openDialog("installDialog");
}
all("[data-view]").forEach((button) =>
  button.addEventListener("click", () => setView(button.dataset.view)),
);
$("eventCountdownLink").addEventListener("click", () => {
  const date = eventCountdown.targetDate();
  if (date) calendarView.showDate(date);
});
all(".settings-trigger").forEach((button) =>
  button.addEventListener("click", () => openDialog("settingsDialog")),
);
all(".dialog-close").forEach((button) =>
  button.addEventListener("click", () => closeDialog(button.closest("dialog"))),
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
        closeDialog(dialog);
    }
  }),
);
// Escape cancellation runs before the queued close event, so a fast API reply
// cannot complete the cancelled selection in between those two browser events.
$("locationDialog").addEventListener("cancel", cancelDialogLocation);
$("locationDialog").addEventListener("close", cancelDialogLocation);
$("manualToggle").addEventListener("click", () => openDialog("locationDialog"));
$("locationSearch").addEventListener("input", renderZones);
$("stateSelect").addEventListener("change", renderZones);
$("locationDialog").addEventListener("click", (event) => {
  const button = event.target.closest("[data-zone]");
  if (button) {
    chooseManualZone(button.dataset.zone);
  }
});
$("detectBtn").addEventListener("click", () => detectLocation());
$("locateBtn").addEventListener("click", () => detectLocation());
$("autoLocationToggle").addEventListener("click", () => {
  if (state.locationMode === "auto") {
    locationController.cancel();
    state.locationMode = "manual";
    state.locationSource = "manualLocation";
    state.locationStatus = { status: "idle" };
    state.locationConfirmed = false;
    state.position = null;
    state.place = null;
    dialogLocationSnapshot = null;
    save("ws_locationMode", "manual");
    renderLocation();
  } else {
    $("settingsDialog").close();
    detectLocation();
  }
});
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
  detectLocation({ automatic: true });
});
const viewFromHash = () =>
  ({ "#jadual": "schedule", "#kiblat": "qibla", "#kalendar": "calendar" })[
    location.hash
  ] || "home";
window.addEventListener("hashchange", () => setView(viewFromHash(), false));
document.querySelector(".skip-link").addEventListener("click", (event) => {
  event.preventDefault();
  $("main").focus();
  $("main").scrollIntoView();
});
document.addEventListener("visibilitychange", () => {
  if (!document.hidden) {
    tick(true);
    detectLocation({ automatic: true });
  }
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
detectLocation({ automatic: true });
setInterval(() => detectLocation({ automatic: true }), 5 * 60 * 1000);
window.addEventListener("pagehide", () => {
  locationController.cancel();
  if (["locating", "resolving"].includes(state.locationStatus.status)) {
    state.locationStatus = { status: "idle" };
    renderLocation();
  }
});
window.addEventListener("pageshow", (event) => {
  if (event.persisted) {
    tick(true);
    detectLocation({ automatic: true });
  }
});
if ("serviceWorker" in navigator) {
  let hadController = Boolean(navigator.serviceWorker.controller);
  let reloading = false;
  navigator.serviceWorker.addEventListener("controllerchange", () => {
    if (hadController && !reloading) {
      reloading = true;
      location.reload();
    }
    hadController = true;
  });
  navigator.serviceWorker
    .register("./service-worker.js")
    .then((registration) => registration.update())
    .catch(() => {});
}
