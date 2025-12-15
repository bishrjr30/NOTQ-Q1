// src/api/entities.js
console.log("✅ entities.js NEW loaded v3");
import { supabase } from "./supabaseClient";

const ENTITIES_VERSION = "entities.js v3 (safe list args + safe order)";

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
   🔁 توحيد باراميترات list
   يدعم:
   - list()
   - list({filters})
   - list("-created_date")
   - list("-created_date", {filters})
   - list({filters}, "-created_date")
========================================================= */
function normalizeListArgs(arg1, arg2) {
  let order = undefined;
  let filters = {};

  if (typeof arg1 === "string") {
    order = arg1;
  } else if (arg1 && typeof arg1 === "object") {
    filters = arg1;
  }

  if (typeof arg2 === "string") {
    order = arg2;
  } else if (arg2 && typeof arg2 === "object") {
    filters = arg2;
  }

  return { filters: filters || {}, order };
}

/* =========================================================
   🔽 تطبيق ترتيب (order) على Query
   يقبل:
   "-created_date" => created_date DESC
   "+created_date" أو "created_date" => created_date ASC
   "created_date.desc" / "created_date.asc"
========================================================= */
function applyOrder(query, order) {
  if (!order) return query;

  if (typeof order === "string") {
    const raw = order.trim();
    if (!raw) return query;

    let col = raw;
    let ascending = true;

    if (col.startsWith("-")) {
      col = col.slice(1);
      ascending = false;
    } else if (col.startsWith("+")) {
      col = col.slice(1);
      ascending = true;
    }

    if (col.includes(".")) {
      const [c, dir] = col.split(".");
      col = c;
      const d = (dir || "").toLowerCase();
      if (d === "desc") ascending = false;
      if (d === "asc") ascending = true;
    }

    if (!col) return query;
    return query.order(col, { ascending });
  }

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
    async list(arg1 = undefined, arg2 = undefined) {
      if (typeof window !== "undefined") {
        if (!window.__ENTITIES_VER_LOGGED__) {
          window.__ENTITIES_VER_LOGGED__ = true;
          console.info(ENTITIES_VERSION);
        }
      }

      const { filters, order } = normalizeListArgs(arg1, arg2);

      const { orderBy, order: orderInFilters, ...pureFilters } =
        filters && typeof filters === "object" ? filters : {};

      let query = supabase.from(tableName).select("*");

      query = applyOrder(query, order || orderBy || orderInFilters);

      if (
        pureFilters &&
        typeof pureFilters === "object" &&
        Object.keys(pureFilters).length > 0
      ) {
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
   🤖 InvokeLLM — استدعاء الذكاء الاصطناعي عبر Vercel API
   ✅ لا مفاتيح في الواجهة الأمامية
   ✅ يدعم response_json_schema (اختياري)
   ✅ يبقي التوافق: يرجع كائن { content, json? } كما يجيء من السيرفر
========================================================= */
export async function InvokeLLM({
  prompt,
  model, // اختياري: نرسله فقط إذا أعطيته، حتى لا نكسر أي validation في السيرفر
  response_json_schema, // اختياري
} = {}) {
  if (!prompt || typeof prompt !== "string") {
    throw new Error("الـ prompt مفقود أو غير صالح في InvokeLLM");
  }

  const payload = {
    prompt,
    ...(model ? { model } : {}),
    ...(response_json_schema ? { response_json_schema } : {}),
  };

  const res = await fetch("/api/llm", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });

  if (!res.ok) {
    const text = await res.text().catch(() => "");
    console.error("❌ /api/llm error:", text);
    throw new Error(text || "LLM request failed");
  }

  // المتوقع من السيرفر: { content: "..." , json?: {...} }
  return res.json();
}
