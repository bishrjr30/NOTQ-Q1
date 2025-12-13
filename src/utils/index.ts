// src/utils/index.ts

export function createPageUrl(pageName: string) {
  if (!pageName) return "/";

  const raw = String(pageName).trim();

  // لو أصلاً جاينا مسار كامل مثل "/StudentDashboard" نرجعه كما هو
  if (raw.startsWith("/")) return raw;

  // نفصل بين اسم الصفحة والاستعلام إن وجد
  const [namePartRaw, queryPart] = raw.split("?");
  const namePart = namePartRaw.trim();

  // (احتياط) لو صار في فراغات داخل الاسم
  const safeName = namePart.replace(/\s+/g, "-");

  const path = `/${safeName}`;
  return queryPart ? `${path}?${queryPart}` : path;
}
