// api/transcribe.js
import { getOpenAIKey } from "./_openai.js";

export const config = {
  api: {
    bodyParser: false, // مهم: حتى نستلم multipart كما هو
  },
};

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const key = getOpenAIKey();

    // اقرأ جسم الطلب كما هو (multipart/form-data) وأعد إرساله
    const chunks = [];
    for await (const chunk of req) chunks.push(chunk);
    const rawBody = Buffer.concat(chunks);

    const contentType = req.headers["content-type"];
    if (!contentType || !contentType.includes("multipart/form-data")) {
      res.status(400).json({
        ok: false,
        error: "Expected multipart/form-data (send FormData from the browser).",
      });
      return;
    }

    // Endpoint الترنسكريبشن (Whisper / Transcription)
    const r = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": contentType,
      },
      body: rawBody,
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      res.status(r.status).json({
        ok: false,
        error: data?.error?.message || "Transcription failed",
        details: data,
      });
      return;
    }

    res.status(200).json({ ok: true, ...data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}