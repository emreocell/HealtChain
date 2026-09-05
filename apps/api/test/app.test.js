const test = require("node:test");
const assert = require("node:assert/strict");
const { createApp } = require("../src/app");

function config(overrides = {}) {
  return {
    allowedOrigins: ["http://localhost:5000"],
    rateLimitWindowMs: 60_000,
    rateLimitMax: 20,
    ...overrides,
  };
}

async function withServer(app, callback) {
  const server = await new Promise((resolve) => {
    const instance = app.listen(0, "127.0.0.1", () => resolve(instance));
  });

  try {
    const address = server.address();
    await callback(`http://127.0.0.1:${address.port}`);
  } finally {
    await new Promise((resolve, reject) => {
      server.close((error) => (error ? reject(error) : resolve()));
    });
  }
}

function validPayload() {
  return {
    symptoms: ["headache"],
    conditions: [],
    medications: [],
    question: "What should I discuss with a clinician?",
    aiDataConsent: true,
  };
}

test("health endpoint returns no-store and security headers", async () => {
  const app = createApp({
    config: config(),
    clinicalEducationService: { async generate() { return "unused"; } },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/health`);
    const body = await response.json();

    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(response.headers.get("x-content-type-options"), "nosniff");
    assert.match(response.headers.get("content-security-policy"), /frame-ancestors 'none'/);
    assert.deepEqual(body, { status: "ok", service: "ai-healthcare-decision-support" });
  });
});

test("clinical endpoint rejects missing consent before calling the provider", async () => {
  let called = false;
  const app = createApp({
    config: config(),
    clinicalEducationService: {
      async generate() {
        called = true;
        return "should not run";
      },
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/clinical-education`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ symptoms: ["headache"] }),
    });

    const body = await response.json();
    assert.equal(response.status, 400);
    assert.equal(called, false);
    assert.ok(body.details.some((item) => item.includes("consent")));
  });
});

test("clinical endpoint returns educational response without caching", async () => {
  const app = createApp({
    config: config(),
    clinicalEducationService: {
      async generate(payload) {
        assert.deepEqual(payload.symptoms, ["headache"]);
        return "Discuss symptom duration with a licensed clinician.";
      },
    },
  });

  await withServer(app, async (baseUrl) => {
    const response = await fetch(`${baseUrl}/api/v1/clinical-education`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload()),
    });

    const body = await response.json();
    assert.equal(response.status, 200);
    assert.equal(response.headers.get("cache-control"), "no-store");
    assert.equal(body.educationalOnly, true);
    assert.match(body.result, /licensed clinician/);
    assert.match(body.disclaimer, /not medical advice/i);
  });
});

test("clinical endpoint enforces the configured rate limit", async () => {
  const app = createApp({
    config: config({ rateLimitMax: 1 }),
    clinicalEducationService: { async generate() { return "ok"; } },
  });

  await withServer(app, async (baseUrl) => {
    const options = {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(validPayload()),
    };

    const first = await fetch(`${baseUrl}/api/v1/clinical-education`, options);
    const second = await fetch(`${baseUrl}/api/v1/clinical-education`, options);

    assert.equal(first.status, 200);
    assert.equal(second.status, 429);
    assert.ok(Number(second.headers.get("retry-after")) >= 1);
  });
});
