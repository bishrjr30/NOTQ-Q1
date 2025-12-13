// src/pages/SpecialTraining.jsx

import React, { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mic,
  Activity,
  Wind,
  Drama,
  Volume2,
  Square,
  ArrowLeft,
  RefreshCw,
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

// ✅ الكيانات والتكاملات الجديدة
import { Student, Recording, SystemSetting } from "@/api/entities";
import { UploadFile } from "@/api/integrations";

export default function SpecialTrainingPage() {
  const [activeTab, setActiveTab] = useState("mirroring");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  // Mirroring State
  const [mirrorText] = useState(
    "اَلْعِلْمُ نُورٌ يَقْذِفُهُ اللهُ فِي قَلْبِ مَنْ يَشَاءُ"
  );

  // Breathing State
  const [breathingText] = useState(
    "تَنَفَّسْ بِعُمْقٍ ... ثُمَّ اقْرَأْ بِهُدُوءٍ ... اَلْقِرَاءَةُ لَيْسَتْ سِبَاقًا ... بَلْ هِيَ رِحْلَةٌ مُمْتِعَةٌ لِلْعَقْلِ وَالرُّوحِ."
  );

  // Acting State
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const plays = [
    [
      {
        name: "الْمُعَلِّمُ",
        text: "يَا أَحْمَدُ، هَلْ حَفِظْتَ دَرْسَ الْيَوْمِ جَيِّدًا؟",
      },
      {
        name: "أَحْمَدُ",
        text: "نَعَمْ يَا أُسْتَاذِي، لَقَدْ قَرَأْتُهُ ثَلَاثَ مَرَّاتٍ بِتَمَعُّنٍ.",
      },
      {
        name: "الْمُعَلِّمُ",
        text: "أَحْسَنْتَ! إِذًا أَخْبِرْنِي، مَا هِيَ أَهَمُّ فِكْرَةٍ فِي النَّصِّ؟",
      },
    ],
    [
      {
        name: "اَلْأُمُّ",
        text: "هَلْ رَتَّبْتَ غُرْفَتَكَ يَا خَالِدُ؟",
      },
      {
        name: "خَالِدُ",
        text: "لَيْسَ بَعْدُ يَا أُمِّي، كُنْتُ مَشْغُولًا بِحَلِّ الْوَاجِبِ.",
      },
      {
        name: "اَلْأُمُّ",
        text: "بَارَكَ اللهُ فِيكَ، وَلَكِنْ لَا تُؤَجِّلْ عَمَلَ الْيَوْمِ إِلَى الْغَدِ.",
      },
    ],
    [
      {
        name: "الْمُسَافِرُ",
        text: "مَتَى سَيَنْطَلِقُ الْقِطَارُ أَيُّهَا الْمُوَظَّفُ؟",
      },
      {
        name: "الْمُوَظَّفُ",
        text: "بَعْدَ خَمْسِ دَقَائِقٍ، عَلَيْكَ الْإِسْرَاعُ!",
      },
      {
        name: "الْمُسَافِرُ",
        text: "شُكْرًا لَكَ، سَأَجْرِي فَوْرًا.",
      },
    ],
  ];

  const [roles, setRoles] = useState(plays[0]);
  const [userRole, setUserRole] = useState(plays[0][1].name);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const renewPlay = () => {
    const nextIndex = (currentPlayIndex + 1) % plays.length;
    setCurrentPlayIndex(nextIndex);
    setRoles(plays[nextIndex]);
    setUserRole(plays[nextIndex][1]?.name || plays[nextIndex][0].name);
    setFeedback(null);
  };

  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
      setFeedback(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: true,
      });
      const options = { mimeType: "audio/webm" };

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) audioChunksRef.current.push(event.data);
      };

      mediaRecorderRef.current.onstop = async () => {
        const blob = new Blob(audioChunksRef.current, {
          type: "audio/webm",
        });
        await processRecording(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      alert("لا يمكن الوصول للميكروفون. يرجى التحقق من الأذونات.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const processRecording = async (audioBlob) => {
    setIsAnalyzing(true);
    setProgress(10);
    try {
      const fileSizeKB = audioBlob.size / 1024;
      if (fileSizeKB < 2) {
        throw new Error(
          "التسجيل قصير جداً أو فارغ. يرجى إعادة المحاولة مع قراءة أوضح."
        );
      }

      // 1) رفع الملف إلى التخزين عبر UploadFile
      const file = new File([audioBlob], "special_training.webm", {
        type: "audio/webm",
      });

      const { file_url } = await UploadFile({
        file,
        bucket: "recordings",
        folder: "special_training",
      });

      setProgress(40);

      // 2) جلب مفتاح OpenAI (من env أو SystemSetting)
      let OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
      try {
        const settings = await SystemSetting.list();
        const keySetting = settings.find(
          (s) => s.key === "openai_api_key" && typeof s.value === "string"
        );
        if (keySetting && keySetting.value.startsWith("sk-")) {
          OPENAI_API_KEY = keySetting.value;
        }
      } catch (e) {
        console.warn("Could not load system key, falling back to env.");
      }

      if (!OPENAI_API_KEY) {
        throw new Error(
          "لم يتم إعداد مفتاح OpenAI API. يرجى من المعلم إضافة المفتاح في الإعدادات."
        );
      }

      // 3) تفريغ الصوت إلى نص باستخدام Whisper
      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");
      formData.append("language", "ar");

      const transRes = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: formData,
        }
      );

      if (!transRes.ok) {
        const errText = await transRes.text();
        if (
          transRes.status === 429 ||
          errText.includes("insufficient_quota")
        ) {
          throw new Error(
            "⚠️ تم تجاوز حد الاستخدام المجاني. يرجى من المعلم إضافة مفتاح API في الإعدادات."
          );
        }
        throw new Error(
          `خطأ في خدمة التفريغ الصوتي: ${transRes.status} - ${errText}`
        );
      }

      const transData = await transRes.json();
      const text = transData.text || "";
      setProgress(60);

      // 4) إعداد النص المستهدف حسب نوع التدريب
      let targetText = "";
      if (activeTab === "mirroring") targetText = mirrorText;
      else if (activeTab === "breathing") targetText = breathingText;
      else if (activeTab === "acting")
        targetText = roles
          .filter((r) => r.name === userRole)
          .map((r) => r.text)
          .join(" ");

      // 5) تحليل الأداء الصوتي عبر GPT-4o
      const analysisRes = await fetch(
        "https://api.openai.com/v1/chat/completions",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${OPENAI_API_KEY}`,
          },
          body: JSON.stringify({
            model: "gpt-4o",
            messages: [
              {
                role: "system",
                content:
                  "أنت خبير تحليل صوتي لغوي. يجب أن تكون جميع مخرجاتك باللغة العربية الفصحى ومشكولة بالكامل تشكيلاً تاماً (100% Full Tashkeel) للحروف والكلمات.",
              },
              {
                role: "user",
                content: `
                  النص الأصلي: "${targetText}"
                  النص المقروء: "${text}"
                  
                  قيّم الأداء بدقة متناهية (حقيقية وليست مجاملة) من حيث:
                  1. التطابق (Score out of 100) - كن صارمًا.
                  2. الإيقاع (Rhythm).
                  3. النبرة (Tone).
                  4. التنفس (Breathing).
                  
                  JSON Output ONLY:
                  {
                      "score": number,
                      "rhythm": "string arabic (full tashkeel)",
                      "tone": "string arabic (full tashkeel)",
                      "breathing": "string arabic (full tashkeel)",
                      "feedback": "string arabic short (full tashkeel)"
                  }
                `,
              },
            ],
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!analysisRes.ok) {
        const errText = await analysisRes.text();
        if (
          analysisRes.status === 429 ||
          errText.includes("insufficient_quota")
        ) {
          throw new Error(
            "⚠️ تم تجاوز حد الاستخدام المجاني. يرجى إضافة مفتاح API."
          );
        }
        throw new Error(
          `خطأ في خدمة التحليل الصوتي: ${analysisRes.status} - ${errText}`
        );
      }

      const analysisData = await analysisRes.json();

      if (
        !analysisData.choices ||
        !analysisData.choices.length ||
        !analysisData.choices[0].message
      ) {
        throw new Error("لم يُرجِع الذكاء الاصطناعي نتيجة تحليل صالحة.");
      }

      const result = JSON.parse(analysisData.choices[0].message.content);

      setProgress(90);
      setFeedback(result);

      // 6) حفظ التسجيل في سجلات الطالب (إن وجد)
      const studentName = localStorage.getItem("studentName");
      if (studentName) {
        const students = await Student.list();
        const student = students.find((s) => s.name === studentName);
        if (student) {
          await Recording.create({
            student_id: student.id,
            exercise_id: "special-training",
            audio_url: file_url,
            score: result.score,
            feedback: result.feedback,
            analysis_details: {
              rhythm: result.rhythm,
              tone: result.tone,
              breathing: result.breathing,
              type: activeTab,
            },
          });
        }
      }

      setProgress(100);
    } catch (e) {
      console.error(e);
      let errorMessage = e.message || "خطأ غير معروف.";
      if (
        errorMessage.includes("limit of integrations") ||
        errorMessage.includes("upgrade your plan")
      ) {
        errorMessage =
          "عذراً، وصل النظام إلى الحد الأقصى للاستخدام الشهري. يرجى إبلاغ المعلم.";
      } else if (errorMessage.includes("quota")) {
        errorMessage =
          "عذراً، تم تجاوز حد استخدام الذكاء الاصطناعي. يرجى إبلاغ المعلم.";
      }
      alert(`خطأ: ${errorMessage}`);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("StudentDashboard")}>
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold arabic-text text-slate-800">
              ⚡ تدريب خاص ومبتكر
            </h1>
            <p className="text-slate-600 arabic-text">
              جرّب أساليب مختلفة لتحسين النطق، التنفس، والتعبير الصوتي
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="mirroring"
          onValueChange={setActiveTab}
          className="space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white shadow-sm border">
            <TabsTrigger
              value="mirroring"
              className="text-lg arabic-text data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700"
            >
              <Activity className="w-5 h-5 ml-2" />
              مماثلة الصوت
            </TabsTrigger>
            <TabsTrigger
              value="breathing"
              className="text-lg arabic-text data-[state=active]:bg-green-100 data-[state=active]:text-green-700"
            >
              <Wind className="w-5 h-5 ml-2" />
              تدريب التنفس
            </TabsTrigger>
            <TabsTrigger
              value="acting"
              className="text-lg arabic-text data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700"
            >
              <Drama className="w-5 h-5 ml-2" />
              مسرح القراءة
            </TabsTrigger>
          </TabsList>

          {/* Mirroring Mode */}
          <TabsContent value="mirroring">
            <Card className="border-0 shadow-lg bg-white/80">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-xl">
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  قلّد نغمة وإيقاع المعلم
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center space-y-8">
                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200">
                  <p className="text-3xl font-bold text-blue-900 arabic-text leading-loose">
                    {mirrorText}
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <Button
                    onClick={() => speakText(mirrorText)}
                    disabled={isPlaying}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg arabic-text"
                  >
                    <Volume2 className="w-6 h-6 ml-2" />
                    {isPlaying ? "جاري الاستماع..." : "استمع للنمط"}
                  </Button>
                </div>

                {/* موجة صوتية بسيطة (visual only) */}
                <div className="h-24 bg-slate-100 rounded-xl flex items-center justify-center gap-1 overflow-hidden">
                  {Array.from({ length: 40 }).map((_, i) => (
                    <motion.div
                      key={i}
                      animate={{
                        height: isPlaying
                          ? [10, Math.random() * 80, 10]
                          : 10,
                      }}
                      transition={{
                        duration: 0.2,
                        repeat: Infinity,
                        delay: i * 0.05,
                      }}
                      className="w-2 bg-blue-400 rounded-full"
                      style={{ height: "10px" }}
                    />
                  ))}
                </div>

                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full py-8 text-xl rounded-2xl arabic-text"
                >
                  {isAnalyzing ? (
                    <>جاري التحليل... {progress}%</>
                  ) : (
                    <>
                      {isRecording ? (
                        <Square className="w-6 h-6 ml-2" />
                      ) : (
                        <Mic className="w-6 h-6 ml-2" />
                      )}
                      {isRecording ? "إيقاف وتحليل" : "سجّل محاولتك"}
                    </>
                  )}
                </Button>

                {isAnalyzing && (
                  <div className="space-y-2 mt-4">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-slate-600 arabic-text">
                      يتم تحليل التسجيل صوتيًا...
                    </p>
                  </div>
                )}

                {feedback && activeTab === "mirroring" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 p-6 rounded-xl border border-green-200 text-right"
                  >
                    <h3 className="font-bold text-green-800 text-xl mb-4 arabic-text">
                      تحليل الأداء الصوتي:
                    </h3>
                    <ul className="space-y-2 arabic-text text-green-700">
                      <li>
                        🎵 <strong>الإيقاع:</strong> {feedback.rhythm}
                      </li>
                      <li>
                        🗣️ <strong>النبرة:</strong> {feedback.tone}
                      </li>
                      <li>
                        💨 <strong>التنفس:</strong> {feedback.breathing}
                      </li>
                      <li>
                        💯 <strong>درجة التطابق:</strong> {feedback.score}%
                      </li>
                    </ul>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breathing Mode */}
          <TabsContent value="breathing">
            <Card className="border-0 shadow-lg bg-white/80">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-xl">
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Wind className="w-6 h-6" />
                  مدرّب التوقف والتنفس
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center space-y-8">
                <p className="text-slate-600 arabic-text text-lg">
                  تتبّع الإشارات البصرية للتنفس. خُذ نفسًا عند (💨) واقرأ
                  بهدوء.
                </p>

                <div className="bg-green-50 p-8 rounded-2xl border-2 border-green-200 leading-loose text-2xl font-bold text-green-900 arabic-text">
                  {breathingText.split("...").map((part, idx, arr) => (
                    <span key={idx}>
                      {part}
                      {idx < arr.length - 1 && (
                        <span className="mx-2 inline-flex items-center justify-center w-8 h-8 bg-green-200 text-green-700 rounded-full text-sm">
                          💨
                        </span>
                      )}
                    </span>
                  ))}
                </div>

                <motion.div
                  animate={{ scale: [1, 1.2, 1] }}
                  transition={{
                    duration: 4,
                    repeat: Infinity,
                    ease: "easeInOut",
                  }}
                  className="w-32 h-32 bg-green-100 rounded-full mx-auto flex items-center justify-center border-4 border-green-300"
                >
                  <span className="text-green-700 font-bold arabic-text">
                    تنفّس...
                  </span>
                </motion.div>

                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full py-8 text-xl rounded-2xl arabic-text bg-green-600 hover:bg-green-700 text-white"
                >
                  {isAnalyzing ? (
                    <>جاري التحليل... {progress}%</>
                  ) : (
                    <>
                      {isRecording ? (
                        <Square className="w-6 h-6 ml-2" />
                      ) : (
                        <Mic className="w-6 h-6 ml-2" />
                      )}
                      {isRecording
                        ? "إيقاف وإنهاء التحليل"
                        : "ابدأ تمرين التنفس والقراءة"}
                    </>
                  )}
                </Button>

                {isAnalyzing && (
                  <div className="space-y-2 mt-4">
                    <Progress value={progress} className="h-2" />
                    <p className="text-sm text-slate-600 arabic-text">
                      يتم تحليل طريقة التنفس والوقفات...
                    </p>
                  </div>
                )}

                {feedback && activeTab === "breathing" && (
                  <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="bg-green-50 p-6 rounded-xl border border-green-200 text-right mt-6"
                  >
                    <h3 className="font-bold text-green-800 text-xl mb-4 arabic-text">
                      تحليل التنفس والقراءة:
                    </h3>
                    <ul className="space-y-2 arabic-text text-green-700">
                      <li>
                        💨 <strong>التنفس والوقفات:</strong>{" "}
                        {feedback.breathing}
                      </li>
                      <li>
                        🗣️ <strong>النبرة:</strong> {feedback.tone}
                      </li>
                      <li>
                        💯 <strong>التقييم العام:</strong>{" "}
                        {feedback.score}%
                      </li>
                    </ul>
                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Acting Mode */}
          <TabsContent value="acting">
            <Card className="border-0 shadow-lg bg-white/80">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Drama className="w-6 h-6" />
                  مسرح القراءة (تفاعلي)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                <div className="flex flex-wrap justify-between items-center gap-4">
                  <p className="arabic-text text-lg font-bold">
                    أنت تؤدّي دور:{" "}
                    <span className="text-purple-600">{userRole}</span>
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {roles.map((role) => (
                      <Button
                        key={role.name}
                        size="sm"
                        variant={
                          userRole === role.name ? "default" : "outline"
                        }
                        className={`arabic-text ${
                          userRole === role.name
                            ? "bg-purple-600 text-white"
                            : ""
                        }`}
                        onClick={() => {
                          setUserRole(role.name);
                          setFeedback(null);
                        }}
                      >
                        {role.name}
                      </Button>
                    ))}
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={renewPlay}
                      className="arabic-text flex items-center gap-1 text-purple-700"
                    >
                      <RefreshCw className="w-4 h-4 ml-1" />
                      مشهد جديد
                    </Button>
                  </div>
                </div>

                <div className="space-y-4">
                  {roles.map((role, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-4 ${
                        role.name === userRole
                          ? "flex-row-reverse"
                          : ""
                      }`}
                    >
                      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                        {role.name.slice(0, 2)}
                      </div>
                      <div
                        className={`flex-1 p-4 rounded-2xl border text-right ${
                          role.name === userRole
                            ? "bg-purple-50 border-purple-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold arabic-text text-sm text-slate-700">
                            {role.name}
                          </span>
                          {role.name === userRole ? (
                            <span className="text-xs text-purple-600 arabic-text">
                              هذا دورك 🎭
                            </span>
                          ) : (
                            <Button
                              size="sm"
                              variant="ghost"
                              className="h-8 arabic-text text-slate-600"
                              onClick={() => speakText(role.text)}
                            >
                              <Volume2 className="w-4 h-4 ml-1" />
                              استمع
                            </Button>
                          )}
                        </div>
                        <p className="arabic-text text-lg text-slate-800 leading-relaxed">
                          {role.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-4 mt-4">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                    variant={isRecording ? "destructive" : "default"}
                    className="w-full py-8 text-xl rounded-2xl arabic-text bg-purple-600 hover:bg-purple-700 text-white"
                  >
                    {isAnalyzing ? (
                      <>جاري التحليل... {progress}%</>
                    ) : (
                      <>
                        {isRecording ? (
                          <Square className="w-6 h-6 ml-2" />
                        ) : (
                          <Mic className="w-6 h-6 ml-2" />
                        )}
                        {isRecording
                          ? "إيقاف وتحليل أداء الدور"
                          : "سجّل أداء دورك التمثيلي"}
                      </>
                    )}
                  </Button>

                  {isAnalyzing && (
                    <div className="space-y-2 mt-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-sm text-slate-600 arabic-text text-right">
                        يتم تحليل تعبيرك الصوتي وإيقاعك في الحوار...
                      </p>
                    </div>
                  )}

                  {feedback && activeTab === "acting" && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      className="bg-purple-50 p-6 rounded-xl border border-purple-200 text-right mt-4"
                    >
                      <h3 className="font-bold text-purple-800 text-xl mb-4 arabic-text">
                        تقرير الأداء التمثيلي:
                      </h3>
                      <ul className="space-y-2 arabic-text text-purple-700">
                        <li>
                          🎵 <strong>الإيقاع:</strong> {feedback.rhythm}
                        </li>
                        <li>
                          🗣️ <strong>النبرة والتعبير:</strong>{" "}
                          {feedback.tone}
                        </li>
                        <li>
                          💨 <strong>التنفس والوقفات:</strong>{" "}
                          {feedback.breathing}
                        </li>
                        <li>
                          💯 <strong>الدرجة العامة:</strong>{" "}
                          {feedback.score}%
                        </li>
                      </ul>
                    </motion.div>
                  )}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
