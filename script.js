const PRAYER_KEYS = ["subuh", "syuruk", "zohor", "asar", "maghrib", "isyak"];
const KAABA = { lat: 21.4225, lon: 39.8262 };
const I18N = {
  ms: {
    title: "Waktu Solat Malaysia",
    detect: "Detect Lokasi Saya",
    manual: "Pilih Lokasi Secara Manual",
    notify: "Aktifkan Notifikasi Azan",
    notifyOn: "Notifikasi Aktif",
    notifyOff: "Aktifkan Notifikasi Azan",
    locationUnset: "Belum ditetapkan",
    locationHint: "Sila kesan lokasi atau pilih manual.",
    locationDetected: "Lokasi dikesan",
    locationManual: "Lokasi dipilih manual",
    locationDenied: "Lokasi tidak dibenarkan - sila pilih manual",
    statusUnset: "Lokasi belum dipilih",
    statusUnsupported: "Lokasi tidak disokong",
    statusDetecting: "Mengesan lokasi...",
    statusFail: "Gagal menentukan zon. Sila pilih manual.",
    nextPrayer: "Waktu Solat Seterusnya",
    countdown: "Kiraan Masa",
    currentTime: "Masa Semasa",
    gregorianLabel: "Tarikh Masihi",
    hijriLabel: "Tarikh Hijrah",
    qiblaTitle: "Kompas Kiblat",
    qiblaHeading: "Arah Kaabah",
    qiblaHint: "Aktifkan kompas dan benarkan lokasi untuk ketepatan terbaik.",
    qiblaNeedLocation: "Lokasi diperlukan untuk kiraan kiblat.",
    qiblaActive: "Kompas aktif. Halakan anak panah ke Kaabah.",
    qiblaStatic: "Arah kiblat dikira daripada lokasi semasa.",
    qiblaHelp: "Cara guna: Pegang telefon rata. Arah anak panah menunjuk ke Kaabah.",
    compassOn: "Aktifkan Kompas",
    qiblaIndicatorActive: "Aktif & dikalibrasi",
    qiblaIndicatorInactive: "Tidak aktif",
    settingsTitle: "Tetapan",
    settingsButton: "Tetapan",
    prayerLabels: ["Subuh", "Syuruk", "Zohor", "Asar", "Maghrib", "Isyak"],
  },
  en: {
    title: "Malaysia Prayer Times",
    detect: "Detect My Location",
    manual: "Choose Manual Location",
    notify: "Enable Adhan Alerts",
    notifyOn: "Alerts Enabled",
    notifyOff: "Enable Adhan Alerts",
    locationUnset: "Not set yet",
    locationHint: "Please detect location or select manually.",
    locationDetected: "Location detected",
    locationManual: "Manual location selected",
    locationDenied: "Location blocked - select manually",
    statusUnset: "Location not set",
    statusUnsupported: "Location not supported",
    statusDetecting: "Detecting location...",
    statusFail: "Unable to determine zone. Please select manually.",
    nextPrayer: "Next Prayer",
    countdown: "Countdown",
    currentTime: "Current Time",
    gregorianLabel: "Gregorian Date",
    hijriLabel: "Hijri Date",
    qiblaTitle: "Qibla Compass",
    qiblaHeading: "Direction to Kaaba",
    qiblaHint: "Enable compass and allow location for best accuracy.",
    qiblaNeedLocation: "Location needed to calculate Qibla.",
    qiblaActive: "Compass active. Point the arrow to Kaaba.",
    qiblaStatic: "Qibla direction calculated from your location.",
    qiblaHelp: "How to use: Keep your phone flat. The arrow points to the Kaaba.",
    compassOn: "Enable Compass",
    qiblaIndicatorActive: "Active & calibrated",
    qiblaIndicatorInactive: "Inactive",
    settingsTitle: "Settings",
    settingsButton: "Settings",
    prayerLabels: ["Fajr", "Sunrise", "Dhuhr", "Asr", "Maghrib", "Isha"],
  },
};

