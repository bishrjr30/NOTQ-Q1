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
  AlertCircle,
  Sparkles,
  Play,
  Lightbulb,
  Info
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";

// ✅ الكيانات والتكاملات
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
    "تَنَفَّسْ بِعُمْقٍ ... ثُمَّ اقْرَأْ بِهُدُوءٍ ... اَلْقِرَاءَةُ لَيْسَتْ سِبَاقًا ... بَلْ هِيَ رِحْلَةٌ مُمْتِعَةٌ لِلْعَقْلِ وَالرُّوحِ."
  );

  // Acting State
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const plays = [
    [
      {
        name: "الْمُعَلِّمُ",
        text: "يَا أَحْمَدُ، هَلْ حَفِظْتَ دَرْسَ الْيَوْمِ جَيِّدًا؟",
      },
      {
        name: "أَحْمَدُ",
        text: "نَعَمْ يَا أُسْتَاذِي، لَقَدْ قَرَأْتُهُ ثَلَاثَ مَرَّاتٍ بِتَمَعُّنٍ.",
      },
      {
        name: "الْمُعَلِّمُ",
        text: "أَحْسَنْتَ! إِذًا أَخْبِرْنِي، مَا هِيَ أَهَمُّ فِكْرَةٍ فِي النَّصِّ؟",
      },
    ],
    [
      {
        name: "اَلْأُمُّ",
        text: "هَلْ رَتَّبْتَ غُرْفَتَكَ يَا خَالِدُ؟",
      },
      {
        name: "خَالِدُ",
        text: "لَيْسَ بَعْدُ يَا أُمِّي، كُنْتُ مَشْغُولًا بِحَلِّ الْوَاجِبِ.",
      },
      {
        name: "اَلْأُمُّ",
        text: "بَارَكَ اللهُ فِيكَ، وَلَكِنْ لَا تُؤَجِّلْ عَمَلَ الْيَوْمِ إِلَى الْغَدِ.",
      },
    ],
    [
      {
        name: "الْمُسَافِرُ",
        text: "مَتَى سَيَنْطَلِقُ الْقِطَارُ أَيُّهَا الْمُوَظَّفُ؟",
      },
      {
        name: "الْمُوَظَّفُ",
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
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100,
        },
      });
      const options = { 
        mimeType: "audio/webm;codecs=opus",
        audioBitsPerSecond: 128000,
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = "audio/webm";
      }

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

      // 1) رفع الملف
      const file = new File([audioBlob], "special_training.webm", {
        type: "audio/webm",
      });

      const { file_url } = await UploadFile({
        file,
        bucket: "recordings",
        folder: "special_training",
      });

      setProgress(40);

      // 2) جلب مفتاح OpenAI
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

      // 3) تفريغ الصوت
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

      // 4) إعداد النص المستهدف
      let targetText = "";
      let trainingType = "";
      
      if (activeTab === "mirroring") {
        targetText = mirrorText;
        trainingType = "تقليد النطق والإيقاع";
      } else if (activeTab === "breathing") {
        targetText = breathingText;
        trainingType = "التنفس والوقفات";
      } else if (activeTab === "acting") {
        targetText = roles
          .filter((r) => r.name === userRole)
          .map((r) => r.text)
          .join(" ");
        trainingType = "الأداء التمثيلي";
      }

      // 5) تحليل محسّن وأقل صرامة
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
                content: "أنت معلم صوتيات محترف ومشجع، تساعد الطلاب على تحسين نطقهم بطريقة إيجابية.",
              },
              {
                role: "user",
                content: `أنت معلم تدريب صوتي متخصص ومحفز، تقيّم أداء الطلاب في ${trainingType}.

**النص المطلوب:**
"${targetText}"

**النص المقروء:**
"${text}"

**نوع التدريب:** ${trainingType}

**قواعد التقييم:**
- كن مشجعاً ومحفزاً في تقييمك
- ركز على الجوانب الإيجابية أولاً
- إذا كان الطالب قد حاول وقرأ معظم النص، أعطه درجة جيدة (60-85)
- إذا كان الأداء ممتازاً، أعطه درجة عالية (85-100)
- فقط إذا كان التسجيل صامتاً أو مختلفاً تماماً، أعطه درجة منخفضة

**التقييم المطلوب:**
1. **الإيقاع** - كيف كان انسجام القراءة؟
2. **النبرة** - هل كانت النبرة واضحة ومعبرة؟
3. **التنفس** - هل كانت الوقفات مناسبة؟
4. **الدرجة** - من 0 إلى 100 (كن سخياً ومشجعاً!)
5. **التعليق** - ملاحظة مشجعة ونصيحة عملية

**JSON المطلوب:**
{
  "score": [رقم من 0-100، كن مشجعاً],
  "rhythm": "[تعليق إيجابي عن الإيقاع]",
  "tone": "[تعليق إيجابي عن النبرة]",
  "breathing": "[تعليق عن التنفس]",
  "feedback": "[تعليق مشجع يبدأ بالإيجابيات ثم نصيحة للتحسين]"
}`,
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

      // 6) حفظ التسجيل
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
              ai_model: "GPT-4o",
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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-3 sm:p-4 md:p-6 font-sans" dir="rtl">
      <div className="max-w-7xl mx-auto">
        
        {/* Header Section */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-8">
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("StudentDashboard")}>
                <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white hover:bg-slate-50 transition-transform">
                <ArrowLeft className="w-5 h-5 text-gray-700" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl sm:text-4xl font-black arabic-text text-slate-900 flex items-center gap-3">
                <Sparkles className="text-cyan-600 w-8 h-8" />
                التدريب الصوتي المتقدم
                </h1>
                <p className="text-slate-600 arabic-text text-lg mt-1 opacity-80 hidden sm:block">
                طور مهاراتك في الإلقاء، التنفس، والتمثيل الصوتي مع المدرب الذكي.
                </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* === Main Training Area (8 Cols) === */}
            <div className="lg:col-span-8">
                <Tabs
                    defaultValue="mirroring"
                    onValueChange={setActiveTab}
                    className="space-y-6"
                >
                    <TabsList className="grid w-full grid-cols-3 h-16 bg-white shadow-md border rounded-2xl p-1.5">
                        <TabsTrigger
                            value="mirroring"
                            className="text-base sm:text-lg arabic-text font-bold data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-xl transition-all"
                        >
                            <Activity className="w-5 h-5 ml-2" />
                            مماثلة الصوت
                        </TabsTrigger>
                        <TabsTrigger
                            value="breathing"
                            className="text-base sm:text-lg arabic-text font-bold data-[state=active]:bg-green-100 data-[state=active]:text-green-700 rounded-xl transition-all"
                        >
                            <Wind className="w-5 h-5 ml-2" />
                            تدريب التنفس
                        </TabsTrigger>
                        <TabsTrigger
                            value="acting"
                            className="text-base sm:text-lg arabic-text font-bold data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 rounded-xl transition-all"
                        >
                            <Drama className="w-5 h-5 ml-2" />
                            مسرح القراءة
                        </TabsTrigger>
                    </TabsList>

                    {/* Mirroring Mode */}
                    <TabsContent value="mirroring" className="focus-visible:outline-none">
                        <Card className="border-0 shadow-2xl bg-white/95 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white p-6">
                                <CardTitle className="arabic-text flex items-center gap-3 text-2xl">
                                    <Activity className="w-8 h-8 opacity-80" />
                                    قلّد نغمة وإيقاع المعلم
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 text-center space-y-8">
                                <div className="bg-blue-50 p-8 rounded-3xl border-2 border-blue-200 shadow-inner">
                                    <p className="text-3xl md:text-4xl font-bold text-blue-900 arabic-text leading-relaxed">
                                        {mirrorText}
                                    </p>
                                </div>

                                <div className="flex flex-col sm:flex-row justify-center gap-6">
                                    <Button
                                        onClick={() => speakText(mirrorText)}
                                        disabled={isPlaying}
                                        className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-2xl text-xl arabic-text shadow-lg w-full sm:w-auto"
                                    >
                                        <Volume2 className="w-6 h-6 ml-3" />
                                        {isPlaying ? "جاري الاستماع..." : "استمع للنمط"}
                                    </Button>
                                    
                                    <Button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={isAnalyzing}
                                        variant={isRecording ? "destructive" : "outline"}
                                        className={`px-8 py-6 rounded-2xl text-xl arabic-text shadow-lg border-2 w-full sm:w-auto ${isRecording ? "" : "border-blue-200 hover:bg-blue-50 text-blue-700"}`}
                                    >
                                        {isAnalyzing ? (
                                            <span className="flex items-center gap-2"><div className="animate-spin rounded-full h-5 w-5 border-2 border-current"></div> جاري التحليل... {progress}%</span>
                                        ) : (
                                            <>
                                                {isRecording ? <Square className="w-6 h-6 ml-3" /> : <Mic className="w-6 h-6 ml-3" />}
                                                {isRecording ? "إيقاف التسجيل" : "سجّل محاولتك"}
                                            </>
                                        )}
                                    </Button>
                                </div>

                                {/* Audio Wave Visualization (Decoy) */}
                                <div className="h-24 bg-slate-50 rounded-2xl flex items-end justify-center gap-1 overflow-hidden px-4 pb-4 border border-slate-100">
                                    {Array.from({ length: 50 }).map((_, i) => (
                                        <div
                                            key={i}
                                            className={`w-1.5 bg-blue-400 rounded-t-full transition-all duration-150 ${isPlaying ? 'animate-pulse' : ''}`}
                                            style={{ 
                                                height: isPlaying ? `${20 + Math.random() * 80}%` : "15%",
                                                opacity: isPlaying ? 1 : 0.3
                                            }}
                                        />
                                    ))}
                                </div>

                                {/* Feedback Section */}
                                {feedback && activeTab === "mirroring" && (
                                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-right animate-in slide-in-from-bottom-4 fade-in duration-500">
                                        <div className="flex items-center justify-between mb-4 pb-4 border-b border-emerald-200">
                                            <h3 className="font-bold text-emerald-900 text-xl arabic-text flex items-center gap-2">
                                                <CheckCircle2 className="w-6 h-6" /> تحليل الأداء الصوتي
                                            </h3>
                                            <span className="bg-emerald-600 text-white px-4 py-1 rounded-lg text-xl font-black shadow-sm">
                                                {feedback.score}%
                                            </span>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                                            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                                                <p className="text-emerald-800 font-bold mb-1 text-sm">الإيقاع</p>
                                                <p className="text-slate-600 text-sm">{feedback.rhythm}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                                                <p className="text-emerald-800 font-bold mb-1 text-sm">النبرة</p>
                                                <p className="text-slate-600 text-sm">{feedback.tone}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-emerald-100 shadow-sm">
                                                <p className="text-emerald-800 font-bold mb-1 text-sm">التنفس</p>
                                                <p className="text-slate-600 text-sm">{feedback.breathing}</p>
                                            </div>
                                        </div>
                                        <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-xl flex gap-3 items-start">
                                            <Lightbulb className="w-5 h-5 text-yellow-600 mt-1 flex-shrink-0" />
                                            <p className="text-yellow-900 text-sm leading-relaxed font-medium">
                                                {feedback.feedback}
                                            </p>
                                        </div>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Breathing Mode */}
                    <TabsContent value="breathing" className="focus-visible:outline-none">
                        <Card className="border-0 shadow-2xl bg-white/95 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white p-6">
                                <CardTitle className="arabic-text flex items-center gap-3 text-2xl">
                                    <Wind className="w-8 h-8 opacity-80" />
                                    مدرّب التوقف والتنفس
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 text-center space-y-8">
                                
                                <div className="bg-green-50 p-8 rounded-3xl border-2 border-green-200 shadow-inner relative overflow-hidden">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Wind className="w-32 h-32 text-green-600" />
                                    </div>
                                    <p className="text-2xl md:text-3xl font-bold text-green-900 arabic-text leading-loose relative z-10">
                                        {breathingText.split("...").map((part, idx, arr) => (
                                            <span key={idx}>
                                                {part}
                                                {idx < arr.length - 1 && (
                                                    <span className="mx-3 inline-flex items-center justify-center w-8 h-8 bg-white border-2 border-green-300 text-green-600 rounded-full text-lg shadow-sm" title="تنفس هنا">
                                                        💨
                                                    </span>
                                                )}
                                            </span>
                                        ))}
                                    </p>
                                </div>

                                <div className="flex flex-col items-center gap-4">
                                    <div className={`w-32 h-32 rounded-full border-8 flex items-center justify-center transition-all duration-[4000ms] ease-in-out ${isRecording ? "scale-110 border-green-400 bg-green-50" : "scale-90 border-slate-200 bg-slate-50"}`}>
                                        <span className="text-green-800 font-bold text-lg arabic-text">
                                            {isRecording ? "تنفّس ببطء..." : "استعد"}
                                        </span>
                                    </div>
                                    
                                    <Button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={isAnalyzing}
                                        className={`w-full sm:w-auto py-6 px-10 text-xl rounded-2xl arabic-text shadow-lg transition-all ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-green-600 hover:bg-green-700"} text-white`}
                                    >
                                        {isAnalyzing ? "جاري التحليل..." : (isRecording ? "إنهاء التمرين" : "ابدأ تمرين التنفس")}
                                    </Button>
                                </div>

                                {/* Feedback Section (Breathing) */}
                                {feedback && activeTab === "breathing" && (
                                    <div className="bg-emerald-50 p-6 rounded-2xl border border-emerald-200 text-right animate-in slide-in-from-bottom-4 fade-in duration-500">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-emerald-900 text-xl arabic-text">نتيجة تمرين التنفس</h3>
                                            <span className="bg-emerald-600 text-white px-4 py-1 rounded-lg text-xl font-black">{feedback.score}%</span>
                                        </div>
                                        <p className="text-emerald-800 leading-relaxed mb-4">{feedback.feedback}</p>
                                        <div className="bg-white p-4 rounded-xl border border-emerald-100">
                                            <p className="text-sm text-slate-500 font-bold mb-1">تفاصيل التنفس:</p>
                                            <p className="text-slate-700">{feedback.breathing}</p>
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </TabsContent>

                    {/* Acting Mode */}
                    <TabsContent value="acting" className="focus-visible:outline-none">
                        <Card className="border-0 shadow-2xl bg-white/95 overflow-hidden">
                            <CardHeader className="bg-gradient-to-r from-purple-600 to-pink-600 text-white p-6">
                                <CardTitle className="arabic-text flex items-center gap-3 text-2xl">
                                    <Drama className="w-8 h-8 opacity-80" />
                                    مسرح القراءة التفاعلي
                                </CardTitle>
                            </CardHeader>
                            <CardContent className="p-8 space-y-8">
                                
                                <div className="flex flex-col sm:flex-row justify-between items-center bg-purple-50 p-4 rounded-2xl border border-purple-100 gap-4">
                                    <div className="text-center sm:text-right">
                                        <p className="text-sm text-purple-600 font-bold mb-1">أنت تلعب دور:</p>
                                        <div className="bg-white px-6 py-2 rounded-xl shadow-sm border border-purple-200 text-purple-900 font-black text-xl">
                                            {userRole} 🎭
                                        </div>
                                    </div>
                                    
                                    <div className="flex gap-2">
                                        {roles.map((role) => (
                                            <Button
                                                key={role.name}
                                                size="sm"
                                                variant={userRole === role.name ? "default" : "outline"}
                                                className={`rounded-xl ${userRole === role.name ? "bg-purple-600 hover:bg-purple-700" : "border-purple-200 text-purple-700"}`}
                                                onClick={() => { setUserRole(role.name); setFeedback(null); }}
                                            >
                                                {role.name}
                                            </Button>
                                        ))}
                                        <Button size="sm" variant="ghost" onClick={renewPlay} className="text-slate-500 hover:bg-slate-100 rounded-xl">
                                            <RefreshCw className="w-4 h-4 ml-1" /> مشهد جديد
                                        </Button>
                                    </div>
                                </div>

                                <div className="space-y-4">
                                    {roles.map((role, idx) => (
                                        <div key={idx} className={`flex gap-4 ${role.name === userRole ? "flex-row-reverse" : ""}`}>
                                            <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-lg shadow-sm border-2 ${role.name === userRole ? "bg-purple-100 text-purple-700 border-purple-200" : "bg-slate-100 text-slate-600 border-slate-200"}`}>
                                                {role.name.charAt(0)}
                                            </div>
                                            <div className={`flex-1 p-5 rounded-2xl border-2 relative ${role.name === userRole ? "bg-purple-50 border-purple-200 text-purple-900 rounded-tr-none" : "bg-white border-slate-100 text-slate-700 rounded-tl-none"}`}>
                                                <div className="flex justify-between items-center mb-2">
                                                    <span className="font-bold text-sm opacity-70">{role.name}</span>
                                                    {role.name !== userRole && (
                                                        <Button size="icon" variant="ghost" className="h-8 w-8 rounded-full hover:bg-slate-100" onClick={() => speakText(role.text)}>
                                                            <Volume2 className="w-4 h-4 text-slate-400" />
                                                        </Button>
                                                    )}
                                                </div>
                                                <p className="text-xl font-medium leading-relaxed">{role.text}</p>
                                            </div>
                                        </div>
                                    ))}
                                </div>

                                <div className="flex justify-center pt-4">
                                    <Button
                                        onClick={isRecording ? stopRecording : startRecording}
                                        disabled={isAnalyzing}
                                        className={`w-full sm:w-auto py-6 px-12 text-xl rounded-2xl arabic-text shadow-xl transition-transform hover:scale-105 ${isRecording ? "bg-red-500 hover:bg-red-600" : "bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"} text-white`}
                                    >
                                        {isAnalyzing ? "جاري تقييم الأداء..." : (isRecording ? "إنهاء المشهد" : "🎬 ابدأ التمثيل (سجّل دورك)")}
                                    </Button>
                                </div>

                                {/* Feedback Section (Acting) */}
                                {feedback && activeTab === "acting" && (
                                    <div className="bg-purple-50 p-6 rounded-2xl border border-purple-200 text-right animate-in slide-in-from-bottom-4 fade-in duration-500">
                                        <div className="flex items-center justify-between mb-4">
                                            <h3 className="font-bold text-purple-900 text-xl arabic-text">تقييم الممثل المبدع</h3>
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm text-purple-600 font-bold">الأداء:</span>
                                                <span className="bg-purple-600 text-white px-3 py-1 rounded-lg text-lg font-black">{feedback.score}/100</span>
                                            </div>
                                        </div>
                                        
                                        <p className="text-purple-800 mb-6 font-medium leading-relaxed">{feedback.feedback}</p>
                                        
                                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                            <div className="bg-white p-4 rounded-xl border border-purple-100">
                                                <p className="text-xs text-purple-400 font-bold uppercase mb-1">التعبير والنبرة</p>
                                                <p className="text-slate-700 text-sm">{feedback.tone}</p>
                                            </div>
                                            <div className="bg-white p-4 rounded-xl border border-purple-100">
                                                <p className="text-xs text-purple-400 font-bold uppercase mb-1">التناغم والإيقاع</p>
                                                <p className="text-slate-700 text-sm">{feedback.rhythm}</p>
                                            </div>
                                        </div>
                                    </div>
                                )}

                            </CardContent>
                        </Card>
                    </TabsContent>
                </Tabs>
            </div>

            {/* === Sidebar / Educational Content (4 Cols) - AdSense Rich Content === */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Info Card 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-lg border border-slate-100">
                    <div className="flex items-center gap-3 mb-4 pb-4 border-b border-slate-50">
                        <div className="bg-blue-100 p-2.5 rounded-xl text-blue-600">
                            <Info className="w-6 h-6" />
                        </div>
                        <h3 className="font-bold text-slate-800 text-lg arabic-text">لماذا هذا التدريب؟</h3>
                    </div>
                    <p className="text-slate-600 leading-relaxed text-sm text-justify mb-4">
                        التنويع في أساليب القراءة (التقليد، التمثيل، التنفس) يساعد في بناء <strong>الذاكرة العضلية</strong> لأعضاء النطق، ويجعل صوتك أكثر مرونة وقوة وتأثيراً.
                    </p>
                    <div className="bg-slate-50 p-3 rounded-lg text-xs text-slate-500 border border-slate-200">
                        "الصوت هو أداة، وكلما تدربت عليها، أصبحت أكثر إتقانًا."
                    </div>
                </div>

                {/* Info Card 2 */}
                <div className="bg-gradient-to-br from-purple-600 to-pink-600 p-6 rounded-2xl shadow-lg text-white">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                            <Lightbulb className="w-6 h-6 text-yellow-300" />
                        </div>
                        <h3 className="font-bold text-lg arabic-text">نصيحة ذهبية</h3>
                    </div>
                    <p className="text-purple-100 leading-relaxed text-sm mb-4">
                        عند أداء دور تمثيلي، لا تقرأ الكلمات فقط، بل <strong>عش المشاعر</strong>. تخيل أنك الشخصية فعلاً. هل هو غاضب؟ سعيد؟ مستعجل؟ دع صوتك يعكس ذلك.
                    </p>
                    <Button variant="secondary" size="sm" className="w-full bg-white text-purple-700 hover:bg-purple-50 font-bold rounded-xl">
                        جرب الآن في "مسرح القراءة"
                    </Button>
                </div>

                {/* Ad Placeholder (For AdSense) */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-64 flex flex-col items-center justify-center gap-2 text-slate-400">
                    <span className="text-sm font-bold">مساحة إعلانية</span>
                    <span className="text-xs opacity-70">Google AdSense</span>
                </div>

            </div>
        </div>
      </div>
    </div>
  );
}
