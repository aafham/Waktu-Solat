import test from "node:test";
import assert from "node:assert/strict";
import {
  getBearing,
  getHeading,
  getDistance,
  getAlignment,
  createQibla,
} from "../qibla.js";

const near = (actual, expected, precision = 1e-8) =>
  assert.ok(
    Math.abs(actual - expected) < precision,
    `${actual} should be close to ${expected}`,
  );
const position = (
  latitude = 3.139,
  longitude = 101.6869,
  timestamp = Date.now(),
) => ({ coords: { latitude, longitude, accuracy: 15 }, timestamp });
const flush = async () => {
  for (let index = 0; index < 12; index += 1) await Promise.resolve();
};

test("great-circle bearing has correct cardinal cases and known Kuala Lumpur direction", () => {
  near(getBearing(3.139, 101.6869), 292.54, 0.1);
  assert.equal(getBearing(0, 39.826206), 0);
  assert.equal(getBearing(40, 39.826206), 180);
  near(getBearing(0, 39.826206 - 90), 90 - 21.422487);
  assert.equal(getBearing(21.422487, 39.826206), null);
  assert.equal(getBearing(-21.422487, 39.826206 - 180), null);
  for (const coordinates of [
    [NaN, 100],
    [4, Infinity],
    [91, 100],
    [4, 181],
    [null, 100],
    ["4", 100],
  ]) {
    assert.equal(getBearing(...coordinates), null);
    assert.equal(getDistance(...coordinates), null);
  }
});

test("distance is zero at Kaaba and agrees with meridian and antipodal arcs", () => {
  assert.equal(getDistance(21.422487, 39.826206), 0);
  near(getDistance(0, 39.826206), (6371.0088 * 21.422487 * Math.PI) / 180);
  near(getDistance(-21.422487, 39.826206 - 180), 6371.0088 * Math.PI, 0.001);
  assert.ok(getDistance(3.139, 110) > getDistance(3.139, 100));
});

test("north-referenced alpha works in portrait and both landscape directions", () => {
  for (const [alpha, heading] of [
    [0, 0],
    [90, 270],
    [180, 180],
    [270, 90],
    [360, 0],
  ]) {
    near(getHeading({ absolute: true, alpha, beta: 0, gamma: 0 }), heading);
  }
  near(getHeading({ absolute: true, alpha: 90 }, 90), 0);
  near(getHeading({ absolute: true, alpha: 90 }, 270), 180);
  near(getHeading({ absolute: true, alpha: 90 }, -90), 180);
  // Screen-top projection for alpha=0, beta=gamma=30 in landscape is
  // east=sqrt(3)/2, north=1/4, rather than the flat-device estimate of 90°.
  near(
    getHeading({ absolute: true, alpha: 0, beta: 30, gamma: 30 }, 90),
    (Math.atan2(Math.sqrt(3) / 2, 1 / 4) * 180) / Math.PI,
  );
});

test("relative, invalid, steeply tilted and poor WebKit readings are rejected", () => {
  for (const event of [
    { alpha: 90 },
    { absolute: false, alpha: 90 },
    { absolute: true, alpha: null },
    { absolute: true, alpha: Infinity },
    { absolute: true, alpha: -1 },
    { absolute: true, alpha: 10, beta: 90 },
    { absolute: true, alpha: 10, gamma: NaN },
    { webkitCompassHeading: -1 },
    { webkitCompassHeading: null },
    { webkitCompassHeading: 10, webkitCompassAccuracy: -1 },
    { webkitCompassHeading: 10, webkitCompassAccuracy: 30 },
    { webkitCompassHeading: 10, webkitCompassAccuracy: Infinity },
  ]) {
    assert.equal(getHeading(event), null);
  }
  assert.equal(
    getHeading({ webkitCompassHeading: 0, webkitCompassAccuracy: 0 }),
    0,
  );
  assert.equal(
    getHeading({ webkitCompassHeading: 45, webkitCompassAccuracy: 10 }, 90),
    135,
  );
  assert.equal(getHeading({ absolute: true, alpha: 0 }, NaN), null);
});

