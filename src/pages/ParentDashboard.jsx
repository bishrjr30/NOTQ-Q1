// src/pages/ParentDashboard.jsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Users,
  User,
  ArrowLeft,
  Activity,
  Volume2,
  Star,
  Target,
  MessageSquare,
  Mic,
  Play,
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

// ✅ استبدال base44 بـ entities + integrations
import { Student, Recording, FamilyChallenge } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

const GRADES = [
  "الروضة",
  "الصف الأول",
  "الصف الثاني",
  "الصف الثالث",
  "الصف الرابع",
  "الصف الخامس",
  "الصف السادس",
  "الصف السابع",
  "الصف الثامن",
  "الصف التاسع",
  "الصف العاشر",
  "الصف الحادي عشر",
  "الصف الثاني عشر",
];

export default function ParentDashboard() {
  const navigate = useNavigate();
  const [mode, setMode] = useState("login"); // login, dashboard
  const [studentCode, setStudentCode] = useState("");
  const [selectedStudent, setSelectedStudent] = useState(null);
  const [stats, setStats] = useState(null);
  const [recentRecordings, setRecentRecordings] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [encouragementMsg, setEncouragementMsg] = useState("");

  // Family Challenge State
  const [challengeText, setChallengeText] = useState("");
  const [isRecording, setIsRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);
  const [recordedAudio, setRecordedAudio] = useState(null);

  // 🔐 تسجيل الدخول بكود الطالب
  const handleLogin = async () => {
    if (!studentCode.trim()) return;

    setIsLoading(true);
    try {
      // جلب كل الطلاب من Supabase
      const allStudents = await Student.list();
      // مطابقة Case Sensitive كما ذكرت
      const student = allStudents.find(
        (s) => s.access_code === studentCode.trim()
      );

      if (student) {
        setSelectedStudent(student);
        setMode("dashboard");
        await loadStudentData(student.id);
      } else {
        alert(
          "كود الطالب غير صحيح. يرجى التأكد من الكود (حالة الأحرف مهمة)."
        );
      }
    } catch (e) {
      console.error(e);
      alert("حدث خطأ في الاتصال، يرجى المحاولة لاحقاً.");
    } finally {
      setIsLoading(false);
    }
  };

  // 📊 تحميل بيانات الطالب + تسجيلاته
  const loadStudentData = async (studentId) => {
    setIsLoading(true);
    try {
      const student = await Student.get(studentId);
      setSelectedStudent(student);

      // جلب تسجيلات هذا الطالب فقط عبر Recording.list مع فلتر
      let studentRecs = await Recording.list({ student_id: studentId });

      // ترتيب حسب الأحدث (باستخدام created_date أو created_at إن وُجد)
      studentRecs = (studentRecs || []).sort((a, b) => {
        const da = new Date(a.created_date || a.created_at || 0).getTime();
        const db = new Date(b.created_date || b.created_at || 0).getTime();
        return db - da;
      });

      setRecentRecordings(studentRecs.slice(0, 3));

      const totalExercises = studentRecs.length;
      const bestScore =
        studentRecs.length > 0
          ? Math.max(...studentRecs.map((r) => r.score || 0))
          : 0;

      let statusMsg = "بداية جيدة!";
      if (totalExercises > 5) statusMsg = "يتحسن بشكل ملحوظ ✅";
      if (bestScore > 90) statusMsg = "أداء ممتاز في النطق! 🌟";

      setStats({
        exercisesCount: totalExercises,
        totalMinutes: student.total_minutes || 0,
        bestScore,
        statusMsg,
      });
    } catch (e) {
      console.error(e);
    } finally {
      setIsLoading(false);
    }
  };

  // 💌 إرسال رسالة تشجيع نصية
  const sendEncouragement = async () => {
    if (!encouragementMsg.trim() || !selectedStudent) return;
    try {
      await Student.update(selectedStudent.id, {
        encouragement_message: encouragementMsg,
        last_activity: new Date().toISOString(),
      });
      alert(
        "تم إرسال الرسالة بنجاح! ستظهر للطالب عند دخوله القادم."
      );
      setEncouragementMsg("");
      // تحديث نسخة الطالب في الواجهة
      const updated = await Student.get(selectedStudent.id);
      setSelectedStudent(updated);
    } catch (e) {
      console.error(e);
      alert("فشل الإرسال، يرجى المحاولة مرة أخرى.");
    }
  };

  // 🎙 تسجيل صوت التحدّي
  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const recorder = new MediaRecorder(stream);
      setMediaRecorder(recorder);
      setAudioChunks([]);

      recorder.ondataavailable = (e) => {
        if (e.data.size > 0)
          setAudioChunks((prev) => [...prev, e.data]);
      };

      recorder.onstop = () => {
        stream.getTracks().forEach((track) => track.stop());
      };

      recorder.start();
      setIsRecording(true);
    } catch (e) {
      console.error(e);
      alert("تعذر الوصول للميكروفون. الرجاء التحقق من الأذونات.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorder) {
      mediaRecorder.stop();
      setIsRecording(false);
      setTimeout(() => {
        const blob = new Blob(audioChunks, { type: "audio/webm" });
        setRecordedAudio(blob);
      }, 500);
    }
  };

  // 🏆 إرسال تحدّي العائلة
  const sendChallenge = async () => {
    if (!challengeText || !selectedStudent) return;
    setIsLoading(true);
    try {
      let audioUrl = null;

      if (recordedAudio) {
        const file = new File([recordedAudio], "challenge.webm", {
          type: "audio/webm",
        });

        // ✅ استخدام UploadFile من integrations بدل base44
        const upload = await UploadFile({
          file,
          bucket: "recordings",
          folder: `family_challenges/${selectedStudent.id}`,
        });

        audioUrl = upload.file_url;
      }

      await FamilyChallenge.create({
        student_id: selectedStudent.id,
        text: challengeText,
        parent_audio_url: audioUrl,
        is_completed: false,
      });

      alert("تم إرسال التحدي بنجاح!");
      setChallengeText("");
      setRecordedAudio(null);
      setAudioChunks([]);
    } catch (e) {
      console.error(e);
      alert("فشل إرسال التحدي، يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  // 🟢 واجهة تسجيل الدخول لولي الأمر
  if (mode === "login") {
    return (
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 to-teal-100 flex items-center justify-center p-6">
        <Card className="w-full max-w-md border-0 shadow-2xl bg-white/90">
          <CardHeader className="text-center">
            <div className="w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Users className="w-10 h-10 text-emerald-600" />
            </div>
            <CardTitle className="text-2xl font-bold arabic-text text-emerald-900">
              بوابة ولي الأمر 👨‍👩‍👧‍👦
            </CardTitle>
            <p className="text-emerald-600 arabic-text">
              تابع تقدم طفلك وشجعه
            </p>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-right">
              <p className="text-emerald-800 text-sm arabic-text leading-relaxed">
                يرجى إدخال <strong>كود الطالب</strong> الخاص بابنك/ابنتك.
                <br />
                يمكن للطالب العثور على هذا الكود في صفحته الشخصية.
              </p>
            </div>

            <div>
              <label className="block text-right mb-2 font-bold text-gray-700 arabic-text">
                كود الطالب (Access Code)
              </label>
              <Input
                value={studentCode}
                onChange={(e) => setStudentCode(e.target.value)}
                className="text-center font-mono text-xl tracking-widest h-14 border-2 border-emerald-200 focus:border-emerald-500"
                placeholder="e.g. aB3dE9"
              />
              <p className="text-xs text-gray-400 text-right mt-1 mr-1 arabic-text">
                يرجى مراعاة الأحرف الكبيرة والصغيرة
              </p>
            </div>

            <Button
              onClick={handleLogin}
              disabled={!studentCode || isLoading}
              className="w-full bg-emerald-600 hover:bg-emerald-700 arabic-text text-lg h-12"
            >
              {isLoading ? "جاري التحقق..." : "دخول"}
            </Button>
            <Button
              variant="ghost"
              onClick={() => navigate("/")}
              className="w-full arabic-text"
            >
              عودة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 🟣 واجهة لوحة ولي الأمر بعد تسجيل الدخول
  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Header */}
      <div className="bg-emerald-600 text-white p-6 pb-12 rounded-b-[40px] shadow-lg">
        <div className="max-w-4xl mx-auto flex justify-between items-center">
          <Button
            variant="ghost"
            onClick={() => setMode("login")}
            className="text-white hover:bg-white/20"
          >
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div className="text-center">
            <motion.div
              initial={{ scale: 0.8, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              className="mb-2"
            >
              <h1 className="text-3xl font-bold arabic-text mb-1">
                مرحباً ولي الأمر 👋
              </h1>
              <div className="bg-white/20 rounded-full px-4 py-1 inline-block">
                <p className="opacity-100 arabic-text text-sm">
                  أنت تتابع بطل المستقبل:{" "}
                  <strong className="text-yellow-300 text-lg">
                    {selectedStudent?.name}
                  </strong>
                </p>
              </div>
            </motion.div>
          </div>
          <User className="w-8 h-8 opacity-80" />
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 -mt-8 space-y-6">
        {/* Summary Cards */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-0 shadow-lg text-center p-4">
            <Activity className="w-8 h-8 text-blue-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {stats?.exercisesCount || 0}
            </div>
            <div className="text-xs text-gray-500 arabic-text">
              تمارين الأسبوع
            </div>
          </Card>
          <Card className="border-0 shadow-lg text-center p-4">
            <Volume2 className="w-8 h-8 text-purple-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {stats?.totalMinutes || 0}
            </div>
            <div className="text-xs text-gray-500 arabic-text">
              دقيقة تدريب
            </div>
          </Card>
          <Card
            className="border-0 shadow-lg text-center p-4 cursor-pointer hover:bg-yellow-50 transition-colors"
            onClick={() =>
              window.open(createPageUrl("Certificates"), "_blank")
            }
          >
            <Star className="w-8 h-8 text-yellow-500 mx-auto mb-2" />
            <div className="text-2xl font-bold">
              {stats?.bestScore || 0}%
            </div>
            <div className="text-xs text-gray-500 arabic-text">
              عرض الشهادات والإنجازات 🔗
            </div>
          </Card>
          <Card className="border-0 shadow-lg text-center p-4 bg-emerald-50 border-emerald-100">
            <Target className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
            <div className="text-sm font-bold text-emerald-800 arabic-text">
              {stats?.statusMsg}
            </div>
            <div className="text-xs text-emerald-600 arabic-text">
              الحالة العامة
            </div>
          </Card>
        </div>

        {/* Tabs */}
        <Tabs defaultValue="progress" className="w-full">
          <TabsList className="grid w-full grid-cols-3 bg-white shadow-sm h-12">
            <TabsTrigger value="progress" className="arabic-text">
              التقدم والتسجيلات
            </TabsTrigger>
            <TabsTrigger value="encourage" className="arabic-text">
              التشجيع والتواصل
            </TabsTrigger>
            <TabsTrigger value="challenge" className="arabic-text">
              تحدي العائلة
            </TabsTrigger>
          </TabsList>

          {/* تبويب التقدم */}
          <TabsContent value="progress" className="space-y-4 mt-4">
            {/* Weekly Goals */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg arabic-text text-right">
                  🎯 أهداف الأسبوع المقترحة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex justify-between mb-1 arabic-text text-sm">
                    <span>إكمال 5 تمارين نطق</span>
                    <span>
                      {Math.min(
                        100,
                        ((stats?.exercisesCount || 0) / 5) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-blue-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((stats?.exercisesCount || 0) / 5) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
                <div>
                  <div className="flex justify-between mb-1 arabic-text text-sm">
                    <span>التدريب لمدة 30 دقيقة</span>
                    <span>
                      {Math.min(
                        100,
                        ((stats?.totalMinutes || 0) / 30) * 100
                      )}
                      %
                    </span>
                  </div>
                  <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-purple-500 rounded-full"
                      style={{
                        width: `${Math.min(
                          100,
                          ((stats?.totalMinutes || 0) / 30) * 100
                        )}%`,
                      }}
                    ></div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Last 3 Recordings */}
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg arabic-text text-right">
                  🎙️ آخر التسجيلات
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {recentRecordings.map((rec) => {
                  const createdAt =
                    rec.created_date || rec.created_at || null;
                  const dateStr = createdAt
                    ? new Date(createdAt).toLocaleDateString("ar-AE")
                    : "--";
                  return (
                    <div
                      key={rec.id}
                      className="p-3 bg-slate-50 rounded-lg border border-slate-100"
                    >
                      <div className="flex justify-between items-center mb-2">
                        <span
                          className={`font-bold ${
                            rec.score > 80
                              ? "text-green-600"
                              : "text-orange-600"
                          }`}
                        >
                          {rec.score}%
                        </span>
                        <span className="text-xs text-gray-500">
                          {dateStr}
                        </span>
                      </div>
                      {rec.analysis_details?.original_text && (
                        <p className="text-sm text-gray-700 arabic-text text-right mb-2 line-clamp-1">
                          "{rec.analysis_details.original_text}"
                        </p>
                      )}
                      <div className="flex justify-end gap-2">
                        {rec.audio_url && (
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => window.open(rec.audio_url)}
                            className="h-8 arabic-text"
                          >
                            <Play className="w-3 h-3 ml-1" /> استماع
                          </Button>
                        )}
                      </div>
                      {rec.feedback && (
                        <div className="mt-2 text-xs text-blue-600 bg-blue-50 p-2 rounded text-right arabic-text">
                          🤖 {rec.feedback}
                        </div>
                      )}
                      {rec.teacher_comment && (
                        <div className="mt-2 text-xs text-green-600 bg-green-50 p-2 rounded text-right arabic-text">
                          👨‍🏫 {rec.teacher_comment}
                        </div>
                      )}
                    </div>
                  );
                })}
                {recentRecordings.length === 0 && (
                  <p className="text-center text-gray-500 arabic-text">
                    لا توجد تسجيلات حديثة
                  </p>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* تبويب التشجيع */}
          <TabsContent value="encourage" className="space-y-4 mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg arabic-text text-right flex items-center justify-end gap-2">
                  <MessageSquare className="w-5 h-5" />
                  رسالة تشجيع
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-right text-gray-600 arabic-text text-sm">
                  اكتب رسالة قصيرة لابنك/ابنتك ستظهر له في أعلى التطبيق عند
                  دخوله القادم. الكلمات الطيبة تصنع المعجزات! ✨
                </p>
                <Input
                  value={encouragementMsg}
                  onChange={(e) => setEncouragementMsg(e.target.value)}
                  placeholder="مثلاً: أنا فخور بمثابرتك يا بطل!"
                  className="text-right arabic-text"
                />
                <Button
                  onClick={sendEncouragement}
                  className="w-full bg-pink-500 hover:bg-pink-600 arabic-text text-white"
                >
                  إرسال الرسالة ❤️
                </Button>
              </CardContent>
            </Card>

            {selectedStudent?.encouragement_message && (
              <div className="bg-pink-50 p-4 rounded-xl border border-pink-100 text-center">
                <p className="text-xs text-pink-500 mb-1 arabic-text">
                  الرسالة الحالية:
                </p>
                <p className="text-pink-700 font-bold arabic-text">
                  "{selectedStudent.encouragement_message}"
                </p>
              </div>
            )}
          </TabsContent>

          {/* تبويب تحدّي العائلة */}
          <TabsContent value="challenge" className="space-y-4 mt-4">
            <Card className="border-0 shadow-md">
              <CardHeader>
                <CardTitle className="text-lg arabic-text text-right flex items-center justify-end gap-2">
                  🏆 تحدي العائلة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-right text-gray-600 arabic-text text-sm">
                  سجّل صوتك وأرسل تحدياً لابنك ليقلدك! المشاركة العائلية تزيد
                  المتعة.
                </p>

                <div className="space-y-2">
                  <label className="text-right block text-sm font-bold arabic-text">
                    1. اكتب الجملة
                  </label>
                  <Input
                    value={challengeText}
                    onChange={(e) =>
                      setChallengeText(e.target.value)
                    }
                    placeholder="اكتب جملة التحدي هنا..."
                    className="text-right arabic-text"
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-right block text-sm font-bold arabic-text">
                    2. سجّل صوتك (اختياري)
                  </label>
                  <div className="flex justify-center">
                    <Button
                      onClick={isRecording ? stopRecording : startRecording}
                      variant={isRecording ? "destructive" : "secondary"}
                      className="w-full h-12 rounded-full arabic-text"
                    >
                      <Mic
                        className={`w-5 h-5 ml-2 ${
                          isRecording ? "animate-pulse" : ""
                        }`}
                      />
                      {isRecording ? "إيقاف التسجيل" : "اضغط للتسجيل"}
                    </Button>
                  </div>
                  {recordedAudio && (
                    <p className="text-center text-green-600 text-sm arabic-text">
                      تم تسجيل الصوت بنجاح ✅
                    </p>
                  )}
                </div>

                <Button
                  onClick={sendChallenge}
                  disabled={isLoading || !challengeText}
                  className="w-full bg-purple-600 hover:bg-purple-700 arabic-text text-white h-12"
                >
                  {isLoading ? "جاري الإرسال..." : "أرسل التحدي! 🚀"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
