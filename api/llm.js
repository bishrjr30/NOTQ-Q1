// api/llm.js
import { getOpenAIKey, readJsonBody } from "./_openai.js";

/**
 * ✅ OpenAI json_schema strict يتطلب:
 * - لكل type:"object" => additionalProperties:false
 * هذا المُعالج يضيفها تلقائياً (ويطبّقها على كل الكائنات المتداخلة).
 */
function normalizeJsonSchema(schema) {
  if (!schema || typeof schema !== "object") return schema;

  const seen = new WeakMap();

  const walk = (node) => {
    if (!node || typeof node !== "object") return node;

    if (seen.has(node)) return seen.get(node);

    const out = Array.isArray(node) ? [] : {};
    seen.set(node, out);

    for (const [k, v] of Object.entries(node)) {
      out[k] = walk(v);
    }

    // اعتبره object schema إذا:
    // - type === "object"
    // - أو عنده properties
    // (بعض المخططات تضع properties بدون type)
    const isObjectSchema =
      out.type === "object" || (out.properties && typeof out.properties === "object");

    if (isObjectSchema) {
      out.type = "object";
      out.additionalProperties = false;
    }

    return out;
  };

  return walk(schema);
}

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

      // ✅ schema القادم من الواجهة
      response_json_schema,

      // ✅ دعم قديم (اختياري)
      response_format,

      temperature,
      max_output_tokens,
    } = body || {};

    // ✅ جهّز messages
    let finalMessages = [];
    if (Array.isArray(messages) && messages.length > 0) {
      finalMessages = messages;
    } else if (typeof prompt === "string" && prompt.trim()) {
      finalMessages = [
        {
          role: "system",
          content:
            "أجب مباشرة. إذا طُلب JSON فأعد JSON فقط بدون أي شرح وبدون أي ```.",
        },
        { role: "user", content: prompt },
      ];
    } else {
      res.status(400).json({ ok: false, error: "prompt or messages is required" });
      return;
    }

    // ✅ response_format النهائي
    let finalResponseFormat;

    if (response_json_schema) {
      const normalized = normalizeJsonSchema(response_json_schema);

      finalResponseFormat = {
        type: "json_schema",
        json_schema: {
          name: "structured_response",
          schema: normalized,
          strict: true,
        },
      };
    } else if (response_format) {
      finalResponseFormat = response_format;
    }

    const payload = {
      model,
      messages: finalMessages,
    };

    if (finalResponseFormat) payload.response_format = finalResponseFormat;
    if (typeof temperature === "number") payload.temperature = temperature;
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

    const contentRaw = data?.choices?.[0]?.message?.content ?? "";

    // ✅ تنظيف أي ``` لو رجع بالغلط
    const content = String(contentRaw)
      .trim()
      .replace(/^```(?:json)?\s*/i, "")
      .replace(/```$/i, "")
      .trim();

    const expectsJson =
      finalResponseFormat &&
      (finalResponseFormat.type === "json_object" || finalResponseFormat.type === "json_schema");

    if (expectsJson) {
      try {
        const json = JSON.parse(content);
        res.status(200).json({ ok: true, content, json });
        return;
      } catch {
        res.status(200).json({ ok: true, content, json: null });
        return;
      }
    }

    res.status(200).json({ ok: true, content });
  } catch (e) {
    res.status(500).json({ ok: false, error: e?.message || "Server error" });
  }
}
