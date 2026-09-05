require("dotenv").config();
const OpenAI = require("openai");
const { loadConfig } = require("./config");
const { createClinicalEducationService } = require("./clinicalEducation");
const { createApp } = require("./app");

const config = loadConfig();
const client = config.openAiApiKey ? new OpenAI({ apiKey: config.openAiApiKey }) : null;
const clinicalEducationService = createClinicalEducationService({
  client,
  model: config.openAiModel,
});

const app = createApp({ config, clinicalEducationService });

app.listen(config.port, () => {
  console.log(`HealthChain research app listening on http://localhost:${config.port}`);
  if (!config.openAiApiKey) {
    console.log("AI endpoint is disabled until OPENAI_API_KEY is configured.");
  }
});
