const KAABA = { latitude: 21.422487, longitude: 39.826206 };
const SENSOR_TIMEOUT_MS = 8000;
const REQUEST_TIMEOUT_MS = 20000;
const radians = (degrees) => (degrees * Math.PI) / 180;
const normalize = (degrees) => ((degrees % 360) + 360) % 360;
const difference = (target, origin) => normalize(target - origin + 180) - 180;
const validCoordinates = (latitude, longitude) =>
  Number.isFinite(latitude) &&
  Number.isFinite(longitude) &&
  Math.abs(latitude) <= 90 &&
  Math.abs(longitude) <= 180;
const hasWebKitHeading = (event) =>
  event != null && "webkitCompassHeading" in event;
const setText = (element, value) => {
  if (element && element.textContent !== value) element.textContent = value;
};

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
  // The destination and its antipode have no unique initial direction.
  if (Math.hypot(x, y) < 1e-12) return null;
  return normalize((Math.atan2(y, x) * 180) / Math.PI);
}

/** Approximate great-circle distance in kilometres on a mean-radius Earth. */
export function getDistance(latitude, longitude) {
  if (!validCoordinates(latitude, longitude)) return null;
  const halfLatitude = radians(KAABA.latitude - latitude) / 2;
  const halfLongitude = radians(KAABA.longitude - longitude) / 2;
  const a =
    Math.sin(halfLatitude) ** 2 +
    Math.cos(radians(latitude)) *
      Math.cos(radians(KAABA.latitude)) *
      Math.sin(halfLongitude) ** 2;
  return 6371.0088 * 2 * Math.asin(Math.sqrt(Math.max(0, Math.min(1, a))));
}

function readingIssue(event) {
  for (const key of ["beta", "gamma"]) {
    if (event?.[key] != null && !Number.isFinite(event[key]))
      return "unreliable";
    if (Number.isFinite(event?.[key]) && Math.abs(event[key]) > 45)
      return "tilted";
  }
  if (hasWebKitHeading(event)) {
    const accuracy = event.webkitCompassAccuracy;
    // https://developer.apple.com/documentation/webkitjs/deviceorientationevent/1804769-webkitcompassaccuracy
    // Apple documents negative accuracy as an unusable reading. Values over
    // 25 degrees are too imprecise to present as useful Qibla guidance.
    if (
      accuracy != null &&
      (!Number.isFinite(accuracy) || accuracy < 0 || accuracy > 25)
    )
      return "unreliable";
  }
  return null;
}

/** North-referenced heading of the top of the displayed screen; relative alpha is rejected. */
export function getHeading(event, screenAngle = 0) {
  if (!event || !Number.isFinite(screenAngle) || readingIssue(event))
    return null;
  if (hasWebKitHeading(event)) {
    if (
      !Number.isFinite(event.webkitCompassHeading) ||
      event.webkitCompassHeading < 0 ||
      event.webkitCompassHeading > 360
    )
      return null;
    // WebKit exposes magnetic north, so its live UI explicitly says approximate.
    return normalize(event.webkitCompassHeading + screenAngle);
  }
  if (
    event.absolute !== true ||
    !Number.isFinite(event.alpha) ||
    event.alpha < 0 ||
    event.alpha > 360
  )
    return null;
  // W3C's Z-X'-Y'' rotation matrix projects the screen-top vector onto the
  // horizontal plane. Unlike alpha alone, this also handles modest tilt in
  // landscape. At beta=gamma=0 it reduces to (360 - alpha + screenAngle).
  // https://www.w3.org/TR/orientation-event/#worked-example
  const alpha = radians(event.alpha);
  const beta = radians(event.beta ?? 0);
  const gamma = radians(event.gamma ?? 0);
  const angle = radians(screenAngle);
  const x =
    (Math.cos(alpha) * Math.cos(gamma) -
      Math.sin(alpha) * Math.sin(beta) * Math.sin(gamma)) *
      Math.sin(angle) -
    Math.cos(beta) * Math.sin(alpha) * Math.cos(angle);
  const y =
    (Math.sin(alpha) * Math.cos(gamma) +
      Math.cos(alpha) * Math.sin(beta) * Math.sin(gamma)) *
      Math.sin(angle) +
    Math.cos(alpha) * Math.cos(beta) * Math.cos(angle);
  if (Math.hypot(x, y) < 0.5) return null;
  return normalize((Math.atan2(x, y) * 180) / Math.PI);
}

