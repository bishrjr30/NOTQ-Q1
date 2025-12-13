// src/api/aiclient.js

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

export async function InvokeLLM({
  prompt,
  model = "gpt-4o-mini",
  temperature = 0.3,
}) {
  if (!OPENAI_API_KEY) {
    console.error("VITE_OPENAI_API_KEY غير موجود في البيئة");
    throw new Error(
      "مفتاح OpenAI غير مهيّأ. أضِف VITE_OPENAI_API_KEY في إعدادات Vercel."
    );
  }

  const body = {
    model,
    messages: [
      {
        role: "user",
        content: prompt,
      },
    ],
    temperature,
  };

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${OPENAI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!response.ok) {
    const text = await response.text();
    console.error("LLM error:", response.status, text);
    throw new Error(`فشل استدعاء الذكاء الاصطناعي: ${response.status}`);
  }

  const data = await response.json();
  const content = data.choices?.[0]?.message?.content;

  return typeof content === "string" ? content : "";
}