const ZONE_DATA = [
  {
    state: "Johor",
    zones: [
      { code: "JHR01", name: "Pulau Aur dan Pulau Pemanggil" },
      { code: "JHR02", name: "Johor Bahru, Kota Tinggi, Mersing, Kulai" },
      { code: "JHR03", name: "Kluang, Pontian" },
      { code: "JHR04", name: "Batu Pahat, Muar, Segamat, Gemas Johor, Tangkak" },
    ],
  },
  {
    state: "Kedah",
    zones: [
      { code: "KDH01", name: "Kota Setar, Kubang Pasu, Pokok Sena" },
      { code: "KDH02", name: "Kuala Muda, Yan, Pendang" },
      { code: "KDH03", name: "Padang Terap, Sik" },
      { code: "KDH04", name: "Baling" },
      { code: "KDH05", name: "Bandar Baharu, Kulim" },
      { code: "KDH06", name: "Langkawi" },
      { code: "KDH07", name: "Puncak Gunung Jerai" },
    ],
  },
  {
    state: "Kelantan",
    zones: [
      { code: "KTN01", name: "Bachok, Kota Bharu, Machang, Pasir Mas, Pasir Puteh, Tanah Merah, Tumpat" },
      { code: "KTN02", name: "Gua Musang, Jeli, Kuala Krai, Mukim Chiku" },
    ],
  },
  {
    state: "Melaka",
    zones: [{ code: "MLK01", name: "Bandar Melaka, Alor Gajah, Jasin, Masjid Tanah, Merlimau, Nyalas" }],
  },
  {
    state: "Negeri Sembilan",
    zones: [
      { code: "NGS01", name: "Jempol, Tampin" },
      { code: "NGS02", name: "Jelebu, Kuala Pilah, Port Dickson, Rembau, Seremban" },
      { code: "NGS03", name: "Gemis, Jempol" },
    ],
  },
  {
    state: "Pahang",
    zones: [
      { code: "PHG01", name: "Pulau Tioman" },
      { code: "PHG02", name: "Kuantan, Pekan, Rompin, Muadzam Shah" },
      { code: "PHG03", name: "Maran, Chenor, Temerloh, Bera, Jerantut" },
      { code: "PHG04", name: "Bentong, Lipis, Raub" },
      { code: "PHG05", name: "Genting Sempah, Janda Baik, Bukit Tinggi" },
      { code: "PHG06", name: "Cameron Highlands, Genting Highlands, Bukit Fraser" },
      { code: "PHG07", name: "Cameron Highlands (Tanah Rata)" },
    ],
  },
  {
    state: "Perlis",
    zones: [{ code: "PLS01", name: "Kangar, Padang Besar, Arau" }],
  },
  {
    state: "Pulau Pinang",
    zones: [{ code: "PNG01", name: "Seluruh Negeri Pulau Pinang" }],
  },
  {
    state: "Perak",
    zones: [
      { code: "PRK01", name: "Tapah, Slim River, Tanjung Malim" },
      { code: "PRK02", name: "Ipoh, Batu Gajah, Kampar, Sg. Siput, Kuala Kangsar" },
      { code: "PRK03", name: "Lenggong, Pengkalan Hulu, Grik" },
      { code: "PRK04", name: "Temengor, Belum" },
      { code: "PRK05", name: "Teluk Intan, Bagan Datuk, Kg. Gajah, Seri Iskandar, Beruas, Parit, Lumut, Sitiawan, Pulau Pangkor" },
      { code: "PRK06", name: "Selama, Taiping, Bagan Serai, Parit Buntar" },
      { code: "PRK07", name: "Bukit Larut" },
    ],
  },
  {
    state: "Sabah",
    zones: [
      { code: "SBH01", name: "Bahagian Sandakan (Timur), Bukit Garam, Semawang, Temanggong, Tambisan" },
      { code: "SBH02", name: "Beluran, Telupid, Pinangah, Terusan, Kuamut, Bahagian Sandakan (Barat)" },
      { code: "SBH03", name: "Lahad Datu, Silabukan, Kunak, Sahabat, Semporna, Tungku" },
      { code: "SBH04", name: "Bandar Tawau, Balong, Merotai, Kalabakan, Bahagian Tawau (Timur)" },
      { code: "SBH05", name: "Kudat, Kota Marudu, Pitas, Pulau Banggi, Bahagian Kudat" },
      { code: "SBH06", name: "Gunung Kinabalu" },
      { code: "SBH07", name: "Kota Kinabalu, Penampang, Tuaran, Papar, Kota Belud, Ranau" },
      { code: "SBH08", name: "Pensiangan, Keningau, Tambunan, Nabawan, Bahagian Pendalaman (Atas)" },
      { code: "SBH09", name: "Beaufort, Kuala Penyu, Sipitang, Tenom, Long Pasia, Membakut, Weston, Bahagian Pendalaman (Bawah)" },
    ],
  },
  {
    state: "Selangor",
    zones: [
      { code: "SGR01", name: "Gombak, Petaling, Sepang, Hulu Langat, Hulu Selangor, Shah Alam" },
      { code: "SGR02", name: "Kuala Selangor, Sabak Bernam" },
      { code: "SGR03", name: "Klang, Kuala Langat" },
    ],
  },
  {
    state: "Sarawak",
    zones: [
      { code: "SWK01", name: "Kuching, Bau, Lundu, Sematan" },
      { code: "SWK02", name: "Sri Aman, Simunjan, Lingga, Sebuyau, Sadong Jaya" },
      { code: "SWK03", name: "Sibu, Mukah, Dalat, Song, Igan, Oya, Balingian, Kanowit, Kapit" },
      { code: "SWK04", name: "Miri, Niah, Bekenu, Sibuti, Marudi" },
      { code: "SWK05", name: "Limbang, Lawas, Sundar, Trusan" },
      { code: "SWK06", name: "Bintulu, Tatau, Sebauh" },
      { code: "SWK07", name: "Kapit, Belaga" },
      { code: "SWK08", name: "Sarikei, Matu, Julau, Rajang, Daro, Bintangor, Belawai" },
      { code: "SWK09", name: "Asajaya, Beladin, Belawai, Betong, Debak, Kabong, Lingga, Pusa, Roban, Saratok, Spaoh" },
    ],
  },
  {
    state: "Terengganu",
    zones: [
      { code: "TRG01", name: "Kuala Terengganu, Marang, Kuala Nerus" },
      { code: "TRG02", name: "Besut, Setiu" },
      { code: "TRG03", name: "Hulu Terengganu" },
      { code: "TRG04", name: "Dungun, Kemaman" },
    ],
  },
  {
    state: "Wilayah Persekutuan",
    zones: [
      { code: "WLY01", name: "Kuala Lumpur, Putrajaya" },
      { code: "WLY02", name: "Labuan" },
    ],
  },
];

