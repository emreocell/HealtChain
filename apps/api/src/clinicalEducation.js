const SAFETY_INSTRUCTIONS = `
You are an educational clinical decision-support assistant inside a research prototype.
Your output is not a diagnosis, prescription, treatment plan, or substitute for a licensed clinician.

Rules:
- Use cautious, non-diagnostic language.
- Do not provide medication dosing or tell the user to start, stop, or change a medication.
- Separate known user-provided facts from possibilities or questions to discuss with a clinician.
- Highlight uncertainty and missing context.
- If the supplied context could represent an emergency, advise immediate contact with local emergency services or an appropriate urgent-care service.
- Never claim that blockchain integrity proves medical correctness.
- Keep the response concise and structured under: Summary, Questions for a clinician, Safety notes.
`.trim();

function formatList(label, items) {
  return `${label}: ${items.length ? items.join(", ") : "not provided"}`;
}

function buildInput(payload) {
  return [
    "User-provided context:",
    formatList("Symptoms", payload.symptoms),
    formatList("Known conditions", payload.conditions),
    formatList("Medications", payload.medications),
    `Question: ${payload.question || "not provided"}`,
  ].join("\n");
}

function createClinicalEducationService({ client, model }) {
  return {
    async generate(payload) {
      if (!client) {
        const error = new Error("AI provider is not configured.");
        error.code = "AI_NOT_CONFIGURED";
        throw error;
      }

      const response = await client.responses.create({
        model,
        instructions: SAFETY_INSTRUCTIONS,
        input: buildInput(payload),
      });

      const output = String(response.output_text || "").trim();
      if (!output) {
        const error = new Error("AI provider returned an empty response.");
        error.code = "AI_EMPTY_RESPONSE";
        throw error;
      }

      return output;
    },
  };
}

module.exports = {
  SAFETY_INSTRUCTIONS,
  buildInput,
  createClinicalEducationService,
};
