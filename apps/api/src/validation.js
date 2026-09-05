class ValidationError extends Error {
  constructor(message, details = []) {
    super(message);
    this.name = "ValidationError";
    this.details = details;
  }
}

function normalizeString(value, maxLength) {
  if (typeof value !== "string") return "";
  return value.trim().replace(/\s+/g, " ").slice(0, maxLength);
}

function normalizeList(value, field, errors) {
  if (value === undefined || value === null) return [];
  if (!Array.isArray(value)) {
    errors.push(`${field} must be an array.`);
    return [];
  }
  if (value.length > 20) {
    errors.push(`${field} can contain at most 20 items.`);
  }

  const result = [];
  const seen = new Set();
  for (const item of value.slice(0, 20)) {
    const normalized = normalizeString(item, 160);
    if (!normalized) continue;
    const key = normalized.toLocaleLowerCase("tr-TR");
    if (!seen.has(key)) {
      seen.add(key);
      result.push(normalized);
    }
  }
  return result;
}

function validateClinicalRequest(body) {
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    throw new ValidationError("Request body must be a JSON object.");
  }

  const errors = [];
  const symptoms = normalizeList(body.symptoms, "symptoms", errors);
  const conditions = normalizeList(body.conditions, "conditions", errors);
  const medications = normalizeList(body.medications, "medications", errors);
  const question = normalizeString(body.question, 500);

  if (body.aiDataConsent !== true) {
    errors.push("Explicit AI data processing consent is required for this demo.");
  }
  if (!symptoms.length && !conditions.length && !medications.length && !question) {
    errors.push("Provide at least one symptom, condition, medication, or question.");
  }

  if (errors.length) {
    throw new ValidationError("Invalid clinical education request.", errors);
  }

  return { symptoms, conditions, medications, question };
}

module.exports = {
  ValidationError,
  validateClinicalRequest,
};