const els = {
  gregorianDate: document.getElementById("gregorianDate"),
  hijriDate: document.getElementById("hijriDate"),
  locationStatus: document.getElementById("locationStatus"),
  locationName: document.getElementById("locationName"),
  locationMeta: document.getElementById("locationMeta"),
  detectBtn: document.getElementById("detectBtn"),
  manualToggle: document.getElementById("manualToggle"),
  manualPanel: document.getElementById("manualPanel"),
  stateSelect: document.getElementById("stateSelect"),
  zoneSelect: document.getElementById("zoneSelect"),
  applyZone: document.getElementById("applyZone"),
  manualHint: document.getElementById("manualHint"),
  prayerGrid: document.getElementById("prayerGrid"),
  nextPrayerName: document.getElementById("nextPrayerName"),
  nextPrayerTime: document.getElementById("nextPrayerTime"),
  countdownValue: document.getElementById("countdownValue"),
  currentTime: document.getElementById("currentTime"),
  themeToggle: document.getElementById("themeToggle"),
  langSelect: document.getElementById("langSelect"),
  langLabel: document.getElementById("langLabel"),
  langToggle: document.getElementById("langToggle"),
  langMs: document.getElementById("langMs"),
  langEn: document.getElementById("langEn"),
  notifyBtn: document.getElementById("notifyBtn"),
  gregorianLabel: document.getElementById("gregorianLabel"),
  hijriLabel: document.getElementById("hijriLabel"),
  compassBtn: document.getElementById("compassBtn"),
  settingsBtn: document.getElementById("settingsBtn"),
  settingsModal: document.getElementById("settingsModal"),
  settingsClose: document.getElementById("settingsClose"),
  settingsTitle: document.getElementById("settingsTitle"),
  settingsBtnLabel: document.getElementById("settingsBtnLabel"),
  qiblaLabel: document.getElementById("qiblaLabel"),
  qiblaTitleEl: document.getElementById("qiblaTitle"),
  qiblaHelp: document.getElementById("qiblaHelp"),
  clearCacheBtn: document.getElementById("clearCacheBtn"),
  qiblaNeedle: document.getElementById("qiblaNeedle"),
  qiblaAngle: document.getElementById("qiblaAngle"),
  qiblaStatus: document.getElementById("qiblaStatus"),
  qiblaIndicator: document.getElementById("qiblaIndicator"),
  heroTitle: document.getElementById("heroTitle"),
  clockHour: document.getElementById("clockHour"),
  clockMinute: document.getElementById("clockMinute"),
  clockSecond: document.getElementById("clockSecond"),
};

const state = {
  zoneCode: null,
  zoneName: null,
  stateName: null,
  coords: null,
  monthlyData: [],
  todayTimes: null,
  nextPrayer: null,
  countdownTimer: null,
  clockTimer: null,
  compassActive: false,
  qiblaBearing: null,
  lang: "ms",
  notifyEnabled: false,
  lastNotified: null,
  hijriOffsetDays: -2,
  detectedStateName: "",
};

function todayKey() {
  const now = new Date();
  return now.toISOString().slice(0, 10);
}

function formatGregorian() {
  const now = new Date();
  const locale = state.lang === "en" ? "en-MY" : "ms-MY";
  els.gregorianDate.textContent = new Intl.DateTimeFormat(locale, {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  }).format(now);
}

function formatHijri() {
  updateHijriDate();
}

function updateHijriDate() {
  const now = new Date();
  let hijriBase = now;
  if (state.todayTimes?.maghrib) {
    const key = todayKey();
    const maghribTime = timeToDate(key, state.todayTimes.maghrib);
    if (maghribTime && now >= maghribTime) {
      hijriBase = new Date(now);
      hijriBase.setDate(hijriBase.getDate() + 1);
    }
  }
  if (state.hijriOffsetDays) {
    hijriBase = new Date(hijriBase);
    hijriBase.setDate(hijriBase.getDate() + state.hijriOffsetDays);
  }
  try {
    els.hijriDate.textContent = new Intl.DateTimeFormat("ar-SA-u-ca-islamic", {
      day: "numeric",
      month: "long",
      year: "numeric",
    }).format(hijriBase);
  } catch (error) {
    els.hijriDate.textContent = "—";
  }
}

function setStatus(text, type = "info") {
  els.locationStatus.textContent = text;
  els.locationStatus.dataset.type = type;
}

function buildPrayerCards() {
  els.prayerGrid.innerHTML = "";
  const labels = I18N[state.lang].prayerLabels;
  labels.forEach((label, index) => {
    const card = document.createElement("div");
    card.className = "prayer-card";
    card.dataset.key = PRAYER_KEYS[index];
    card.innerHTML = `
      <div>
        <p class="prayer-name">${label}</p>
      </div>
      <div class="prayer-time">--:--</div>
    `;
    els.prayerGrid.appendChild(card);
  });
}

function setLocationDisplay() {
  if (!state.zoneCode) {
    els.locationName.textContent = I18N[state.lang].locationUnset;
    els.locationMeta.textContent = I18N[state.lang].locationHint;
    return;
  }
  els.locationName.textContent = state.zoneName || state.zoneCode;
  els.locationMeta.textContent = `${state.stateName || "Malaysia"} Â· ${state.zoneCode}`;
}

