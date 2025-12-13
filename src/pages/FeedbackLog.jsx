// src/pages/FeedbackLog.jsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  ArrowLeft,
  MessageCircle,
  Star,
  Search,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

// ✅ استيراد الكيانات من Supabase
import { Student, Recording } from "@/api/entities";

export default function FeedbackLogPage() {
  const [recordings, setRecordings] = useState([]);
  const [filteredRecordings, setFilteredRecordings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [student, setStudent] = useState(null);

  // الفلاتر
  const [filterType, setFilterType] = useState("all"); // all, high_score, low_score, teacher_comment
  const [searchTerm, setSearchTerm] = useState("");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      const studentId =
        typeof window !== "undefined"
          ? window.localStorage.getItem("studentId")
          : null;

      if (!studentId) {
        setLoading(false);
        return;
      }

      // ✅ جلب الطالب من Supabase
      const studentData = await Student.get(studentId);
      setStudent(studentData);

      // ✅ جلب كل التسجيلات من Supabase ثم التصفية
      const allRecordings = await Recording.list();

      // لو الـ student_id رقم أو نص، نأخذه كنص لضمان التطابق
      const myRecordings = (allRecordings || []).filter(
        (r) => String(r.student_id) === String(studentId)
      );

      // ترتيب حسب الأحدث (created_at أو created_date)
      const sorted = [...myRecordings].sort((a, b) => {
        const aDate = a.created_at || a.created_date;
        const bDate = b.created_at || b.created_date;
        if (!aDate || !bDate) return 0;
        return new Date(bDate) - new Date(aDate);
      });

      setRecordings(sorted);
      setFilteredRecordings(sorted);
    } catch (error) {
      console.error("Failed to load feedback log", error);
    } finally {
      setLoading(false);
    }
  };

  // تطبيق الفلاتر والبحث كلما تغيرت
  useEffect(() => {
    let result = recordings;

    // نوع الفلتر
    if (filterType === "high_score") {
      result = result.filter((r) => (r.score || 0) >= 85);
    } else if (filterType === "low_score") {
      result = result.filter((r) => (r.score || 0) < 60);
    } else if (filterType === "teacher_comment") {
      result = result.filter(
        (r) => r.teacher_comment || r.teacher_audio_comment
      );
    }

    // البحث في feedback أو teacher_comment
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      result = result.filter(
        (r) =>
          (r.feedback &&
            String(r.feedback).toLowerCase().includes(term)) ||
          (r.teacher_comment &&
            String(r.teacher_comment).toLowerCase().includes(term))
      );
    }

    setFilteredRecordings(result);
  }, [filterType, searchTerm, recordings]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-blue-50 p-6">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl("StudentDashboard")}>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg bg-white"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 arabic-text">
              سجل الملاحظات الذكي 📝
            </h1>
            <p className="text-indigo-600 arabic-text">
              جميع تقييماتك وملاحظات المعلم في مكان واحد
            </p>
          </div>
        </motion.div>

        {/* شريط الفلاتر */}
        <Card className="mb-8 border-0 shadow-lg bg-white/80 backdrop-blur-sm">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4 items-center">
              {/* حقل البحث */}
              <div className="relative flex-1 w-full">
                <Search className="absolute right-3 top-3 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="ابحث في الملاحظات..."
                  className="pr-10 text-right arabic-text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>

              {/* أزرار الفلترة */}
              <div className="flex gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
                <Button
                  variant={filterType === "all" ? "default" : "outline"}
                  onClick={() => setFilterType("all")}
                  className="arabic-text whitespace-nowrap"
                >
                  الكل
                </Button>
                <Button
                  variant={
                    filterType === "teacher_comment" ? "default" : "outline"
                  }
                  onClick={() => setFilterType("teacher_comment")}
                  className="arabic-text whitespace-nowrap bg-indigo-50 text-indigo-700 border-indigo-200 hover:bg-indigo-100"
                >
                  <MessageCircle className="w-4 h-4 ml-1" />
                  تعليقات المعلم
                </Button>
                <Button
                  variant={filterType === "high_score" ? "default" : "outline"}
                  onClick={() => setFilterType("high_score")}
                  className="arabic-text whitespace-nowrap text-green-700 border-green-200 hover:bg-green-50"
                >
                  <Star className="w-4 h-4 ml-1" />
                  درجات ممتازة
                </Button>
                <Button
                  variant={filterType === "low_score" ? "default" : "outline"}
                  onClick={() => setFilterType("low_score")}
                  className="arabic-text whitespace-nowrap text-orange-700 border-orange-200 hover:bg-orange-50"
                >
                  تحتاج تدريب
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* القائمة الرئيسية */}
        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
            </div>
          ) : filteredRecordings.length > 0 ? (
            filteredRecordings.map((rec, idx) => {
              const createdAt = rec.created_at || rec.created_date;
              const dateStr = createdAt
                ? new Date(createdAt).toLocaleDateString("ar-AE")
                : "-";
              const timeStr = createdAt
                ? new Date(createdAt).toLocaleTimeString("ar-AE", {
                    hour: "2-digit",
                    minute: "2-digit",
                  })
                : "";

              return (
                <motion.div
                  key={rec.id || idx}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: idx * 0.05 }}
                >
                  <Card className="border-0 shadow-md hover:shadow-xl transition-all duration-300 overflow-hidden group">
                    <div
                      className={`h-2 w-full ${
                        (rec.score || 0) >= 85
                          ? "bg-green-500"
                          : (rec.score || 0) >= 60
                          ? "bg-yellow-500"
                          : "bg-red-500"
                      }`}
                    />
                    <CardContent className="p-6">
                      <div className="flex flex-col md:flex-row gap-6">
                        {/* صندوق الدرجة */}
                        <div className="flex flex-col items-center justify-center min-w-[100px] border-l pl-6 border-gray-100">
                          <div
                            className={`text-4xl font-bold mb-1 ${
                              (rec.score || 0) >= 85
                                ? "text-green-600"
                                : (rec.score || 0) >= 60
                                ? "text-yellow-600"
                                : "text-red-600"
                            }`}
                          >
                            {rec.score ?? 0}%
                          </div>
                          <Badge
                            variant="outline"
                            className="arabic-text text-gray-500"
                          >
                            {dateStr}
                          </Badge>
                          {timeStr && (
                            <div className="text-xs text-gray-400 mt-1">
                              {timeStr}
                            </div>
                          )}
                        </div>

                        {/* التفاصيل */}
                        <div className="flex-1 space-y-4">
                          {/* ملاحظات الذكاء الاصطناعي */}
                          <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                                <span className="text-xs">🤖</span>
                              </div>
                              <span className="font-bold text-indigo-900 arabic-text text-sm">
                                ملاحظات الذكاء الاصطناعي
                              </span>
                            </div>
                            <p className="text-slate-700 arabic-text leading-relaxed">
                              {rec.feedback || "لا توجد ملاحظات متاحة."}
                            </p>
                          </div>

                          {/* تعليقات المعلم (نصية + صوتية) */}
                          {(rec.teacher_comment ||
                            rec.teacher_audio_comment) && (
                            <div className="bg-blue-50 p-4 rounded-xl border-2 border-blue-100 animate-in fade-in zoom-in duration-300">
                              <h4 className="font-bold text-blue-900 mb-3 arabic-text flex items-center gap-2">
                                <MessageCircle className="w-5 h-5" />
                                تعليقات المعلم
                              </h4>

                              {rec.teacher_comment && (
                                <div className="bg-white p-3 rounded-lg mb-3 shadow-sm">
                                  <p className="text-blue-800 arabic-text">
                                    {rec.teacher_comment}
                                  </p>
                                </div>
                              )}

                              {rec.teacher_audio_comment && (
                                <div className="flex items-center gap-3 bg-white p-2 rounded-lg shadow-sm w-fit pr-4">
                                  <span className="text-xs font-bold text-blue-700 arabic-text">
                                    تسجيل صوتي:
                                  </span>
                                  <audio controls className="h-8 w-48">
                                    <source
                                      src={rec.teacher_audio_comment}
                                      type="audio/webm"
                                    />
                                    <source
                                      src={rec.teacher_audio_comment}
                                      type="audio/mp4"
                                    />
                                    متصفحك لا يدعم الصوت
                                  </audio>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              );
            })
          ) : (
            <div className="text-center py-16 bg-white/50 rounded-3xl">
              <div className="w-20 h-20 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4 text-3xl">
                📭
              </div>
              <h3 className="text-xl font-bold text-gray-600 arabic-text">
                لا توجد سجلات مطابقة
              </h3>
              <p className="text-gray-400 arabic-text mt-2">
                جرّب تغيير الفلاتر أو ابدأ تمارين جديدة
              </p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
