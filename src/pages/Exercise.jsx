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
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// ✅ Supabase entities
import { Exercise as ExerciseEntity, Student, Recording } from "@/api/entities";

// ✅ تكامل الذكاء الاصطناعي + رفع الملفات (يمر عبر /api على Vercel)
import { UploadFile, InvokeLLM } from "@/api/integrations";

/* =========================================================
   ✅ Helpers: تطبيع النص العربي + تقدير نسبة التطابق
   الهدف: منع "0 دائمًا" بسبب اختلاف التشكيل/الترقيم/تنويعات الحروف
========================================================= */
function normalizeArabicText(input = "") {
  if (!input || typeof input !== "string") return "";
  return (
    input
      // إزالة التشكيل
      .replace(/[\u064B-\u0652\u0670]/g, "")
      // إزالة التطويل
      .replace(/\u0640/g, "")
      // توحيد أشكال الألف
      .replace(/[إأآا]/g, "ا")
      // توحيد الياء/الألف المقصورة
      .replace(/ى/g, "ي")
      // توحيد الهمزات على واو/ياء (تقريب)
      .replace(/ؤ/g, "و")
      .replace(/ئ/g, "ي")
      // إزالة الترقيم والرموز (نُبقي الحروف العربية والمسافات فقط)
      .replace(/[^\u0600-\u06FF\s]/g, " ")
      // مسافات زائدة
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

  // عدّ الكلمات المتوقعة الموجودة في المسموع (تقريبًا)
  const heardSet = new Set(heardWords);
  let matched = 0;
  for (const w of expWords) {
    if (heardSet.has(w)) matched++;
  }

  return matched / expWords.length; // 0..1
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

  // New Features State
  const [isFocusMode, setIsFocusMode] = useState(false);
  const [isPracticeMode, setIsPracticeMode] = useState(false);
  const [showQuiz, setShowQuiz] = useState(false);
  const [quizQuestions, setQuizQuestions] = useState([]);
  const [quizAnswers, setQuizAnswers] = useState({});
  const [quizScore, setQuizScore] = useState(null);
  const [isGeneratingQuiz, setIsGeneratingQuiz] = useState(false);

  // ✅ Progress gating
  const [analysisPassed, setAnalysisPassed] = useState(false); // قراءة صحيحة (score>0 و status=valid)
  const [mustRetry, setMustRetry] = useState(false); // يجب الإعادة (0 أو wrong/silence)
  const [lastRecordingId, setLastRecordingId] = useState(null); // لتعليم التسجيل أنه أتمّ الاختبار

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  // تحميل التمرين + الطالب
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

        // ✅ من Supabase عبر entities
        const exerciseData = await ExerciseEntity.get(exerciseId);
        setExercise(exerciseData);

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

    // ✅ تصفير كل ما له علاقة بالاختبار/المنع
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

      // 1️⃣ رفع الملف إلى Supabase Storage عبر UploadFile
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

      // 2️⃣ تحويل الصوت إلى نص عبر Vercel API (FormData كما يطلب /api/transcribe)
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

      // ✅ حساب نسبة تطابق تقريبية بعد التطبيع
      const expectedRaw = exercise.sentence || "";
      const expectedNorm = normalizeArabicText(expectedRaw);
      const heardNorm = normalizeArabicText(transcribedText);
      const matchRatio = wordMatchRatio(expectedRaw, transcribedText);

      // 3️⃣ التحليل عبر InvokeLLM (يمر عبر /api/llm)
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

      const analysisPrompt = `
أنت مقيّم لغوي خبير في اللغة العربية الفصحى، ومتخصص في تقييم القراءة الجهرية والنطق.

سيتم تزويدك بنصين:
1) النص الأصلي المطلوب من الطالب قراءته
2) النص الناتج عن تحويل صوت الطالب إلى نص

مهمتك هي تقييم القراءة بدقة وحياد، دون مجاملة أو تشدد غير مبرر.

====================
النص الأصلي:
"${expectedRaw}"

النص المقروء:
"${transcribedText}"

نسخ مطبّعة للمقارنة (بدون تشكيل أو ترقيم):
- expected_norm: "${expectedNorm}"
- heard_norm: "${heardNorm}"
- match_ratio: ${matchRatio}
====================

قواعد صفرية إلزامية:
- إذا كان النص المقروء فارغًا، أو غير مفهوم، أو يدل على صمت → الدرجة = 0
- إذا كان النص المقروء غير مرتبط بالنص الأصلي (match_ratio < 0.25) → الدرجة = 0
- إذا قرأ الطالب نصًا مختلفًا أو أعاد صياغته → الدرجة = 0

في غير ذلك:
قيّم الأداء فقط، وليس النية.

قواعد التقييم:
1) اكتمال النص:
- أقل من نصف النص → خصم كبير
- أكثر من نصف النص → خصم متوسط
- النص كامل → لا خصم للطول

2) مطابقة المعنى:
- حذف جمل مع بقاء المعنى العام → خصم متوسط
- تغيير المعنى → خصم كبير

3) الدقة اللغوية:
- أخطاء نطق بسيطة → خصم بسيط
- أخطاء متكررة → خصم متوسط
- أخطاء تؤثر على الفهم → خصم كبير

مقياس الدرجات (التزم به حرفيًا):
- 0 : صمت أو نص مختلف
- 40–55 : قراءة ضعيفة جدًا
- 55–70 : قراءة جزئية مفهومة
- 70–85 : قراءة جيدة
- 85–100 : قراءة ممتازة وقريبة جدًا من النص

لا تعطِ درجة مرتفعة لمجرد المحاولة.
ولا تُنقص الدرجة بشدة إذا كان النص واضحًا لكنه ناقص قليلًا.

أعد النتيجة بصيغة JSON فقط، بدون أي شرح خارجها، وبدون علامات تنسيق:

{
  "score": رقم من 0 إلى 100,
  "feedback": "تعليق مهني واضح يشرح سبب الدرجة وما الذي يجب تحسينه"
}
`;

      const analysisResponse = await InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: analysisSchema,
      });

      const aiAnalysis =
        typeof analysisResponse === "string"
          ? JSON.parse(analysisResponse)
          : analysisResponse;

      // نخزن رابط الصوت مع التحليل ليستفيد "وضع المرآة"
      setLastAnalysis({ ...aiAnalysis, audio_url: file_url });

      setAnalysisProgress(90);

      // 4️⃣ حفظ التسجيل والنتيجة في جدول recordings
      const recordingData = {
        student_id: student.id,
        exercise_id: exercise.id,
        audio_url: file_url,
        score: aiAnalysis.score,
        feedback: aiAnalysis.feedback,
        analysis_details: {
          ...aiAnalysis.analysis_details,
          ai_model: "Vercel API (/api/llm)",
          analyzed_at: new Date().toISOString(),

          // ✅ gating fields
          status: aiAnalysis.status,
          quiz_completed: false,

          // ✅ (اختياري) مفيد للتشخيص لاحقاً:
          match_ratio: matchRatio,
          expected_norm: expectedNorm,
          heard_norm: heardNorm,
          transcribed_text: transcribedText,
        },
      };

      const createdRecording = await Recording.create(recordingData);
      setLastRecordingId(createdRecording?.id || null);

      setAnalysisProgress(100);

      // 5️⃣ تحديث بيانات الطالب (نتركها كما هي)
      await Student.update(student.id, {
        last_activity: new Date().toISOString(),
        total_exercises: (student.total_exercises || 0) + 1,
        total_minutes: (student.total_minutes || 0) + 1,
      });

      setRecordingSubmitted(true);
      setIsSending(false);
      setIsAnalyzing(false);

      // ✅ Gate: لا اختبار ولا انتقال إذا صفر/خطأ نص/صمت
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

      // ✅ إذا نجح: لازم اختبار فهم (ولا ننتقل إلا بعده)
      await generateQuiz();
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
      const allExercises = await ExerciseEntity.list();
      if (!student || !exercise || allExercises.length === 0) return;

      const allRecordings = await Recording.list();

      // ✅ يعتبر التمرين مكتملًا فقط إذا score>0 و quiz_completed=true و status=valid
      const studentRecordings = allRecordings.filter((r) => {
        if (r.student_id !== student.id) return false;
        const score = Number(r.score || 0);
        const quizDone = r.analysis_details?.quiz_completed === true;
        const status = r.analysis_details?.status;
        return score > 0 && quizDone && status === "valid";
      });

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

        await Student.update(student.id, {
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
      const response = await InvokeLLM({
        prompt: `
بناءً على النص التالي: "${exercise.sentence}"
قم بإنشاء 3 أسئلة اختيار من متعدد (MCQ) لاختبار فهم الطالب للنص.

المخرجات JSON فقط بالشكل:
{
  "questions": [
    {
      "question": "نص السؤال",
      "options": ["خيار 1", "خيار 2", "خيار 3"],
      "correct_index": 0
    }
  ]
}
        `,
        response_json_schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            questions: {
              type: "array",
              items: {
                type: "object",
                additionalProperties: false,
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

    // ✅ علّم آخر تسجيل بأن الاختبار اكتمل
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

        {/* Focus Mode Overlay */}
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
                        اقرأ النص التالي بصوت واضح مع مراعاة تشكيل أواخر الكلمات
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
                                <Progress value={analysisProgress} className="h-3" />
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

                                {/* ✅ Controlled RadioGroup (يحل مشكلة عدم النقر) */}
                                <RadioGroup
                                  dir="rtl"
                                  value={
                                    quizAnswers[qIdx] !== undefined
                                      ? String(quizAnswers[qIdx])
                                      : undefined
                                  }
                                  onValueChange={(val) =>
                                    setQuizAnswers((prev) => ({
                                      ...prev,
                                      [qIdx]: parseInt(val, 10),
                                    }))
                                  }
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
                              disabled={quizQuestions.some(
                                (_, idx) => quizAnswers[idx] === undefined
                              )}
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
                                  {lastAnalysis.analysis_details?.rhythm || "جيد"}
                                </p>
                              </div>
                              <div className="bg-green-50 p-3 rounded-lg border border-green-100">
                                <p className="text-green-900 font-bold arabic-text">
                                  🗣️ النبرة:
                                </p>
                                <p className="text-green-700 arabic-text">
                                  {lastAnalysis.analysis_details?.tone || "واضحة"}
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
                              تم التحليل عبر Vercel API بدقة عالية
                            </p>
                          </motion.div>
                        )}

                        {/* ✅ إذا فشل: منع الاختبار والانتقال + إعادة التسجيل */}
                        {mustRetry && (
                          <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4 text-right">
                              <p className="text-red-700 arabic-text">
                                لا يمكنك الانتقال: يجب قراءة النص نفسه والحصول على
                                درجة فوق الصفر.
                              </p>
                              <Button onClick={retryRecording} className="mt-3 arabic-text">
                                إعادة التسجيل
                              </Button>
                            </CardContent>
                          </Card>
                        )}

                        <p className="text-xl text-indigo-700 arabic-text leading-relaxed">
                          تسجيلك محفوظ ووصل للمعلم للمراجعة والتقييم
                        </p>

                        {/* وضع المرآة */}
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
                                  lastAnalysis?.audio_url ||
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
                              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 ml-2"></div>
                              جارٍ تحضير الأسئلة...
                            </Button>
                          ) : quizQuestions.length > 0 && analysisPassed ? (
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