function updateHeroTitle() {
  if (!els.heroTitle) return;
  const primary = state.detectedStateName?.trim();
  const fallback = state.stateName?.trim() || state.zoneName?.trim();
  const label = primary || fallback;
  els.heroTitle.textContent = label ? `Waktu Solat, ${label}` : "Waktu Solat";
}

function cacheLastTimes(dateKeyValue, times) {
  if (!dateKeyValue || !times) return;
  const payload = {
    date: dateKeyValue,
    times,
    zoneCode: state.zoneCode,
    zoneName: state.zoneName,
    stateName: state.stateName,
  };
  localStorage.setItem("ws_lastTimes", JSON.stringify(payload));
}

function applyCachedTimes() {
  const cached = localStorage.getItem("ws_lastTimes");
  if (!cached) return false;
  try {
    const parsed = JSON.parse(cached);
    if (!parsed?.times) return false;
    state.todayTimes = parsed.times;
    renderPrayerTimes(state.todayTimes);
    updateCurrentPrayer();
    renderNextPrayer();
    startCountdown();
    updateHijriDate();
    return true;
  } catch (error) {
    localStorage.removeItem("ws_lastTimes");
    return false;
  }
}

function populateStates() {
  ZONE_DATA.forEach((entry) => {
    const option = document.createElement("option");
    option.value = entry.state;
    option.textContent = entry.state;
    els.stateSelect.appendChild(option);
  });
}

function populateZones(stateName) {
  const stateEntry = ZONE_DATA.find((entry) => entry.state === stateName);
  els.zoneSelect.innerHTML = '<option value="">Pilih zon</option>';
  if (!stateEntry) {
    els.zoneSelect.disabled = true;
    return;
  }
  stateEntry.zones.forEach((zone) => {
    const option = document.createElement("option");
    option.value = zone.code;
    option.textContent = `${zone.code} â€” ${zone.name}`;
    els.zoneSelect.appendChild(option);
  });
  els.zoneSelect.disabled = false;
}

function findZoneMeta(code) {
  for (const stateEntry of ZONE_DATA) {
    const match = stateEntry.zones.find((zone) => zone.code === code);
    if (match) {
      return { state: stateEntry.state, name: match.name };
    }
  }
  return null;
}

function timeToDate(dateKeyValue, timeStr) {
  if (!timeStr) return null;
  const [hour, minute] = timeStr.split(":").map((v) => Number.parseInt(v, 10));
  if (Number.isNaN(hour) || Number.isNaN(minute)) return null;
  const date = new Date(`${dateKeyValue}T00:00:00`);
  date.setHours(hour, minute, 0, 0);
  return date;
}

function normalizePrayerKeys(item) {
  return {
    subuh: item.subuh || item.fajr || item.fajr_time || item.fajrTime,
    syuruk: item.syuruk || item.sunrise || item.syuruq,
    zohor: item.zohor || item.dhuhr || item.zuhr,
    asar: item.asar || item.asr,
    maghrib: item.maghrib,
    isyak: item.isyak || item.isha,
  };
}

function parseApiDate(value) {
  if (!value) return null;
  if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
    return value;
  }
  const match = value.match(/^(\d{1,2})-([A-Za-z]{3})-(\d{4})$/);
  if (match) {
    const [, day, month, year] = match;
    const months = {
      Jan: "01",
      Feb: "02",
      Mar: "03",
      Apr: "04",
      May: "05",
      Jun: "06",
      Jul: "07",
      Aug: "08",
      Sep: "09",
      Oct: "10",
      Nov: "11",
      Dec: "12",
    };
    return `${year}-${months[month] || "01"}-${day.padStart(2, "0")}`;
  }
  return null;
}

function getTodayItem(data) {
  const key = todayKey();
  return data.find((item) => parseApiDate(item.date) === key) || null;
}

function renderPrayerTimes(times) {
  const cards = Array.from(els.prayerGrid.querySelectorAll(".prayer-card"));
  cards.forEach((card) => {
    const key = card.dataset.key;
    const time = times?.[key] || "--:--";
    card.querySelector(".prayer-time").textContent = time;
    card.classList.remove("active");
  });
}

function updateCurrentPrayer() {
  if (!state.todayTimes) return;
  const now = new Date();
  const key = todayKey();
  const labels = I18N[state.lang].prayerLabels;
  const times = PRAYER_KEYS.map((k) => ({
    key: k,
    label: labels[PRAYER_KEYS.indexOf(k)],
    date: timeToDate(key, state.todayTimes[k]),
  })).filter((item) => item.date);
  let current = times[0];
  times.forEach((item) => {
    if (item.date <= now) current = item;
  });
  const cards = Array.from(els.prayerGrid.querySelectorAll(".prayer-card"));
  cards.forEach((card) => {
    if (card.dataset.key === current?.key) {
      card.classList.add("active");
    }
  });
}

