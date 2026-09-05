const test = require("node:test");
const assert = require("node:assert/strict");
const {
  SAFETY_INSTRUCTIONS,
  buildInput,
  createClinicalEducationService,
} = require("../src/clinicalEducation");

test("buildInput labels every user-provided clinical field", () => {
  const input = buildInput({
    symptoms: ["headache"],
    conditions: ["migraine"],
    medications: ["example medication"],
    question: "What should I discuss with a clinician?",
  });

  assert.match(input, /Symptoms: headache/);
  assert.match(input, /Known conditions: migraine/);
  assert.match(input, /Medications: example medication/);
  assert.match(input, /Question: What should I discuss with a clinician\?/);
});

test("service sends safety instructions separately from user input", async () => {
  let request;
  const client = {
    responses: {
      async create(payload) {
        request = payload;
        return { output_text: "Educational response" };
      },
    },
  };

  const service = createClinicalEducationService({ client, model: "test-model" });
  const result = await service.generate({
    symptoms: ["headache"],
    conditions: [],
    medications: [],
    question: "What should I ask?",
  });

  assert.equal(result, "Educational response");
  assert.equal(request.model, "test-model");
  assert.equal(request.instructions, SAFETY_INSTRUCTIONS);
  assert.match(request.input, /Symptoms: headache/);
});

test("service rejects an empty provider response", async () => {
  const client = {
    responses: {
      async create() {
        return { output_text: "   " };
      },
    },
  };

  const service = createClinicalEducationService({ client, model: "test-model" });

  await assert.rejects(
    () => service.generate({ symptoms: ["headache"], conditions: [], medications: [], question: "" }),
    (error) => error.code === "AI_EMPTY_RESPONSE"
  );
});
