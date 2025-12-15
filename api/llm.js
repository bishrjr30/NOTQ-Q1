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
      // ✅ ندعم الطريقتين: prompt أو messages
      prompt,
      messages,
      model = "gpt-4.1-mini",

      // ✅ طريقتين للـ structured output:
      // 1) response_json_schema القادمة من الواجهة (Integrations.InvokeLLM)
      response_json_schema,

      // 2) response_format (json_object / json_schema) لو عندك كود قديم يستخدمه
      response_format,

      temperature,
      max_output_tokens,
    } = body || {};

    // ✅ جهّز messages بشكل متوافق
    let finalMessages = [];

    if (Array.isArray(messages) && messages.length > 0) {
      finalMessages = messages;
    } else if (typeof prompt === "string" && prompt.trim()) {
      finalMessages = [
        {
          role: "system",
          content:
            "أجب مباشرة. إذا طُلب JSON فأعد JSON فقط بدون أي شرح وبدون ```.",
        },
        { role: "user", content: prompt },
      ];
    } else {
      res.status(400).json({
        ok: false,
        error: "prompt or messages is required",
      });
      return;
    }

    // ✅ حوّل response_json_schema إلى response_format الخاص بـ Chat Completions
    let finalResponseFormat = undefined;

    if (response_json_schema) {
      finalResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "structured_response",
          schema: response_json_schema,
          strict: true,
        },
      };
    } else if (response_format) {
      // دعم قديم: json_object / json_schema
      finalResponseFormat = response_format;
    }

    // ✅ نستخدم Chat Completions لأنه أسهل/أثبت مع messages + response_format
    const payload = {
      model,
      messages: finalMessages,
    };

    if (finalResponseFormat) payload.response_format = finalResponseFormat;
    if (typeof temperature === "number") payload.temperature = temperature;

    // max_output_tokens في ملفك القديم → نمرره كـ max_tokens للـ chat completions
    if (typeof max_output_tokens === "number") payload.max_tokens = max_output_tokens;

    const r = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    const text = await r.text();
    let data = {};
    try {
      data = JSON.parse(text);
    } catch {
      // إذا رجع نص غير JSON (نادر)، نعطيه كما هو
      if (!r.ok) {
        res.status(r.status).json({ ok: false, error: text || "OpenAI request failed" });
        return;
      }
      res.status(200).json({ ok: true, content: text });
      return;
    }

    if (!r.ok) {
      res.status(r.status).json({
        ok: false,
        error: data?.error?.message || "OpenAI request failed",
        details: data,
      });
      return;
    }

    // ✅ استخراج المحتوى
    const contentRaw = data?.choices?.[0]?.message?.content ?? "";

    // ✅ تنظيف ```json ``` إذا رجع بالغلط
    const content = String(contentRaw)
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    // ✅ لو طلبنا JSON (json_schema أو json_object) نحاول نرجّع json جاهز
    const expectsJson =
      finalResponseFormat &&
      (finalResponseFormat.type === "json_object" ||
        finalResponseFormat.type === "json_schema");

    if (expectsJson) {
      try {
        const json = JSON.parse(content);
        res.status(200).json({ ok: true, content, json });
        return;
      } catch {
        // لا نكسر التطبيق: نرجع content فقط
        res.status(200).json({ ok: true, content, json: null });
        return;
      }
    }

    res.status(200).json({ ok: true, content });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