function computeNextPrayer() {
  if (!state.todayTimes) return null;
  const now = new Date();
  const today = todayKey();
  const labels = I18N[state.lang].prayerLabels;
  const times = PRAYER_KEYS.map((k) => ({
    key: k,
    label: labels[PRAYER_KEYS.indexOf(k)],
    date: timeToDate(today, state.todayTimes[k]),
  })).filter((item) => item.date);

  let next = times.find((item) => item.date > now);
  if (!next) {
    const tomorrowItem = state.monthlyData.find((item) => {
      const parsed = parseApiDate(item.date);
      if (!parsed) return false;
      const tomorrow = new Date(today);
      tomorrow.setDate(tomorrow.getDate() + 1);
      return parsed === tomorrow.toISOString().slice(0, 10);
    });
    if (tomorrowItem) {
      const timesTomorrow = normalizePrayerKeys(tomorrowItem);
      next = {
        key: "subuh",
        label: labels[0],
        date: timeToDate(parseApiDate(tomorrowItem.date), timesTomorrow.subuh),
      };
    }
  }
  return next;
}

function renderNextPrayer() {
  state.nextPrayer = computeNextPrayer();
  if (!state.nextPrayer) {
    els.nextPrayerName.textContent = "â€”";
    els.nextPrayerTime.textContent = "â€”";
    return;
  }
  els.nextPrayerName.textContent = state.nextPrayer.label;
  const time = state.nextPrayer.date
    ? state.nextPrayer.date.toLocaleTimeString("ms-MY", { hour: "2-digit", minute: "2-digit" })
    : "--:--";
  els.nextPrayerTime.textContent = time;
}

function startCountdown() {
  if (state.countdownTimer) clearInterval(state.countdownTimer);
  const tick = () => {
    if (!state.nextPrayer || !state.nextPrayer.date) {
      els.countdownValue.textContent = "--:--:--";
      return;
    }
    const diff = state.nextPrayer.date - new Date();
    if (diff <= 0) {
      triggerPrayerAlert();
      renderNextPrayer();
      updateCurrentPrayer();
      return;
    }
    const hours = Math.floor(diff / 3600000);
    const minutes = Math.floor((diff % 3600000) / 60000);
    const seconds = Math.floor((diff % 60000) / 1000);
    els.countdownValue.textContent = `${String(hours).padStart(2, "0")}:${String(minutes).padStart(
      2,
      "0"
    )}:${String(seconds).padStart(2, "0")}`;
  };
  tick();
  state.countdownTimer = setInterval(tick, 1000);
}

function startClock() {
  if (state.clockTimer) clearInterval(state.clockTimer);
  const formatBmTime = (date, withSeconds = false) => {
    const h = date.getHours();
    const m = date.getMinutes();
    const s = date.getSeconds();
    const hour12 = h % 12 === 0 ? 12 : h % 12;
    const time = `${hour12}:${String(m).padStart(2, "0")}${
      withSeconds ? `:${String(s).padStart(2, "0")}` : ""
    }`;
    return time;
  };
  const tick = () => {
    const now = new Date();
    if (els.currentTime) {
      els.currentTime.textContent = formatBmTime(now, true);
    }
    if (els.clockHour && els.clockMinute && els.clockSecond) {
      const hours = now.getHours() % 12;
      const minutes = now.getMinutes();
      const seconds = now.getSeconds();
      const hourDeg = hours * 30 + minutes * 0.5;
      const minuteDeg = minutes * 6 + seconds * 0.1;
      const secondDeg = seconds * 6;
      els.clockHour.style.transform = `translateX(-50%) rotate(${hourDeg}deg)`;
      els.clockMinute.style.transform = `translateX(-50%) rotate(${minuteDeg}deg)`;
      els.clockSecond.style.transform = `translateX(-50%) rotate(${secondDeg}deg)`;
    }
    updateHijriDate();
  };
  tick();
  state.clockTimer = setInterval(tick, 1000);
}

async function fetchMonthlyTimes(zoneCode) {
  const now = new Date();
  const key = `ws_month_${zoneCode}_${now.getFullYear()}_${now.getMonth() + 1}`;
  const cached = localStorage.getItem(key);
  if (cached) {
    try {
      const parsed = JSON.parse(cached);
      if (parsed?.data?.length) {
        return parsed.data;
      }
    } catch (error) {
      localStorage.removeItem(key);
    }
  }

  const jakimUrl = `https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat&zone=${zoneCode}&period=month`;
  const response = await fetch(jakimUrl);
  if (!response.ok) throw new Error("Gagal dapatkan data JAKIM.");
  const json = await response.json();
  const data = json.prayerTime || json.data || [];
  if (data.length) {
    localStorage.setItem(key, JSON.stringify({ data }));
  }
  return data;
}

async function fetchZoneFromGps(lat, lon) {
  const url = `https://api.waktusolat.app/v2/solat/gps/${lat}/${lon}`;
  const response = await fetch(url);
  if (!response.ok) throw new Error("Gagal kesan zon.");
  const json = await response.json();
  return json;
}

