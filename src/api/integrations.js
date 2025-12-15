// src/api/integrations.js

import { supabase } from "./supabaseClient";

// ✅ ملاحظة: لا نستخدم مفاتيح OpenAI في الواجهة الأمامية إطلاقًا.
// المفتاح يجب أن يكون في Vercel كمتغير سيرفر فقط (مثلاً: OPENAI_API_KEY)
// وملفات /api/* هي التي تتواصل مع OpenAI.

async function uploadToSupabaseBucket(file, options = {}) {
  const { bucket = "uploads", folder = "public", isPublic = true } = options;

  if (!file) throw new Error("لا يوجد ملف لرفعه");

  const ext = file.name?.split(".").pop() || "bin";
  const random = Math.random().toString(36).slice(2);
  const filePath = `${folder ? folder + "/" : ""}${Date.now()}-${random}.${ext}`;

  const { error } = await supabase.storage.from(bucket).upload(filePath, file);

  if (error) {
    console.error("❌ Supabase upload error:", error);
    throw new Error("فشل في رفع الملف إلى التخزين");
  }

  const { data: publicData } = supabase.storage.from(bucket).getPublicUrl(filePath);

  return {
    file_url: publicData?.publicUrl || null,
    path: filePath,
    bucket,
    isPublic,
  };
}

/**
 * 🔹 InvokeLLM عبر /api/llm
 * ✅ السيرفر عندك يطلب: messages (وليس prompt) — وهذا سبب خطأ: "messages is required"
 * ✅ نحافظ على التوافق مع استدعاءاتك الحالية التي تمرّر prompt كنص
 */
export async function InvokeLLM({
  prompt,
  messages,
  response_json_schema,
  model,
  system,
} = {}) {
  // دعم قديم: prompt string
  const finalMessages =
    Array.isArray(messages) && messages.length
      ? messages
      : typeof prompt === "string" && prompt.trim()
        ? [
            ...(system
              ? [{ role: "system", content: String(system) }]
              : []),
            { role: "user", content: prompt },
          ]
        : null;

  if (!finalMessages) {
    throw new Error("يجب تمرير prompt (نص) أو messages (مصفوفة رسائل) إلى InvokeLLM");
  }

  const payload = {
    messages: finalMessages, // ✅ المطلوب من السيرفر
    ...(model ? { model } : {}),
    ...(response_json_schema ? { response_json_schema } : {}),
  };

  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  // حاول قراءة جسم الرد حتى لو 400 لإظهار السبب الحقيقي
  let raw = "";
  try {
    raw = await res.text();
  } catch {}

  if (!res.ok) {
    console.error("❌ /api/llm error:", raw);
    // لو السيرفر يرجع JSON بشكل {ok:false,error:"..."} نخليه يظهر للمستخدم
    try {
      const j = JSON.parse(raw);
      throw new Error(j?.error || "فشل في الاتصال بخدمة الذكاء الاصطناعي.");
    } catch {
      throw new Error(raw || "فشل في الاتصال بخدمة الذكاء الاصطناعي.");
    }
  }

  let data = {};
  try {
    data = raw ? JSON.parse(raw) : {};
  } catch {
    data = {};
  }

  // السيرفر غالباً يرجع:
  // - { content: "..." }
  // - أو { json: {...}, content: "..." }
  if (response_json_schema) {
    if (data?.json) return data.json;
    if (typeof data?.content === "string") {
      try {
        return JSON.parse(data.content);
      } catch {
        return data.content;
      }
    }
    return data;
  }

  return data?.content ?? data;
}

export async function UploadFile({ file, bucket, folder } = {}) {
  return uploadToSupabaseBucket(file, {
    bucket: bucket || "uploads",
    folder: folder || "public",
    isPublic: true,
  });
}

export async function UploadPrivateFile({ file, bucket, folder } = {}) {
  return uploadToSupabaseBucket(file, {
    bucket: bucket || "private",
    folder: folder || "protected",
    isPublic: false,
  });
}

// ⛔ الدوال التالية غير مفعّلة حالياً، فقط ترمي أخطاء واضحة:
export async function SendEmail() {
  throw new Error(
    "SendEmail غير مفعّلة حالياً. تحتاج إعداد خدمة بريد (مثل Resend أو Backend خاص)."
  );
}

export async function GenerateImage() {
  throw new Error(
    "GenerateImage غير مفعّلة حالياً. إن احتجتها يمكن ربطها مع OpenAI Images أو خدمة أخرى."
  );
}

export async function ExtractDataFromUploadedFile() {
  throw new Error(
    "ExtractDataFromUploadedFile غير مفعّلة حالياً. تحتاج Backend لمعالجة الملفات."
  );
}

export async function CreateFileSignedUrl() {
  throw new Error("CreateFileSignedUrl غير مفعّلة حالياً في الواجهة الأمامية.");
}

export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
  CreateFileSignedUrl,
  UploadPrivateFile,
};
