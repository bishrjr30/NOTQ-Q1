// api/_openai.js

export function getOpenAIKey() {
  // الأفضل: OPENAI_API_KEY (سيرفر فقط)
  // دعمًا لوضعك الحالي: fallback إلى VITE_OPENAI_API_KEY
  const key = process.env.OPENAI_API_KEY || process.env.VITE_OPENAI_API_KEY;

  if (!key) {
    throw new Error(
      "Missing OpenAI API key. Set OPENAI_API_KEY (recommended) or VITE_OPENAI_API_KEY (fallback)."
    );
  }
  return key;
}

export async function readJsonBody(req) {
  const chunks = [];
  for await (const chunk of req) chunks.push(chunk);
  const raw = Buffer.concat(chunks).toString("utf8");
  return raw ? JSON.parse(raw) : {};
}
