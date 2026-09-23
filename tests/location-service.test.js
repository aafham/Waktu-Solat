import test from "node:test";
import assert from "node:assert/strict";
import {
  requestPosition,
  createLocationController,
  reverseGeocodePosition,
} from "../location-service.js";

const position = {
  coords: { latitude: 3.139, longitude: 101.6869, accuracy: 30 },
  timestamp: Date.now(),
};
test("browser location requests use bounded fresh GPS options", async () => {
  let options;
  const actual = await requestPosition({
    geolocation: {
      getCurrentPosition(resolve, reject, input) {
        options = input;
        resolve(position);
      },
    },
  });
  assert.equal(actual, position);
  assert.deepEqual(options, {
    enableHighAccuracy: true,
    timeout: 15000,
    maximumAge: 60000,
  });
});
test("abort cancels a pending native request and ignores its eventual result", async () => {
  const controller = new AbortController();
  let success;
  const pending = requestPosition({
    signal: controller.signal,
    geolocation: {
      getCurrentPosition(resolve) {
        success = resolve;
      },
    },
  });
  controller.abort();
  success(position);
  await assert.rejects(pending, { name: "AbortError" });
});
test("permission denial and invalid coordinates propagate without invented position", async () => {
  await assert.rejects(
    requestPosition({
      geolocation: {
        getCurrentPosition(resolve, reject) {
          reject({ code: 1 });
        },
      },
    }),
    (error) => error.code === 1,
  );
  await assert.rejects(
    requestPosition({
      geolocation: {
        getCurrentPosition(resolve) {
          resolve({ coords: { latitude: NaN, longitude: 0, accuracy: 0 } });
        },
      },
    }),
    (error) => error.code === "invalid-position",
  );
});
test("automatic zone detection emits progress and only then the resolved zone", async () => {
  const states = [],
    selected = [];
  const controller = createLocationController({
    getPosition: async (options) => {
      assert.equal(options.maximumAge, 0);
      return position;
    },
    resolveZone: async () => "WLY01",
    onState: (s) => states.push(s.status),
    onZone: (...args) => selected.push(args),
  });
  await controller.detect();
  assert.deepEqual(states, ["locating", "resolving", "success"]);
  assert.deepEqual(selected, [["WLY01", position]]);
});
test("manual cancellation during API resolution cannot change the selected zone", async () => {
  let complete;
  const selected = [];
  const controller = createLocationController({
    getPosition: async () => position,
    resolveZone: () =>
      new Promise((resolve) => {
        complete = resolve;
      }),
    onZone: (zone) => selected.push(zone),
  });
  const pending = controller.detect();
  await new Promise(setImmediate);
  controller.cancel();
  complete("WLY01");
  await pending;
  assert.deepEqual(selected, []);
});
test("later GPS attempt wins even when an older request resolves afterward", async () => {
  const positions = [],
    selected = [];
  const controller = createLocationController({
    getPosition: () => new Promise((resolve) => positions.push(resolve)),
    resolveZone: async (lat) => (lat === 3.139 ? "WLY01" : "SBH07"),
    onZone: (zone) => selected.push(zone),
  });
  const first = controller.detect(),
    second = controller.detect();
  positions[1]({ coords: { ...position.coords, latitude: 5.98 } });
  await second;
  positions[0](position);
  await first;
  assert.deepEqual(selected, ["SBH07"]);
});
test("automatic foreground checks are throttled while explicit retry bypasses interval", async () => {
  let now = 0,
    calls = 0;
  const controller = createLocationController({
    getPosition: async () => {
      calls++;
      return position;
    },
    resolveZone: async () => "WLY01",
    now: () => now,
  });
  await controller.detect({ automatic: true });
  await controller.detect({ automatic: true });
  assert.equal(calls, 1);
  await controller.detect();
  assert.equal(calls, 2);
  now = 300001;
  await controller.detect({ automatic: true });
  assert.equal(calls, 3);
});
test("low precision location does not resolve a potentially wrong prayer zone", async () => {
  const states = [];
  let calls = 0;
  const controller = createLocationController({
    getPosition: async () => ({
      coords: { ...position.coords, accuracy: 20000 },
    }),
    resolveZone: async () => {
      calls++;
    },
    onState: (s) => states.push(s),
  });
  await controller.detect();
  assert.equal(calls, 0);
  assert.equal(states.at(-1).code, "low-accuracy");
});