async function useZone(zoneCode, meta = {}) {
  const normalizedZone = zoneCode ? String(zoneCode).toUpperCase() : zoneCode;
  state.zoneCode = normalizedZone;
  const zoneMeta = findZoneMeta(normalizedZone);
  state.zoneName = meta.zoneName || zoneMeta?.name || normalizedZone;
  state.stateName = meta.stateName || zoneMeta?.state || "Malaysia";
  if (meta.source === "gps") {
    const detectedLabel = (meta.stateName || zoneMeta?.state || state.stateName || meta.zoneName || state.zoneName || "").trim();
    state.detectedStateName = detectedLabel;
    localStorage.setItem("ws_lastDetectedState", state.detectedStateName);
  }
  updateHeroTitle();
  setLocationDisplay();
  if (meta.source === "manual") {
    setStatus(I18N[state.lang].locationManual, "ok");
  } else {
    setStatus(I18N[state.lang].locationDetected, "ok");
  }
  localStorage.setItem("ws_lastZone", zoneCode);
  localStorage.setItem("ws_lastZoneName", state.zoneName);
  localStorage.setItem("ws_lastStateName", state.stateName);

  try {
    state.monthlyData = await fetchMonthlyTimes(zoneCode);
    const todayItem = getTodayItem(state.monthlyData);
    if (todayItem) {
      state.todayTimes = normalizePrayerKeys(todayItem);
      renderPrayerTimes(state.todayTimes);
      updateCurrentPrayer();
      renderNextPrayer();
      startCountdown();
      updateHijriDate();
      cacheLastTimes(parseApiDate(todayItem.date), state.todayTimes);
    }
  } catch (error) {
    const usedCache = applyCachedTimes();
    els.locationMeta.textContent = usedCache
      ? I18N[state.lang].offlineFallback
      : I18N[state.lang].statusFail;
  }
}

async function handleDetectLocation() {
  if (!navigator.geolocation) {
    setStatus(I18N[state.lang].statusUnsupported, "error");
    els.locationMeta.textContent = I18N[state.lang].statusUnsupported;
    return;
  }
  setStatus(I18N[state.lang].statusDetecting, "info");
  navigator.geolocation.getCurrentPosition(
    async (position) => {
      const { latitude, longitude } = position.coords;
      state.coords = { lat: latitude, lon: longitude };
      localStorage.setItem("ws_lastCoords", JSON.stringify(state.coords));
      try {
        const json = await fetchZoneFromGps(latitude, longitude);
        const zoneCode =
          json.zone?.code ||
          json.zone ||
          json.data?.zone ||
          json.data?.zone?.code ||
          json.data?.zone_code;
        if (!zoneCode) throw new Error("Zon tidak dijumpai.");
        const meta = findZoneMeta(zoneCode);
        await useZone(zoneCode, {
          zoneName: meta?.name || json.zone?.name,
          stateName: meta?.state,
          source: "gps",
        });
        els.locationMeta.textContent = I18N[state.lang].locationDetected;
        updateQiblaBearing();
      } catch (error) {
        const cached = localStorage.getItem("ws_lastZone");
        if (cached) {
          useZone(cached, { source: "auto" });
          els.locationMeta.textContent = I18N[state.lang].statusFail;
          return;
        }
        setStatus(I18N[state.lang].locationDenied, "error");
        els.locationMeta.textContent = I18N[state.lang].statusFail;
      }
    },
    () => {
      setStatus(I18N[state.lang].locationDenied, "error");
      els.locationMeta.textContent = I18N[state.lang].locationDenied;
    },
    { enableHighAccuracy: true, timeout: 12000 }
  );
}

function updateQiblaBearing() {
  if (!state.coords) {
    els.qiblaStatus.textContent = I18N[state.lang].qiblaNeedLocation;
    if (!state.compassActive) setQiblaIndicator(false);
    return;
  }
  const { lat, lon } = state.coords;
  const bearing = getBearing(lat, lon, KAABA.lat, KAABA.lon);
  state.qiblaBearing = bearing;
  els.qiblaAngle.textContent = Math.round(bearing);
  els.qiblaStatus.textContent = I18N[state.lang].qiblaStatic;
  rotateNeedle(bearing);
  if (state.compassActive) setQiblaIndicator(true);
}

function getBearing(lat1, lon1, lat2, lon2) {
  const toRad = (value) => (value * Math.PI) / 180;
  const y = Math.sin(toRad(lon2 - lon1)) * Math.cos(toRad(lat2));
  const x =
    Math.cos(toRad(lat1)) * Math.sin(toRad(lat2)) -
    Math.sin(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.cos(toRad(lon2 - lon1));
  const brng = (Math.atan2(y, x) * 180) / Math.PI;
  return (brng + 360) % 360;
}

function rotateNeedle(angle) {
  els.qiblaNeedle.style.transform = `translateX(-50%) rotate(${angle}deg)`;
}

function handleOrientation(event) {
  if (!state.qiblaBearing) return;
  const heading =
    typeof event.webkitCompassHeading === "number"
      ? event.webkitCompassHeading
      : event.alpha !== null
      ? 360 - event.alpha
      : null;
  if (heading === null) return;
  const relative = (state.qiblaBearing - heading + 360) % 360;
  rotateNeedle(relative);
}

async function enableCompass() {
  if (!state.coords && navigator.geolocation) {
    try {
      const position = await new Promise((resolve, reject) =>
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          timeout: 12000,
        })
      );
      state.coords = { lat: position.coords.latitude, lon: position.coords.longitude };
      localStorage.setItem("ws_lastCoords", JSON.stringify(state.coords));
    } catch (error) {
      els.qiblaStatus.textContent = I18N[state.lang].qiblaNeedLocation;
    }
  }
  if (!state.coords) {
    els.qiblaStatus.textContent = I18N[state.lang].qiblaNeedLocation;
    return;
  }
  if (state.compassActive) return;
  if (
    typeof DeviceOrientationEvent !== "undefined" &&
    typeof DeviceOrientationEvent.requestPermission === "function"
  ) {
    try {
      const permission = await DeviceOrientationEvent.requestPermission();
      if (permission !== "granted") {
        els.qiblaStatus.textContent = I18N[state.lang].qiblaStatic;
        return;
      }
    } catch (error) {
      els.qiblaStatus.textContent = I18N[state.lang].qiblaStatic;
      return;
    }
  }
  state.compassActive = true;
  setQiblaIndicator(true);
  updateQiblaBearing();
  window.addEventListener("deviceorientation", handleOrientation, true);
  els.qiblaStatus.textContent = I18N[state.lang].qiblaActive;
}

