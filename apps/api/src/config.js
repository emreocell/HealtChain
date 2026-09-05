function splitCsv(value) {
  return String(value || "")
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function loadConfig(env = process.env) {
  return {
    port: Number(env.PORT || 5000),
    openAiApiKey: env.OPENAI_API_KEY || "",
    openAiModel: env.OPENAI_MODEL || "gpt-5.6-terra",
    allowedOrigins: splitCsv(env.ALLOWED_ORIGINS || "http://localhost:5000"),
    rateLimitWindowMs: Number(env.RATE_LIMIT_WINDOW_MS || 60_000),
    rateLimitMax: Number(env.RATE_LIMIT_MAX || 20),
  };
}

module.exports = { loadConfig };
