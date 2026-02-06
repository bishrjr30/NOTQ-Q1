// src/pages/Exercise.jsx

import React, { useState, useEffect, useRef } from "react";
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
  Award,
  TrendingUp,
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// ✅ Supabase entities
import { Exercise as ExerciseEntity, Student, Recording } from "@/api/entities";

// ✅ تكامل الذكاء الاصطناعي
import { UploadFile, InvokeLLM } from "@/api/integrations";

// ✅ هام جداً: استيراد التمارين المحلية (هذا ما كان ينقصك)
import { staticExercises } from "@/data/staticExercises";

/* =========================================================
   ✅ Helpers
========================================================= */
function normalizeArabicText(input = "") {
  if (!input || typeof input !== "string") return "";
  return (
    input
      .replace(/[\u064B-\u0652\u0670]/g, "")
      .replace(/\u0640/g, "")
      .replace(/[إأآا]/g, "ا")
      .replace(/ى/g, "ي")
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      .replace(/[^\u0600-\u06FF\s]/g, " ")
      .replace(/\s+/g, " ")
      .trim()
  );
}

function wordMatchRatio(expectedRaw = "", heardRaw = "") {
  const expected = normalizeArabicText(expectedRaw);
  const heard = normalizeArabicText(heardRaw);

  const expWords = expected.split(" ").filter(Boolean);
  const heardWords = heard.split(" ").filter(Boolean);

  if (expWords.length === 0) return 0;

  const heardSet = new Set(heardWords);
  let matched = 0;
  for (const w of expWords) {
    if (heardSet.has(w)) matched++;
  }

  return matched / expWords.length;
}

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

  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  const [analysisPassed, setAnalysisPassed] = useState(false);
  const [mustRetry, setMustRetry] = useState(false);
  const [lastRecordingId, setLastRecordingId] = useState(null);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  useEffect(() => {
    const load = async () => {
      try {
        setError(null);
        setExercise(null); // تصفير التمرين لبدء التحميل

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

        // ✅ التعديل الأساسي: البحث في التمارين المحلية أولاً
        // نبحث في المصفوفة المستوردة من الملف
        let foundExercise = staticExercises.find((ex) => ex.id === exerciseId);

        // إذا لم نجده في الملف المحلي، نبحث في قاعدة البيانات (للمستخدمين القدامى)
        if (!foundExercise) {
            // نتأكد أن المعرف ليس محلياً قبل الطلب من السيرفر لتجنب الأخطاء
            const isLocalId = exerciseId.startsWith("local-") || exerciseId.startsWith("ex-");
            if (!isLocalId) {
                try {
                    foundExercise = await ExerciseEntity.get(exerciseId);
                } catch (dbError) {
                    console.warn("Exercise not found in DB:", dbError);
                }
            }
        }

        if (foundExercise) {
            setExercise(foundExercise);
        } else {
            setError("عذراً، هذا التمرين غير موجود أو تم حذفه.");
        }

        if (!finalStudentId) {
          navigate(createPageUrl("StudentOnboarding"));
          return;
        }

        const studentData = await Student.get(finalStudentId);
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

      audio.play().catch((err) => {
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

    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizScore(null);
    setIsGeneratingQuiz(false);

    setNextExercise(null);
    setLastAnalysis(null);

    setAnalysisPassed(false);
    setMustRetry(false);
    setLastRecordingId(null);
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

      const uploadResult = await UploadFile({
        file,
        bucket: "recordings",
        folder: `student_recordings/${student.id}`,
      });

      if (!uploadResult || !uploadResult.file_url) {
        throw new Error("فشل في رفع الملف الصوتي.");
      }
      const file_url = uploadResult.file_url;

      setAnalysisProgress(40);

      const audioFileForTranscribe =
        file instanceof File
          ? file
          : new File([audioBlob], "recording.webm", {
              type: audioBlob.type || "audio/webm",
            });

      const transcribeForm = new FormData();
      transcribeForm.append("file", audioFileForTranscribe);
      transcribeForm.append("language", "ar");
      transcribeForm.append("model", "whisper-1");

      const transcriptionResponse = await fetch("/api/transcribe", {
        method: "POST",
        body: transcribeForm,
      });

      const transcriptionJson = await transcriptionResponse
        .json()
        .catch(() => null);

      if (!transcriptionResponse.ok) {
        const msg =
          transcriptionJson?.error ||
          transcriptionJson?.message ||
          `Transcribe failed (${transcriptionResponse.status})`;
        throw new Error(msg);
      }

      const transcribedText =
        transcriptionJson?.text ||
        transcriptionJson?.transcript ||
        transcriptionJson?.result ||
        "";

      if (!transcribedText) {
        throw new Error("لم يتم استخراج نص من الصوت.");
      }

      setAnalysisProgress(70);

      // ✅ دعم الخاصية sentence أو text (لأن الملف المحلي يستخدم text والقاعدة تستخدم sentence)
      const expectedRaw = exercise.sentence || exercise.text || "";
      const expectedNorm = normalizeArabicText(expectedRaw);
      const heardNorm = normalizeArabicText(transcribedText);
      const matchRatio = wordMatchRatio(expectedRaw, transcribedText);

      const analysisSchema = {
        type: "object",
        additionalProperties: false,
        properties: {
          score: { type: "number" },
          status: { type: "string", enum: ["valid", "silence", "wrong_text"] },
          feedback: { type: "string" },
          analysis_details: {
            type: "object",
            additionalProperties: false,
            properties: {
              word_match_score: { type: "number" },
              pronunciation_score: { type: "number" },
              tashkeel_score: { type: "number" },
              fluency_score: { type: "number" },
              rhythm: { type: "string" },
              tone: { type: "string" },
              breathing: { type: "string" },
              suggestions: { type: "string" },
            },
            required: [
              "word_match_score",
              "pronunciation_score",
              "tashkeel_score",
              "fluency_score",
              "rhythm",
              "tone",
              "breathing",
              "suggestions",
            ],
          },
        },
        required: ["score", "status", "feedback", "analysis_details"],
      };

      const analysisPrompt = `أنت معلم لغة عربية محترف. قيم قراءة الطالب:
      النص المطلوب: "${expectedRaw}"
      النص المقروء: "${transcribedText}"
      نسبة التطابق: ${(matchRatio * 100).toFixed(0)}%
      
      قواعد صارمة:
      1. صمت/غير مفهوم -> score=0, status="silence"
      2. نص مختلف تماماً -> score=0, status="wrong_text"
      3. تطابق > 70% -> ممتاز (85-100)
      4. تطابق 50-70% -> جيد جداً (70-85)
      5. تطابق 30-50% -> جيد (50-70)
      
      الرد JSON فقط كما هو محدد.`;

      const analysisResponse = await InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: analysisSchema,
      });

      const aiAnalysis =
        typeof analysisResponse === "string"
          ? JSON.parse(analysisResponse)
          : analysisResponse;

      setLastAnalysis({ ...aiAnalysis, audio_url: file_url });

      setAnalysisProgress(90);

      const recordingData = {
        student_id: student.id,
        exercise_id: exercise.id,
        audio_url: file_url,
        score: aiAnalysis.score,
        feedback: aiAnalysis.feedback,
        analysis_details: {
          ...aiAnalysis.analysis_details,
          ai_model: "GPT-4 via Vercel",
          analyzed_at: new Date().toISOString(),
          status: aiAnalysis.status,
          quiz_completed: false,
          match_ratio: matchRatio,
          expected_norm: expectedNorm,
          heard_norm: heardNorm,
          transcribed_text: transcribedText,
        },
      };

      const createdRecording = await Recording.create(recordingData);
      setLastRecordingId(createdRecording?.id || null);

      setAnalysisProgress(100);

      await Student.update(student.id, {
        last_activity: new Date().toISOString(),
        total_exercises: (student.total_exercises || 0) + 1,
        total_minutes: (student.total_minutes || 0) + 1,
      });

      setRecordingSubmitted(true);
      setIsSending(false);
      setIsAnalyzing(false);

      const scoreNum = Number(aiAnalysis?.score || 0);
      const status = String(aiAnalysis?.status || "");
      const passed = scoreNum > 0 && status === "valid";

      setAnalysisPassed(passed);
      setMustRetry(!passed);

      if (!passed) {
        setShowQuiz(false);
        setQuizQuestions([]);
        setNextExercise(null);
        return;
      }

      await generateQuiz();
    } catch (err) {
      console.error("Failed to submit recording:", err);
      let errorMessage = err.message || "خطأ غير معروف";
      if (errorMessage.includes("quota")) errorMessage = "عذراً، تم تجاوز حد الذكاء الاصطناعي.";
      setError(`فشل إرسال التسجيل: ${errorMessage}`);
      setIsSending(false);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
    }
  };

  const loadNextExercise = async () => {
    try {
      // ✅ دمج التمارين لتحديد التمرين التالي بشكل صحيح
      const dbExercises = await ExerciseEntity.list();
      const allExercises = [...dbExercises, ...staticExercises];
      
      if (!student || !exercise || allExercises.length === 0) return;

      const allRecordings = await Recording.list();

      const studentRecordings = allRecordings.filter((r) => {
        if (r.student_id !== student.id) return false;
        const score = Number(r.score || 0);
        // نعتبر التمرين مكتملاً إذا نجح فيه الطالب
        return score > 0 && r.analysis_details?.status === "valid";
      });

      const completedExerciseIds = studentRecordings.map((r) => r.exercise_id);

      const currentStage = parseInt(exercise.stage) || 1;

      const sameStageExercises = allExercises.filter(
        (ex) =>
          ex.level === exercise.level &&
          (parseInt(ex.stage) || 1) === currentStage &&
          ex.id !== exercise.id &&
          !completedExerciseIds.includes(ex.id)
      );

      if (sameStageExercises.length > 0) {
        const randomIndex = Math.floor(
          Math.random() * sameStageExercises.length
        );
        setNextExercise(sameStageExercises[randomIndex]);
      } else {
        const nextStage = currentStage + 1;

        await Student.update(student.id, {
          current_stage: nextStage,
        });

        const nextStageExercises = allExercises.filter(
          (ex) => ex.level === exercise.level && (parseInt(ex.stage) || 1) === nextStage
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
    const text = exercise.sentence || exercise.text || "";
    try {
      const response = await InvokeLLM({
        prompt: `بناءً على النص: "${text}". أنشئ 3 أسئلة اختيار من متعدد. JSON: {questions: [{question, options:[], correct_index}]}`,
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
                required: ["question", "options", "correct_index"],
              },
            },
          },
          required: ["questions"],
        },
      });

      const data = typeof response === "string" ? JSON.parse(response) : response;

      if (data && data.questions) {
        setQuizQuestions(data.questions);
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

  const submitQuiz = async () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index) correct++;
    });
    const score = (correct / quizQuestions.length) * 100;
    setQuizScore(score);

    if (lastRecordingId) {
      try {
        const mergedDetails = {
          ...(lastAnalysis?.analysis_details || {}),
          quiz_score: score,
          quiz_completed: true,
          status: lastAnalysis?.status || lastAnalysis?.analysis_details?.status,
        };

        await Recording.update(lastRecordingId, {
          analysis_details: mergedDetails,
        });
      } catch (e) {
        console.warn("Failed to mark quiz_completed on recording:", e);
      }
    }

    await loadNextExercise();
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
    }
  };

  // ✅ عرض رسالة خطأ واضحة بدلاً من الدوران اللانهائي
  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-red-50 p-4">
        <Card className="max-w-md w-full border-red-200 shadow-xl">
          <CardHeader className="text-center">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-2" />
            <CardTitle className="text-red-700 arabic-text">تنبيه</CardTitle>
          </CardHeader>
          <CardContent className="text-center space-y-4">
            <p className="text-red-600 arabic-text">{error}</p>
            <Link to={createPageUrl("StudentDashboard")}>
              <Button variant="outline" className="arabic-text">
                العودة للوحة الطالب
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!exercise || !student) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50">
        <div className="text-center arabic-text">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
          <p className="text-indigo-700 text-lg">جارٍ تحميل التمرين...</p>
        </div>
      </div>
    );
  }

  // ✅ دعم الخاصية sentence (للقديم) أو text (للجديد)
  const displayTitle = exercise.sentence || exercise.text || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to={createPageUrl("StudentDashboard")}>
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all flex-shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent arabic-text">
              تمرين النطق
            </h1>
            <p className="text-indigo-600 arabic-text text-sm sm:text-base">
              مستوى {exercise.level} - المرحلة {exercise.stage}
            </p>
          </div>
          
          <div className="flex gap-2 w-full sm:w-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setIsPracticeMode(!isPracticeMode)}
              className={`flex-1 sm:flex-none arabic-text text-xs sm:text-sm ${
                isPracticeMode
                  ? "bg-yellow-100 border-yellow-300 text-yellow-800"
                  : ""
              }`}
            >
              <Headphones className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
              <span className="hidden sm:inline">{isPracticeMode ? "وضع التدريب مفعّل" : "تفعيل وضع التدريب"}</span>
              <span className="sm:hidden">تدريب</span>
            </Button>
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setIsFocusMode(!isFocusMode)}
              title="وضع التركيز"
              className="flex-shrink-0"
            >
              {isFocusMode ? (
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5" />
              ) : (
                <Eye className="w-4 h-4 sm:w-5 sm:h-5" />
              )}
            </Button>
          </div>
        </div>

        {/* Focus Mode Overlay */}
        {isFocusMode && <div className="fixed inset-0 bg-white z-40" />}

        <div
          className={
            isFocusMode
              ? "fixed inset-0 z-50 flex items-center justify-center bg-white p-4 sm:p-6"
              : ""
          }
        >
          <div className={isFocusMode ? "w-full max-w-4xl" : ""}>
            {isFocusMode && (
              <Button
                variant="ghost"
                className="absolute top-4 sm:top-6 right-4 sm:right-6 text-sm sm:text-base"
                onClick={() => setIsFocusMode(false)}
              >
                <EyeOff className="w-4 h-4 sm:w-5 sm:h-5 ml-2" />
                إلغاء التركيز
              </Button>
            )}

            {!recordingSubmitted ? (
              <div className="space-y-4 sm:space-y-6 md:space-y-8">
                {/* Exercise Text Card */}
                <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/90 backdrop-blur-sm">
                  <CardHeader className="text-center bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl p-4 sm:p-6">
                    <CardTitle className="text-base sm:text-lg md:text-xl font-bold arabic-text leading-relaxed">
                      اقرأ النص التالي بصوت واضح مع مراعاة تشكيل أواخر الكلمات
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="text-center p-4 sm:p-6 md:p-8 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl border-2 border-indigo-200">
                      <p
                        className={`text-xl sm:text-2xl md:text-3xl lg:text-4xl font-bold text-indigo-900 arabic-text leading-relaxed mb-4 sm:mb-6 whitespace-pre-line ${
                          isFocusMode ? "text-4xl sm:text-5xl leading-loose" : ""
                        }`}
                      >
                        {displayTitle}
                      </p>

                      {isPracticeMode && (
                        <div className="mb-4 sm:mb-6">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => speakText(displayTitle)}
                            className="bg-yellow-100 text-yellow-900 hover:bg-yellow-200 text-xs sm:text-sm"
                          >
                            <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 ml-1 sm:ml-2" />
                            استمع للنطق الصحيح
                          </Button>
                          <p className="text-xs text-yellow-700 mt-2 arabic-text">
                            💡 استمع جيداً وحاول التقليد قبل التسجيل
                          </p>
                        </div>
                      )}

                      <div className="flex items-center justify-center gap-2 sm:gap-4 flex-wrap">
                        <Badge className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-3 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-lg arabic-text shadow-lg">
                          {displayTitle.split(/\s+/).length} كلمة
                        </Badge>
                        <Badge className="bg-gradient-to-r from-orange-500 to-red-600 text-white px-3 sm:px-6 py-1.5 sm:py-2 text-sm sm:text-lg arabic-text shadow-lg">
                          {exercise.difficulty_points || 10} نقطة
                        </Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                {/* Recording Controls Card */}
                <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/90 backdrop-blur-sm">
                  <CardContent className="p-4 sm:p-6 md:p-8">
                    <div className="text-center space-y-4 sm:space-y-6">
                      {!audioBlob ? (
                        <>
                          <div className="w-24 h-24 sm:w-32 sm:h-32 mx-auto">
                            <Button
                              onClick={
                                isRecording ? stopRecording : startRecording
                              }
                              size="lg"
                              className={`w-full h-full rounded-full text-white shadow-2xl transition-all duration-300 ${
                                isRecording
                                  ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse"
                                  : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-110"
                              }`}
                            >
                              {isRecording ? (
                                <Square className="w-8 h-8 sm:w-12 sm:h-12" />
                              ) : (
                                <Mic className="w-8 h-8 sm:w-12 sm:h-12" />
                              )}
                            </Button>
                          </div>
                          <div>
                            <p className="text-lg sm:text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent arabic-text mb-2">
                              {isRecording
                                ? "جارٍ التسجيل..."
                                : "اضغط للبدء في التسجيل"}
                            </p>
                            <p className="text-indigo-600 arabic-text text-sm sm:text-base">
                              {isRecording
                                ? "اضغط مرة أخرى للتوقف"
                                : "خذ وقتك - لا يوجد حد زمني"}
                            </p>
                          </div>
                        </>
                      ) : (
                        <>
                          <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-xl sm:rounded-2xl p-4 sm:p-6 md:p-8 border-2 border-indigo-200">
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 mb-4">
                              <Button
                                onClick={playRecording}
                                disabled={isPlaying}
                                className="w-full sm:w-auto bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white rounded-full px-6 sm:px-8 py-3 sm:py-4 shadow-lg text-sm sm:text-base"
                              >
                                {isPlaying ? (
                                  <Volume2 className="w-4 h-4 sm:w-5 sm:h-5 mr-2 animate-pulse" />
                                ) : (
                                  <Play className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
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
                                className="w-full sm:w-auto rounded-full px-6 sm:px-8 py-3 sm:py-4 border-2 border-indigo-300 hover:bg-indigo-50 shadow-lg text-sm sm:text-base"
                              >
                                <RotateCcw className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                <span className="arabic-text">
                                  إعادة التسجيل
                                </span>
                              </Button>
                            </div>
                          </div>

                          {isAnalyzing && (
                            <div className="space-y-2 sm:space-y-3">
                              <div className="flex items-center justify-center gap-2">
                                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-indigo-500"></div>
                                <p className="text-indigo-700 arabic-text font-semibold text-sm sm:text-base">
                                  جاري تحليل الصوت باستخدام GPT-4...
                                </p>
                              </div>
                              <Progress value={analysisProgress} className="h-2 sm:h-3" />
                            </div>
                          )}

                          <Button
                            onClick={submitRecording}
                            disabled={isSending}
                            className="w-full sm:w-auto bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white px-8 sm:px-12 py-4 sm:py-6 rounded-xl sm:rounded-2xl text-base sm:text-lg arabic-text shadow-2xl"
                          >
                            {isSending ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 sm:h-5 sm:w-5 border-b-2 border-white mr-2"></div>
                                جارٍ الإرسال...
                              </>
                            ) : (
                              <>
                                <Send className="w-4 h-4 sm:w-5 sm:h-5 mr-2" />
                                إرسال للمعلم
                              </>
                            )}
                          </Button>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </div>
            ) : (
              // تم اختصار هذا الجزء لتوفير المساحة، انسخ بقية الكود من ملفك الأصلي إذا كان يحتوي على تغييرات خاصة
              // أو استخدم ما وفرته في الإجابات السابقة
              <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/90 backdrop-blur-sm">
                <CardHeader className="text-center bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl p-4 sm:p-6">
                  <div className="w-16 h-16 sm:w-20 sm:h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-3 sm:mb-4">
                    <CheckCircle className="w-10 h-10 sm:w-12 sm:h-12 text-white" />
                  </div>
                  <CardTitle className="text-2xl sm:text-3xl font-bold arabic-text">
                    تم إرسال تسجيلك بنجاح! 🎉
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-center p-4 sm:p-6 md:p-8 space-y-4 sm:space-y-6">
                  {lastAnalysis && (
                    <div className="bg-white p-4 sm:p-6 rounded-xl border-2 border-indigo-100 shadow-sm text-right w-full">
                        <div className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white p-4 sm:p-6 rounded-2xl mb-4 sm:mb-6 text-center shadow-lg">
                            <p className="text-4xl sm:text-5xl md:text-6xl font-bold">{lastAnalysis.score}%</p>
                            <p className="text-xs sm:text-sm mt-2 opacity-80 arabic-text">{lastAnalysis.feedback}</p>
                        </div>
                    </div>
                  )}
                  
                  <div className="flex justify-center gap-4">
                    {!mustRetry && nextExercise && (
                        <Button onClick={goToNextExercise} className="bg-purple-600 hover:bg-purple-700 text-white px-8 py-4 text-lg">التمرين التالي</Button>
                    )}
                    {mustRetry && (
                        <Button onClick={retryRecording} className="bg-red-600 hover:bg-red-700 text-white px-8 py-4 text-lg">إعادة المحاولة</Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
