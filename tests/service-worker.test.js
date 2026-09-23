import test from "node:test";
import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";
import vm from "node:vm";

const source = await readFile(
  new URL("../service-worker.js", import.meta.url),
  "utf8",
);
const scope = "https://example.test/solat/";
const appCache = "waktu-solat-app-v18";
const indexUrl = `${scope}index.html`;

function worker({
  fetcher = async () => new Response("network"),
  cacheNames = [],
  installError = false,
  storageError = false,
} = {}) {
  const handlers = new Map();
  const stores = new Map(cacheNames.map((name) => [name, new Map()]));
  const deleted = [],
    fetched = [],
    precached = [];
  let skipped = false,
    claimed = false;
  const store = (name) => {
    if (!stores.has(name)) stores.set(name, new Map());
    return stores.get(name);
  };
  const caches = {
    keys: async () => [...stores.keys()],
    delete: async (name) => {
      deleted.push(name);
      return stores.delete(name);
    },
    open: async (name) => ({
      addAll: async (requests) => {
        if (installError) throw new Error("offline");
        for (const request of requests) {
          precached.push(request);
          store(name).set(request.url, new Response(`asset:${request.url}`));
        }
      },
      match: async (key) =>
        store(name)
          .get(typeof key === "string" ? key : key.url)
          ?.clone(),
      put: async (key, response) => {
        if (storageError) throw new Error("QuotaExceededError");
        store(name).set(
          typeof key === "string" ? key : key.url,
          response.clone(),
        );
      },
    }),
  };
  const context = vm.createContext({
    URL,
    Request,
    Response,
    caches,
    self: {
      registration: { scope },
      addEventListener: (name, handler) => handlers.set(name, handler),
      skipWaiting: async () => {
        skipped = true;
      },
      clients: {
        claim: async () => {
          claimed = true;
        },
      },
    },
    fetch: async (request) => {
      fetched.push(request);
      return fetcher(request);
    },
  });
  vm.runInContext(source, context, { filename: "service-worker.js" });
  return {
    stores,
    deleted,
    fetched,
    precached,
    get skipped() {
      return skipped;
    },
    get claimed() {
      return claimed;
    },
    async lifecycle(name) {
      let task;
      handlers.get(name)({
        waitUntil(promise) {
          task = promise;
        },
      });
      await task;
    },
    dispatch(url, mode = "cors", method = "GET") {
      let response;
      handlers.get("fetch")({
        request: { url, mode, method },
        respondWith(promise) {
          response = promise;
        },
      });
      return response;
    },
    seed(key, body = "saved") {
      store(appCache).set(key, new Response(body));
    },
  };
}

test("installation saves the full ES-module shell at the service-worker scope before taking over", async () => {
  const app = worker();
  await app.lifecycle("install");
  for (const file of [
    "index.html",
    "script.js",
    "prayer-data.js",
    "location-service.js",
    "qibla.js",
    "zones.js",
    "style.css",
    "manifest.json",
  ]) {
    assert.ok(
      app.stores.get(appCache).has(`${scope}${file}`),
      `${file} should be available offline`,
    );
  }
  assert.ok(
    app.precached.every(
      (request) => request.url.startsWith(scope) && request.cache === "reload",
    ),
  );
  assert.equal(app.skipped, true);
});

test("an incomplete installation cannot take over the working application", async () => {
  const app = worker({ installError: true });
  await assert.rejects(app.lifecycle("install"));
  assert.equal(app.skipped, false);
});

test("activation removes old application/data caches and preserves unrelated applications", async () => {
  const app = worker({
    cacheNames: [
      appCache,
      "waktu-solat-app-v16",
      "waktu-solat-data-v16",
      "another-app-v1",
    ],
  });
  await app.lifecycle("activate");
  assert.deepEqual(app.deleted.sort(), [
    "waktu-solat-app-v16",
    "waktu-solat-data-v16",
  ]);
  assert.ok(app.stores.has("another-app-v1"));
  assert.ok(app.stores.has(appCache));
  assert.equal(app.claimed, true);
});

test("navigation is network-first and saves one canonical index instead of every query URL", async () => {
  const app = worker();
  app.seed(indexUrl);
  const response = await app.dispatch(`${scope}?source=home`, "navigate");
  assert.equal(await response.text(), "network");
  assert.equal(await app.stores.get(appCache).get(indexUrl).text(), "network");
  assert.equal(app.stores.get(appCache).size, 1);
  assert.equal(app.fetched.length, 1);
});

test("offline root and index navigations use the saved index even with query strings", async () => {
  const app = worker({
    fetcher: async () => {
      throw new Error("offline");
    },
  });
  app.seed(indexUrl, "offline app");
  for (const url of [scope, `${scope}?source=installed`, `${indexUrl}?v=17`]) {
    const response = await app.dispatch(url, "navigate");
    assert.equal(await response.text(), "offline app");
  }
});

test("server errors cannot replace the last working HTML, and missing cache preserves the error", async () => {
  const app = worker({
    fetcher: async () => new Response("unavailable", { status: 503 }),
  });
  app.seed(indexUrl, "working app");
  assert.equal(
    await (await app.dispatch(scope, "navigate")).text(),
    "working app",
  );
  assert.equal(
    await app.stores.get(appCache).get(indexUrl).text(),
    "working app",
  );
  const empty = worker({
    fetcher: async () => new Response("unavailable", { status: 503 }),
  });
  assert.equal((await empty.dispatch(scope, "navigate")).status, 503);
});

test("cached scripts, modules and styles load offline without network requests", async () => {
  const app = worker({
    fetcher: async () => {
      throw new Error("offline");
    },
  });
  await app.lifecycle("install");
  for (const file of [
    "script.js",
    "prayer-data.js",
    "location-service.js",
    "qibla.js",
    "zones.js",
    "style.css",
  ]) {
    assert.equal(
      await (await app.dispatch(`${scope}${file}`)).text(),
      `asset:${scope}${file}`,
    );
  }
  assert.equal(app.fetched.length, 0);
});

test("API calls, unrelated same-origin resources, other scopes and writes bypass the worker", () => {
  const app = worker();
  for (const url of [
    "https://www.e-solat.gov.my/index.php?r=esolatApi/takwimsolat",
    "https://api.waktusolat.app/v2/solat/WLY01?year=2026&month=9",
    `${scope}api/prayers`,
    `${scope}unrelated.css`,
    "https://example.test/script.js",
  ])
    assert.equal(app.dispatch(url), undefined, url);
  assert.equal(app.dispatch(`${scope}other-page`, "navigate"), undefined);
  assert.equal(app.dispatch(`${scope}script.js`, "cors", "POST"), undefined);
  assert.equal(app.fetched.length, 0);
  assert.equal(app.stores.size, 0);
});

test("missing shell assets are cached only after a successful response", async () => {
  const success = worker();
  assert.equal(
    await (await success.dispatch(`${scope}qibla.js`)).text(),
    "network",
  );
  assert.ok(success.stores.get(appCache).has(`${scope}qibla.js`));
  const failed = worker({
    fetcher: async () => new Response("missing", { status: 404 }),
  });
  assert.equal((await failed.dispatch(`${scope}qibla.js`)).status, 404);
  assert.equal(failed.stores.get(appCache).has(`${scope}qibla.js`), false);
});

test("storage quota errors do not discard successful live navigation or asset responses", async () => {
  const app = worker({ storageError: true });
  assert.equal(await (await app.dispatch(scope, "navigate")).text(), "network");
  assert.equal(
    await (await app.dispatch(`${scope}style.css`)).text(),
    "network",
  );
});
