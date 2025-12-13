// src/api/integrations.js

import { supabase } from "./supabaseClient";

// ⚠️ مهم: يجب أن تضيف هذه المتغيّرات في Vercel (Project Settings → Environment Variables)
// VITE_OPENAI_API_KEY  = مفتاح OpenAI
// VITE_SUPABASE_URL
// VITE_SUPABASE_ANON_KEY

const OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY;

// ✅ أداة عامة لرفع ملف إلى Supabase Storage
async function uploadToSupabaseBucket(file, options = {}) {
  const {
    bucket = "uploads",        // غيّر الاسم لو عندك bucket آخر
    folder = "",
    isPublic = true,
  } = options;

  if (!file) {
    throw new Error("لا يوجد ملف لرفعه");
  }

  const ext = file.name?.split(".").pop() || "bin";
  const random = Math.random().toString(36).slice(2);
  const filePath = `${folder ? folder + "/" : ""}${Date.now()}-${random}.${ext}`;

  const { data, error } = await supabase
    .storage
    .from(bucket)
    .upload(filePath, file);

  if (error) {
    console.error("Supabase upload error:", error);
    throw new Error("فشل في رفع الملف إلى التخزين");
  }

  const { data: publicData } = supabase
    .storage
    .from(bucket)
    .getPublicUrl(filePath);

  // نحافظ على نفس شكل ناتج Base44: { file_url: "..." }
  return {
    file_url: publicData?.publicUrl || null,
    path: filePath,
    bucket,
  };
}

// ✅ استدعاء نماذج OpenAI بديلًا عن Base44.integrations.Core.InvokeLLM
export async function InvokeLLM({ prompt, response_json_schema } = {}) {
  if (!OPENAI_API_KEY) {
    throw new Error(
      "لم يتم ضبط VITE_OPENAI_API_KEY في إعدادات البيئة (Vercel Environment Variables)."
    );
  }

  if (!prompt || typeof prompt !== "string") {
    throw new Error("الـ prompt مفقود أو غير صالح في InvokeLLM");
  }

  const body = {
    model: "gpt-4o-mini",
    messages: [
      {
        role: "system",
        content:
          "أنت مساعد ذكي يتحدث العربية، وتلتزم دائماً بإرجاع ناتج نظيف بدون شروحات إضافية إذا طُلب JSON.",
      },
      {
        role: "user",
        content: prompt,
      },
    ],
  };

  // إذا طلبنا JSON Schema من الموديل
  if (response_json_schema) {
    body.response_format = {
      type: "json_schema",
      json_schema: {
        name: "structured_response",
        schema: response_json_schema,
        strict: true,
      },
    };
  }

  const res = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    const errText = await res.text();
    console.error("OpenAI error:", errText);
    throw new Error("فشل في الاتصال بخدمة الذكاء الاصطناعي.");
  }

  const data = await res.json();
  const content = data.choices?.[0]?.message?.content ?? "";

  // لو كان المطلوب JSON نحاول نعمل parse
  if (response_json_schema) {
    try {
      return JSON.parse(content);
    } catch (e) {
      console.warn("Failed to parse JSON from model, returning raw text");
      return content;
    }
  }

  return content;
}

// ✅ بديل Base44.UploadFile
export async function UploadFile({ file, bucket, folder } = {}) {
  return uploadToSupabaseBucket(file, {
    bucket: bucket || "uploads",
    folder: folder || "public",
    isPublic: true,
  });
}

// ✅ يمكن استخدامه لنفس الشيء لكن في bucket خاص لو حابب
export async function UploadPrivateFile({ file, bucket, folder } = {}) {
  return uploadToSupabaseBucket(file, {
    bucket: bucket || "private",
    folder: folder || "protected",
    isPublic: false,
  });
}

// ⛔ هذه الدوال إمّا غير مستخدمة عندك حاليًا أو تحتاج Backend منفصل.
// نتركها ترمي خطأ واضح لو تم استدعاؤها، بدل ما تكسّر الـ build.

export async function SendEmail() {
  throw new Error("SendEmail غير مفعّلة حالياً. تحتاج إعداد خدمة بريد (مثل Resend أو API مخصّص).");
}

export async function GenerateImage() {
  throw new Error("GenerateImage غير مفعّلة حالياً. إن احتجتها نربطها مع OpenAI Images أو خدمة أخرى.");
}

export async function ExtractDataFromUploadedFile() {
  throw new Error("ExtractDataFromUploadedFile غير مفعّلة حالياً. تحتاج Backend لمعالجة الملفات.");
}

export async function CreateFileSignedUrl() {
  throw new Error("CreateFileSignedUrl غير مفعّلة حالياً في الواجهة الأمامية.");
}

// ✅ نوفّر كائن Core بنفس أسماء الدوال القديمة للمشاريع التي كانت تستخدم base44.integrations.Core
export const Core = {
  InvokeLLM,
  SendEmail,
  UploadFile,
  GenerateImage,
  ExtractDataFromUploadedFile,
  CreateFileSignedUrl,
  UploadPrivateFile,
};
