// src/utils/aiclient.js

async function postJSON(url, body) {
  const r = await fetch(url, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok || data?.ok === false) {
    throw new Error(data?.error || "Request failed");
  }
  return data;
}

// نفس فكرة “InvokeLLM” لكن آمنة: تكلم السيرفر وليس OpenAI مباشرة
export async function InvokeLLM({ model, messages, response_format, temperature, max_output_tokens }) {
  const data = await postJSON("/api/llm", {
    model,
    messages,
    response_format,
    temperature,
    max_output_tokens,
  });

  // نرجّع نفس الشيء اللي غالبًا مشروعك يتوقعه
  return { content: data.content, raw: data.response };
}

// تفريغ صوت -> نص (يرسل FormData إلى /api/transcribe)
export async function TranscribeAudio({ blob, filename = "audio.webm", model = "whisper-1", language }) {
  const fd = new FormData();
  fd.append("file", blob, filename);
  fd.append("model", model);
  if (language) fd.append("language", language);

  const r = await fetch("/api/transcribe", { method: "POST", body: fd });
  const data = await r.json().catch(() => ({}));

  if (!r.ok || data?.ok === false) {
    throw new Error(data?.error || "Transcription failed");
  }

  // OpenAI يرجع غالبًا { text: "..." }
  return data.text || "";
}
