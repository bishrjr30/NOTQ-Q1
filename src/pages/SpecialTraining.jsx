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
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to={createPageUrl("StudentDashboard")}>
            <Button variant="outline" size="icon" className="rounded-full shadow-lg hover:shadow-xl transition-all flex-shrink-0">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold arabic-text text-slate-800 flex items-center gap-2 mb-1">
              <Sparkles className="text-cyan-600 w-6 h-6 sm:w-7 sm:h-7" />
              تدريب خاص ومبتكر
            </h1>
            <p className="text-slate-600 arabic-text text-sm sm:text-base">
              جرّب أساليب مختلفة لتحسين النطق، التنفس، والتعبير الصوتي
            </p>
          </div>
        </div>

        <Tabs
          defaultValue="mirroring"
          onValueChange={setActiveTab}
          className="space-y-4 sm:space-y-6"
        >
          <TabsList className="grid w-full grid-cols-3 h-auto sm:h-14 bg-white shadow-lg border-2 rounded-xl p-1">
            <TabsTrigger
              value="mirroring"
              className="text-sm sm:text-lg arabic-text data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700 rounded-lg py-2 sm:py-3"
            >
              <Activity className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">مماثلة الصوت</span>
              <span className="sm:hidden">مماثلة</span>
            </TabsTrigger>
            <TabsTrigger
              value="breathing"
              className="text-sm sm:text-lg arabic-text data-[state=active]:bg-green-100 data-[state=active]:text-green-700 rounded-lg py-2 sm:py-3"
            >
              <Wind className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">تدريب التنفس</span>
              <span className="sm:hidden">التنفس</span>
            </TabsTrigger>
            <TabsTrigger
              value="acting"
              className="text-sm sm:text-lg arabic-text data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700 rounded-lg py-2 sm:py-3"
            >
              <Drama className="w-4 h-4 sm:w-5 sm:h-5 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">مسرح القراءة</span>
              <span className="sm:hidden">المسرح</span>
            </TabsTrigger>
          </TabsList>

          {/* Mirroring Mode */}
          <TabsContent value="mirroring">
            <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/90">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-xl p-4 sm:p-6">
                <CardTitle className="arabic-text flex items-center gap-2 text-lg sm:text-xl">
                  <Activity className="w-5 h-5 sm:w-6 sm:h-6" />
                  قلّد نغمة وإيقاع المعلم
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-6 sm:space-y-8">
                <div className="bg-blue-50 p-4 sm:p-6 rounded-xl sm:rounded-2xl border-2 border-blue-200">
                  <p className="text-xl sm:text-2xl md:text-3xl font-bold text-blue-900 arabic-text leading-loose">
                    {mirrorText}
                  </p>
                </div>

                <div className="flex justify-center gap-3 sm:gap-4">
                  <Button
                    onClick={() => speakText(mirrorText)}
                    disabled={isPlaying}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 sm:px-8 py-4 sm:py-6 rounded-xl text-base sm:text-lg arabic-text shadow-lg"
                  >
                    <Volume2 className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                    <span className="hidden sm:inline">{isPlaying ? "جاري الاستماع..." : "استمع للنمط"}</span>
                    <span className="sm:hidden">{isPlaying ? "استماع..." : "استمع"}</span>
                  </Button>
                </div>

                {/* Audio Wave Visualization */}
                <div className="h-20 sm:h-24 bg-slate-100 rounded-xl flex items-center justify-center gap-0.5 sm:gap-1 overflow-hidden px-2">
                  {Array.from({ length: window.innerWidth < 640 ? 30 : 40 }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-1 sm:w-2 bg-blue-400 rounded-full transition-all duration-200 ${
                        isPlaying ? 'animate-pulse' : ''
                      }`}
                      style={{ 
                        height: isPlaying ? `${10 + Math.random() * 60}px` : "10px",
                        animationDelay: `${i * 50}ms`
                      }}
                    />
                  ))}
                </div>

                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full py-6 sm:py-8 text-lg sm:text-xl rounded-xl sm:rounded-2xl arabic-text shadow-xl"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      جاري التحليل... {progress}%
                    </span>
                  ) : (
                    <>
                      {isRecording ? (
                        <Square className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                      ) : (
                        <Mic className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                      )}
                      {isRecording ? "إيقاف وتحليل" : "سجّل محاولتك"}
                    </>
                  )}
                </Button>

                {isAnalyzing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs sm:text-sm text-slate-600 arabic-text">
                      يتم تحليل التسجيل صوتياً بواسطة GPT-4...
                    </p>
                  </div>
                )}

                {feedback && activeTab === "mirroring" && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border-2 border-green-200 text-right animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-green-200">
                      <h3 className="font-bold text-green-800 text-lg sm:text-xl arabic-text">
                        تحليل الأداء الصوتي
                      </h3>
                      <div className="bg-green-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-base sm:text-lg font-bold">
                        {feedback.score}%
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-green-700 arabic-text text-sm sm:text-base">
                          <strong>🎵 الإيقاع:</strong> {feedback.rhythm}
                        </p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-green-700 arabic-text text-sm sm:text-base">
                          <strong>🗣️ النبرة:</strong> {feedback.tone}
                        </p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-green-700 arabic-text text-sm sm:text-base">
                          <strong>💨 التنفس:</strong> {feedback.breathing}
                        </p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
                      <p className="text-yellow-900 font-bold arabic-text mb-2 text-sm sm:text-base">
                        💡 ملاحظات المعلم:
                      </p>
                      <p className="text-yellow-800 arabic-text text-sm sm:text-base leading-relaxed">
                        {feedback.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breathing Mode */}
          <TabsContent value="breathing">
            <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/90">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-xl p-4 sm:p-6">
                <CardTitle className="arabic-text flex items-center gap-2 text-lg sm:text-xl">
                  <Wind className="w-5 h-5 sm:w-6 sm:h-6" />
                  مدرّب التوقف والتنفس
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 md:p-8 text-center space-y-6 sm:space-y-8">
                <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 sm:p-4">
                  <p className="text-slate-700 arabic-text text-sm sm:text-base lg:text-lg flex items-start gap-2">
                    <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-blue-600 flex-shrink-0 mt-0.5" />
                    <span>تتبّع الإشارات البصرية للتنفس. خُذ نفساً عند (💨) واقرأ بهدوء.</span>
                  </p>
                </div>

                <div className="bg-green-50 p-4 sm:p-6 md:p-8 rounded-xl sm:rounded-2xl border-2 border-green-200 leading-loose text-lg sm:text-xl md:text-2xl font-bold text-green-900 arabic-text">
                  {breathingText.split("...").map((part, idx, arr) => (
                    <span key={idx}>
                      {part}
                      {idx < arr.length - 1 && (
                        <span className="mx-2 inline-flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-green-200 text-green-700 rounded-full text-sm sm:text-base">
                          💨
                        </span>
                      )}
                    </span>
                  ))}
                </div>

                <div className="w-24 h-24 sm:w-32 sm:h-32 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full mx-auto flex items-center justify-center border-4 border-green-300 shadow-lg">
                  <span className="text-green-700 font-bold arabic-text text-sm sm:text-base">
                    تنفّس...
                  </span>
                </div>

                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  disabled={isAnalyzing}
                  variant={isRecording ? "destructive" : "default"}
                  className="w-full py-6 sm:py-8 text-lg sm:text-xl rounded-xl sm:rounded-2xl arabic-text bg-green-600 hover:bg-green-700 text-white shadow-xl"
                >
                  {isAnalyzing ? (
                    <span className="flex items-center justify-center gap-2">
                      <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                      جاري التحليل... {progress}%
                    </span>
                  ) : (
                    <>
                      {isRecording ? (
                        <Square className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                      ) : (
                        <Mic className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                      )}
                      {isRecording
                        ? "إيقاف وإنهاء التحليل"
                        : "ابدأ تمرين التنفس والقراءة"}
                    </>
                  )}
                </Button>

                {isAnalyzing && (
                  <div className="space-y-2">
                    <Progress value={progress} className="h-2" />
                    <p className="text-xs sm:text-sm text-slate-600 arabic-text">
                      يتم تحليل طريقة التنفس والوقفات بواسطة GPT-4...
                    </p>
                  </div>
                )}

                {feedback && activeTab === "breathing" && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 p-4 sm:p-6 rounded-xl border-2 border-green-200 text-right animate-in fade-in slide-in-from-bottom-4 duration-500">
                    <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-green-200">
                      <h3 className="font-bold text-green-800 text-lg sm:text-xl arabic-text">
                        تحليل التنفس والقراءة
                      </h3>
                      <div className="bg-green-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-base sm:text-lg font-bold">
                        {feedback.score}%
                      </div>
                    </div>
                    
                    <div className="space-y-3 mb-4">
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-green-700 arabic-text text-sm sm:text-base">
                          <strong>💨 التنفس والوقفات:</strong> {feedback.breathing}
                        </p>
                      </div>
                      <div className="bg-white/50 p-3 rounded-lg">
                        <p className="text-green-700 arabic-text text-sm sm:text-base">
                          <strong>🗣️ النبرة:</strong> {feedback.tone}
                        </p>
                      </div>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
                      <p className="text-yellow-900 font-bold arabic-text mb-2 text-sm sm:text-base">
                        💡 ملاحظات المعلم:
                      </p>
                      <p className="text-yellow-800 arabic-text text-sm sm:text-base leading-relaxed">
                        {feedback.feedback}
                      </p>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Acting Mode */}
          <TabsContent value="acting">
            <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/90">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl p-4 sm:p-6">
                <CardTitle className="arabic-text flex items-center gap-2 text-lg sm:text-xl">
                  <Drama className="w-5 h-5 sm:w-6 sm:h-6" />
                  مسرح القراءة (تفاعلي)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 sm:p-6 space-y-4 sm:space-y-6">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 sm:gap-4">
                  <p className="arabic-text text-base sm:text-lg font-bold">
                    أنت تؤدّي دور:{" "}
                    <span className="text-purple-600">{userRole}</span>
                  </p>
                  <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                    {roles.map((role) => (
                      <Button
                        key={role.name}
                        size="sm"
                        variant={
                          userRole === role.name ? "default" : "outline"
                        }
                        className={`arabic-text text-xs sm:text-sm ${
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
                      className="arabic-text flex items-center gap-1 text-purple-700 text-xs sm:text-sm"
                    >
                      <RefreshCw className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                      مشهد جديد
                    </Button>
                  </div>
                </div>

                <div className="space-y-3 sm:space-y-4">
                  {roles.map((role, idx) => (
                    <div
                      key={idx}
                      className={`flex gap-2 sm:gap-4 ${
                        role.name === userRole
                          ? "flex-row-reverse"
                          : ""
                      }`}
                    >
                      <div className="flex-shrink-0 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-purple-100 flex items-center justify-center text-xs font-bold text-purple-700">
                        {role.name.slice(0, 2)}
                      </div>
                      <div
                        className={`flex-1 p-3 sm:p-4 rounded-xl sm:rounded-2xl border text-right ${
                          role.name === userRole
                            ? "bg-purple-50 border-purple-200"
                            : "bg-slate-50 border-slate-200"
                        }`}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-bold arabic-text text-xs sm:text-sm text-slate-700">
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
                              className="h-7 sm:h-8 arabic-text text-slate-600 text-xs sm:text-sm"
                              onClick={() => speakText(role.text)}
                            >
                              <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1" />
                              استمع
                            </Button>
                          )}
                        </div>
                        <p className="arabic-text text-sm sm:text-base lg:text-lg text-slate-800 leading-relaxed">
                          {role.text}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="space-y-3 sm:space-y-4">
                  <Button
                    onClick={isRecording ? stopRecording : startRecording}
                    disabled={isAnalyzing}
                    variant={isRecording ? "destructive" : "default"}
                    className="w-full py-6 sm:py-8 text-lg sm:text-xl rounded-xl sm:rounded-2xl arabic-text bg-purple-600 hover:bg-purple-700 text-white shadow-xl"
                  >
                    {isAnalyzing ? (
                      <span className="flex items-center justify-center gap-2">
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                        جاري التحليل... {progress}%
                      </span>
                    ) : (
                      <>
                        {isRecording ? (
                          <Square className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                        ) : (
                          <Mic className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                        )}
                        {isRecording
                          ? "إيقاف وتحليل أداء الدور"
                          : "سجّل أداء دورك التمثيلي"}
                      </>
                    )}
                  </Button>

                  {isAnalyzing && (
                    <div className="space-y-2">
                      <Progress value={progress} className="h-2" />
                      <p className="text-xs sm:text-sm text-slate-600 arabic-text text-right">
                        يتم تحليل تعبيرك الصوتي وإيقاعك في الحوار بواسطة GPT-4...
                      </p>
                    </div>
                  )}

                  {feedback && activeTab === "acting" && (
                    <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 sm:p-6 rounded-xl border-2 border-purple-200 text-right animate-in fade-in slide-in-from-bottom-4 duration-500">
                      <div className="flex items-center justify-between mb-4 pb-3 border-b-2 border-purple-200">
                        <h3 className="font-bold text-purple-800 text-lg sm:text-xl arabic-text">
                          تقرير الأداء التمثيلي
                        </h3>
                        <div className="bg-purple-600 text-white px-3 sm:px-4 py-1 sm:py-2 rounded-full text-base sm:text-lg font-bold">
                          {feedback.score}%
                        </div>
                      </div>
                      
                      <div className="space-y-3 mb-4">
                        <div className="bg-white/50 p-3 rounded-lg">
                          <p className="text-purple-700 arabic-text text-sm sm:text-base">
                            <strong>🎵 الإيقاع:</strong> {feedback.rhythm}
                          </p>
                        </div>
                        <div className="bg-white/50 p-3 rounded-lg">
                          <p className="text-purple-700 arabic-text text-sm sm:text-base">
                            <strong>🗣️ النبرة والتعبير:</strong> {feedback.tone}
                          </p>
                        </div>
                        <div className="bg-white/50 p-3 rounded-lg">
                          <p className="text-purple-700 arabic-text text-sm sm:text-base">
                            <strong>💨 التنفس والوقفات:</strong> {feedback.breathing}
                          </p>
                        </div>
                      </div>

                      <div className="bg-yellow-50 border border-yellow-200 p-3 sm:p-4 rounded-lg">
                        <p className="text-yellow-900 font-bold arabic-text mb-2 text-sm sm:text-base">
                          💡 ملاحظات المعلم:
                        </p>
                        <p className="text-yellow-800 arabic-text text-sm sm:text-base leading-relaxed">
                          {feedback.feedback}
                        </p>
                      </div>
                    </div>
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