test("alignment uses the shortest turn across the north boundary", () => {
  assert.deepEqual(getAlignment(1, 359), { direction: "aligned", degrees: 2 });
  assert.deepEqual(getAlignment(355, 10), { direction: "left", degrees: 15 });
  assert.deepEqual(getAlignment(15, 355), { direction: "right", degrees: 20 });
  assert.equal(getAlignment(NaN, 0), null);
});

function eventTarget() {
  const listeners = new Map();
  return {
    listeners,
    addEventListener(name, callback) {
      if (!listeners.has(name)) listeners.set(name, new Set());
      listeners.get(name).add(callback);
    },
    removeEventListener(name, callback) {
      listeners.get(name)?.delete(callback);
      if (!listeners.get(name)?.size) listeners.delete(name);
    },
    emit(name, values = {}) {
      for (const callback of [...(listeners.get(name) || [])])
        callback({ type: name, ...values });
    },
  };
}

function browserHarness({
  permission = "granted",
  noGps = false,
  noSensor = false,
} = {}) {
  const originals = Object.fromEntries(
    ["window", "document", "navigator"].map((key) => [
      key,
      Object.getOwnPropertyDescriptor(globalThis, key),
    ]),
  );
  const elements = new Map(),
    timers = new Map(),
    watches = new Map();
  const calls = [],
    requests = [],
    clearedWatches = [];
  let timerId = 0,
    watchNumber = 0,
    elapsed = 0;
  const orientation = { ...eventTarget(), angle: 0 };
  const host = {
    ...eventTarget(),
    isSecureContext: true,
    screen: { orientation },
    setTimeout(callback, delay) {
      timers.set(++timerId, { callback, due: elapsed + delay });
      return timerId;
    },
    clearTimeout(id) {
      timers.delete(id);
    },
  };
  if (!noSensor)
    host.DeviceOrientationEvent = {
      requestPermission: (absolute) => {
        calls.push(["permission", absolute]);
        return typeof permission === "function"
          ? permission()
          : Promise.resolve(permission);
      },
    };
  const doc = {
    ...eventTarget(),
    hidden: false,
    getElementById(id) {
      if (!elements.has(id))
        elements.set(id, {
          ...eventTarget(),
          textContent: "",
          style: {},
          dataset: {},
          attributes: {},
          setAttribute(name, value) {
            this.attributes[name] = value;
          },
        });
      return elements.get(id);
    },
  };
  const geolocation = {
    getCurrentPosition(resolve, reject, options) {
      calls.push(["location", options]);
      requests.push({ resolve, reject, options });
    },
    watchPosition(resolve, reject, options) {
      watches.set(++watchNumber, { resolve, reject, options });
      return watchNumber;
    },
    clearWatch(id) {
      clearedWatches.push(id);
      watches.delete(id);
    },
  };
  const nav = noGps ? {} : { geolocation };
  for (const [key, value] of Object.entries({
    window: host,
    document: doc,
    navigator: nav,
  }))
    Object.defineProperty(globalThis, key, { configurable: true, value });
  return {
    host,
    doc,
    elements,
    timers,
    watches,
    calls,
    requests,
    clearedWatches,
    sensor: (values, type = "deviceorientation") => host.emit(type, values),
    finishLocation(value = position(), index = requests.length - 1) {
      requests[index].resolve(value);
    },
    advance(milliseconds) {
      elapsed += milliseconds;
      for (const [id, timer] of [...timers])
        if (timer.due <= elapsed) {
          timers.delete(id);
          timer.callback();
        }
    },
    cleanup() {
      for (const [key, descriptor] of Object.entries(originals)) {
        if (descriptor) Object.defineProperty(globalThis, key, descriptor);
        else delete globalThis[key];
      }
    },
  };
}

async function runFixture(options, run) {
  const fixture = browserHarness(options);
  let language = "en";
  const qibla = createQibla({ getLanguage: () => language });
  try {
    await run(fixture, qibla, (value) => {
      language = value;
      qibla.render();
    });
  } finally {
    qibla.destroy();
    fixture.cleanup();
  }
}

