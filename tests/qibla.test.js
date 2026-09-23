import test from "node:test";
import assert from "node:assert/strict";
import { getBearing, getHeading, createQibla } from "../qibla.js";

test("Qibla bearings are geographic, including a valid zero-degree bearing", () => {
  assert.ok(Math.abs(getBearing(3.139, 101.6869) - 292.54) < 0.1);
  assert.equal(getBearing(0, 39.826206), 0);
  assert.equal(getBearing(21.422487, 39.826206), null);
  for (const values of [
    [NaN, 100],
    [4, Infinity],
    [91, 100],
    [4, 181],
    [null, 100],
  ]) {
    assert.equal(getBearing(...values), null);
  }
});

test("only absolute or valid WebKit compass headings can activate guidance", () => {
  assert.equal(getHeading({ absolute: true, alpha: 0 }), 0);
  assert.equal(getHeading({ absolute: true, alpha: 90 }), 270);
  assert.equal(getHeading({ absolute: false, alpha: 90 }), null);
  assert.equal(getHeading({ alpha: 90 }), null);
  assert.equal(getHeading({ absolute: true, alpha: null }), null);
  assert.equal(getHeading({ absolute: true, alpha: Infinity }), null);
  assert.equal(getHeading({ webkitCompassHeading: 0 }), 0);
  assert.equal(getHeading({ webkitCompassHeading: 45 }, 90), 135);
  assert.equal(
    getHeading({ webkitCompassHeading: 10, webkitCompassAccuracy: -1 }),
    null,
  );
  assert.equal(getHeading({ webkitCompassHeading: -1 }), null);
});

function browserHarness({ permission = "granted", locationError } = {}) {
  const original = Object.fromEntries(
    ["window", "document", "navigator"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const elements = new Map();
  const listeners = new Map();
  const timers = new Map();
  const calls = [];
  let timerId = 0;
  let finishLocation;
  const host = {
    isSecureContext: true,
    screen: { orientation: { angle: 0 } },
    DeviceOrientationEvent: {
      requestPermission: (absolute) => {
        calls.push(["permission", absolute]);
        return Promise.resolve(permission);
      },
    },
    addEventListener: (name, callback) => listeners.set(name, callback),
    removeEventListener: (name) => listeners.delete(name),
    setTimeout: (callback) => {
      timers.set(++timerId, callback);
      return timerId;
    },
    clearTimeout: (id) => timers.delete(id),
  };
  const doc = {
    getElementById: (id) => {
      if (!elements.has(id))
        elements.set(id, {
          textContent: "",
          style: {},
          dataset: {},
          setAttribute() {},
        });
      return elements.get(id);
    },
  };
  const nav = {
    geolocation: {
      getCurrentPosition: (resolve, reject, options) => {
        calls.push(["location", options]);
        finishLocation = () =>
          locationError
            ? reject(locationError)
            : resolve({ coords: { latitude: 3.139, longitude: 101.6869 } });
      },
    },
  };
  Object.entries({ window: host, document: doc, navigator: nav }).forEach(
    ([key, value]) => {
      Object.defineProperty(globalThis, key, { configurable: true, value });
    },
  );
  return {
    calls,
    host,
    elements,
    listeners,
    timers,
    finishLocation: () => finishLocation(),
    cleanup: () =>
      Object.entries(original).forEach(([key, descriptor]) => {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }),
  };
}

test("permission is requested within the gesture before fresh GPS; relative readings stay inactive", async () => {
  const fixture = browserHarness();
  let qibla;
  try {
    qibla = createQibla();
    const pending = qibla.enable();
    assert.deepEqual(
      fixture.calls.map(([name]) => name),
      ["permission", "location"],
    );
    assert.equal(fixture.calls[0][1], true);
    assert.equal(fixture.calls[1][1].maximumAge, 0);
    fixture.finishLocation();
    await pending;
    const indicator = fixture.elements.get("qiblaIndicator");
    assert.equal(indicator.dataset.state, "waiting");
    fixture.listeners.get("deviceorientation")({ alpha: 23, absolute: false });
    assert.equal(indicator.dataset.state, "waiting");
    fixture.listeners.get("deviceorientation")({ webkitCompassHeading: 0 });
    assert.equal(indicator.dataset.state, "live");
    assert.equal(fixture.timers.size, 0);
  } finally {
    qibla?.destroy();
    fixture.cleanup();
  }
});

test("missing absolute sensor data times out to a clearly labelled static bearing", async () => {
  const fixture = browserHarness();
  let qibla;
  try {
    qibla = createQibla();
    const pending = qibla.enable();
    fixture.finishLocation();
    await pending;
    [...fixture.timers.values()][0]();
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "static",
    );
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /utara benar/,
    );
    assert.equal(fixture.listeners.size, 0);
  } finally {
    qibla?.destroy();
    fixture.cleanup();
  }
});

test("denied sensor permission still provides a static bearing and language changes re-render", async () => {
  const fixture = browserHarness({ permission: "denied" });
  let qibla;
  try {
    let language = "ms";
    qibla = createQibla({ getLanguage: () => language });
    const pending = qibla.enable();
    fixture.finishLocation();
    await pending;
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "static",
    );
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /Kebenaran sensor/,
    );
    assert.equal(fixture.listeners.size, 0);
    language = "en";
    qibla.render();
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /clockwise from true north/,
    );
  } finally {
    qibla?.destroy();
    fixture.cleanup();
  }
});

test("GPS denial gives a recoverable error without showing a made-up direction", async () => {
  const fixture = browserHarness({ locationError: { code: 1 } });
  let qibla;
  try {
    qibla = createQibla({ getLanguage: () => "en" });
    const pending = qibla.enable();
    fixture.finishLocation();
    await pending;
    assert.equal(fixture.elements.get("qiblaIndicator").dataset.state, "error");
    assert.equal(fixture.elements.get("qiblaAngle").textContent, "—");
    assert.equal(fixture.elements.get("qiblaNeedle").hidden, true);
    assert.equal(fixture.elements.get("compassBtn").disabled, false);
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /Location access was denied/,
    );
  } finally {
    qibla?.destroy();
    fixture.cleanup();
  }
});
