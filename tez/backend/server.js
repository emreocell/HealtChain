// server.js
const express = require("express");
const cors = require("cors");
const bodyParser = require("body-parser");
const OpenAI = require("openai");

const app = express();
app.use(cors());
app.use(bodyParser.json());

const openai = new OpenAI({
  apiKey: "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"
});

app.post("/ai-oneri", async (req, res) => {
  const { hastaliklar } = req.body;
  const prompt = `Aşağıdaki hastalıklar için kısa ve açık medikal öneriler ver: ${hastaliklar.join(", ")}`;

  try {
    const completion = await openai.chat.completions.create({
      messages: [{ role: "user", content: prompt }],
      model: "gpt-3.5-turbo"
    });

    const yanit = completion.choices[0].message.content;
    res.json({ oneri: yanit });
  } catch (err) {
    console.error("OpenAI API hatası:", err);
    res.status(500).json({ hata: "OpenAI cevabı alınamadı." });
  }
});

app.listen(5000, () => {
  console.log("✅ AI sunucu çalışıyor: http://localhost:5000");
});
