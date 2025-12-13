// src/api/entities.js

import { supabase } from "./supabaseClient";

// ✳️ مساعد عام للتعامل مع الأخطاء
async function handleQuery(promise, context = "Supabase") {
  const { data, error } = await promise;
  if (error) {
    console.error(`❌ ${context} error:`, error);
    throw error;
  }
  return data;
}

// ✅ Factories بسيطة لكل جدول
function createEntity(tableName) {
  return {
    async list(filters = {}) {
      let query = supabase.from(tableName).select("*");
      if (filters && Object.keys(filters).length > 0) {
        query = query.match(filters);
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
        supabase.from(tableName).update(payload).eq("id", id).select("*").single(),
        `${tableName}.update`
      );
    },

    async remove(id) {
      // في الغالب لن تحتاج للـ data هنا، لكن نرجعه احتياطًا
      return await handleQuery(
        supabase.from(tableName).delete().eq("id", id),
        `${tableName}.remove`
      );
    },
  };
}

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

// 👨‍👩‍👧‍👦 مجموعات الطلاب / العائلة
export const StudentGroup = createEntity("student_groups");

// ⚙️ إعدادات النظام (مثل مفتاح OpenAI المخزن في قاعدة البيانات إن استخدمته)
export const SystemSetting = createEntity("system_settings");

// 🏆 تحديات عائلية
export const FamilyChallenge = createEntity("family_challenges");

// 📢 إعلانات الصف
export const ClassAnnouncement = createEntity("class_announcements");

// 🎓 الشهادات
export const Certificate = createEntity("certificates");

// 🧑‍💻 المستخدم (Auth) عبر Supabase
export const User = {
  async getCurrentUser() {
    const {
      data: { user },
      error,
    } = await supabase.auth.getUser();
    if (error) {
      console.error("auth.getUser error:", error);
      throw error;
    }
    return user;
  },

  async signUp({ email, password, ...meta }) {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        data: meta,
      },
    });
    if (error) {
      console.error("auth.signUp error:", error);
      throw error;
    }
    return data;
  },

  async signInWithPassword({ email, password }) {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });
    if (error) {
      console.error("auth.signIn error:", error);
      throw error;
    }
    return data;
  },

  async signOut() {
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.error("auth.signOut error:", error);
      throw error;
    }
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
