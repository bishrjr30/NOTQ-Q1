// src/api/supabaseClient.js
import { createClient } from "@supabase/supabase-js";

const supabaseUrl = (import.meta.env.VITE_SUPABASE_URL || "").trim();
const supabaseAnonKey = (import.meta.env.VITE_SUPABASE_ANON_KEY || "").trim();

// ✅ Logs فقط أثناء التطوير (لن تظهر في Production على Vercel)
if (import.meta.env.DEV) {
  console.log("SUPABASE_URL loaded?", !!supabaseUrl);
  console.log("SUPABASE_ANON_KEY loaded?", !!supabaseAnonKey);
}

// ✅ تحذير واضح بدون كسر التطبيق
if (!supabaseUrl || !supabaseAnonKey) {
  console.warn(
    "⚠️ Supabase env vars missing: تأكد من VITE_SUPABASE_URL و VITE_SUPABASE_ANON_KEY في Vercel ثم اعمل Redeploy."
  );
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});
