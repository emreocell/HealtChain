const crypto = require("crypto");
const path = require("path");
const express = require("express");
const cors = require("cors");
const { ValidationError, validateClinicalRequest } = require("./validation");

function createRateLimiter({ windowMs, max }) {
  const buckets = new Map();

  return (req, res, next) => {
    const now = Date.now();
    const key = req.ip || req.socket.remoteAddress || "unknown";
    const current = buckets.get(key);

    if (!current || now - current.startedAt >= windowMs) {
      buckets.set(key, { startedAt: now, count: 1 });
      return next();
    }

    current.count += 1;
    if (current.count > max) {
      res.setHeader("Retry-After", String(Math.ceil((windowMs - (now - current.startedAt)) / 1000)));
      return res.status(429).json({ error: "Too many requests. Try again later." });
    }

    return next();
  };
}

function createApp({ config, clinicalEducationService }) {
  const app = express();
  app.disable("x-powered-by");
  app.set("trust proxy", 1);

  app.use((req, res, next) => {
    req.requestId = crypto.randomUUID();
    res.setHeader("X-Request-Id", req.requestId);
    res.setHeader("X-Content-Type-Options", "nosniff");
    res.setHeader("X-Frame-Options", "DENY");
    res.setHeader("Referrer-Policy", "no-referrer");
    res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
    next();
  });

  app.use(
    cors({
      origin(origin, callback) {
        if (!origin || config.allowedOrigins.includes(origin)) return callback(null, true);
        return callback(new Error("Origin is not allowed by CORS policy."));
      },
      methods: ["GET", "POST"],
      allowedHeaders: ["Content-Type"],
    })
  );

  app.use(express.json({ limit: "16kb" }));

  app.get("/health", (req, res) => {
    res.setHeader("Cache-Control", "no-store");
    res.json({ status: "ok", service: "ai-healthcare-decision-support" });
  });

  app.post(
    "/api/v1/clinical-education",
    createRateLimiter({ windowMs: config.rateLimitWindowMs, max: config.rateLimitMax }),
    async (req, res, next) => {
      try {
        const payload = validateClinicalRequest(req.body);
        const result = await clinicalEducationService.generate(payload);
        res.setHeader("Cache-Control", "no-store");
        res.json({
          requestId: req.requestId,
          educationalOnly: true,
          disclaimer: "Research prototype only. This output is not medical advice, diagnosis, or treatment.",
          result,
        });
      } catch (error) {
        next(error);
      }
    }
  );

  const webRoot = path.join(__dirname, "..", "..", "web");
  app.use(express.static(webRoot, { extensions: ["html"], maxAge: 0 }));

  app.use((error, req, res, next) => {
    if (res.headersSent) return next(error);

    if (error instanceof ValidationError) {
      return res.status(400).json({
        error: error.message,
        details: error.details,
        requestId: req.requestId,
      });
    }

    if (error.code === "AI_NOT_CONFIGURED") {
      return res.status(503).json({
        error: "AI provider is not configured on this server.",
        requestId: req.requestId,
      });
    }

    // Intentionally do not log request bodies: they may contain health information.
    console.error(`[${req.requestId}] ${error.name || "Error"}: ${error.message}`);
    return res.status(500).json({
      error: "Unexpected server error.",
      requestId: req.requestId,
    });
  });

  return app;
}

module.exports = { createApp, createRateLimiter };