async function enableAt(fixture, qibla, value = position()) {
  const pending = qibla.enable();
  fixture.finishLocation(value);
  await pending;
}

test("rendered bearing preserves Kuala Lumpur 292.5 degrees and wraps rounded north to 0.0", async () => {
  await runFixture({ permission: "denied" }, async (fixture, qibla) => {
    await enableAt(fixture, qibla);
    assert.equal(fixture.elements.get("qiblaAngle").textContent, "292.5°");
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /292\.5° clockwise from true north/,
    );
    // This coordinate is just east of the Kaaba's meridian, giving a bearing
    // immediately below 360 degrees that rounds to north at one decimal place.
    const nearNorth = position(0, 39.83);
    assert.ok(
      getBearing(nearNorth.coords.latitude, nearNorth.coords.longitude) >
        359.95,
    );
    await enableAt(fixture, qibla, nearNorth);
    assert.equal(fixture.elements.get("qiblaAngle").textContent, "0.0°");
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /0\.0° clockwise from true north/,
    );
  });
});

test("iOS permission is invoked in the gesture before GPS; initial sensor event during GPS is retained", async () => {
  await runFixture({}, async (fixture, qibla) => {
    const pending = qibla.enable();
    assert.deepEqual(
      fixture.calls.map(([name]) => name),
      ["permission", "location"],
    );
    assert.equal(fixture.calls[0][1], true);
    assert.equal(fixture.calls[1][1].maximumAge, 0);
    await flush();
    fixture.sensor({ webkitCompassHeading: 0, webkitCompassAccuracy: 5 });
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "loading",
    );
    fixture.finishLocation();
    await pending;
    assert.equal(fixture.elements.get("qiblaIndicator").dataset.state, "live");
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /magnetic north/,
    );
    assert.match(fixture.elements.get("qiblaDistance").textContent, /km/);
    assert.equal(fixture.timers.size, 0);
    assert.equal(fixture.watches.size, 1);
  });
});

test("relative alpha never activates guidance and sensor timeout clears tracking", async () => {
  await runFixture({}, async (fixture, qibla) => {
    await enableAt(fixture, qibla);
    fixture.sensor({ alpha: 23, absolute: false });
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "waiting",
    );
    fixture.advance(8000);
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "static",
    );
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /clockwise from true north/,
    );
    assert.equal(fixture.elements.get("qiblaAlignment").hidden, true);
    assert.equal(fixture.watches.size, 0);
    assert.equal(fixture.host.listeners.has("deviceorientation"), false);
  });
});

test("live needle updates immediately, crosses north smoothly, and follows screen rotation", async () => {
  await runFixture({}, async (fixture, qibla) => {
    await enableAt(fixture, qibla, position(0, 39.826206));
    fixture.sensor({ webkitCompassHeading: 359 });
    const before = Number(
      fixture.elements.get("qiblaNeedle").style.transform.match(/[-\d.]+/)[0],
    );
    fixture.sensor({ webkitCompassHeading: 1 });
    const after = Number(
      fixture.elements.get("qiblaNeedle").style.transform.match(/[-\d.]+/)[0],
    );
    near(after - before, -2);
    assert.equal(
      fixture.elements.get("qiblaAlignment").dataset.state,
      "aligned",
    );
    fixture.host.screen.orientation.angle = 90;
    fixture.host.screen.orientation.emit("change");
    const rotated = Number(
      fixture.elements.get("qiblaNeedle").style.transform.match(/[-\d.]+/)[0],
    );
    near(rotated - after, -90);
    assert.equal(fixture.elements.get("qiblaAlignment").dataset.state, "left");
    fixture.advance(60000); // stationary devices need not emit repeated events
    assert.equal(fixture.elements.get("qiblaIndicator").dataset.state, "live");
  });
});

