const KAABA = { latitude: 21.422487, longitude: 39.826206 };
const SENSOR_TIMEOUT_MS = 8000;
const radians = (degrees) => (degrees * Math.PI) / 180;
const normalize = (degrees) => ((degrees % 360) + 360) % 360;
const validCoordinates = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180;

/** Initial great-circle bearing towards the Kaaba, clockwise from true north. */
export function getBearing(latitude, longitude) {
  if (!validCoordinates(latitude, longitude)) return null;
  const start = radians(latitude);
  const end = radians(KAABA.latitude);
  const delta = radians(KAABA.longitude - longitude);
  const y = Math.sin(delta) * Math.cos(end);
  const x =
    Math.cos(start) * Math.sin(end) -
    Math.sin(start) * Math.cos(end) * Math.cos(delta);
  // At the destination (or its antipode) there is no unique initial direction.
  if (Math.hypot(x, y) < 1e-12) return null;
  return normalize((Math.atan2(y, x) * 180) / Math.PI);
}

/** A relative alpha has no north reference and must never activate a compass. */
export function getHeading(event, screenAngle = 0) {
  if (!event || !Number.isFinite(screenAngle)) return null;
  let heading;
  if (
    Number.isFinite(event.webkitCompassHeading) &&
    event.webkitCompassHeading >= 0 &&
    event.webkitCompassHeading <= 360
  ) {
    if (
      Number.isFinite(event.webkitCompassAccuracy) &&
      event.webkitCompassAccuracy < 0
    )
      return null;
    heading = event.webkitCompassHeading;
  } else if (
    event.absolute === true &&
    Number.isFinite(event.alpha) &&
    event.alpha >= 0 &&
    event.alpha <= 360
  ) {
    // The W3C alpha convention is counterclockwise; this assumes a flat phone.
    heading = 360 - event.alpha;
  } else {
    return null;
  }
  return normalize(heading + screenAngle);
}

const messages = {
  ms: {
    idle: "Benarkan lokasi untuk mengira arah kiblat dari tempat anda.",
    locating: "Mendapatkan lokasi semasa anda…",
    waiting:
      "Arah kiblat dikira. Menunggu bacaan kompas mutlak daripada peranti…",
    live: "Panduan sensor aktif. Letakkan telefon mendatar dan ikut anak panah. Bacaan bergantung pada sensor dan gangguan magnet.",
    static:
      "Arah tetap: {angle}° mengikut arah jam dari utara benar. Gunakan rujukan utara; anak panah ini tidak mengikut putaran telefon.",
    unavailable: "Sensor kompas tidak tersedia. ",
    denied: "Kebenaran sensor tidak diberikan. ",
    timeout: "Tiada bacaan kompas mutlak diterima. ",
    gpsDenied:
      "Akses lokasi tidak dibenarkan. Benarkan lokasi dalam tetapan pelayar, kemudian cuba lagi.",
    gpsTimeout:
      "Lokasi mengambil masa terlalu lama. Cuba lagi di tempat yang mempunyai isyarat GPS lebih baik.",
    gpsUnavailable:
      "Lokasi semasa tidak dapat diperoleh. Semak tetapan lokasi peranti dan cuba lagi.",
    gpsUnsupported:
      "Pelayar ini tidak menyokong lokasi. Cuba pelayar lain untuk mengira arah kiblat.",
    noBearing: "Arah kiblat tidak dapat ditentukan daripada koordinat ini.",
    secure: "Akses lokasi memerlukan sambungan HTTPS yang selamat.",
    start: "Aktifkan panduan kiblat",
    retry: "Cuba lagi",
    refresh: "Kemas kini lokasi",
    busy: "Mendapatkan arah…",
    idleLabel: "Lokasi diperlukan",
    loadingLabel: "Mencari lokasi",
    waitingLabel: "Menunggu sensor",
    staticLabel: "Arah tetap",
    liveLabel: "Sensor aktif",
    errorLabel: "Lokasi tidak tersedia",
  },
  en: {
    idle: "Allow location access to calculate the Qibla direction from where you are.",
    locating: "Getting your current location…",
    waiting:
      "Qibla bearing calculated. Waiting for an absolute compass reading from your device…",
    live: "Sensor guidance active. Hold your phone flat and follow the arrow. Readings depend on the sensor and magnetic interference.",
    static:
      "Static bearing: {angle}° clockwise from true north. Use a north reference; this arrow does not follow your phone’s rotation.",
    unavailable: "A compass sensor is unavailable. ",
    denied: "Sensor permission was not granted. ",
    timeout: "No absolute compass reading was received. ",
    gpsDenied:
      "Location access was denied. Allow location in your browser settings, then try again.",
    gpsTimeout:
      "Getting your location took too long. Try again somewhere with a better GPS signal.",
    gpsUnavailable:
      "Your current location could not be obtained. Check your device’s location settings and try again.",
    gpsUnsupported:
      "This browser does not support location. Try another browser to calculate the Qibla bearing.",
    noBearing: "A Qibla bearing cannot be determined from these coordinates.",
    secure: "Location access requires a secure HTTPS connection.",
    start: "Enable Qibla guidance",
    retry: "Try again",
    refresh: "Refresh location",
    busy: "Finding direction…",
    idleLabel: "Location needed",
    loadingLabel: "Finding location",
    waitingLabel: "Waiting for sensor",
    staticLabel: "Static bearing",
    liveLabel: "Sensor active",
    errorLabel: "Location unavailable",
  },
};

