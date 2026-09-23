/** Fresh browser location with explicit cancellation and a bounded waiting time. */
export function requestPosition({
  signal,
  maximumAge = 60000,
  timeout = 15000,
  highAccuracy = true,
  geolocation = globalThis.navigator?.geolocation,
} = {}) {
  return new Promise((resolve, reject) => {
    if (!geolocation) {
      reject(
        Object.assign(new Error("Geolocation is unavailable."), {
          code: "unsupported",
        }),
      );
      return;
    }
    if (signal?.aborted) {
      reject(new DOMException("Location request cancelled.", "AbortError"));
      return;
    }
    let settled = false;
    let timer;
    const finish = (callback, result) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      signal?.removeEventListener("abort", abort);
      callback(result);
    };
    const abort = () =>
      finish(
        reject,
        new DOMException("Location request cancelled.", "AbortError"),
      );
    signal?.addEventListener("abort", abort, { once: true });
    // Some embedded browsers fail to invoke either native callback.
    timer = setTimeout(
      () =>
        finish(
          reject,
          Object.assign(new Error("Location timed out."), { code: 3 }),
        ),
      timeout + 1000,
    );
    try {
      geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude, accuracy } = position?.coords || {};
          if (
            ![latitude, longitude, accuracy].every(Number.isFinite) ||
            Math.abs(latitude) > 90 ||
            Math.abs(longitude) > 180 ||
            accuracy < 0
          ) {
            finish(
              reject,
              Object.assign(new Error("Invalid location reading."), {
                code: "invalid-position",
              }),
            );
            return;
          }
          finish(resolve, position);
        },
        (error) => finish(reject, error),
        {
          enableHighAccuracy: highAccuracy,
          timeout,
          maximumAge,
        },
      );
    } catch (error) {
      finish(reject, error);
    }
  });
}

export async function getLocationPermission() {
  try {
    return (await navigator.permissions.query({ name: "geolocation" })).state;
  } catch {
    // Safari and embedded browsers may not implement the Permissions API.
    return "unknown";
  }
}

/** The free client endpoint is only called with fresh, consented device GPS. */
export async function reverseGeocodePosition(
  position,
  { signal, language = "ms" } = {},
) {
  const { latitude, longitude } = position.coords;
  const controller = new AbortController();
  const abort = () => controller.abort();
  if (signal?.aborted) throw new DOMException("Cancelled.", "AbortError");
  signal?.addEventListener("abort", abort, { once: true });
  const timer = setTimeout(abort, 6000);
  try {
    const query = new URLSearchParams({
      latitude: String(latitude),
      longitude: String(longitude),
      localityLanguage: language,
    });
    const response = await fetch(
      `https://api.bigdatacloud.net/data/reverse-geocode-client?${query}`,
      { signal: controller.signal, cache: "no-store" },
    );
    if (!response.ok) throw new Error("Place name unavailable.");
    const data = await response.json();
    if (
      ![data.latitude, data.longitude].every(Number.isFinite) ||
      Math.abs(data.latitude - latitude) > 0.01 ||
      Math.abs(data.longitude - longitude) > 0.01 ||
      !/^[A-Z]{2}$/.test(data.countryCode)
    )
      throw new Error("Mismatched geocoding result.");
    const clean = (value) =>
      typeof value === "string" ? value.trim().slice(0, 180) : "";
    return {
      countryCode: data.countryCode,
      state: clean(data.principalSubdivision),
      stateCode: clean(data.principalSubdivisionCode),
      city: clean(data.city),
      locality: clean(data.locality),
      country: clean(data.countryName),
      district: "",
      administrative: (data.localityInfo?.administrative || [])
        .map((item) => clean(item.name))
        .filter(Boolean),
    };
  } finally {
    clearTimeout(timer);
    signal?.removeEventListener("abort", abort);
  }
}

/** Prevent stale GPS/API results from overriding a newer manual choice. */
export function createLocationController({
  getPosition = requestPosition,
  getPlace = async () => null,
  resolveZone,
  onState = () => {},
  onPosition = () => {},
  onZone = () => {},
  now = () => Date.now(),
  refreshInterval = 5 * 60 * 1000,
} = {}) {
  let active = null;
  let sequence = 0;
  let lastCheck = null;

  function cancel() {
    // An interrupted check must be retried when a page returns from bfcache.
    // Keep the interval for completed checks, including ordinary foreground events.
    if (active) lastCheck = null;
    sequence += 1;
    active?.abort();
    active = null;
  }

  async function detect({ automatic = false } = {}) {
    if (
      automatic &&
      (active || (lastCheck !== null && now() - lastCheck < refreshInterval))
    )
      return;
    cancel();
    const request = sequence;
    const controller = new AbortController();
    active = controller;
    lastCheck = now();
    onState({ status: "locating" });
    try {
      const position = await getPosition({
        signal: controller.signal,
        maximumAge: 0,
        timeout: 12000,
      });
      if (request !== sequence) return;
      onPosition(position, null);
      // A town-sized uncertainty can place the user across a prayer-zone border.
      if (position.coords.accuracy > 5000) {
        throw Object.assign(new Error("Location is too approximate."), {
          code: "low-accuracy",
          accuracy: position.coords.accuracy,
        });
      }
      onState({ status: "resolving", accuracy: position.coords.accuracy });
      let place = null;
      try {
        place = await getPlace(position, { signal: controller.signal });
      } catch (error) {
        if (controller.signal.aborted) throw error;
        // Exact coordinates remain available even if the place-name service is down.
      }
      if (request !== sequence) return;
      onPosition(position, place);
      const zone = await resolveZone(
        position.coords.latitude,
        position.coords.longitude,
        place,
      );
      if (request !== sequence) return;
      onZone(zone, position);
      onState({
        status: "success",
        accuracy: position.coords.accuracy,
        checkedAt: now(),
      });
    } catch (error) {
      if (request !== sequence || error?.name === "AbortError") return;
      onState({
        status: "error",
        code: error?.code,
        accuracy: error?.accuracy,
      });
    } finally {
      if (request === sequence) active = null;
    }
  }
  return { detect, cancel };
}