test("cardinal labels rotate with the live heading and return to static north when stopped", async () => {
  await runFixture({}, async (fixture, qibla) => {
    await enableAt(fixture, qibla);
    const directions = fixture.elements.get("qiblaDirections");
    assert.equal(directions.style.transform, "rotate(0deg)");
    fixture.sensor({ webkitCompassHeading: 90 });
    assert.equal(directions.style.transform, "rotate(-90deg)");
    fixture.sensor({ webkitCompassHeading: 359 });
    assert.equal(directions.style.transform, "rotate(1deg)");
    fixture.sensor({ webkitCompassHeading: 1 });
    assert.equal(directions.style.transform, "rotate(-1deg)");
    qibla.stop();
    assert.equal(directions.style.transform, "rotate(0deg)");
  });
});

test("bad compass readings remove live alignment and recover when a valid reading arrives", async () => {
  await runFixture({}, async (fixture, qibla) => {
    await enableAt(fixture, qibla);
    fixture.sensor({ webkitCompassHeading: 292, webkitCompassAccuracy: 5 });
    fixture.sensor({ webkitCompassHeading: 292, webkitCompassAccuracy: -1 });
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "static",
    );
    assert.equal(fixture.elements.get("qiblaAlignment").hidden, true);
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /not reliable enough/,
    );
    fixture.sensor(
      { absolute: true, alpha: 68, beta: 0, gamma: 0 },
      "deviceorientationabsolute",
    );
    assert.equal(fixture.elements.get("qiblaIndicator").dataset.state, "live");
    fixture.sensor({ absolute: false, alpha: 10 });
    assert.equal(fixture.elements.get("qiblaIndicator").dataset.state, "live");
    fixture.sensor(
      { absolute: true, alpha: 68, beta: 90, gamma: 0 },
      "deviceorientationabsolute",
    );
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "static",
    );
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /Hold your phone flat/,
    );
  });
});

test("location watch updates bearing and distance but discards stale or invalid fixes atomically", async () => {
  await runFixture({}, async (fixture, qibla) => {
    await enableAt(fixture, qibla);
    fixture.sensor({ absolute: true, alpha: 60 });
    const watcher = [...fixture.watches.values()][0];
    assert.equal(watcher.options.maximumAge, 0);
    const oldAngle = fixture.elements.get("qiblaAngle").textContent;
    const oldDistance = fixture.elements.get("qiblaDistance").textContent;
    watcher.resolve(position(5.9804, 116.0735)); // Kota Kinabalu
    assert.notEqual(fixture.elements.get("qiblaAngle").textContent, oldAngle);
    assert.notEqual(
      fixture.elements.get("qiblaDistance").textContent,
      oldDistance,
    );
    const newAngle = fixture.elements.get("qiblaAngle").textContent;
    watcher.resolve(position(21.422487, 39.826206)); // no unique bearing
    watcher.resolve(position(4, 100, Date.now() - 120000));
    fixture.sensor({ absolute: true, alpha: 40 });
    assert.equal(fixture.elements.get("qiblaAngle").textContent, newAngle);
    watcher.reject({ code: 2 });
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /last location/,
    );
    watcher.reject({ code: 1 });
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "static",
    );
    assert.equal(fixture.watches.size, 0);
  });
});

test("hidden-page, explicit stop and destroy remove live sensors and location watches", async () => {
  await runFixture({}, async (fixture, qibla) => {
    await enableAt(fixture, qibla);
    fixture.sensor({ webkitCompassHeading: 290 });
    fixture.doc.hidden = true;
    fixture.doc.emit("visibilitychange");
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "static",
    );
    assert.equal(fixture.elements.get("qiblaNeedle").dataset.mode, "static");
    assert.equal(fixture.watches.size, 0);
    assert.equal(fixture.host.screen.orientation.listeners.size, 0);
    fixture.doc.hidden = false;
    fixture.doc.emit("visibilitychange");
    assert.equal(
      fixture.elements.get("qiblaIndicator").dataset.state,
      "static",
    );
    await enableAt(fixture, qibla);
    fixture.sensor({ webkitCompassHeading: 290 });
    fixture.elements.get("qiblaStopBtn").emit("click");
    assert.equal(fixture.elements.get("qiblaStopBtn").hidden, true);
    assert.equal(fixture.watches.size, 0);
    await enableAt(fixture, qibla);
    fixture.host.emit("pagehide");
    assert.equal(fixture.watches.size, 0);
    qibla.destroy();
    assert.equal(fixture.host.listeners.size, 0);
    assert.equal(fixture.doc.listeners.size, 0);
    assert.equal(fixture.timers.size, 0);
  });
});

