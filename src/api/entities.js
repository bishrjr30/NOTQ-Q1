// src/api/entities.js

import { supabase } from "./supabaseClient";

/* =========================================================
   🧰 Helper عام للتعامل مع أخطاء Supabase
========================================================= */
async function handleQuery(promise, context = "Supabase") {
  const { data, error } = await promise;
  if (error) {
    console.error(`❌ ${context} error:`, error);
    throw error;
  }
  return data;
}

/* =========================================================
   🏭 Factory لإنشاء CRUD لأي جدول
========================================================= */
function createEntity(tableName) {
  return {
    /**
     * list تدعم:
     * - list() => كل البيانات
     * - list({a:1}) => match filters
     * - list("-created_date") => order desc by created_date
     * - list({a:1}, { order:"-x", limit:10 }) => filters + order + limit
     */
    async list(arg1 = {}, arg2 = {}) {
      let query = supabase.from(tableName).select("*");

      let filters = arg1;
      let options = arg2;

      // لو جاءنا string مثل "-created_date" أو "created_date"
      if (typeof arg1 === "string") {
        options = { order: arg1 };
        filters = {};
      }

      // Filters
      if (filters && typeof filters === "object" && Object.keys(filters).length > 0) {
        query = query.match(filters);
      }

      // Order
      if (options?.order && typeof options.order === "string") {
        const col = options.order.startsWith("-")
          ? options.order.slice(1)
          : options.order;
        const ascending = !options.order.startsWith("-");
        query = query.order(col, { ascending });
      }

      // Limit
      if (options?.limit && Number.isFinite(options.limit)) {
        query = query.limit(options.limit);
      }

      return await handleQuery(query, `${tableName}.list`);
    },

    async get(id) {
      return await handleQuery(
        supabase.from(tableName).select("*").eq("id", id).single(),
        `${tableName}.get`
      );
    },

    async create(payload) {
      return await handleQuery(
        supabase.from(tableName).insert(payload).select("*").single(),
        `${tableName}.create`
      );
    },

    async update(id, payload) {
      return await handleQuery(
        supabase
          .from(tableName)
          .update(payload)
          .eq("id", id)
          .select("*")
          .single(),
        `${tableName}.update`
      );
    },

    async remove(id) {
      return await handleQuery(
        supabase.from(tableName).delete().eq("id", id),
        `${tableName}.remove`
      );
    },

    // ✅ Alias لأن بعض ملفاتك تستخدم delete()
    async delete(id) {
      return await this.remove(id);
    },
  };
}

/* =========================================================
   📦 الكيانات (Tables)
========================================================= */

// 🧑‍🎓 الطلاب
export const Student = createEntity("students");

// 📚 التمارين
export const Exercise = createEntity("exercises");

// 🔊 التسجيلات الصوتية
export const Recording = createEntity("recordings");

// 📝 الدروس
export const Lesson = createEntity("lessons");

// ❓ أسئلة الطلاب
export const StudentQuestion = createEntity("student_questions");

// 👨‍👩‍👧‍👦 مجموعات / عائلة
export const StudentGroup = createEntity("student_groups");

// ⚙️ إعدادات النظام
export const SystemSetting = createEntity("system_settings");

// 🏆 تحديات عائلية
export const FamilyChallenge = createEntity("family_challenges");

// 📢 إعلانات الصف
export const ClassAnnouncement = createEntity("class_announcements");

// 🎓 الشهادات
export const Certificate = createEntity("certificates");

/* =========================================================
   👤 Auth (Supabase)
========================================================= */
export const User = {
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) throw error;
    return user;
  },

  async signUp({ email, password, ...meta }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: { data: meta },
    });
    if (error) throw error;
    return data;
  },

  async signInWithPassword({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) throw error;
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
  },

  onAuthStateChange(callback) {
    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return subscription;
  },
};

/* =========================================================
   🤖 InvokeLLM — استدعاء الذكاء الاصطناعي (Vercel API)
   ⚠️ لا يوجد مفتاح هنا، كله آمن عبر API Route
========================================================= */
export async function InvokeLLM({ prompt, model = "gpt-4o-mini" }) {
  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ prompt, model }),
  });

  if (!res.ok) {
    const text = await res.text();
    throw new Error(text || "LLM request failed");
  }

  return res.json();
}
