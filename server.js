import "dotenv/config";
import express from "express";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import multer from "multer";
import pdfParse from "pdf-parse";
import { GoogleGenAI } from "@google/genai";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const PORT = Number(process.env.PORT || 3000);
const MODEL = process.env.GEMINI_MODEL || "gemini-3.1-pro-preview";
const API_KEY = process.env.GEMINI_API_KEY;

app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: "1mb" }));
app.use(express.static(path.join(__dirname, "public")));
app.use("/api/", rateLimit({ windowMs: 60_000, limit: 30, standardHeaders: true, legacyHeaders: false }));

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 8 * 1024 * 1024, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) cb(null, true);
    else cb(new Error("Only PDF files are supported."));
  }
});

function getAI() {
  if (!API_KEY || API_KEY === "put_your_api_key_here") {
    const error = new Error("API key missing. Set GEMINI_API_KEY in your .env file.");
    error.status = 503;
    throw error;
  }
  return new GoogleGenAI({ apiKey: API_KEY });
}

const systemInstruction = `You are VEDANT AI, a helpful, respectful bilingual assistant created by VIKAS_HINDU.
Answer in the same language the user uses (Hindi, Hinglish, or English). Be clear and practical.
Do not claim to have performed actions you have not performed. If unsure, say so.
For education, explain concepts step-by-step. For business questions, be concise and structured.`;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, app: "VEDANT AI", model: MODEL, apiKeyConfigured: Boolean(API_KEY && API_KEY !== "put_your_api_key_here") });
});

app.post("/api/chat", async (req, res) => {
  try {
    const { message, history = [], documentText = "" } = req.body || {};
    if (typeof message !== "string" || !message.trim()) return res.status(400).json({ error: "Please enter a message." });
    if (message.length > 12_000) return res.status(400).json({ error: "Message is too long (maximum 12,000 characters)." });

    const safeHistory = Array.isArray(history) ? history.slice(-12).filter(x =>
      x && ["user", "model"].includes(x.role) && typeof x.text === "string"
    ).map(x => ({ role: x.role, parts: [{ text: x.text.slice(0, 6000) }] })) : [];

    const documentContext = typeof documentText === "string" ? documentText.slice(0, 35_000) : "";
    const prompt = documentContext
      ? `The user has supplied this extracted PDF text. Use it when relevant and state if the answer is not found in the document.\n\n--- PDF TEXT ---\n${documentContext}\n--- END PDF TEXT ---\n\nUser question: ${message}`
      : message;

    const ai = getAI();
    const response = await ai.models.generateContent({
      model: MODEL,
      contents: [...safeHistory, { role: "user", parts: [{ text: prompt }] }],
      config: { systemInstruction, temperature: 0.7, maxOutputTokens: 2048 }
    });
    res.json({ reply: response.text || "I couldn't generate a text response. Please try again.", model: MODEL });
  } catch (err) {
    console.error("Chat error:", err?.message || err);
    const status = err.status || (String(err.message).includes("API key missing") ? 503 : 500);
    res.status(status).json({ error: status === 500 ? "AI request failed. Check your model access, API key, and server logs." : err.message });
  }
});

app.post("/api/pdf", upload.single("pdf"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "Choose a PDF file first." });
    const parsed = await pdfParse(req.file.buffer);
    const text = (parsed.text || "").trim();
    if (!text) return res.status(422).json({ error: "No readable text found. This may be a scanned PDF." });
    res.json({ filename: req.file.originalname.slice(0, 160), text: text.slice(0, 35_000), characters: text.length });
  } catch (err) {
    console.error("PDF error:", err?.message || err);
    res.status(400).json({ error: "Could not read this PDF. Try a text-based PDF under 8 MB." });
  }
});

app.use((err, _req, res, _next) => {
  if (err instanceof multer.MulterError) return res.status(400).json({ error: err.code === "LIMIT_FILE_SIZE" ? "PDF must be 8 MB or smaller." : "Upload failed." });
  res.status(400).json({ error: err.message || "Request failed." });
});

app.listen(PORT, "0.0.0.0", () => {
  console.log(`VEDANT AI running at http://localhost:${PORT}`);
  console.log(`Model configured: ${MODEL}`);
});
