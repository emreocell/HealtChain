const test = require("node:test");
const assert = require("node:assert/strict");
const { ValidationError, validateClinicalRequest } = require("../src/validation");

test("normalizes and deduplicates clinical fields", () => {
  const result = validateClinicalRequest({
    symptoms: [" Headache ", "headache", " nausea  "],
    conditions: [],
    medications: [],
    question: "  What should I discuss with a clinician?  ",
    aiDataConsent: true,
  });

  assert.deepEqual(result.symptoms, ["Headache", "nausea"]);
  assert.equal(result.question, "What should I discuss with a clinician?");
});

test("requires explicit consent before AI processing", () => {
  assert.throws(
    () => validateClinicalRequest({ symptoms: ["headache"] }),
    (error) => error instanceof ValidationError && error.details.some((item) => item.includes("consent"))
  );
});

test("rejects an empty request", () => {
  assert.throws(
    () => validateClinicalRequest({ aiDataConsent: true }),
    (error) => error instanceof ValidationError && error.details.length === 1
  );
});
