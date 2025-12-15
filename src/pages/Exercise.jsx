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

// ✅ AI + Upload (يمر عبر /api على Vercel)
import { UploadFile, InvokeLLM } from "@/api/integrations";

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

  // ✅ التحكم في التقدم
  const [requiresRetry, setRequiresRetry] = useState(false); // إذا 0 أو wrong_text/silence
  const [analysisPassed, setAnalysisPassed] = useState(false); // إذا الدرجة >0 و status=valid

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

    // ✅ مهم: تصفير كل حالات الاختبار/التحليل حتى لا “تعلق”
    setLastAnalysis(null);
    setNextExercise(null);

    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizScore(null);
    setIsGeneratingQuiz(false);

    setRequiresRetry(false);
    setAnalysisPassed(false);
  };

  // ✅ Fallback Quiz إذا فشل LLM (حتى لا تمنع الطالب بسبب عطل خارجي)
  const buildFallbackQuiz = (sentence) => {
    const words = String(sentence || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

    const w1 = words[0] || "—";
    const w2 = words[1] || w1;
    const wLast = words[words.length - 1] || w2;

    return [
      {
        question: "ما الكَلِمَةُ الأُولَى فِي النَّصِّ؟",
        options: [w1, w2, wLast].slice(0, 3),
        correct_index: 0,
      },
      {
        question: "ما الكَلِمَةُ الأَخِيرَةُ فِي النَّصِّ؟",
        options: [wLast, w1, w2].slice(0, 3),
        correct_index: 0,
      },
      {
        question: "كَمْ عَدَدُ كَلِمَاتِ النَّصِّ؟",
        options: [
          String(words.length),
          String(Math.max(1, words.length - 1)),
          String(words.length + 1),
        ],
        correct_index: 0,
      },
    ];
  };

  const generateQuiz = async () => {
    setIsGeneratingQuiz(true);
    try {
      const quizSchema = {
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
      };

      const response = await InvokeLLM({
        prompt: `
بناءً على النَّصِّ التَّالِي: "${exercise.sentence}"
اِصْنَعْ 3 أَسْئِلَةِ اخْتِيَارٍ مِنْ مُتَعَدِّدٍ (MCQ) لِاخْتِبَارِ فَهْمِ الطَّالِبِ لِلنَّصِّ.

اَلْمَخْرَجُ: JSON فَقَط بِالشَّكْلِ:
{
  "questions": [
    {
      "question": "نَصُّ السُّؤَالِ",
      "options": ["خِيَارٌ 1", "خِيَارٌ 2", "خِيَارٌ 3"],
      "correct_index": 0
    }
  ]
}
        `,
        response_json_schema: quizSchema,
      });

      const data = typeof response === "string" ? JSON.parse(response) : response;

      if (data && Array.isArray(data.questions) && data.questions.length > 0) {
        setQuizQuestions(data.questions);
        return;
      }

      // fallback
      setQuizQuestions(buildFallbackQuiz(exercise.sentence));
    } catch (e) {
      console.error("Quiz gen failed", e);
      setQuizQuestions(buildFallbackQuiz(exercise.sentence));
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const loadNextExercise = async () => {
    try {
      const allExercises = await ExerciseEntity.list();
      if (!student || !exercise || allExercises.length === 0) return;

      const allRecordings = await Recording.list();

      // ✅ مهم جدًا: لا نعتبر التمرين “مكتمل” إذا الدرجة 0 أو أقل
      const studentRecordings = allRecordings.filter(
        (r) => r.student_id === student.id && Number(r.score || 0) > 0
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
        const randomIndex = Math.floor(Math.random() * sameStageExercises.length);
        setNextExercise(sameStageExercises[randomIndex]);
      } else {
        const nextStage = exercise.stage + 1;

        // ✅ يحدث فقط بعد اجتياز (درجة >0) + إكمال الاختبار
        await Student.update(student.id, { current_stage: nextStage });

        const nextStageExercises = allExercises.filter(
          (ex) => ex.level === exercise.level && ex.stage === nextStage
        );

        if (nextStageExercises.length > 0) {
          const randomIndex = Math.floor(Math.random() * nextStageExercises.length);
          setNextExercise(nextStageExercises[randomIndex]);
        }
      }
    } catch (err) {
      console.error("Failed to load next exercise:", err);
    }
  };

  const submitQuiz = async () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index) correct++;
    });

    const score = quizQuestions.length ? (correct / quizQuestions.length) * 100 : 0;
    setQuizScore(score);

    // ✅ الآن فقط نسمح بإحضار التمرين/المرحلة التالية
    await loadNextExercise();
  };

  const speakText = (text) => {
    if (typeof window === "undefined" || !window.speechSynthesis) return;
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = "ar-SA";
    window.speechSynthesis.speak(utterance);
  };

  const goToNextExercise = () => {
    // ✅ لا انتقال إذا لم يجتز التحليل أو لم يُكمل الاختبار
    if (!analysisPassed) {
      setError("لَا يُمْكِنُ الِانْتِقَالُ قَبْلَ أَنْ تُحَقِّقَ دَرَجَةً فَوْقَ الصِّفْرِ.");
      return;
    }
    if (quizQuestions.length > 0 && quizScore === null) {
      setError("يَجِبُ إِكْمَالُ اخْتِبَارِ الْفَهْمِ أَوَّلًا.");
      return;
    }

    if (nextExercise && student) {
      navigate(createPageUrl(`Exercise?id=${nextExercise.id}&studentId=${student.id}`));
    }
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

    // تصفير
    setRequiresRetry(false);
    setAnalysisPassed(false);
    setShowQuiz(false);
    setQuizQuestions([]);
    setQuizAnswers({});
    setQuizScore(null);
    setNextExercise(null);

    try {
      const fileSizeKB = audioBlob.size / 1024;
      if (fileSizeKB < 2) {
        setError("التسجيل فارغ أو قصير جداً. يرجى التحدث بوضوح لمدة أطول قليلاً.");
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

      // 1) Upload
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

      // 2) Transcribe عبر /api/transcribe (FormData)
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

      const transcriptionJson = await transcriptionResponse.json().catch(() => null);

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

      // 3) Analysis عبر /api/llm
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

      const analysisPrompt = `أَنْتَ خَبِيرٌ لُغَوِيٌّ مُتَخَصِّصٌ فِي اللُّغَةِ الْعَرَبِيَّةِ الْفُصْحَى وَمَخَارِجِ الْحُرُوفِ. قَيِّمْ قِرَاءَةَ الطَّالِبِ بِإِنْصَافٍ وَدِقَّةٍ.

مُلَاحَظَةٌ مُهِمَّةٌ: نَصُّ التَّحْوِيلِ مِنَ الصَّوْتِ (Whisper) قَدْ يَفْتَقِدُ التَّشْكِيلَ، فَلَا تُعَاقِبْ الطَّالِبَ عَلَى نَقْصِ التَّشْكِيلِ فِي Whisper، وَرَكِّزْ عَلَى:
- مُطَابَقَةِ الْكَلِمَاتِ وَالْمَعْنَى
- الطَّلَاقَةِ وَوُضُوحِ النُّطْق

الحَالَات:
1) صَمْت/غَيْرُ مَفْهُوم -> score = 0.0، status = "silence"
2) نَصٌّ مُخْتَلِفٌ بِوُضُوح -> score = 0.0، status = "wrong_text"
3) مُحَاوَلَةُ قِرَاءَةٍ لِلنَّصِّ نَفْسِهِ -> status = "valid" وَ score > 0

التَّعْلِيق (feedback): بِالْعَرَبِيَّةِ الْفُصْحَى وَمُشَكَّلًا بِالْكَامِلِ.

النَّصُّ الْأَصْلِيُّ: "${exercise.sentence}"
نَصُّ Whisper: "${transcribedText}"

أَعِدْ نَاتِجًا بِصِيغَةِ JSON فَقَط.`;

      const analysisResponse = await InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: analysisSchema,
      });

      const aiAnalysis =
        typeof analysisResponse === "string"
          ? JSON.parse(analysisResponse)
          : analysisResponse;

      const scoreNum = Number(aiAnalysis?.score || 0);
      const status = String(aiAnalysis?.status || "");

      // نخزن رابط الصوت مع التحليل ليستفيد "وضع المرآة"
      setLastAnalysis({ ...aiAnalysis, audio_url: file_url });

      setAnalysisProgress(90);

      // 4) Save recording
      const recordingData = {
        student_id: student.id,
        exercise_id: exercise.id,
        audio_url: file_url,
        score: scoreNum,
        feedback: aiAnalysis.feedback,
        analysis_details: {
          ...aiAnalysis.analysis_details,
          ai_model: "Vercel API (/api/llm)",
          analyzed_at: new Date().toISOString(),
          status,
        },
      };

      await Recording.create(recordingData);

      // 5) Update student stats (حتى لو صفر، نحفظ نشاطه)
      await Student.update(student.id, {
        last_activity: new Date().toISOString(),
        total_exercises: (student.total_exercises || 0) + 1,
        total_minutes: (student.total_minutes || 0) + 1,
      });

      setAnalysisProgress(100);

      // ✅ شرط النجاح: الدرجة >0 و status valid
      const passed = scoreNum > 0 && status === "valid";
      setAnalysisPassed(passed);
      setRequiresRetry(!passed);

      setRecordingSubmitted(true);
      setIsSending(false);
      setIsAnalyzing(false);

      // ✅ إذا لم يجتز: لا اختبار ولا تمرين جديد
      if (!passed) {
        setShowQuiz(false);
        setQuizQuestions([]);
        setNextExercise(null);
        return;
      }

      // ✅ إذا اجتاز: لازم اختبار فهم قبل المرحلة التالية
      await generateQuiz();
    } catch (err) {
      console.error("Failed to submit recording:", err);
      const errorMessage = err?.message || "خطأ غير معروف";
      setError(`فشل إرسال التسجيل: ${errorMessage}`);
      setIsSending(false);
      setIsAnalyzing(false);
      setAnalysisProgress(0);
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
                isPracticeMode ? "bg-yellow-100 border-yellow-300 text-yellow-800" : ""
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
              {isFocusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>
        </motion.div>

        {isFocusMode && <div className="fixed inset-0 bg-white z-40" />}

        <div className={isFocusMode ? "fixed inset-0 z-50 flex items-center justify-center bg-white p-6" : ""}>
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
              <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} className="mb-6">
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
                                onClick={isRecording ? stopRecording : startRecording}
                                size="lg"
                                className={`w-full h-full rounded-full text-white shadow-2xl transition-all duration-300 glow-effect ${
                                  isRecording
                                    ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse"
                                    : "bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 hover:scale-110"
                                }`}
                              >
                                {isRecording ? <Square className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                              </Button>
                            </div>

                            <div>
                              <p className="text-xl font-semibold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent arabic-text mb-2">
                                {isRecording ? "جارٍ التسجيل..." : "اضغط للبدء في التسجيل"}
                              </p>
                              <p className="text-indigo-600 arabic-text">
                                {isRecording ? "اضغط مرة أخرى للتوقف" : "خذ وقتك - لا يوجد حد زمني"}
                              </p>
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
                                  <span className="arabic-text">{isPlaying ? "يتم التشغيل..." : "استمع للتسجيل"}</span>
                                </Button>

                                <Button
                                  onClick={retryRecording}
                                  variant="outline"
                                  className="rounded-full px-8 py-4 border-2 border-indigo-300 hover:bg-indigo-50 shadow-lg"
                                >
                                  <RotateCcw className="w-5 h-5 mr-2" />
                                  <span className="arabic-text">إعادة التسجيل</span>
                                </Button>
                              </div>
                            </div>

                            {isAnalyzing && (
                              <div className="space-y-3">
                                <div className="flex items-center justify-center gap-2">
                                  <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-indigo-500"></div>
                                  <p className="text-indigo-700 arabic-text font-semibold">
                                    جاري تحليل الصوت...
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

                                {/* ✅ FIX: RadioGroup controlled + functional setState */}
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
                                      [qIdx]: Number(val),
                                    }))
                                  }
                                >
                                  {q.options.map((opt, oIdx) => (
                                    <div
                                      key={oIdx}
                                      className="flex items-center gap-2 mb-2 cursor-pointer"
                                      onClick={() =>
                                        setQuizAnswers((prev) => ({
                                          ...prev,
                                          [qIdx]: oIdx,
                                        }))
                                      }
                                    >
                                      <RadioGroupItem
                                        value={String(oIdx)}
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
                                Object.keys(quizAnswers).length < quizQuestions.length
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
                              {quizScore === 100 ? "ممتاز! 🌟" : "جيد جداً! 👍"}
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
                        {/* ✅ رسالة منع التقدم */}
                        {requiresRetry && (
                          <Card className="border-red-200 bg-red-50">
                            <CardContent className="p-4 text-right">
                              <p className="text-red-800 arabic-text font-bold">
                                لَا يُمْكِنُ الِانْتِقَالُ: يَجِبُ أَنْ تَقْرَأَ النَّصَّ نَفْسَهُ وَتَحْصُلَ عَلَى دَرَجَةٍ فَوْقَ الصِّفْرِ.
                              </p>
                              <div className="mt-3 flex justify-end">
                                <Button
                                  onClick={retryRecording}
                                  className="bg-red-600 hover:bg-red-700 text-white arabic-text"
                                >
                                  أَعِدِ المُحَاوَلَةَ
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        )}

                        {lastAnalysis && (
                          <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="bg-white p-6 rounded-xl border-2 border-indigo-100 shadow-sm text-right w-full mb-6"
                          >
                            <h3 className="font-bold text-indigo-800 text-xl mb-4 arabic-text border-b pb-2">
                              📊 نتيجة التحليل:
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
                                  📝 النص:
                                </p>
                                <p className="text-purple-800 arabic-text text-sm leading-relaxed">
                                  "{exercise.sentence}"
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
                            </div>
                          </motion.div>
                        )}

                        {/* ✅ لا اختبار ولا انتقال إذا لم يجتز */}
                        <div className="flex gap-4 justify-center flex-wrap">
                          {analysisPassed ? (
                            isGeneratingQuiz ? (
                              <Button
                                disabled
                                className="bg-gray-100 text-gray-600 px-8 py-6 rounded-xl text-lg arabic-text border-2 border-gray-200"
                              >
                                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-gray-600 ml-2"></div>
                                جارٍ تحضير الأسئلة...
                              </Button>
                            ) : (
                              <Button
                                onClick={() => setShowQuiz(true)}
                                disabled={quizQuestions.length === 0}
                                className="bg-gradient-to-r from-indigo-600 to-blue-600 hover:from-indigo-700 hover:to-blue-700 text-white px-10 py-6 rounded-xl text-xl arabic-text shadow-xl animate-pulse"
                              >
                                <Brain className="w-6 h-6 mr-2" />
                                ابدأ اختبار الفهم
                              </Button>
                            )
                          ) : (
                            <Button
                              onClick={retryRecording}
                              className="bg-red-600 hover:bg-red-700 text-white px-10 py-6 rounded-xl text-xl arabic-text shadow-xl"
                            >
                              <RotateCcw className="w-6 h-6 mr-2" />
                              أعد التسجيل
                            </Button>
                          )}

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
