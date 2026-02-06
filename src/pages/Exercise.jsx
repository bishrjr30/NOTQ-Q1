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
  ChevronRight,
  ThumbsUp,
  ThumbsDown,
  Star
} from "lucide-react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Progress } from "@/components/ui/progress";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";

// ✅ Supabase entities
import { Exercise as ExerciseEntity, Student, Recording } from "@/api/entities";

// ✅ Integrations
import { UploadFile, InvokeLLM } from "@/api/integrations";

// ✅ Local Exercises
import { staticExercises } from "@/data/staticExercises";

/* ================= Helpers ================= */
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
        setExercise(null); 

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

        // 1. البحث في التمارين المحلية
        let foundExercise = staticExercises.find((ex) => ex.id === exerciseId);

        // 2. البحث في قاعدة البيانات إذا لم يوجد محلياً
        if (!foundExercise) {
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

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Error accessing microphone:", err);
      setError(
        "لم يتمكن من الوصول للميكروفون. يرجى التأكد من منح الإذن للموقع."
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
      audio.play().catch((err) => {
        setIsPlaying(false);
        setError("لم يتمكن من تشغيل التسجيل.");
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
      setError("خطأ: بيانات غير مكتملة.");
      return;
    }

    setIsSending(true);
    setIsAnalyzing(true);
    setAnalysisProgress(0);
    setError(null);

    try {
      if (audioBlob.size / 1024 < 2) {
        throw new Error("التسجيل قصير جداً.");
      }

      setAnalysisProgress(10);
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const fileName = `recording_${student.name}_${timestamp}.webm`;
      const file = new File([audioBlob], fileName, { type: audioBlob.type || "audio/webm" });

      setAnalysisProgress(20);
      const uploadResult = await UploadFile({
        file,
        bucket: "recordings",
        folder: `student_recordings/${student.id}`,
      });

      if (!uploadResult?.file_url) throw new Error("فشل رفع الملف.");
      const file_url = uploadResult.file_url;

      setAnalysisProgress(40);
      const audioFileForTranscribe = file;
      const transcribeForm = new FormData();
      transcribeForm.append("file", audioFileForTranscribe);
      transcribeForm.append("language", "ar");
      transcribeForm.append("model", "whisper-1");

      const transcriptionResponse = await fetch("/api/transcribe", { method: "POST", body: transcribeForm });
      const transcriptionJson = await transcriptionResponse.json().catch(() => null);
      const transcribedText = transcriptionJson?.text || "";

      if (!transcribedText) throw new Error("لم يتم سماع أي صوت.");

      setAnalysisProgress(70);
      const expectedRaw = exercise.sentence || exercise.text || "";
      const expectedNorm = normalizeArabicText(expectedRaw);
      const heardNorm = normalizeArabicText(transcribedText);
      const matchRatio = wordMatchRatio(expectedRaw, transcribedText);

      // ✅ التعديل هنا: Prompt مفصل وواقعي (AI عادل ومشجع)
      const analysisPrompt = `
      أنت معلم لغة عربية متميز وداعم، تهدف لتعليم الطلاب النطق الصحيح بأسلوب مشجع وواقعي.

      **المهمة:**
      تحليل تسجيل صوتي لطالب يقرأ النص التالي.
      النص المطلوب: "${expectedRaw}"
      النص المسموع (تقريباً): "${transcribedText}"
      نسبة التطابق التقريبية: ${(matchRatio * 100).toFixed(0)}%

      **معايير التقييم (كن واقعياً ومتوسط الصرامة):**
      1. **الدرجة (Score):** امنح درجة تعكس الجهد والوضوح.
         - قراءة ممتازة (حتى مع أخطاء بسيطة جداً): 90-100.
         - قراءة جيدة ومفهومة (أخطاء تشكيل أو كلمة): 75-89.
         - قراءة مقبولة (أخطاء متعددة لكن المعنى واضح): 50-74.
         - قراءة غير صحيحة أو نص مختلف: أقل من 50.
         - صمت تام: 0.

      2. **التعليق (Feedback):**
         - يجب أن يكون باللغة العربية، متوسط الطول (3-4 جمل)، وبنبرة محفزة.
         - ابدأ بمدح واضح.
         - اذكر **نقاط القوة** (مثلاً: وضوح الصوت، نطق حروف معينة).
         - اذكر **نقاط الضعف/التحسين** بلطف (مثلاً: الانتباه للمدود، التشكيل في كلمة كذا).
         - اختم بتشجيع.

      **المطلوب إرجاع JSON فقط:**
      {
        "score": number,
        "status": "valid" | "silence" | "wrong_text",
        "feedback": "نص التعليق المفصل...",
        "analysis_details": {
          "word_match_score": number,
          "pronunciation_score": number,
          "tashkeel_score": number,
          "fluency_score": number,
          "rhythm": "string",
          "tone": "string",
          "breathing": "string",
          "suggestions": "نصيحة قصيرة ومفيدة"
        }
      }
      `;

      const analysisResponse = await InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
            type: "object",
            properties: {
                score: {type: "number"},
                status: {type: "string"},
                feedback: {type: "string"},
                analysis_details: {type: "object"}
            },
            required: ["score", "status", "feedback"]
        },
      });

      const aiAnalysis = typeof analysisResponse === "string" ? JSON.parse(analysisResponse) : analysisResponse;
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
          ai_model: "GPT-4",
          status: aiAnalysis.status,
          quiz_completed: false,
          match_ratio: matchRatio,
          transcribed_text: transcribedText,
        },
      };

      // محاولة الحفظ في قاعدة البيانات
      let createdRecording = null;
      try {
        createdRecording = await Recording.create(recordingData);
        setLastRecordingId(createdRecording?.id || null);
      } catch (dbErr) {
        console.warn("DB Save Error:", dbErr);
      }

      setAnalysisProgress(100);

      await Student.update(student.id, {
        last_activity: new Date().toISOString(),
        total_exercises: (student.total_exercises || 0) + 1,
      });

      setRecordingSubmitted(true);
      setIsSending(false);
      setIsAnalyzing(false);

      const scoreNum = Number(aiAnalysis?.score || 0);
      const passed = scoreNum > 0 && aiAnalysis?.status === "valid";

      setAnalysisPassed(passed);
      setMustRetry(!passed);

      // تحميل التمرين التالي
      await loadNextExercise();

      if (passed) {
        generateQuiz();
      }
    } catch (err) {
      console.error("Submission error:", err);
      let msg = err.message;
      if (msg.includes("uuid")) msg = "حدث خطأ تقني. لكن نتيجتك ظهرت!";
      setError(`تنبيه: ${msg}`);
      setIsSending(false);
      setIsAnalyzing(false);
    }
  };

  const loadNextExercise = async () => {
    try {
      const dbExercises = await Exercise.list();
      const allExercises = [...dbExercises, ...staticExercises];
      
      if (!student || !exercise || allExercises.length === 0) return;

      const currentStage = parseInt(exercise.stage) || 1;
      
      // منطق اختيار التمرين التالي: نفس المرحلة (لم يحل بعد) أو المرحلة التالية
      const sameStageCandidates = allExercises.filter(ex => 
        (parseInt(ex.stage) || 1) === currentStage && ex.id !== exercise.id
      );

      const nextStageCandidates = allExercises.filter(ex => 
        (parseInt(ex.stage) || 1) === currentStage + 1
      );

      let nextEx = null;

      if (sameStageCandidates.length > 0) {
        nextEx = sameStageCandidates[Math.floor(Math.random() * sameStageCandidates.length)];
      } else if (nextStageCandidates.length > 0) {
        nextEx = nextStageCandidates[0];
        await Student.update(student.id, { current_stage: currentStage + 1 });
      }

      setNextExercise(nextEx);

    } catch (err) {
      console.error("Failed to load next exercise:", err);
    }
  };

  const generateQuiz = async () => {
    setIsGeneratingQuiz(true);
    const text = exercise.sentence || exercise.text || "";
    try {
      const response = await InvokeLLM({
        prompt: `نص: "${text}". أنشئ 3 أسئلة اختيار من متعدد بسيطة جداً للأطفال. JSON: {questions: [{question, options:[], correct_index}]}`,
        response_json_schema: { type: "object", properties: { questions: { type: "array" } } }
      });
      const data = typeof response === "string" ? JSON.parse(response) : response;
      if (data?.questions) setQuizQuestions(data.questions);
    } catch (e) {
      console.error(e);
    } finally {
      setIsGeneratingQuiz(false);
    }
  };

  const submitQuiz = async () => {
    let correct = 0;
    quizQuestions.forEach((q, idx) => {
      if (quizAnswers[idx] === q.correct_index) correct++;
    });
    setQuizScore((correct / quizQuestions.length) * 100);
    if (lastRecordingId) {
        try {
            await Recording.update(lastRecordingId, { 
                analysis_details: { ...(lastAnalysis?.analysis_details || {}), quiz_completed: true, quiz_score: (correct / quizQuestions.length) * 100 } 
            });
        } catch(e) {}
    }
  };

  const speakText = (text) => {
    if (typeof window !== "undefined" && window.speechSynthesis) {
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.lang = "ar-SA";
        window.speechSynthesis.speak(utterance);
    }
  };

  const goToNextExercise = () => {
    if (nextExercise && student) {
      window.location.href = createPageUrl(`Exercise?id=${nextExercise.id}&studentId=${student.id}`);
    }
  };

  // Error View
  if (error && !recordingSubmitted) {
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
              <Button variant="outline" className="arabic-text">العودة للوحة الطالب</Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  // Loading View
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

  const displayTitle = exercise.sentence || exercise.text || "";

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 sm:p-4 md:p-6">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Link to={createPageUrl("StudentDashboard")}>
            <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white/80 backdrop-blur-sm">
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
            <Button variant="outline" size="sm" onClick={() => setIsPracticeMode(!isPracticeMode)} className={`flex-1 sm:flex-none arabic-text ${isPracticeMode ? "bg-yellow-100" : ""}`}>
              <Headphones className="w-4 h-4 ml-2" /> {isPracticeMode ? "تدريب" : "تدريب"}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => setIsFocusMode(!isFocusMode)}>
                {isFocusMode ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Content */}
        <div className={isFocusMode ? "fixed inset-0 z-50 bg-white p-6 flex items-center justify-center" : ""}>
            <div className={isFocusMode ? "w-full max-w-4xl" : ""}>
                {isFocusMode && <Button variant="ghost" className="absolute top-6 right-6" onClick={() => setIsFocusMode(false)}><EyeOff className="ml-2" /> خروج</Button>}
                
                {!recordingSubmitted ? (
                    <div className="space-y-6">
                        <Card className="border-0 shadow-xl bg-white/90">
                            <CardContent className="p-8 text-center">
                                <p className={`text-3xl font-bold text-indigo-900 arabic-text mb-6 whitespace-pre-line leading-relaxed ${isFocusMode ? "text-5xl" : ""}`}>
                                    {displayTitle}
                                </p>
                                {isPracticeMode && (
                                    <Button variant="secondary" size="sm" onClick={() => speakText(displayTitle)} className="bg-yellow-100 text-yellow-900">
                                        <Volume2 className="w-4 h-4 ml-2" /> استمع للنطق
                                    </Button>
                                )}
                            </CardContent>
                        </Card>

                        <Card className="border-0 shadow-xl bg-white/90">
                            <CardContent className="p-8 text-center">
                                {!audioBlob ? (
                                    <Button onClick={isRecording ? stopRecording : startRecording} size="lg" className={`w-24 h-24 rounded-full ${isRecording ? "bg-red-500 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700 shadow-xl hover:shadow-2xl transition-all"}`}>
                                        {isRecording ? <Square className="w-10 h-10 text-white" /> : <Mic className="w-10 h-10 text-white" />}
                                    </Button>
                                ) : (
                                    <div className="space-y-4">
                                        <div className="flex justify-center gap-4">
                                            <Button onClick={playRecording} variant="outline" className="rounded-full px-6"><Play className="ml-2" /> استمع</Button>
                                            <Button onClick={retryRecording} variant="outline" className="rounded-full px-6"><RotateCcw className="ml-2" /> إعادة</Button>
                                        </div>
                                        {isAnalyzing && <div className="text-indigo-600 arabic-text font-bold">جارٍ تحليل أدائك... <Progress value={analysisProgress} className="mt-2" /></div>}
                                        <Button onClick={submitRecording} disabled={isSending} className="w-full bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg shadow-lg rounded-xl">
                                            {isSending ? "جارٍ الإرسال..." : "إرسال للمعلم 🚀"}
                                        </Button>
                                    </div>
                                )}
                            </CardContent>
                        </Card>
                    </div>
                ) : (
                    // Result View
                    <Card className="border-0 shadow-xl bg-white/90 animate-in fade-in zoom-in duration-500">
                        <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl text-center p-6">
                            <CheckCircle className="w-12 h-12 mx-auto text-white mb-2" />
                            <CardTitle className="text-3xl arabic-text font-bold">أداء رائع! 🎉</CardTitle>
                        </CardHeader>
                        <CardContent className="p-4 sm:p-8 text-center space-y-6">
                             {lastAnalysis && (
                                <div className="space-y-6">
                                    {/* النتيجة والتعليق */}
                                    <div className="bg-gradient-to-br from-indigo-50 to-blue-50 p-6 rounded-2xl border-2 border-indigo-100 shadow-md text-right relative overflow-hidden">
                                        <div className="absolute top-0 left-0 p-4 opacity-10"><Star className="w-24 h-24 text-indigo-500"/></div>
                                        <div className="flex justify-between items-center mb-4 relative z-10">
                                            <Badge className={`text-lg px-4 py-1 ${lastAnalysis.score >= 85 ? "bg-green-500" : lastAnalysis.score >= 50 ? "bg-yellow-500" : "bg-red-500"}`}>
                                                الدرجة: {lastAnalysis.score}%
                                            </Badge>
                                            <span className="font-bold text-indigo-800 flex items-center gap-2"><Award className="w-5 h-5"/> تعليق المعلم</span>
                                        </div>
                                        <p className="text-lg text-slate-800 arabic-text leading-loose relative z-10 font-medium">
                                            {lastAnalysis.feedback}
                                        </p>
                                        
                                        {/* تفاصيل نقاط القوة والضعف */}
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6 relative z-10">
                                            <div className="bg-white p-3 rounded-xl border border-green-200 shadow-sm">
                                                <p className="font-bold text-green-700 flex items-center gap-2 mb-2"><ThumbsUp className="w-4 h-4"/> نقاط أبهرتني:</p>
                                                <p className="text-slate-600 text-sm">{lastAnalysis.analysis_details?.rhythm || "نبرة صوتك واضحة وجميلة"}</p>
                                            </div>
                                            <div className="bg-white p-3 rounded-xl border border-orange-200 shadow-sm">
                                                <p className="font-bold text-orange-700 flex items-center gap-2 mb-2"><TrendingUp className="w-4 h-4"/> همسة في أذنك:</p>
                                                <p className="text-slate-600 text-sm">{lastAnalysis.analysis_details?.suggestions || "ركز قليلاً على التشكيل"}</p>
                                            </div>
                                        </div>
                                    </div>
                                </div>
                             )}
                             
                             {mustRetry ? (
                                <div className="space-y-4">
                                    <p className="text-red-600 font-bold arabic-text">عذراً، لم نتمكن من سماعك بوضوح أو القراءة غير صحيحة. حاول مرة أخرى!</p>
                                    <Button onClick={retryRecording} className="w-full py-6 text-lg bg-red-600 hover:bg-red-700 shadow-md rounded-xl">
                                        <RotateCcw className="ml-2" /> إعادة المحاولة
                                    </Button>
                                </div>
                             ) : (
                                <div className="space-y-6">
                                    {/* أزرار الإجراءات - "التمرين التالي" بارز جداً */}
                                    <div className="flex flex-col gap-4">
                                        {nextExercise && (
                                            <Button onClick={goToNextExercise} className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white py-8 text-xl rounded-2xl shadow-xl transform transition-all hover:scale-105 hover:shadow-2xl">
                                                <Sparkles className="w-6 h-6 ml-3 animate-pulse" />
                                                الانتقال للتمرين التالي
                                                <ChevronRight className="w-6 h-6 mr-3" />
                                            </Button>
                                        )}
                                        
                                        {quizQuestions.length > 0 && !showQuiz && (
                                            <Button onClick={() => setShowQuiz(true)} variant="outline" className="w-full py-6 text-lg border-2 border-blue-200 text-blue-700 hover:bg-blue-50 rounded-xl">
                                                <Brain className="ml-2 w-5 h-5" /> أريد اختبار فهمي للنص (اختياري)
                                            </Button>
                                        )}
                                    </div>

                                    {/* قسم الاختبار الاختياري */}
                                    {showQuiz && (
                                        <div className="mt-8 text-right bg-slate-50 p-6 rounded-2xl border-2 border-slate-200 animate-in slide-in-from-bottom-4">
                                            <h3 className="font-bold text-xl mb-4 text-slate-800 border-b pb-2">🧠 اختبار الفهم السريع</h3>
                                            {quizScore === null ? (
                                                <div className="space-y-6">
                                                    {quizQuestions.map((q, i) => (
                                                        <div key={i} className="pb-4">
                                                            <p className="font-bold mb-3 text-lg text-indigo-900">{q.question}</p>
                                                            <RadioGroup onValueChange={(v) => setQuizAnswers(p => ({...p, [i]: parseInt(v)}))}>
                                                                {q.options.map((opt, oi) => (
                                                                    <div key={oi} className="flex items-center space-x-2 space-x-reverse mb-2 bg-white p-3 rounded-lg border hover:border-indigo-300 transition-colors cursor-pointer">
                                                                        <RadioGroupItem value={oi.toString()} id={`q${i}o${oi}`} />
                                                                        <Label htmlFor={`q${i}o${oi}`} className="flex-1 cursor-pointer mr-2 text-slate-700">{opt}</Label>
                                                                    </div>
                                                                ))}
                                                            </RadioGroup>
                                                        </div>
                                                    ))}
                                                    <Button onClick={submitQuiz} className="w-full bg-blue-600 hover:bg-blue-700 py-4 text-lg rounded-xl shadow-md">تحقق من الإجابات</Button>
                                                </div>
                                            ) : (
                                                <div className="text-center py-4">
                                                    <div className="text-5xl font-bold text-blue-600 mb-2">{Math.round(quizScore)}%</div>
                                                    <p className="text-lg text-slate-600 mb-4">نتيجة رائعة!</p>
                                                    {nextExercise && (
                                                        <Button onClick={goToNextExercise} className="bg-purple-600 hover:bg-purple-700 px-8 py-3 rounded-xl shadow-lg">
                                                            تابع الرحلة 🚀
                                                        </Button>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    )}
                                </div>
                             )}
                        </CardContent>
                    </Card>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