function setQiblaIndicator(active) {
  if (!els.qiblaIndicator) return;
  const dict = I18N[state.lang];
  if (active) {
    els.qiblaIndicator.innerHTML = `<span class="dot active"></span>${dict.qiblaIndicatorActive}`;
    els.qiblaIndicator.classList.add("active");
  } else {
    els.qiblaIndicator.innerHTML = `<span class="dot"></span>${dict.qiblaIndicatorInactive}`;
    els.qiblaIndicator.classList.remove("active");
  }
}

function toggleManualPanel() {
  els.manualPanel.classList.toggle("hidden");
}

function openSettings() {
  if (!els.settingsModal) return;
  els.settingsModal.classList.remove("hidden");
}

function closeSettings() {
  if (!els.settingsModal) return;
  els.settingsModal.classList.add("hidden");
}

async function clearAppCache() {
  try {
    localStorage.clear();
  } catch (error) {}
  try {
    if ("caches" in window) {
      const keys = await caches.keys();
      await Promise.all(keys.map((key) => caches.delete(key)));
    }
  } catch (error) {}
  try {
    if ("serviceWorker" in navigator) {
      const regs = await navigator.serviceWorker.getRegistrations();
      await Promise.all(regs.map((reg) => reg.unregister()));
    }
  } catch (error) {}
  window.location.reload();
}

function applyManualZone() {
  const zoneCode = els.zoneSelect.value;
  if (!zoneCode) return;
  useZone(zoneCode, { stateName: els.stateSelect.value, source: "manual" });
}

function loadCachedZone() {
  const zone = localStorage.getItem("ws_lastZone");
  if (!zone) return;
  state.detectedStateName = localStorage.getItem("ws_lastDetectedState") || "";
  state.zoneCode = zone;
  state.zoneName = localStorage.getItem("ws_lastZoneName");
  state.stateName = localStorage.getItem("ws_lastStateName");
  setLocationDisplay();
  useZone(zone);
  const coords = localStorage.getItem("ws_lastCoords");
  if (coords) {
    try {
      state.coords = JSON.parse(coords);
      updateQiblaBearing();
    } catch (error) {
      localStorage.removeItem("ws_lastCoords");
    }
  }
}