test("place names preserve the device coordinates and validated administrative metadata", async (t) => {
  let requested;
  t.mock.method(globalThis, "fetch", async (url) => {
    requested = new URL(url);
    return {
      ok: true,
      json: async () => ({
        latitude: 3.139,
        longitude: 101.6869,
        countryCode: "MY",
        countryName: "Malaysia",
        principalSubdivision: "Kuala Lumpur",
        principalSubdivisionCode: "MY-14",
        city: "Kuala Lumpur",
        locality: "  Bukit Bintang  ",
        localityInfo: { administrative: [{ name: "Kuala Lumpur" }] },
      }),
    };
  });
  const place = await reverseGeocodePosition(position);
  assert.equal(
    requested.searchParams.get("latitude"),
    String(position.coords.latitude),
  );
  assert.equal(
    requested.searchParams.get("longitude"),
    String(position.coords.longitude),
  );
  assert.equal(place.locality, "Bukit Bintang");
  assert.equal(place.stateCode, "MY-14");
  assert.deepEqual(place.administrative, ["Kuala Lumpur"]);
});

test("mismatched or malformed geocoder results cannot name the current GPS position", async (t) => {
  const invalid = [
    { latitude: 1.3, longitude: 103.8, countryCode: "MY" },
    { latitude: 3.139, longitude: 101.6869, countryCode: "Malaysia" },
    { latitude: "3.139", longitude: 101.6869, countryCode: "MY" },
  ];
  t.mock.method(globalThis, "fetch", async () => ({
    ok: true,
    json: async () => invalid.shift(),
  }));
  for (let i = 0; i < 3; i++)
    await assert.rejects(reverseGeocodePosition(position), /Mismatched/);
});

test("place-name outage retains actual coordinates and still resolves the prayer zone", async () => {
  const displayed = [],
    selected = [];
  const controller = createLocationController({
    getPosition: async () => position,
    getPlace: async () => {
      throw new Error("Name service offline");
    },
    resolveZone: async (lat, lon, place) => {
      assert.equal(lat, position.coords.latitude);
      assert.equal(lon, position.coords.longitude);
      assert.equal(place, null);
      return "WLY01";
    },
    onPosition: (...args) => displayed.push(args),
    onZone: (zone) => selected.push(zone),
  });
  await controller.detect();
  assert.deepEqual(displayed.at(-1), [position, null]);
  assert.deepEqual(selected, ["WLY01"]);
});

test("an interrupted foreground check retries immediately and ignores the old result", async () => {
  const pending = [],
    selected = [],
    states = [];
  let positionCalls = 0;
  const controller = createLocationController({
    now: () => 1000,
    getPosition: async () => {
      positionCalls++;
      return position;
    },
    resolveZone: () => new Promise((resolve) => pending.push(resolve)),
    onZone: (zone) => selected.push(zone),
    onState: (state) => states.push(state.status),
  });
  const first = controller.detect({ automatic: true });
  await new Promise(setImmediate);
  controller.cancel();
  const foreground = controller.detect({ automatic: true });
  await new Promise(setImmediate);
  assert.equal(positionCalls, 2);
  pending[1]("PNG01");
  await foreground;
  pending[0]("WLY01");
  await first;
  assert.deepEqual(selected, ["PNG01"]);
  assert.equal(states.at(-1), "success");
});

test("cancelling after a completed check preserves the automatic refresh interval", async () => {
  let calls = 0;
  const controller = createLocationController({
    now: () => 1000,
    getPosition: async () => {
      calls++;
      return position;
    },
    resolveZone: async () => "WLY01",
  });
  await controller.detect({ automatic: true });
  controller.cancel();
  await controller.detect({ automatic: true });
  assert.equal(calls, 1);
});

test("a rejected GPS zone retains the actual reading without confirming any schedule", async () => {
  const displayed = [],
    selected = [],
    states = [];
  const place = { countryCode: "SG", city: "Singapore" };
  const controller = createLocationController({
    getPosition: async () => position,
    getPlace: async () => place,
    resolveZone: async () => {
      throw Object.assign(new Error("Outside Malaysia"), {
        code: "OUTSIDE_MALAYSIA",
      });
    },
    onPosition: (...args) => displayed.push(args),
    onZone: (zone) => selected.push(zone),
    onState: (state) => states.push(state),
  });
  await controller.detect();
  assert.deepEqual(displayed.at(-1), [position, place]);
  assert.deepEqual(selected, []);
  assert.equal(states.at(-1).code, "OUTSIDE_MALAYSIA");
  assert.ok(states.every((state) => state.status !== "success"));
});
