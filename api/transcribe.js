// api/transcribe.js

export const config = {
  runtime: 'edge', // استخدام بيئة Edge لدعم FormData بشكل أصلي وسريع
};

export default async function handler(req) {
  // 1. التحقق من نوع الطلب
  if (req.method !== 'POST') {
    return new Response(JSON.stringify({ ok: false, error: 'Method not allowed' }), { status: 405 });
  }

  try {
    // 2. استلام البيانات من المتصفح
    const reqFormData = await req.formData();
    const file = reqFormData.get('file');

    if (!file) {
      return new Response(JSON.stringify({ ok: false, error: 'No file uploaded' }), { status: 400 });
    }

    // 3. جلب مفتاح API
    const apiKey = process.env.VITE_OPENAI_API_KEY || process.env.OPENAI_API_KEY;
    if (!apiKey) {
      return new Response(JSON.stringify({ ok: false, error: 'OpenAI Key is missing on server' }), { status: 500 });
    }

    // 4. بناء FormData جديد لـ OpenAI (هنا نحل المشكلة بإضافة الموديل)
    const openAIFormData = new FormData();
    openAIFormData.append('file', file);
    openAIFormData.append('model', 'whisper-1'); // ✅ هذا الحقل الإجباري الذي كان ناقصاً
    openAIFormData.append('language', 'ar');     // تحسين الدقة للغة العربية

    // 5. الإرسال إلى OpenAI
    const response = await fetch('https://api.openai.com/v1/audio/transcriptions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        // ملاحظة هامة: لا نضع Content-Type يدوياً هنا، المتصفح يضعه تلقائياً مع الـ boundary الصحيح
      },
      body: openAIFormData,
    });

    // 6. معالجة الرد
    const data = await response.json();

    if (!response.ok) {
      console.error("OpenAI API Error:", data);
      return new Response(JSON.stringify({ 
        ok: false, 
        error: data.error?.message || "Transcription failed from OpenAI",
        details: data 
      }), { status: response.status });
    }

    // 7. إرجاع النص بنجاح
    return new Response(JSON.stringify({ ok: true, ...data }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' },
    });

  } catch (error) {
    console.error("Server Handler Error:", error);
    return new Response(JSON.stringify({ ok: false, error: error.message }), { status: 500 });
  }
}
