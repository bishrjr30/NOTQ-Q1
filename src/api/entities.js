// src/api/entities.js
import { supabase } from "./supabaseClient";

const ENTITIES_VERSION = "entities.js v2 (fix order + delete alias)";

/* =========================================================
   🧰 Helper عام للتعامل مع أخطاء Supabase
========================================================= */
async function handleQuery(promise, context = "Supabase") {
  const { data, error } = await promise;
  if (error) {
    console.error(`❌ ${context} error:`, {
      message: error.message,
      details: error.details,
      hint: error.hint,
      code: error.code,
    });
    throw error;
  }
  return data;
}

/* =========================================================
   🔽 تطبيق ترتيب (order) على Query
   يقبل:
   "-created_date" => created_date DESC
   "+created_date" أو "created_date" => created_date ASC
========================================================= */
function applyOrder(query, order) {
  if (!order) return query;

  // String syntax: "-col" / "+col" / "col"
  if (typeof order === "string") {
    let col = order;
    let ascending = true;

    if (order.startsWith("-")) {
      col = order.slice(1);
      ascending = false;
    } else if (order.startsWith("+")) {
      col = order.slice(1);
      ascending = true;
    }

    if (!col) return query;
    return query.order(col, { ascending });
  }

  // Object syntax: { column: "created_date", ascending: false }
  if (typeof order === "object" && order.column) {
    return query.order(order.column, { ascending: order.ascending !== false });
  }

  return query;
}

/* =========================================================
   🏭 Factory لإنشاء CRUD لأي جدول
========================================================= */
function createEntity(tableName) {
  const entity = {
    /**
     * list يمكنه استقبال:
     * - list() => كل السجلات
     * - list({ grade: "الصف الثالث" }) => فلاتر
     * - list("-created_date") => ترتيب تنازلي
     * - list({ grade:"..." }, "-created_date") => فلاتر + ترتيب
     */
    async list(arg1 = {}, arg2 = undefined) {
      // لطباعة سريعة تؤكد أن النسخة الجديدة اشتغلت
      if (typeof window !== "undefined") {
        // مرة واحدة فقط
        if (!window.__ENTITIES_VER_LOGGED__) {
          window.__ENTITIES_VER_LOGGED__ = true;
          console.info(ENTITIES_VERSION);
        }
      }

      let filters = {};
      let order = undefined;

      if (typeof arg1 === "string") {
        order = arg1;
        filters = {};
      } else {
        filters = arg1 || {};
        order = arg2;
      }

      // دعم: لو أحد مرّر order داخل filters بالغلط
      const { orderBy, order: orderInFilters, ...pureFilters } =
        filters && typeof filters === "object" ? filters : {};

      let query = supabase.from(tableName).select("*");

      query = applyOrder(query, order || orderBy || orderInFilters);

      if (pureFilters && Object.keys(pureFilters).length > 0) {
        query = query.match(pureFilters);
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
      return await handleQuery(
        supabase.from(tableName).delete().eq("id", id),
        `${tableName}.remove`
      );
    },

    // ✅ Alias لأن بعض صفحاتك تستعمل delete بدل remove
    async delete(id) {
      return await entity.remove(id);
    },
  };

  return entity;
}

/* =========================================================
   📦 الكيانات (Tables)
========================================================= */
export const Student = createEntity("students");
export const Exercise = createEntity("exercises");
export const Recording = createEntity("recordings");
export const Lesson = createEntity("lessons");
export const StudentQuestion = createEntity("student_questions");
export const StudentGroup = createEntity("student_groups");
export const SystemSetting = createEntity("system_settings");
export const FamilyChallenge = createEntity("family_challenges");
export const ClassAnnouncement = createEntity("class_announcements");
export const Certificate = createEntity("certificates");

/* =========================================================
   👤 Auth (Supabase)
========================================================= */
export const User = {
  async getCurrentUser() {
    const { data, error } = await supabase.auth.getUser();
    if (error) throw error;
    return data.user;
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
    const { data } = supabase.auth.onAuthStateChange((event, session) => {
      callback(event, session);
    });
    return data.subscription;
  },
};

/* =========================================================
   🤖 InvokeLLM — استدعاء الذكاء الاصطناعي (Vercel API)
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
