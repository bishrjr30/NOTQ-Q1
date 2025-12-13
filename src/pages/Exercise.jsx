import React, { useState, useEffect, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Mic,
  Play,
  Square,
  ArrowLeft,
  Volume2,
  RotateCcw,
  Send,
  AlertTriangle,
  CheckCircle,
  Sparkles,
  Brain,
  Eye,
  EyeOff,
  Headphones,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

export default function ExercisePage() {
  const navigate = useNavigate();
  const location = useLocation();

  const [exercise, setExercise] = useState(null);
  const [student, setStudent] = useState(null);
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisProgress, setAnalysisProgress] = useState(0);
  const [recordingSubmitted, setRecordingSubmitted] = useState(false);
  const [error, setError] = useState(null);
  const [nextExercise, setNextExercise] = useState(null);
  const [lastAnalysis, setLastAnalysis] = useState(null);

  // New Features State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // تحميل التمرين + الطالب بناءً على الـ URL أو localStorage
  useEffect(() => {
    const load = async () => {
      try {
        setError(null);

        const params = new URLSearchParams(location.search);
        const exerciseId = params.get("id");
        const urlStudentId = params.get("studentId");
        const storedStudentId =
          typeof window !== "undefined"
            ? window.localStorage.getItem("studentId")
            : null;

        const finalStudentId = urlStudentId || storedStudentId;

        if (!exerciseId) {
          setError("لم يتم العثور على التمرين المطلوب.");
          return;
        }

        const exerciseData = await base44.entities.Exercise.get(exerciseId);
        setExercise(exerciseData);

        if (!finalStudentId) {
          // لو ما في طالب، نعيده لصفحة البداية / الإعداد
          navigate(createPageUrl("StudentOnboarding"));
          return;
        }

        const studentData = await base44.entities.Student.get(finalStudentId);
        setStudent(studentData);
      } catch (err) {
        console.error("Failed to load exercise:", err);
        setError("فشل في تحميل التمرين. يرجى إعادة المحاولة.");
      }
    };

    load();
  }, [location.search, navigate]);

  const startRecording = async () => {
    try {
      setError(null);
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
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType || "audio/webm";
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.onerror = (event) => {
        console.error("MediaRecorder error:", event.error);
        setError("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(
        "لم يتمكن من الوصول للميكروفون. يرجى التأكد من منح الإذن للموقع لاستخدام الميكروفون."
      );
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      setIsPlaying(true);

      audio.onended = () => setIsPlaying(false);
      audio.onerror = () => {
        setIsPlaying(false);
        setError("حدث خطأ أثناء تشغيل التسجيل.");
      };

      audio
        .play()
        .catch((err) => {
          setIsPlaying(false);
          setError("لم يتمكن من تشغيل التسجيل.");
          console.error("Audio play error:", err);
        });
    }
  };

  const retryRecording = () => {
    setAudioBlob(null);
    setRecordingSubmitted(false);
    setError(null);
    setAnalysisProgress(0);
  };

  const submitRecording = async () => {
    if (!audioBlob || !exercise || !student) {
      setError("خطأ: بيانات التمرين أو الطالب أو التسجيل غير مكتملة.");
      return;
    }

    setIsSending(true);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);

    try {
      // 0. جلب مفتاح OpenAI من الإعدادات (بدون تخزين مفتاح حقيقي في الكود)
      let OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || "";
      try {
        const settings = await base44.entities.SystemSetting.list();
        const keySetting = settings.find(
          (s) => s.key === "openai_api_key" && typeof s.value === "string"
        );
        if (keySetting && keySetting.value.startsWith("sk-")) {
          OPENAI_API_KEY = keySetting.value;
        }
      } catch (e) {
        console.warn("Could not load system key, using default placeholder");
      }

      // ...existing code...
      if (
        !OPENAI_API_KEY ||
        OPENAI_API_KEY === import.meta.env.VITE_OPENAI_API_KEY
      ) {
// ...existing code...
        throw new Error(
          "لم يتم إعداد مفتاح OpenAI API. يرجى من المعلم إضافة المفتاح في الإعدادات."
        );
      }

      const fileSizeKB = audioBlob.size / 1024;
      if (fileSizeKB < 2) {
        setError(
          "التسجيل فارغ أو قصير جداً. يرجى التأكد من التحدث بوضوح لمدة أطول قليلاً."
        );
        setIsSending(false);
        setIsAnalyzing(false);
        return;
      }

      setAnalysisProgress(10);

      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `recording_${student.name}_${timestamp}.webm`;

      const file = new File([audioBlob], fileName, {
        type: audioBlob.type || "audio/webm",
      });

      setAnalysisProgress(20);

      // 1. رفع الملف
      const uploadResult = await base44.integrations.Core.UploadFile({ file });
      if (!uploadResult || !uploadResult.file_url) {
        throw new Error("فشل في رفع الملف الصوتي.");
      }
      const file_url = uploadResult.file_url;

      setAnalysisProgress(40);

      // 2. التحويل إلى نص بـ Whisper
      const audioFile = new File([audioBlob], "recording.webm", {
        type: "audio/webm",
      });
      const formData = new FormData();
      formData.append("file", audioFile);
      formData.append("model", "whisper-1");
      formData.append("language", "ar");

      const transcriptionResponse = await fetch(
        "https://api.openai.com/v1/audio/transcriptions",
        {
          method: "POST",
          headers: { Authorization: `Bearer ${OPENAI_API_KEY}` },
          body: formData,
        }
      );

      if (!transcriptionResponse.ok) {
        const errText = await transcriptionResponse.text();
        if (
          transcriptionResponse.status === 429 ||
          errText.includes("insufficient_quota")
        ) {
          throw new Error(
            "⚠️ عذراً، تم تجاوز حد استخدام الذكاء الاصطناعي المجاني. يرجى من المعلم إضافة مفتاح API خاص في الإعدادات."
          );
        }
        throw new Error(`خطأ في خدمة تحويل الصوت (Whisper): ${errText}`);
      }

      const transcriptionData = await transcriptionResponse.json();
      const transcribedText = transcriptionData.text;

      setAnalysisProgress(70);

      // 3. التحليل بـ GPT-4o
      const analysisResponse = await fetch(
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
                content: `أنت خبير لغوي متخصص في اللغة العربية الفصحى وأحكام التجويد ومخارج الحروف. مهمتك تقييم تسجيل الطالب بدقة لغوية عالية:

              الحالات:
              1. صمت/غير مفهوم -> 0.0، تعليق: "لم نسمع قراءة..."
              2. نص مختلف -> 0.0، تعليق: "النص المقروء مختلف..."
              3. محاولة قراءة -> تقييم دقيق (مثلاً 87.5) بناءً على:
                 - صحة المخارج وصفات الحروف (30%)
                 - الالتزام بقواعد النحو وتشكيل أواخر الكلمات (30%)
                 - مطابقة الكلمات (30%)
                 - الطلاقة والأداء (10%)

              التعليق (Feedback) - يجب أن يكون باللغة العربية الفصحى ومشكولاً بالكامل (Full Tashkeel):
              1. ابدأ بمدح نقطة قوة محددة.
              2. ثم حدد خطأً لغوياً أو نحوياً وصححه.
              3. اختم بنصيحة لغوية للتحسين.
              `,
              },
              {
                role: "user",
                content: `
                النص الأصلي المطلوب قراءته: "${exercise.sentence}"
                النص الذي سمعه النظام (Whisper): "${transcribedText}"

                قم بالتحليل وإخراج JSON فقط:
                {
                  "score": number (float, e.g. 85.5),
                  "status": "valid" | "silence" | "wrong_text",
                  "feedback": "string (Arabic, Full Tashkeel)",
                  "analysis_details": {
                    "word_match_score": number,
                    "pronunciation_score": number,
                    "tashkeel_score": number,
                    "fluency_score": number,
                    "rhythm": "string",
                    "tone": "string",
                    "breathing": "string",
                    "suggestions": "string"
                  }
                }
              `,
              },
            ],
            response_format: { type: "json_object" },
          }),
        }
      );

      if (!analysisResponse.ok) {
        const errText = await analysisResponse.text();
        if (
          analysisResponse.status === 429 ||
          errText.includes("insufficient_quota")
        ) {
          throw new Error(
            "⚠️ عذراً، تم تجاوز حد استخدام الذكاء الاصطناعي المجاني. يرجى من المعلم إضافة مفتاح API خاص في الإعدادات."
          );
        }
        throw new Error(`خطأ في خدمة التحليل (GPT-4): ${errText}`);
      }

      const analysisData = await analysisResponse.json();
      const aiAnalysis = JSON.parse(
        analysisData.choices[0].message.content
      );

      setLastAnalysis(aiAnalysis);
      setAnalysisProgress(90);

      const recordingData = {
        student_id: student.id,
        exercise_id: exercise.id,
        audio_url: file_url,
        score: aiAnalysis.score,
        feedback: aiAnalysis.feedback,
        analysis_details: {
          ...aiAnalysis.analysis_details,
          ai_model: "OpenAI GPT-4o (Real)",
          analyzed_at: new Date().toISOString(),
        },
      };

      await base44.entities.Recording.create(recordingData);

      setAnalysisProgress(100);

      await base44.entities.Student.update(student.id, {
        last_activity: new Date().toISOString(),
        total_exercises: (student.total_exercises || 0) + 1,
        total_minutes: (student.total_minutes || 0) + 1,
      });

      setRecordingSubmitted(true);
      setIsSending(false);
      setIsAnalyzing(false);

      if (aiAnalysis && aiAnalysis.score > 50) {
        generateQuiz();
      } else {
        await loadNextExercise();
      }
    } catch (err) {
      console.error("Failed to submit recording:", err);
      let errorMessage = err.message || "خطأ غير معروف";

      if (
        errorMessage.includes("limit of integrations") ||
        errorMessage.includes("upgrade your plan")
      ) {
        errorMessage =
          "عذراً، وصل النظام إلى الحد الأقصى للاستخدام الشهري لهذا التطبيق. يرجى إبلاغ المعلم بذلك.";
      } else if (errorMessage.includes("quota")) {
        errorMessage =
          "عذراً، تم تجاوز حد استخدام الذكاء الاصطناعي. يرجى إبلاغ المعلم.";
      }

      setError(`فشل إرسال التسجيل: ${errorMessage}`);
      setIsSending(false);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const loadNextExercise = async () => {
    try {
      const allExercises = await base44.entities.Exercise.list();
      if (!student || !exercise || allExercises.length === 0) return;

      const allRecordings = await base44.entities.Recording.list();
      const studentRecordings = allRecordings.filter(
        (r) => r.student_id === student.id
      );
      const completedExerciseIds = studentRecordings.map((r) => r.exercise_id);

      const sameStageExercises = allExercises.filter(
        (ex) =>
          ex.level === exercise.level &&
          ex.stage === exercise.stage &&
          ex.id !== exercise.id &&
          !completedExerciseIds.includes(ex.id)
      );

      if (sameStageExercises.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * sameStageExercises.length
        );
        setNextExercise(sameStageExercises[randomIndex]);
      } else {
        const nextStage = exercise.stage + 1;
        await base44.entities.Student.update(student.id, {
          current_stage: nextStage,
        });

        const nextStageExercises = allExercises.filter(
          (ex) => ex.level === exercise.level && ex.stage === nextStage
        );

        if (nextStageExercises.length > 0) {
          const randomIndex = Math.floor(
            Math.random() * nextStageExercises.length
          );
          setNextExercise(nextStageExercises[randomIndex]);
        }
      }
    } catch (err) {
      console.error("Failed to load next exercise:", err);
    }
  };

  const generateQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const response = await base44.integrations.Core.InvokeLLM({
        prompt: `
              بناءً على النص التالي: "${exercise.sentence}"
              قم بإنشاء 3 أسئلة اختيار من متعدد (MCQ) لاختبار فهم الطالب للنص.

              المخرجات JSON فقط:
              [
                 {
                    "question": "نص السؤال",
                    "options": ["خيار 1", "خيار 2", "خيار 3"],
                    "correct_index": 0
                 }
              ]
           `,
        response_json_schema: {
          type: "object",
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  question: { type: "string" },
                  options: { type: "array", items: { type: "string" } },
                  correct_index: { type: "integer" },
                },
              },
            },
          },
        },
      });

      if (response && response.questions) {
        setQuizQuestions(response.questions);
      } else {
        await loadNextExercise();
      }
    } catch (e) {
      console.error("Quiz gen failed", e);
      await loadNextExercise();
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const submitQuiz = () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index) correct++;
    });
    const score = (correct / quizQuestions.length) * 100;
    setQuizScore(score);
    loadNextExercise();
  };

  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    window.speechSynthesis.speak(utterance);
  };

  const goToNextExercise = () => {
    if (nextExercise && student) {
      navigate(
        createPageUrl(`Exercise?id=${nextExercise.id}&studentId=${student.id}`)
      );
      // لا نستخدم window.location.reload، الـ useEffect سيحمّل التمرين الجديد تلقائياً
    }
  };

  if (!exercise || !student) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center arabic-text">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-indigo-700">جارٍ تحميل التمرين...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl("StudentDashboard")}>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all duration-300"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent arabic-text">
              تمرين النطق
            </h1>
            <p className="text-indigo-600 arabic-text">
              مستوى {exercise.level} - المرحلة {exercise.stage}
            </p>
          </div>
          <div className="mr-auto flex gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPracticeMode(!isPracticeMode)}
              className={`arabic-text ${
                isPracticeMode
                  ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                  : ""
              }`}
            >
              <Headphones className="w-4 h-4 ml-2" />
              {isPracticeMode ? "وضع التدريب مفعّل" : "تفعيل وضع التدريب"}
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFocusMode(!isFocusMode)}
              title="وضع التركيز"
            >
              {isFocusMode ? (
                <EyeOff className="w-5 h-5" />
              ) : (
                <Eye className="w-5 h-5" />
              )}
            </Button>
          </div>
        </motion.div>

        {/* Focus Mode Overlay Background */}
        {isFocusMode && <div className="fixed inset-0 bg-white z-40" />}

        <div
          className={
            isFocusMode
              ? "fixed inset-0 z-50 flex items-center justify-center bg-white p-6"
              : ""
          }
        >
          <div className={isFocusMode ? "w-full max-w-4xl" : ""}>
            {isFocusMode && (
              <Button
                variant="ghost"
                className="absolute top-6 right-6"
                onClick={() => setIsFocusMode(false)}
              >
                <EyeOff className="w-5 h-5 ml-2" />
                إلغاء التركيز
              </Button>
            )}

            {error && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                className="mb-6"
              >
                <Card className="border-red-200 bg-red-50">
                  <CardContent className="p-4 flex items-center gap-3">
                    <AlertTriangle className="w-5 h-5 text-red-500" />
                    <p className="text-red-700 arabic-text">{error}</p>
                  </CardContent>
                </Card>
              </motion.div>
            )}

            <AnimatePresence mode="wait">
              {!recordingSubmitted ? (
                <motion.div
                  key="exercise"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="space-y-8"
                >
                  <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm glow-effect">
                    <CardHeader className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl">
                      <CardTitle className="text-xl font-bold arabic-text">
                        اقرأ النص التالي بصوت واضح مع مراعاة تشكيل أواخر
                        الكلمات
                      </CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="text-center p-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl border-2 border-indigo-200">
                        <p
                          className={`text-3xl md:text-4xl font-bold text-indigo-900 arabic-text leading-relaxed mb-6 ${
                            isFocusMode ? "text-5xl leading-loose" : ""
                          }`}
                        >
                          {exercise.sentence}
                        </p>

                        {isPracticeMode && (
                          <div className="mb-6">
                            <Button
                              variant="secondary"
                              size="sm"
                              onClick={() => speakText(exercise.sentence)}
                              className="bg-yellow-100 text-yellow-900 hover:bg-yellow-200"
                            >
                              <Volume2 className="w-4 h-4 ml-2" />
                              استمع للنطق الصحيح
                            </Button>
                            <p className="text-xs text-yellow-700 mt-2 arabic-text">
                              💡 استمع جيداً وحاول التقليد قبل التسجيل
                            </p>
                          </div>
                        )}

                        <div className="flex items-center justify-center gap-4 flex-wrap">
                          <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-2 text-lg arabic-text shadow-lg">
                            {exercise.sentence.split(/\s+/).length} كلمة
                          </Badge>
                          <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-6 py-2 text-lg arabic-text shadow-lg">
                            {exercise.difficulty_points} نقطة
                          </Badge>
                        </div>
                      </div>
                    </CardContent>
                  </Card>

                  <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm glow-effect">
                    <CardContent className="p-8">
                      <div className="text-center space-y-6">
                        {!audioBlob ? (
                          <>
                            <div className="w-32 h-32 mx-auto">
                              <Button
                                onClick={
                                  isRecording ? stopRecording : startRecording
                                }
                                size="lg"
                                className={`w-full h-full rounded-full text-white shadow-2xl transition-all duration-300 glow-effect ${
                                  isRecording
                                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse"
                                    : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-110"
                                }`}
                              >
                                {isRecording ? (
                                  <Square className="w-12 h-12" />
                                ) : (
                                  <Mic className="w-12 h-12" />
                                )}
                              </Button>
                            </div>
                            <div>
                              <p className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent arabic-text mb-2">
                                {isRecording
                                  ? "جارٍ التسجيل..."
                                  : "اضغط للبدء في التسجيل"}
                              </p>
                              <p className="text-indigo-600 arabic-text">
                                {isRecording
                                  ? "اضغط مرة أخرى للتوقف"
                                  : "خذ وقتك - لا يوجد حد زمني"}
                              </p>
                              <div className="mt-4 bg-gradient-to-r from-blue-50 to-purple-50 rounded-lg p-4 border-2 border-blue-200">
                                <div className="flex items-center justify-center gap-2 mb-2">
                                  <CheckCircle className="w-5 h-5 text-blue-600" />
                                  <p className="font-bold text-blue-900 arabic-text">
                                    تقييم المعلم المتخصص
                                  </p>
                                </div>
                                <p className="text-sm text-blue-700 arabic-text">
                                  سيراجع المعلم تسجيلك بعناية ويعطيك تقييماً
                                  دقيقاً وتوجيهات مخصصة
                                </p>
                              </div>
                            </div>
                          </>
                        ) : (
                          <>
                            <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-8 border-2 border-indigo-200">
                              <div className="flex items-center justify-center gap-4 mb-4">
                                <Button
                                  onClick={playRecording}
                                  disabled={isPlaying}
                                  className="bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-8 py-4 shadow-lg glow-effect"
                                >
                                  {isPlaying ? (
                                    <Volume2 className="w-5 h-5 mr-2 animate-pulse" />
                                  ) : (
                                    <Play className="w-5 h-5 mr-2" />
                                  )}
                                  <span className="arabic-text">
                                    {isPlaying
                                      ? "يتم التشغيل..."
                                      : "استمع للتسجيل"}
                                  </span>
                                </Button>
                                <Button
                                  onClick={retryRecording}
                                  variant="outline"
                                  className="rounded-full px-8 py-4 border-2 border-indigo-300 hover:bg-indigo-50 shadow-lg"
                                >
                                  <RotateCcw className="w-5 h-5 mr-2" />
                                  <span className="arabic-text">
                                    إعادة التسجيل
                                  </span>
                                </Button>
                              </div>
                            </div>

                            {isAnalyzing && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                                  <p className="text-indigo-700 arabic-text font-semibold">
                                    جاري تحليل الصوت باستخدام CHAT GPT 5...
                                  </p>
                                </div>
                                <Progress
                                  value={analysisProgress}
                                  className="h-3"
                                />
                              </div>
                            )}

                            <Button
                              onClick={submitRecording}
                              disabled={isSending}
                              className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-12 py-6 rounded-2xl text-lg arabic-text shadow-2xl glow-effect"
                            >
                              {isSending ? (
                                <>
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                                  جارٍ الإرسال...
                                </>
                              ) : (
                                <>
                                  <Send className="w-5 h-5 mr-2" />
                                  إرسال للمعلم
                                </>
                              )}
                            </Button>
                          </>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ) : (
                <motion.div
                  key="submitted"
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                >
                  {showQuiz ? (
                    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm glow-effect">
                      <CardHeader className="text-center bg-gradient-to-r from-blue-500 to-cyan-600 text-white rounded-t-xl">
                        <CardTitle className="text-2xl font-bold arabic-text flex items-center justify-center gap-2">
                          <Brain className="w-8 h-8" />
                          اختبر فهمك للنص
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-8 space-y-6">
                        {quizScore === null ? (
                          <div className="space-y-6">
                            {quizQuestions.map((q, qIdx) => (
                              <div
                                key={qIdx}
                                className="bg-slate-50 p-4 rounded-xl border border-slate-200 text-right"
                              >
                                <p className="font-bold text-lg text-slate-900 mb-3 arabic-text">
                                  {q.question}
                                </p>
                                <RadioGroup
                                  onValueChange={(val) =>
                                    setQuizAnswers({
                                      ...quizAnswers,
                                      [qIdx]: parseInt(val, 10),
                                    })
                                  }
                                  dir="rtl"
                                >
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className="flex items-center space-x-2 space-x-reverse mb-2"
                                    >
                                      <RadioGroupItem
                                        value={oIdx.toString()}
                                        id={`q${qIdx}-o${oIdx}`}
                                      />
                                      <Label
                                        htmlFor={`q${qIdx}-o${oIdx}`}
                                        className="text-slate-700 arabic-text text-lg cursor-pointer"
                                      >
                                        {opt}
                                      </Label>
                                    </div>
                                  ))}
                                </RadioGroup>
                              </div>
                            ))}
                            <Button
                              onClick={submitQuiz}
                              disabled={
                                Object.keys(quizAnswers).length <
                                quizQuestions.length
                              }
                              className="w-full bg-gradient-to-r from-blue-600 to-cyan-600 text-white py-6 text-lg arabic-text"
                            >
                              تحقق من الإجابات
                            </Button>
                          </div>
                        ) : (
                          <div className="text-center space-y-6">
                            <div className="w-24 h-24 bg-blue-100 rounded-full flex items-center justify-center mx-auto">
                              <span className="text-3xl font-bold text-blue-700">
                                {Math.round(quizScore)}%
                              </span>
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 arabic-text">
                              {quizScore === 100
                                ? "ممتاز! فهم كامل للنص 🌟"
                                : "جيد جداً! استمر في المحاولة 👍"}
                            </h3>
                            <div className="flex justify-center">
                              {nextExercise && (
                                <Button
                                  onClick={goToNextExercise}
                                  className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-8 py-6 rounded-xl text-lg arabic-text shadow-lg"
                                >
                                  <Sparkles className="w-5 h-5 mr-2" />
                                  التمرين التالي
                                </Button>
                              )}
                            </div>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  ) : (
                    <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-sm glow-effect">
                      <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl">
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", duration: 0.6 }}
                          className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                        >
                          <CheckCircle className="w-12 h-12 text-white" />
                        </motion.div>
                        <CardTitle className="text-3xl font-bold arabic-text">
                          تم إرسال تسجيلك بنجاح! 🎉
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="text-center p-8 space-y-6">
                        {lastAnalysis && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-xl border-2 border-indigo-100 shadow-sm text-right w-full mb-6"
                          >
                            <h3 className="font-bold text-indigo-800 text-xl mb-4 arabic-text border-b pb-2">
                              📊 نتيجة التحليل (Chat GPT 5):
                            </h3>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <div className="bg-indigo-50 p-4 rounded-xl border border-indigo-200 text-center">
                                <p className="text-indigo-900 font-bold arabic-text mb-1">
                                  🎯 النتيجة النهائية
                                </p>
                                <p className="text-4xl font-bold text-indigo-700">
                                  {lastAnalysis.score}%
                                </p>
                              </div>
                              <div className="bg-purple-50 p-4 rounded-xl border border-purple-200">
                                <p className="text-purple-900 font-bold arabic-text mb-2">
                                  📝 النص الذي تم تقييمه:
                                </p>
                                <p className="text-purple-800 arabic-text text-sm leading-relaxed">
                                  "{exercise.sentence}"
                                </p>
                              </div>
                            </div>

                            <div className="space-y-4 mb-6">
                              <div className="bg-blue-50 p-3 rounded-lg border border-blue-100">
                                <p className="text-blue-900 font-bold arabic-text">
                                  🎵 الإيقاع:
                                </p>
                                <p className="text-blue-700 arabic-text">
                                  {lastAnalysis.analysis_details?.rhythm ||
                                    "جيد"}
                                </p>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                <p className="text-green-900 font-bold arabic-text">
                                  🗣️ النبرة:
                                </p>
                                <p className="text-green-700 arabic-text">
                                  {lastAnalysis.analysis_details?.tone ||
                                    "واضحة"}
                                </p>
                              </div>
                              <div className="bg-orange-50 p-3 rounded-lg border border-orange-100">
                                <p className="text-orange-900 font-bold arabic-text">
                                  💨 التنفس:
                                </p>
                                <p className="text-orange-700 arabic-text">
                                  {lastAnalysis.analysis_details?.breathing ||
                                    "منتظم"}
                                </p>
                              </div>
                            </div>

                            <div className="bg-yellow-50 p-4 rounded-lg border-2 border-yellow-200 mb-4">
                              <p className="text-yellow-900 font-bold arabic-text mb-2 text-lg">
                                💡 ملاحظات الذكاء الاصطناعي:
                              </p>
                              <p className="text-yellow-800 arabic-text text-lg leading-relaxed">
                                {lastAnalysis.feedback}
                              </p>
                              {lastAnalysis.analysis_details?.suggestions && (
                                <p className="text-yellow-700 arabic-text mt-2 pt-2 border-t border-yellow-200">
                                  <strong>كيفية التطوير:</strong>{" "}
                                  {lastAnalysis.analysis_details.suggestions}
                                </p>
                              )}
                            </div>

                            <p className="text-xs text-gray-400 text-center mt-4 arabic-text">
                              تم التحليل بواسطة Chat GPT 5 بدقة عالية
                            </p>
                          </motion.div>
                        )}

                        <p className="text-xl text-indigo-700 arabic-text leading-relaxed">
                          تسجيلك محفوظ ووصل للمعلم للمراجعة والتقييم
                        </p>

                        {/* Mirror Mode Section */}
                        <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 w-full mb-6">
                          <h4 className="font-bold text-slate-800 mb-3 arabic-text flex items-center justify-center gap-2">
                            <Headphones className="w-5 h-5" />
                            وضع المرآة (قارن نطقك)
                          </h4>
                          <div className="flex justify-center gap-4">
                            <Button
                              variant="outline"
                              onClick={() => {
                                const audio = new Audio(
                                  lastAnalysis.audio_url ||
                                    URL.createObjectURL(audioBlob)
                                );
                                audio.play();
                              }}
                              className="arabic-text"
                            >
                              <Play className="w-4 h-4 ml-2" />
                              اسمع صوتك
                            </Button>
                            <Button
                              variant="default"
                              onClick={() => speakText(exercise.sentence)}
                              className="arabic-text bg-indigo-600 hover:bg-indigo-700"
                            >
                              <Volume2 className="w-4 h-4 ml-2" />
                              اسمع النطق الصحيح
                            </Button>
                          </div>
                        </div>

                        <div className="flex gap-4 justify-center flex-wrap">
                          {isGeneratingQuiz ? (
                            <Button
                              disabled
                              className="bg-gray-100 text-gray-600 px-8 py-6 rounded-xl text-lg arabic-text border-2 border-gray-200"
                            >
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 mr-2"></div>
                              جارٍ تحضير الأسئلة...
                            </Button>
                          ) : quizQuestions.length > 0 ? (
                            <Button
                              onClick={() => setShowQuiz(true)}
                              className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-10 py-6 rounded-xl text-xl arabic-text shadow-xl animate-pulse"
                            >
                              <Brain className="w-6 h-6 mr-2" />
                              ابدأ اختبار الفهم
                            </Button>
                          ) : nextExercise ? (
                            <Button
                              onClick={goToNextExercise}
                              className="bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white px-8 py-6 rounded-xl text-lg arabic-text shadow-lg glow-effect"
                            >
                              <Sparkles className="w-5 h-5 mr-2" />
                              التمرين التالي
                            </Button>
                          ) : null}

                          <Link to={createPageUrl("StudentDashboard")}>
                            <Button
                              variant="outline"
                              className="px-8 py-6 rounded-xl text-lg arabic-text border-2"
                            >
                              <ArrowLeft className="w-5 h-5 mr-2" />
                              العودة للرئيسية
                            </Button>
                          </Link>
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>
    </div>
  );
}
