// api/llm.js
import { getOpenAIKey, readJsonBody } from "./_openai.js";

export default async function handler(req, res) {
  try {
    if (req.method !== "POST") {
      res.status(405).json({ ok: false, error: "Method not allowed" });
      return;
    }

    const key = getOpenAIKey();
    const body = await readJsonBody(req);

    const {
      model = "gpt-4.1-mini",
      // messages بصيغة: [{role:"system"|"user"|"assistant", content:"..."}]
      messages = [],
      // response_format اختياري (json_object / json_schema)
      response_format,
      temperature,
      max_output_tokens,
    } = body || {};

    if (!Array.isArray(messages) || messages.length === 0) {
      res.status(400).json({ ok: false, error: "messages is required" });
      return;
    }

    // Responses API (مُوصى به) 
    const payload = {
      model,
      input: messages,
    };

    if (response_format) payload.response_format = response_format;
    if (typeof temperature === "number") payload.temperature = temperature;
    if (typeof max_output_tokens === "number") payload.max_output_tokens = max_output_tokens;

    const r = await fetch("https://api.openai.com/v1/responses", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const data = await r.json().catch(() => ({}));

    if (!r.ok) {
      res.status(r.status).json({
        ok: false,
        error: data?.error?.message || "OpenAI request failed",
        details: data,
      });
      return;
    }

    // محاولة استخراج النص بشكل مرن
    const content =
      data.output_text ??
      (Array.isArray(data.output)
        ? data.output
            .flatMap((o) => o?.content || [])
            .map((c) => c?.text)
            .filter(Boolean)
            .join("\n")
        : "");

    res.status(200).json({ ok: true, content, response: data });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}