export function getAlignment(bearing, heading, tolerance = 7) {
  if (
    ![bearing, heading, tolerance].every(Number.isFinite) ||
    tolerance < 0 ||
    tolerance > 180
  )
    return null;
  const delta = difference(bearing, heading);
  return {
    direction:
      Math.abs(delta) <= tolerance ? "aligned" : delta < 0 ? "left" : "right",
    degrees: Math.round(Math.abs(delta)),
  };
}

const messages = {
  ms: {
    idle: "Benarkan lokasi untuk mengira arah kiblat dari tempat anda.",
    locating: "Mendapatkan lokasi semasa anda…",
    waiting:
      "Gerakkan telefon perlahan sambil mendatar untuk mendapatkan bacaan kompas mutlak.",
    permissionWaiting:
      "Arah kiblat dikira. Selesaikan permintaan kebenaran sensor untuk panduan langsung.",
    live: "Kompas langsung mengikut putaran telefon. Pegang telefon mendatar; arah dan penjajaran ialah anggaran sensor.",
    magnetic:
      "Kompas langsung mengikut putaran telefon menggunakan utara magnet. Penjajaran ialah anggaran; bearing angka diukur dari utara benar.",
    static:
      "Arah tetap: {angle}° mengikut arah jam dari utara benar. Gunakan rujukan utara; anak panah ini tidak mengikut putaran telefon.",
    unavailable: "Sensor kompas tidak tersedia. ",
    denied: "Kebenaran sensor tidak diberikan. ",
    permissionTimeout:
      "Permintaan kebenaran sensor belum selesai. Cuba aktifkan semula. ",
    timeout: "Tiada bacaan kompas mutlak yang sesuai diterima. ",
    tilted: "Letakkan telefon mendatar supaya arah boleh dibaca. ",
    unreliable:
      "Bacaan kompas tidak cukup baik. Jauhkan telefon daripada objek logam dan gerakkannya perlahan. ",
    stopped:
      "Kompas langsung dihentikan. Aktifkan semula untuk bacaan baharu. ",
    gpsDenied:
      "Akses lokasi tidak dibenarkan. Benarkan lokasi dalam tetapan pelayar, kemudian cuba lagi. ",
    gpsTimeout:
      "Lokasi mengambil masa terlalu lama. Cuba lagi di tempat yang mempunyai isyarat GPS lebih baik. ",
    gpsUnavailable:
      "Lokasi semasa tidak dapat diperoleh. Semak tetapan lokasi peranti dan cuba lagi. ",
    gpsUnsupported:
      "Pelayar ini tidak menyokong lokasi. Cuba pelayar lain untuk mengira arah kiblat. ",
    locationStale:
      " Lokasi terakhir digunakan kerana GPS belum dapat dikemas kini.",
    noBearing: "Arah kiblat tidak dapat ditentukan daripada koordinat ini.",
    secure: "Akses lokasi memerlukan sambungan HTTPS yang selamat.",
    start: "Aktifkan kompas langsung",
    retry: "Cuba lagi",
    refresh: "Kemas kini lokasi",
    busy: "Mendapatkan arah…",
    stop: "Hentikan kompas",
    idleLabel: "Lokasi diperlukan",
    loadingLabel: "Mencari lokasi",
    waitingLabel: "Menunggu sensor",
    staticLabel: "Arah tetap · bukan langsung",
    liveLabel: "Kompas langsung",
    errorLabel: "Lokasi tidak tersedia",
    aligned: "Anggaran sehala dengan kiblat",
    left: "Pusing ke kiri kira-kira {degrees}°",
    right: "Pusing ke kanan kira-kira {degrees}°",
  },
  en: {
    idle: "Allow location access to calculate the Qibla direction from where you are.",
    locating: "Getting your current location…",
    waiting:
      "Move your phone gently while holding it flat to obtain an absolute compass reading.",
    permissionWaiting:
      "Qibla bearing calculated. Complete the sensor permission request for live guidance.",
    live: "The live compass follows your phone’s rotation. Hold it flat; the direction and alignment are sensor estimates.",
    magnetic:
      "The live compass follows your phone’s rotation using magnetic north. Alignment is approximate; the numeric bearing is measured from true north.",
    static:
      "Static bearing: {angle}° clockwise from true north. Use a north reference; this arrow does not follow your phone’s rotation.",
    unavailable: "A compass sensor is unavailable. ",
    denied: "Sensor permission was not granted. ",
    permissionTimeout:
      "The sensor permission request did not finish. Try enabling it again. ",
    timeout: "No suitable absolute compass reading was received. ",
    tilted: "Hold your phone flat so its direction can be read. ",
    unreliable:
      "The compass reading is not reliable enough. Move away from metal objects and move your phone gently. ",
    stopped:
      "The live compass has stopped. Enable it again for a fresh reading. ",
    gpsDenied:
      "Location access was denied. Allow location in your browser settings, then try again. ",
    gpsTimeout:
      "Getting your location took too long. Try again somewhere with a better GPS signal. ",
    gpsUnavailable:
      "Your current location could not be obtained. Check your device’s location settings and try again. ",
    gpsUnsupported:
      "This browser does not support location. Try another browser to calculate the Qibla bearing. ",
    locationStale:
      " The last location is being used because GPS has not updated yet.",
    noBearing: "A Qibla bearing cannot be determined from these coordinates.",
    secure: "Location access requires a secure HTTPS connection.",
    start: "Enable live compass",
    retry: "Try again",
    refresh: "Refresh location",
    busy: "Finding direction…",
    stop: "Stop compass",
    idleLabel: "Location needed",
    loadingLabel: "Finding location",
    waitingLabel: "Waiting for sensor",
    staticLabel: "Static bearing · not live",
    liveLabel: "Live compass",
    errorLabel: "Location unavailable",
    aligned: "Approximately aligned with Qibla",
    left: "Turn left by about {degrees}°",
    right: "Turn right by about {degrees}°",
  },
};