function initTheme() {
  if (!els.themeToggle) return;
  const setTheme = (isDark) => {
    document.body.classList.toggle("dark", isDark);
    els.themeToggle.setAttribute("aria-checked", isDark ? "true" : "false");
    localStorage.setItem("ws_theme", isDark ? "dark" : "light");
  };
  const saved = localStorage.getItem("ws_theme");
  setTheme(saved === "dark");
  const toggleTheme = () => {
    const isDark = !document.body.classList.contains("dark");
    setTheme(isDark);
  };
  els.themeToggle.addEventListener("click", toggleTheme);
  els.themeToggle.addEventListener("keydown", (event) => {
    if (event.key === " " || event.key === "Enter") {
      event.preventDefault();
      toggleTheme();
    }
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker
    .register("./service-worker.js")
    .then((registration) => {
      if (registration.waiting) {
        registration.waiting.postMessage({ type: "SKIP_WAITING" });
      }
      registration.addEventListener("updatefound", () => {
        const worker = registration.installing;
        if (!worker) return;
        worker.addEventListener("statechange", () => {
          if (worker.state === "installed" && navigator.serviceWorker.controller) {
            registration.waiting?.postMessage({ type: "SKIP_WAITING" });
          }
        });
      });
      registration.update().catch(() => {});
    })
    .catch(() => {});

  navigator.serviceWorker.addEventListener("controllerchange", () => {
    window.location.reload();
  });
}

function applyLanguage(lang) {
  state.lang = lang;
  const dict = I18N[lang];
  els.detectBtn.textContent = dict.detect;
  els.manualToggle.textContent = dict.manual;
  if (els.notifyBtn) {
    els.notifyBtn.textContent = state.notifyEnabled ? dict.notifyOn : dict.notifyOff;
  }
  els.langLabel.textContent = lang === "ms" ? "Bahasa" : "Language";
  els.nextPrayerName.previousElementSibling.textContent = dict.nextPrayer;
  els.countdownValue.previousElementSibling.textContent = dict.countdown;
  els.qiblaStatus.textContent = dict.qiblaHint;
  if (els.gregorianLabel) els.gregorianLabel.textContent = dict.gregorianLabel;
  if (els.hijriLabel) els.hijriLabel.textContent = dict.hijriLabel;
  if (els.qiblaLabel) els.qiblaLabel.textContent = dict.qiblaTitle;
  if (els.qiblaTitleEl) els.qiblaTitleEl.textContent = dict.qiblaHeading;
  if (els.qiblaHelp) els.qiblaHelp.textContent = dict.qiblaHelp;
  if (els.compassBtn) els.compassBtn.textContent = dict.compassOn;
  setQiblaIndicator(state.compassActive);
  if (els.settingsTitle) {
    els.settingsTitle.textContent = dict.settingsTitle;
  }
  if (els.settingsBtnLabel) {
    els.settingsBtnLabel.textContent = dict.settingsButton;
  }
  if (els.settingsBtn) {
    els.settingsBtn.setAttribute("aria-label", dict.settingsButton);
  }
  buildPrayerCards();
  if (state.todayTimes) {
    renderPrayerTimes(state.todayTimes);
    updateCurrentPrayer();
    renderNextPrayer();
  }
  setLocationDisplay();
  updateHeroTitle();
  formatGregorian();
  if (!state.zoneCode) {
    setStatus(dict.statusUnset);
  }
  if (els.langSelect) {
    els.langSelect.value = lang;
  }
  if (els.langMs && els.langEn) {
    els.langMs.classList.toggle("active", lang === "ms");
    els.langEn.classList.toggle("active", lang === "en");
    els.langMs.setAttribute("aria-pressed", lang === "ms" ? "true" : "false");
    els.langEn.setAttribute("aria-pressed", lang === "en" ? "true" : "false");
  }
}

async function toggleNotifications() {
  if (!("Notification" in window)) {
    if (els.notifyBtn) {
      els.notifyBtn.textContent = I18N[state.lang].notifyOff;
    }
    return;
  }
  if (Notification.permission === "granted") {
    state.notifyEnabled = !state.notifyEnabled;
  } else {
    const permission = await Notification.requestPermission();
    state.notifyEnabled = permission === "granted";
  }
  localStorage.setItem("ws_notify", state.notifyEnabled ? "1" : "0");
  if (els.notifyBtn) {
    els.notifyBtn.textContent = state.notifyEnabled
      ? I18N[state.lang].notifyOn
      : I18N[state.lang].notifyOff;
  }
}

function triggerPrayerAlert() {
  if (!state.notifyEnabled || !state.nextPrayer?.date) return;
  const key = `${state.nextPrayer.key}_${state.nextPrayer.date.toISOString()}`;
  if (state.lastNotified === key) return;
  state.lastNotified = key;
  if ("Notification" in window && Notification.permission === "granted") {
    const body =
      state.lang === "ms"
        ? `${state.nextPrayer.label} telah masuk.`
        : `${state.nextPrayer.label} time has started.`;
    new Notification(`${I18N[state.lang].title}`, { body });
  }
}

function init() {
  formatGregorian();
  formatHijri();
  buildPrayerCards();
  populateStates();
  startClock();
  updateHeroTitle();
  registerServiceWorker();

  els.detectBtn.addEventListener("click", handleDetectLocation);
  els.manualToggle.addEventListener("click", toggleManualPanel);
  els.stateSelect.addEventListener("change", (event) => populateZones(event.target.value));
  els.applyZone.addEventListener("click", applyManualZone);
  els.compassBtn.addEventListener("click", enableCompass);
  if (els.notifyBtn) {
    els.notifyBtn.addEventListener("click", toggleNotifications);
  }
  if (els.langSelect) {
    els.langSelect.addEventListener("change", (event) => {
      applyLanguage(event.target.value);
      localStorage.setItem("ws_lang", event.target.value);
    });
  }
  if (els.langToggle) {
    els.langToggle.addEventListener("click", (event) => {
      const btn = event.target.closest("button[data-lang]");
      if (!btn) return;
      const lang = btn.dataset.lang;
      if (!I18N[lang]) return;
      applyLanguage(lang);
      localStorage.setItem("ws_lang", lang);
    });
  }
  if (els.settingsBtn) els.settingsBtn.addEventListener("click", openSettings);
  if (els.settingsClose) {
    els.settingsClose.addEventListener("click", (event) => {
      event.stopPropagation();
      closeSettings();
    });
  }
  if (els.clearCacheBtn) {
    els.clearCacheBtn.addEventListener("click", () => {
      clearAppCache();
    });
  }
  if (els.settingsModal) {
    els.settingsModal.addEventListener("click", (event) => {
      if (event.target === els.settingsModal) closeSettings();
    });
  }
  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && els.settingsModal && !els.settingsModal.classList.contains("hidden")) {
      closeSettings();
    }
  });

  initTheme();
  const savedLang = localStorage.getItem("ws_lang");
  if (savedLang && I18N[savedLang]) {
    applyLanguage(savedLang);
  } else {
    applyLanguage(state.lang);
  }
  state.notifyEnabled = localStorage.getItem("ws_notify") === "1";
  if (els.notifyBtn) {
    els.notifyBtn.textContent = state.notifyEnabled
      ? I18N[state.lang].notifyOn
      : I18N[state.lang].notifyOff;
  }
  loadCachedZone();

  let lastKey = todayKey();
  setInterval(() => {
    const currentKey = todayKey();
    if (currentKey !== lastKey && state.zoneCode) {
      lastKey = currentKey;
      useZone(state.zoneCode, {
        zoneName: state.zoneName,
        stateName: state.stateName,
        source: "auto",
      });
      formatGregorian();
      formatHijri();
    }
  }, 60000);
}

init();

