// src/api/integrations.js

import { supabase } from "./supabaseClient";

// ✅ ملاحظة: لم نعد نستخدم VITE_OPENAI_API_KEY في الواجهة الأمامية إطلاقًا.
// المفتاح يجب أن يكون في Vercel كمتغير سيرفر فقط (مثلاً: OPENAI_API_KEY)
// وملفات /api/* هي التي تتواصل مع OpenAI.

async function uploadToSupabaseBucket(file, options = {}) {
  const {
    bucket = "uploads",
    folder = "public",
    isPublic = true,
  } = options;

  if (!file) {
    throw new Error("لا يوجد ملف لرفعه");
  }

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

// 🔹 استدعاء نموذج عبر Vercel API بدلًا من OpenAI مباشرة
export async function InvokeLLM({ prompt, response_json_schema } = {}) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("الـ prompt مفقود أو غير صالح في InvokeLLM");
  }

  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      prompt,
      response_json_schema: response_json_schema || null,
    }),
  });

  if (!res.ok) {
    const errText = await res.text().catch(() => "");
    console.error("❌ /api/llm error:", errText);
    throw new Error("فشل في الاتصال بخدمة الذكاء الاصطناعي.");
  }

  const data = await res.json();

  // السيرفر يرجع:
  // - { content: "..." } للنص العادي
  // - { json: {...}, content: "..." } عند json_schema
  if (response_json_schema) {
    return data?.json ?? data?.content ?? "";
  }

  return data?.content ?? "";
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
