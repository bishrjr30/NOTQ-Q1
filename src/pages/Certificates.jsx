// src/pages/Certificates.jsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Award, Lock } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import CertificateCard from "@/components/CertificateCard";
import { motion } from "framer-motion";

// 🧩 استعمال طبقة الـ entities بدل الاتصال المباشر بـ Supabase
import { Student, Certificate } from "@/api/entities";

export default function CertificatesPage() {
  const [certificates, setCertificates] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const studentId = localStorage.getItem("studentId");
      if (!studentId) {
        window.location.href = createPageUrl("StudentOnboarding");
        return;
      }

      // 1) جلب بيانات الطالب عبر entities
      const studentData = await Student.get(studentId);
      setStudent(studentData);

      // 2) جلب شهادات هذا الطالب فقط
      let myCerts = await Certificate.list({ student_id: studentId });

      // ترتيب الشهادات من الأحدث للأقدم
      myCerts = (myCerts || []).sort(
        (a, b) =>
          new Date(b.date_earned || 0).getTime() -
          new Date(a.date_earned || 0).getTime()
      );

      setCertificates(myCerts);

      // 3) التحقق من الشهادات المستحقة وإنشاؤها إن لزم
      await checkAndAwardCertificates(studentData, myCerts);
    } catch (e) {
      console.error("Load data failed:", e);
    } finally {
      setLoading(false);
    }
  };

  const checkAndAwardCertificates = async (student, existingCerts) => {
    if (!student) return;

    const newCerts = [];

    const totalExercises = student.total_exercises || 0;
    const averageScore = student.average_score || 0;

    // 🎖 1) أول تمرين
    if (
      totalExercises >= 1 &&
      !existingCerts.find((c) => c.title === "بداية البطل")
    ) {
      newCerts.push({
        student_id: student.id,
        title: "بداية البطل",
        description: "أكملت تمرينك الأول بنجاح! بداية موفقة.",
        type: "special",
        date_earned: new Date().toISOString(),
      });
    }

    // 🏅 2) عشرة تمارين
    if (
      totalExercises >= 10 &&
      !existingCerts.find((c) => c.title === "قارئ مثابر")
    ) {
      newCerts.push({
        student_id: student.id,
        title: "قارئ مثابر",
        description: "أكملت 10 تمارين! استمر في التقدم.",
        type: "streak",
        date_earned: new Date().toISOString(),
      });
    }

    // 🥇 3) متوسّط درجات عالي
    if (
      averageScore >= 90 &&
      totalExercises >= 5 &&
      !existingCerts.find((c) => c.title === "نطق ذهبي")
    ) {
      newCerts.push({
        student_id: student.id,
        title: "نطق ذهبي",
        description:
          "حققت متوسط درجات ممتاز (فوق 90%) في 5 تمارين على الأقل.",
        type: "score",
        date_earned: new Date().toISOString(),
      });
    }

    if (newCerts.length > 0) {
      // إنشاء الشهادات الجديدة
      for (const cert of newCerts) {
        await Certificate.create(cert);
      }

      // إعادة تحميل الشهادات بعد الإضافة
      let updatedCerts = await Certificate.list({ student_id: student.id });
      updatedCerts = (updatedCerts || []).sort(
        (a, b) =>
          new Date(b.date_earned || 0).getTime() -
          new Date(a.date_earned || 0).getTime()
      );

      setCertificates(updatedCerts);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-screen">
        جارٍ التحميل...
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 p-6">
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("StudentDashboard")}>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-slate-900 arabic-text flex items-center gap-2">
              <Award className="text-yellow-500 w-8 h-8" />
              جدار الإنجازات والشهادات
            </h1>
            <p className="text-slate-600 arabic-text">
              اجمع الشهادات واحتفل بنجاحك!
            </p>
          </div>
        </div>

        {certificates.length === 0 ? (
          <div className="text-center py-20 bg-white rounded-3xl shadow-sm border border-slate-100">
            <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Lock className="w-10 h-10 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 arabic-text mb-2">
              لا توجد شهادات بعد
            </h3>
            <p className="text-slate-500 arabic-text">
              أكمل التمارين لتحصل على شهاداتك الأولى!
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert, index) => (
              <motion.div
                key={cert.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <CertificateCard certificate={cert} />
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