export function createQibla({ getLanguage = () => "ms" } = {}) {
  const host = window;
  const elements = Object.fromEntries(
    [
      "qiblaNeedle",
      "qiblaAngle",
      "qiblaStatus",
      "qiblaIndicator",
      "compassBtn",
    ].map((id) => [id, document.getElementById(id)]),
  );
  let state = "idle";
  let reason = "idle";
  let bearing = null;
  let heading = null;
  let busy = false;
  let destroyed = false;
  let attempt = 0;
  let sensorTimer;
  let removeListeners = () => {};

  function stopSensors() {
    host.clearTimeout(sensorTimer);
    removeListeners();
    removeListeners = () => {};
    heading = null;
  }

  function render() {
    if (destroyed) return;
    const text = messages[getLanguage()] || messages.ms;
    const angle = bearing === null ? "—" : bearing.toFixed(1);
    const isLive = state === "live";
    if (elements.qiblaAngle)
      elements.qiblaAngle.textContent = bearing === null ? "—" : `${angle}°`;
    if (elements.qiblaNeedle) {
      elements.qiblaNeedle.hidden = bearing === null;
      elements.qiblaNeedle.style.transform = `rotate(${bearing === null ? 0 : normalize(bearing - (isLive ? heading : 0))}deg)`;
      elements.qiblaNeedle.dataset.mode = isLive ? "live" : "static";
    }
    if (elements.qiblaStatus) {
      elements.qiblaStatus.textContent =
        state === "static"
          ? `${text[reason] || ""}${text.static.replace("{angle}", angle)}`
          : text[reason];
    }
    if (elements.qiblaIndicator) {
      elements.qiblaIndicator.dataset.state = state;
      elements.qiblaIndicator.textContent = text[`${state}Label`];
    }
    if (elements.compassBtn) {
      elements.compassBtn.disabled = busy;
      elements.compassBtn.setAttribute("aria-busy", String(busy));
      elements.compassBtn.textContent = busy
        ? text.busy
        : bearing !== null
          ? text.refresh
          : state === "error"
            ? text.retry
            : text.start;
    }
  }

  function startSensors() {
    state = "waiting";
    reason = "waiting";
    const expire = () => {
      reason = "timeout";
      stopSensors();
      state = "static";
      render();
    };
    const receive = (event) => {
      const rotation = Number.isFinite(host.screen?.orientation?.angle)
        ? host.screen.orientation.angle
        : Number.isFinite(host.orientation)
          ? host.orientation
          : 0;
      const nextHeading = getHeading(event, rotation);
      if (nextHeading === null) return;
      heading = nextHeading;
      state = "live";
      reason = "live";
      // A stationary device need not emit new events. Only time out while
      // waiting for the first valid reading, not while the user holds still.
      host.clearTimeout(sensorTimer);
      render();
    };
    host.addEventListener("deviceorientationabsolute", receive);
    host.addEventListener("deviceorientation", receive);
    removeListeners = () => {
      host.removeEventListener("deviceorientationabsolute", receive);
      host.removeEventListener("deviceorientation", receive);
    };
    sensorTimer = host.setTimeout(expire, SENSOR_TIMEOUT_MS);
    render();
  }

  async function enable() {
    if (busy || destroyed) return;
    const currentAttempt = ++attempt;
    stopSensors();
    bearing = null;
    busy = true;
    state = "loading";
    reason = "locating";
    render();

    // Invoke this before any await: iOS requires the original button gesture.
    const Orientation = host.DeviceOrientationEvent;
    let permission;
    try {
      permission =
        typeof Orientation?.requestPermission === "function"
          ? Promise.resolve(Orientation.requestPermission(true)).then(
              (value) => (value === "granted" ? "granted" : "denied"),
              () => "denied",
            )
          : Promise.resolve(
              Orientation || "ondeviceorientationabsolute" in host
                ? "granted"
                : "unavailable",
            );
    } catch {
      permission = Promise.resolve("denied");
    }

    try {
      if (host.isSecureContext === false) throw { reason: "secure" };
      if (!navigator.geolocation) throw { reason: "gpsUnsupported" };
      const position = await new Promise((resolve, reject) => {
        navigator.geolocation.getCurrentPosition(resolve, reject, {
          enableHighAccuracy: true,
          maximumAge: 0,
          timeout: 15000,
        });
      });
      if (destroyed || currentAttempt !== attempt) return;
      bearing = getBearing(
        position?.coords?.latitude,
        position?.coords?.longitude,
      );
      if (bearing === null) throw { reason: "noBearing" };
      state = "waiting";
      reason = "waiting";
      render();
      const permissionState = await permission;
      if (destroyed || currentAttempt !== attempt) return;
      busy = false;
      if (permissionState === "granted") startSensors();
      else {
        state = "static";
        reason = permissionState;
        render();
      }
    } catch (error) {
      if (destroyed || currentAttempt !== attempt) return;
      busy = false;
      state = "error";
      reason =
        error?.reason ||
        (error?.code === 1
          ? "gpsDenied"
          : error?.code === 3
            ? "gpsTimeout"
            : "gpsUnavailable");
      render();
    }
  }

  function destroy() {
    destroyed = true;
    attempt += 1;
    stopSensors();
  }

  render();
  return { enable, render, destroy };
}
