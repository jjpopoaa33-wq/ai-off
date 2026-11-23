
import express from "express";
import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

dotenv.config();

const app = express();
const __dirname = path.dirname(fileURLToPath(import.meta.url));

app.use(express.json({ limit: "1mb" }));
app.use(express.static(__dirname));

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(process.env.GEMINI_API_KEY) });
});

app.post("/api/chat", async (req, res) => {
  try {
    const apiKey = process.env.GEMINI_API_KEY;

    if (!apiKey) {
      return res.status(503).json({
        error: "ยังไม่ได้ตั้งค่า Gemini API Key ครับ"
      });
    }

    const messages = Array.isArray(req.body.messages) ? req.body.messages : [];
    const contents = messages
      .filter(m => ["user", "model"].includes(m.role) && typeof m.content === "string")
      .slice(-20)
      .map(m => ({
        role: m.role,
        parts: [{ text: m.content.slice(0, 8000) }]
      }));

    if (!contents.length || contents[contents.length - 1].role !== "user") {
      return res.status(400).json({ error: "กรุณาพิมพ์ข้อความก่อนส่งครับ" });
    }

    const model = process.env.GEMINI_MODEL || "gemini-2.5-flash";

    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-goog-api-key": apiKey
        },
        body: JSON.stringify({
          systemInstruction: {
            parts: [{
              text: "คุณคือ AI อ็อฟ ผู้ช่วย AI ที่เป็นมิตร พูดภาษาไทยเป็นหลัก ตอบให้เข้าใจง่าย สุภาพ เป็นกันเอง กระชับ และช่วยผู้ใช้ทีละขั้น"
            }]
          },
          contents,
          generationConfig: {
            temperature: 0.7,
            maxOutputTokens: 2048
          }
        })
      }
    );

    const data = await response.json();

    if (!response.ok) {
      return res.status(response.status).json({
        error: data?.error?.message || "เชื่อมต่อ Gemini ไม่สำเร็จ"
      });
    }

    const answer = (data.candidates?.[0]?.content?.parts || [])
      .map(part => part.text || "")
      .join("")
      .trim();

    if (!answer) {
      return res.status(502).json({ error: "AI ยังไม่ได้ส่งคำตอบครับ" });
    }

    res.json({ answer });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์ครับ" });
  }
});

const port = Number(process.env.PORT || 3000);

app.listen(port, "0.0.0.0", () => {
  console.log(`AI OFF is running on port ${port}`);
});