test("cancelled GPS cannot reactivate a stopped session or overwrite a fresh retry", async () => {
  await runFixture({}, async (fixture, qibla) => {
    const cancelled = qibla.enable();
    qibla.stop();
    await cancelled;
    assert.equal(fixture.elements.get("compassBtn").disabled, false);
    const retry = qibla.enable();
    fixture.finishLocation(position(0, 39.826206), 0);
    await flush();
    assert.equal(fixture.elements.get("qiblaAngle").textContent, "—");
    fixture.finishLocation(position(5.9804, 116.0735), 1);
    await retry;
    assert.notEqual(fixture.elements.get("qiblaAngle").textContent, "0.0°");
    assert.equal(fixture.watches.size, 1);
  });
});

test("denied or unsupported sensors retain useful static bearing, distance, and translated state", async () => {
  for (const options of [{ permission: "denied" }, { noSensor: true }]) {
    await runFixture(options, async (fixture, qibla, language) => {
      await enableAt(fixture, qibla);
      assert.equal(
        fixture.elements.get("qiblaIndicator").dataset.state,
        "static",
      );
      assert.match(fixture.elements.get("qiblaDistance").textContent, /km/);
      assert.equal(fixture.watches.size, 0);
      language("ms");
      assert.match(
        fixture.elements.get("qiblaIndicator").textContent,
        /bukan langsung/,
      );
      assert.match(
        fixture.elements.get("qiblaStatus").textContent,
        /utara benar/,
      );
    });
  }
});

test("GPS errors and unsupported location restore retry control without a fabricated bearing", async () => {
  for (const code of [1, 2, 3])
    await runFixture({}, async (fixture, qibla) => {
      const pending = qibla.enable();
      fixture.requests[0].reject({ code });
      await pending;
      assert.equal(
        fixture.elements.get("qiblaIndicator").dataset.state,
        "error",
      );
      assert.equal(fixture.elements.get("qiblaAngle").textContent, "—");
      assert.equal(fixture.elements.get("qiblaNeedle").hidden, true);
      assert.equal(fixture.elements.get("compassBtn").disabled, false);
      assert.equal(fixture.host.listeners.has("deviceorientation"), false);
    });
  await runFixture({ noGps: true }, async (fixture, qibla) => {
    await qibla.enable();
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /does not support location/,
    );
  });
});

test("hung GPS and sensor permission requests have finite waits and remain retryable", async () => {
  await runFixture({}, async (fixture, qibla) => {
    const pending = qibla.enable();
    await flush();
    fixture.advance(20000);
    await pending;
    assert.match(
      fixture.elements.get("qiblaStatus").textContent,
      /took too long/,
    );
    assert.equal(fixture.elements.get("compassBtn").disabled, false);
  });
  await runFixture(
    { permission: () => new Promise(() => {}) },
    async (fixture, qibla) => {
      const pending = qibla.enable();
      fixture.finishLocation();
      await flush();
      fixture.advance(20000);
      await pending;
      assert.equal(
        fixture.elements.get("qiblaIndicator").dataset.state,
        "static",
      );
      assert.match(
        fixture.elements.get("qiblaStatus").textContent,
        /permission request did not finish/,
      );
      assert.equal(fixture.elements.get("compassBtn").disabled, false);
    },
  );
});

test("optional shared position provider receives fresh, abortable request options", async () => {
  const fixture = browserHarness();
  let options;
  const qibla = createQibla({
    getPosition: (value) => {
      options = value;
      return Promise.resolve(position());
    },
  });
  try {
    await qibla.enable();
    assert.equal(options.maximumAge, 0);
    assert.equal(options.highAccuracy, true);
    assert.equal(options.timeout, 15000);
    assert.equal(options.signal.aborted, false);
    qibla.stop();
    assert.equal(options.signal.aborted, true);
  } finally {
    qibla.destroy();
    fixture.cleanup();
  }
});
