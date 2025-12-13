// src/utils/index.ts

export function createPageUrl(pageName: string) {
  // لو أصلاً جاينا مسار كامل مثل "/StudentDashboard" نرجعه كما هو
  if (pageName.startsWith("/")) {
    return pageName;
  }

  // نفصل بين اسم الصفحة والاستعلام إن وجد
  const [namePart, queryPart] = pageName.split("?");

  // نستخدم الاسم كما هو (بنفس الكيسنج) ليتطابق مع مسارات <Route path="/Name">
  const path = `/${namePart}`;

  // نرجّع المسار مع الـ query لو موجود
  return queryPart ? `${path}?${queryPart}` : path;
}