function defaultPosition({ maximumAge, timeout, highAccuracy }) {
  if (!navigator.geolocation)
    return Promise.reject({ reason: "gpsUnsupported" });
  return new Promise((resolve, reject) =>
    navigator.geolocation.getCurrentPosition(resolve, reject, {
      enableHighAccuracy: highAccuracy,
      maximumAge,
      timeout,
    }),
  );
}

export function createQibla({
  getLanguage = () => "ms",
  getPosition = defaultPosition,
} = {}) {
  const host = window;
  const elements = Object.fromEntries(
    [
      "qiblaNeedle",
      "qiblaDirections",
      "qiblaAngle",
      "qiblaStatus",
      "qiblaIndicator",
      "compassBtn",
      "qiblaDistance",
      "qiblaAlignment",
      "qiblaStopBtn",
    ].map((id) => [id, document.getElementById(id)]),
  );
  const distanceFormats = Object.fromEntries(
    ["ms", "en"].map((language) => [
      language,
      [0, 2].map(
        (maximumFractionDigits) =>
          new Intl.NumberFormat(language === "ms" ? "ms-MY" : "en-GB", {
            maximumFractionDigits,
          }),
      ),
    ]),
  );
  let state = "idle",
    reason = "idle",
    bearing = null,
    heading = null,
    distance = null;
  let busy = false,
    destroyed = false,
    attempt = 0,
    sessionActive = false;
  let sensorTimer,
    controller,
    watchId,
    latestSample,
    removeListeners = () => {};
  let activeRank = 0,
    needleRotation = null,
    needleMode = null,
    directionsRotation = 0,
    latestTimestamp = 0;
  let magnetic = false,
    locationStale = false;

  function stopTracking() {
    sessionActive = false;
    host.clearTimeout(sensorTimer);
    sensorTimer = undefined;
    removeListeners();
    removeListeners = () => {};
    if (watchId !== undefined) navigator.geolocation?.clearWatch?.(watchId);
    watchId = undefined;
    heading = null;
    latestSample = null;
    activeRank = 0;
  }

  function render() {
    if (destroyed) return;
    const language = getLanguage() === "en" ? "en" : "ms";
    const text = messages[language];
    const angle =
      bearing === null
        ? "—"
        : ((Math.round(bearing * 10) % 3600) / 10).toFixed(1);
    const isLive = state === "live" && sessionActive && heading !== null;
    setText(elements.qiblaAngle, bearing === null ? "—" : `${angle}°`);
    setText(
      elements.qiblaDistance,
      distance === null
        ? "—"
        : `${distanceFormats[language][distance < 1 ? 1 : 0].format(distance)} km`,
    );
    if (elements.qiblaNeedle) {
      elements.qiblaNeedle.hidden = bearing === null;
      const target =
        bearing === null ? 0 : normalize(bearing - (isLive ? heading : 0));
      const mode = isLive ? "live" : "static";
      // Unwrap 359° -> 1° into a two-degree movement, not a full-circle spin.
      needleRotation =
        needleRotation === null || mode !== needleMode
          ? target
          : needleRotation + difference(target, normalize(needleRotation));
      needleMode = mode;
      elements.qiblaNeedle.style.transform = `rotate(${needleRotation}deg)`;
      elements.qiblaNeedle.dataset.mode = mode;
    }
    if (elements.qiblaDirections) {
      // Cardinal directions share the device-relative frame of the needle.
      // Keep the shortest continuous turn while live; static north is at top.
      directionsRotation = isLive
        ? directionsRotation +
          difference(-heading, normalize(directionsRotation))
        : 0;
      elements.qiblaDirections.style.transform = `rotate(${directionsRotation}deg)`;
    }
    setText(
      elements.qiblaStatus,
      state === "static"
        ? `${text[reason] || ""}${text.static.replace("{angle}", angle)}`
        : `${text[reason]}${isLive && locationStale ? text.locationStale : ""}`,
    );
    if (elements.qiblaIndicator) {
      elements.qiblaIndicator.dataset.state = state;
      setText(elements.qiblaIndicator, text[`${state}Label`]);
    }
    if (elements.qiblaAlignment) {
      const alignment = isLive ? getAlignment(bearing, heading) : null;
      elements.qiblaAlignment.hidden = !alignment;
      elements.qiblaAlignment.dataset.state =
        alignment?.direction || "inactive";
      setText(
        elements.qiblaAlignment,
        alignment
          ? text[alignment.direction].replace("{degrees}", alignment.degrees)
          : "",
      );
    }
    if (elements.compassBtn) {
      elements.compassBtn.disabled = busy;
      elements.compassBtn.setAttribute("aria-busy", String(busy));
      setText(
        elements.compassBtn,
        busy
          ? text.busy
          : state === "live"
            ? text.refresh
            : state === "error"
              ? text.retry
              : text.start,
      );
    }
    if (elements.qiblaStopBtn) {
      elements.qiblaStopBtn.hidden = !busy && !sessionActive;
      setText(elements.qiblaStopBtn, text.stop);
    }
  }

  function waitFor(promise, signal, timeoutReason) {
    return new Promise((resolve, reject) => {
      let finished = false;
      const finish = (callback, value) => {
        if (finished) return;
        finished = true;
        host.clearTimeout(timer);
        signal.removeEventListener("abort", abort);
        callback(value);
      };
      const abort = () => finish(reject, { name: "AbortError" });
      const timer = host.setTimeout(
        () => finish(reject, { reason: timeoutReason }),
        REQUEST_TIMEOUT_MS,
      );
      signal.addEventListener("abort", abort, { once: true });
      Promise.resolve(promise).then(
        (value) => finish(resolve, value),
        (error) => finish(reject, error),
      );
      if (signal.aborted) abort();
    });
  }

  function stop() {
    attempt += 1;
    controller?.abort();
    stopTracking();
    busy = false;
    locationStale = false;
    state = bearing === null ? "idle" : "static";
    reason = bearing === null ? "idle" : "stopped";
    render();
  }

  function sensorTimeout() {
    if (
      sensorTimer !== undefined ||
      !sessionActive ||
      bearing === null ||
      heading !== null
    )
      return;
    sensorTimer = host.setTimeout(() => {
      const lastIssue = ["tilted", "unreliable"].includes(reason)
        ? reason
        : "timeout";
      stopTracking();
      state = "static";
      reason = lastIssue;
      render();
    }, SENSOR_TIMEOUT_MS);
  }

  function screenAngle() {
    return Number.isFinite(host.screen?.orientation?.angle)
      ? host.screen.orientation.angle
      : Number.isFinite(host.orientation)
        ? host.orientation
        : 0;
  }

  function startSensors(currentAttempt) {
    if (destroyed || currentAttempt !== attempt || document.hidden) return;
    sessionActive = true;
    const receive = (event, channel, rotationOnly = false) => {
      if (!sessionActive || currentAttempt !== attempt || document.hidden)
        return;
      const rank = hasWebKitHeading(event) ? 3 : channel === "absolute" ? 2 : 1;
      if (rank < activeRank) return; // Ignore parallel relative events after an absolute sensor is established.
      const nextHeading = getHeading(event, screenAngle());
      if (nextHeading === null) {
        if (!activeRank && event.absolute !== true && !hasWebKitHeading(event))
          return;
        heading = null;
        latestSample = null;
        activeRank = 0;
        if (bearing !== null) {
          state = "static";
          reason = readingIssue(event) || "unreliable";
          sensorTimeout();
          render();
        }
        return;
      }
      activeRank = rank;
      heading = nextHeading;
      magnetic = hasWebKitHeading(event);
      if (!rotationOnly)
        latestSample = {
          event: {
            absolute: event.absolute,
            alpha: event.alpha,
            beta: event.beta,
            gamma: event.gamma,
            ...(hasWebKitHeading(event)
              ? {
                  webkitCompassHeading: event.webkitCompassHeading,
                  webkitCompassAccuracy: event.webkitCompassAccuracy,
                }
              : {}),
          },
          channel,
        };
      // W3C permits events only when orientation changes. A motionless phone
      // remains valid; lifecycle events and explicitly bad readings revoke it.
      host.clearTimeout(sensorTimer);
      sensorTimer = undefined;
      if (bearing !== null) {
        state = "live";
        reason = magnetic ? "magnetic" : "live";
        render();
      }
    };
    const absolute = (event) => receive(event, "absolute");
    const generic = (event) => receive(event, "generic");
    const rotate = () => {
      if (latestSample) receive(latestSample.event, latestSample.channel, true);
    };
    host.addEventListener("deviceorientationabsolute", absolute);
    host.addEventListener("deviceorientation", generic);
    host.addEventListener("orientationchange", rotate);
    host.screen?.orientation?.addEventListener?.("change", rotate);
    removeListeners = () => {
      host.removeEventListener("deviceorientationabsolute", absolute);
      host.removeEventListener("deviceorientation", generic);
      host.removeEventListener("orientationchange", rotate);
      host.screen?.orientation?.removeEventListener?.("change", rotate);
    };
  }

  function updatePosition(position) {
    const { latitude, longitude, accuracy } = position?.coords || {};
    if (
      !validCoordinates(latitude, longitude) ||
      (accuracy != null && (!Number.isFinite(accuracy) || accuracy < 0))
    )
      return false;
    if (
      position.timestamp != null &&
      (!Number.isFinite(position.timestamp) ||
        position.timestamp < Date.now() - 60000 ||
        position.timestamp > Date.now() + 60000 ||
        position.timestamp < latestTimestamp)
    )
      return false;
    const nextBearing = getBearing(latitude, longitude);
    if (nextBearing === null) return false;
    latestTimestamp = position.timestamp ?? latestTimestamp;
    bearing = nextBearing;
    distance = getDistance(latitude, longitude);
    locationStale = false;
    return true;
  }

  function watchLocation(currentAttempt) {
    if (!sessionActive || !navigator.geolocation?.watchPosition) return;
    try {
      watchId = navigator.geolocation.watchPosition(
        (position) => {
          if (!sessionActive || destroyed || currentAttempt !== attempt) return;
          if (updatePosition(position)) render();
        },
        (error) => {
          if (!sessionActive || destroyed || currentAttempt !== attempt) return;
          if (error?.code === 1) {
            stopTracking();
            state = "static";
            reason = "gpsDenied";
          } else locationStale = true;
          render();
        },
        { enableHighAccuracy: true, maximumAge: 0, timeout: 20000 },
      );
    } catch {
      locationStale = true;
      render();
    }
  }

  async function enable() {
    if (busy || destroyed) return;
    controller?.abort();
    stopTracking();
    const currentAttempt = ++attempt;
    controller = new AbortController();
    const signal = controller.signal;
    bearing = null;
    distance = null;
    latestTimestamp = 0;
    locationStale = false;
    busy = true;
    state = "loading";
    reason = "locating";
    render();

    // Invoke synchronously within the click gesture, BEFORE GPS or any await.
    const Orientation = host.DeviceOrientationEvent;
    let request;
    try {
      request =
        typeof Orientation?.requestPermission === "function"
          ? Orientation.requestPermission(true)
          : Orientation ||
              "ondeviceorientationabsolute" in host ||
              "ondeviceorientation" in host
            ? "granted"
            : "unavailable";
    } catch {
      request = "denied";
    }
    const permission = waitFor(request, signal, "permissionTimeout")
      .then(
        (value) =>
          ["granted", "unavailable"].includes(value) ? value : "denied",
        (error) =>
          error?.reason === "permissionTimeout"
            ? "permissionTimeout"
            : "denied",
      )
      .then((value) => {
        // Listen as soon as permission resolves so an initial reading is not
        // lost while a slower GPS request is still pending.
        if (!signal.aborted && value === "granted")
          startSensors(currentAttempt);
        return value;
      });
    try {
      if (host.isSecureContext === false) throw { reason: "secure" };
      const position = await waitFor(
        getPosition({
          signal,
          maximumAge: 0,
          timeout: 15000,
          highAccuracy: true,
        }),
        signal,
        "gpsTimeout",
      );
      if (destroyed || signal.aborted || currentAttempt !== attempt) return;
      if (!updatePosition(position)) throw { reason: "noBearing" };
      state = "waiting";
      reason = "permissionWaiting";
      render();
      const permissionState = await permission;
      if (destroyed || signal.aborted || currentAttempt !== attempt) return;
      busy = false;
      if (permissionState === "granted" && sessionActive) {
        state = heading === null ? "waiting" : "live";
        reason = heading === null ? "waiting" : magnetic ? "magnetic" : "live";
        sensorTimeout();
        watchLocation(currentAttempt);
      } else {
        state = "static";
        reason = permissionState === "granted" ? "stopped" : permissionState;
      }
      render();
    } catch (error) {
      if (destroyed || signal.aborted || currentAttempt !== attempt) return;
      if (error?.name === "AbortError") {
        stop();
        return;
      }
      controller.abort();
      stopTracking();
      busy = false;
      state = "error";
      reason = messages.ms[error?.reason]
        ? error.reason
        : error?.code === "unsupported"
          ? "gpsUnsupported"
          : error?.code === 1
            ? "gpsDenied"
            : error?.code === 3
              ? "gpsTimeout"
              : "gpsUnavailable";
      render();
    }
  }

  const onVisibility = () => {
    if (document.hidden && (busy || sessionActive)) stop();
  };
  const onPageHide = () => {
    if (busy || sessionActive) stop();
  };
  document.addEventListener?.("visibilitychange", onVisibility);
  host.addEventListener("pagehide", onPageHide);
  elements.qiblaStopBtn?.addEventListener?.("click", stop);

  function destroy() {
    stop();
    destroyed = true;
    document.removeEventListener?.("visibilitychange", onVisibility);
    host.removeEventListener("pagehide", onPageHide);
    elements.qiblaStopBtn?.removeEventListener?.("click", stop);
  }
  render();
  return { enable, stop, render, destroy };
}
