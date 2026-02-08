// src/pages/NooraniaLearning.jsx

import React, { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import confetti from "canvas-confetti";

// ✅ استيراد الاتصال بقاعدة البيانات
import { supabase } from "@/api/supabaseClient";
import { Student, Recording, SystemSetting } from "@/api/entities";
import { InvokeLLM, UploadFile } from "@/api/integrations";

// ✅ استيراد مكونات واجهة المستخدم
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Slider } from "@/components/ui/slider";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogDescription,
} from "@/components/ui/dialog";
import { 
  Tooltip, 
  TooltipContent, 
  TooltipProvider, 
  TooltipTrigger 
} from "@/components/ui/tooltip";
import {
  ArrowLeft,
  Mic,
  Volume2,
  BookOpen,
  CheckCircle2,
  AlertCircle,
  Play,
  Brain,
  ChevronRight,
  ChevronLeft,
  Loader2,
  Info,
  Settings,
  Star,
  Trophy,
  RefreshCw,
  X,
  Menu,
  Sparkles,
  Lock,
  Unlock
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";

/* =================================================================================================
   📚 NOORANIA CURRICULUM DATA (البيانات الشاملة)
   ================================================================================================= */

const NOORANIA_DATA = [
  {
    id: 1,
    title: "الدَّرسُ الأَوَّل",
    subtitle: "حُرُوفُ الهِجَاءِ المُفْرَدَة",
    description: "الأساس في تعلم مخارج الحروف العربية الصحيحة.",
    color: "indigo",
    items: [
      { char: "ا", name: "ألف", sound: "alif" },
      { char: "ب", name: "باء", sound: "ba" },
      { char: "ت", name: "تاء", sound: "ta" },
      { char: "ث", name: "ثاء", sound: "tha" },
      { char: "ج", name: "جيم", sound: "jeem" },
      { char: "ح", name: "حاء", sound: "ha" },
      { char: "خ", name: "خاء", sound: "kha" },
      { char: "د", name: "دال", sound: "dal" },
      { char: "ذ", name: "ذال", sound: "thal" },
      { char: "ر", name: "راء", sound: "ra" },
      { char: "ز", name: "زاي", sound: "zay" },
      { char: "س", name: "سين", sound: "seen" },
      { char: "ش", name: "شين", sound: "sheen" },
      { char: "ص", name: "صاد", sound: "sad" },
      { char: "ض", name: "ضاد", sound: "dad" },
      { char: "ط", name: "طاء", sound: "taa" },
      { char: "ظ", name: "ظاء", sound: "thaa" },
      { char: "ع", name: "عين", sound: "ain" },
      { char: "غ", name: "غين", sound: "ghain" },
      { char: "ف", name: "فاء", sound: "fa" },
      { char: "ق", name: "قاف", sound: "qaf" },
      { char: "ك", name: "كاف", sound: "kaf" },
      { char: "ل", name: "لام", sound: "lam" },
      { char: "م", name: "ميم", sound: "meem" },
      { char: "ن", name: "نون", sound: "noon" },
      { char: "و", name: "واو", sound: "waw" },
      { char: "هـ", name: "هاء", sound: "ha" },
      { char: "ء", name: "همزة", sound: "hamza" },
      { char: "ي", name: "ياء", sound: "ya" }
    ]
  },
  {
    id: 2,
    title: "الدَّرسُ الثَّانِي",
    subtitle: "حُرُوفُ الهِجَاءِ المُركَّبَة",
    description: "تعلم أشكال الحروف عندما تتصل ببعضها في الكلمات.",
    color: "emerald",
    items: [
      { char: "لا", name: "لام ألف", sound: "lam alif" },
      { char: "بأ", name: "باء ألف", sound: "ba alif" },
      { char: "تأ", name: "تاء ألف", sound: "ta alif" },
      { char: "ثأ", name: "ثاء ألف", sound: "tha alif" },
      { char: "نأ", name: "نون ألف", sound: "noon alif" },
      { char: "ياء", name: "ياء ألف", sound: "ya alif" },
      { char: "بـا", name: "باء ألف", sound: "ba alif" },
      { char: "نـل", name: "نون لام", sound: "noon lam" },
      { char: "تـا", name: "تاء ألف", sound: "ta alif" },
      { char: "يـا", name: "ياء ألف", sound: "ya alif" },
      { char: "ثـا", name: "ثاء ألف", sound: "tha alif" },
      { char: "بـم", name: "باء ميم", sound: "ba meem" },
      { char: "تـم", name: "تاء ميم", sound: "ta meem" },
      { char: "ثـم", name: "ثاء ميم", sound: "tha meem" }
    ]
  },
  {
    id: 3,
    title: "الدَّرسُ الثَّالِث",
    subtitle: "الحُرُوفُ المُقَطَّعَة",
    description: "حروف فواتح السور، نطقها يعتمد على أسمائها والمدود.",
    color: "amber",
    items: [
      { char: "الم", name: "ألف لام ميم", sound: "alif lam meem" },
      { char: "المص", name: "ألف لام ميم صاد", sound: "alif lam meem sad" },
      { char: "الر", name: "ألف لام را", sound: "alif lam ra" },
      { char: "كهيعص", name: "كاف ها يا عين صاد", sound: "kaf ha ya ain sad" },
      { char: "طه", name: "طا ها", sound: "ta ha" },
      { char: "طسم", name: "طا سين ميم", sound: "ta seen meem" },
      { char: "يس", name: "يا سين", sound: "ya seen" },
      { char: "ص", name: "صاد", sound: "sad" },
      { char: "حم", name: "حا ميم", sound: "ha meem" },
      { char: "عسق", name: "عين سين قاف", sound: "ain seen qaf" },
      { char: "ق", name: "قاف", sound: "qaf" },
      { char: "ن", name: "نون", sound: "noon" }
    ]
  },
  {
    id: 4,
    title: "الدَّرسُ الرَّابِع",
    subtitle: "الحَرَكَات (فَتحَة، كَسْرَة، ضَمَّة)",
    description: "إتقان الحركات القصيرة وعدم تطويلها.",
    color: "blue",
    items: [
      { char: "ءَ", name: "همزة فتحة", sound: "a" },
      { char: "ءِ", name: "همزة كسرة", sound: "i" },
      { char: "ءُ", name: "همزة ضمة", sound: "u" },
      { char: "بَ", name: "باء فتحة", sound: "ba" },
      { char: "بِ", name: "باء كسرة", sound: "bi" },
      { char: "بُ", name: "باء ضمة", sound: "bu" },
      { char: "تَ", name: "تاء فتحة", sound: "ta" },
      { char: "تِ", name: "تاء كسرة", sound: "ti" },
      { char: "تُ", name: "تاء ضمة", sound: "tu" },
      { char: "ثَ", name: "ثاء فتحة", sound: "tha" },
      { char: "ثِ", name: "ثاء كسرة", sound: "thi" },
      { char: "ثُ", name: "ثاء ضمة", sound: "thu" }
    ]
  },
  {
    id: 5,
    title: "الدَّرسُ الخَامِس",
    subtitle: "التَّنْوِين",
    description: "فتحتين، كسرتين، ضمتين (النوتة الموسيقية للغة).",
    color: "rose",
    items: [
      { char: "مً", name: "ميماً فتحتين", sound: "man" },
      { char: "مٍ", name: "ميماً كسرتين", sound: "min" },
      { char: "مٌ", name: "ميماً ضمتين", sound: "mun" },
      { char: "بً", name: "باءً فتحتين", sound: "ban" },
      { char: "بٍ", name: "باءً كسرتين", sound: "bin" },
      { char: "بٌ", name: "باءً ضمتين", sound: "bun" },
      { char: "تً", name: "تاءً فتحتين", sound: "tan" },
      { char: "تٍ", name: "تاءً كسرتين", sound: "tin" },
      { char: "تٌ", name: "تاءً ضمتين", sound: "tun" }
    ]
  },
  {
    id: 6,
    title: "الدَّرسُ السَّادِس",
    subtitle: "تَدْرِيبَاتٌ عَلى الحَرَكَاتِ وَالتَّنْوِين",
    description: "كلمات مركبة تجمع ما سبق تعلمه.",
    color: "purple",
    items: [
      { char: "أَبَدًا", name: "أبداً", sound: "abadan" },
      { char: "أَحَدٌ", name: "أحدٌ", sound: "ahadun" },
      { char: "أَخَذَ", name: "أخذَ", sound: "akhadha" },
      { char: "أَذِنَ", name: "أذنَ", sound: "adhina" },
      { char: "أَمَرَ", name: "أمرَ", sound: "amara" },
      { char: "أَنَا", name: "أنا", sound: "ana" },
      { char: "بَخِلَ", name: "بخلَ", sound: "bakhila" },
      { char: "بَرَرَةٍ", name: "بررةٍ", sound: "bararatin" },
      { char: "جَعَلَ", name: "جعلَ", sound: "ja'ala" },
      { char: "جَمَعَ", name: "جمعَ", sound: "jama'a" }
    ]
  }
];

/* =================================================================================================
   🎨 MAIN COMPONENT
   ================================================================================================= */

export default function NooraniaLearning() {
  const navigate = useNavigate();
  const { toast } = useToast();
  
  // --- States ---
  const [student, setStudent] = useState(null);
  const [currentLessonIdx, setCurrentLessonIdx] = useState(0);
  const [selectedItemIdx, setSelectedItemIdx] = useState(0);
  const [isRecording, setIsRecording] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);
  const [showTeacherChat, setShowTeacherChat] = useState(false);
  const [aiExplanation, setAiExplanation] = useState(null);
  const [loadingExplanation, setLoadingExplanation] = useState(false);
  const [feedback, setFeedback] = useState(null);
  const [settingsOpen, setSettingsOpen] = useState(false);
  const [audioSpeed, setAudioSpeed] = useState([0.8]);
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [totalPoints, setTotalPoints] = useState(0);
  
  // Progress Data from DB
  const [completedItems, setCompletedItems] = useState({}); // { "0_1": true, ... } key = lessonIdx_itemIdx

  // Refs
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const canvasRef = useRef(null);

  // Derived Data
  const currentLesson = NOORANIA_DATA[currentLessonIdx];
  const currentItem = currentLesson.items[selectedItemIdx];
  const progressPercent = useMemo(() => {
    const lessonItems = currentLesson.items;
    let completedCount = 0;
    lessonItems.forEach((_, idx) => {
        if (completedItems[`${currentLessonIdx}_${idx}`]) completedCount++;
    });
    return Math.round((completedCount / lessonItems.length) * 100);
  }, [completedItems, currentLessonIdx, currentLesson]);

  // --- Effects ---
  
  // 1. Load Student & Progress
  useEffect(() => {
    const loadData = async () => {
        const studentId = localStorage.getItem("studentId");
        if (!studentId) {
            navigate(createPageUrl("StudentOnboarding"));
            return;
        }

        try {
            // Fetch Student
            const s = await Student.get(studentId);
            setStudent(s);

            // Fetch Noorania Progress
            const { data: progressData, error } = await supabase
                .from('noorania_progress')
                .select('*')
                .eq('student_id', studentId);
            
            if (error) {
                console.error("Error fetching progress:", error);
            } else {
                const progressMap = {};
                let points = 0;
                progressData.forEach(p => {
                    if (p.is_completed) {
                        progressMap[`${p.lesson_id}_${p.item_index}`] = true;
                        points += (p.score || 0); // Aggregate points
                    }
                });
                setCompletedItems(progressMap);
                setTotalPoints(points); // Simple point calc
            }

        } catch (e) {
            console.error("Failed to load user data", e);
        }
    };
    loadData();
  }, [navigate]);

  useEffect(() => {
    // Reset feedback when item changes
    setFeedback(null);
    setAiExplanation(null);
  }, [selectedItemIdx, currentLessonIdx]);

  /* ------------------------------------------------------------------------------------------------
   * 🔊 Audio & TTS Logic
   * ------------------------------------------------------------------------------------------------ */
  
  const playAudio = (text) => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA";
      utterance.rate = audioSpeed[0];
      
      utterance.onstart = () => setIsPlayingAudio(true);
      utterance.onend = () => setIsPlayingAudio(false);
      utterance.onerror = () => setIsPlayingAudio(false);
      
      window.speechSynthesis.speak(utterance);
    } else {
      toast({ title: "عذراً", description: "المتصفح لا يدعم القراءة الصوتية.", variant: "destructive" });
    }
  };

  /* ------------------------------------------------------------------------------------------------
   * 🎤 Recording & Analysis Logic (With Supabase)
   * ------------------------------------------------------------------------------------------------ */

  const startRecording = async () => {
    try {
      setFeedback(null);
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      setupVisualizer(stream);

      const mediaRecorder = new MediaRecorder(stream);
      mediaRecorderRef.current = mediaRecorder;
      audioChunksRef.current = [];

      mediaRecorder.ondataavailable = (e) => {
        if (e.data.size > 0) audioChunksRef.current.push(e.data);
      };

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
        await analyzePronunciation(audioBlob);
        stream.getTracks().forEach(track => track.stop());
        setIsRecording(false);
      };

      mediaRecorder.start();
      setIsRecording(true);
    } catch (err) {
      console.error("Mic Error:", err);
      toast({ title: "خطأ في الميكروفون", description: "يرجى السماح بالوصول للميكروفون.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
    }
  };

  const setupVisualizer = (stream) => {
    if (!canvasRef.current) return;
    const audioContext = new (window.AudioContext || window.webkitAudioContext)();
    const source = audioContext.createMediaStreamSource(stream);
    const analyzer = audioContext.createAnalyser();
    analyzer.fftSize = 256;
    source.connect(analyzer);
    const bufferLength = analyzer.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);
    const canvas = canvasRef.current;
    const canvasCtx = canvas.getContext("2d");

    const draw = () => {
        if (!isRecording) return;
        requestAnimationFrame(draw);
        analyzer.getByteFrequencyData(dataArray);
        canvasCtx.fillStyle = 'rgb(248, 250, 252)';
        canvasCtx.fillRect(0, 0, canvas.width, canvas.height);
        const barWidth = (canvas.width / bufferLength) * 2.5;
        let barHeight;
        let x = 0;
        for(let i = 0; i < bufferLength; i++) {
            barHeight = dataArray[i] / 2;
            canvasCtx.fillStyle = `rgb(${100}, ${50 + barHeight}, ${255})`;
            canvasCtx.fillRect(x, canvas.height - barHeight, barWidth, barHeight);
            x += barWidth + 1;
        }
    };
    draw();
  };

  const analyzePronunciation = async (audioBlob) => {
    setIsProcessing(true);
    try {
      if (!student) throw new Error("لم يتم تحديد الطالب");

      // 1. Upload File using API utility
      const file = new File([audioBlob], `noorania_${student.id}_${Date.now()}.webm`, { type: "audio/webm" });
      const { file_url } = await UploadFile({ 
          file, 
          bucket: "recordings", 
          folder: "noorania" 
      });

      // 2. Transcribe (Whisper)
      const settings = await SystemSetting.list();
      const apiKeySetting = settings.find(s => s.key === "openai_api_key");
      const apiKey = apiKeySetting?.value || import.meta.env.VITE_OPENAI_API_KEY;

      if (!apiKey) throw new Error("مفتاح OpenAI غير موجود");

      const formData = new FormData();
      formData.append("file", file);
      formData.append("model", "whisper-1");
      formData.append("language", "ar");

      const transRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${apiKey}` },
        body: formData
      });

      if (!transRes.ok) throw new Error("فشل تحويل الصوت إلى نص");
      const transData = await transRes.json();
      const studentText = transData.text || "";

      // 3. Evaluate (GPT-4)
      const prompt = `
        أنت معلم خبير في "القاعدة النورانية".
        الحرف/الكلمة المطلوبة: "${currentItem.char}" (${currentItem.name})
        النص الذي سمعه النظام من الطالب: "${studentText}"
        
        قيم النطق. إذا كان النص المسموع قريباً جداً صوتياً حتى لو اختلف الإملاء قليلاً، اعتبره صحيحاً.
        
        JSON Response Format:
        {
          "isCorrect": boolean,
          "score": number (0-100),
          "message": "رسالة تشجيعية قصيرة جداً (سطر واحد)",
          "correction": "شرح الخطأ إذا وجد (اختياري)"
        }
      `;

      const evalRes = await InvokeLLM({
        prompt,
        response_json_schema: {
             type: "object",
             properties: {
                 isCorrect: { type: "boolean" },
                 score: { type: "number" },
                 message: { type: "string" },
                 correction: { type: "string" }
             },
             required: ["isCorrect", "score", "message"]
        }
      });
      
      const result = typeof evalRes === "string" ? JSON.parse(evalRes) : evalRes;
      setFeedback(result);

      // 4. Save to Database (Recordings & Progress)
      // A. Save Recording Log
      await Recording.create({
          student_id: student.id,
          exercise_id: `noorania_${currentLessonIdx}_${selectedItemIdx}`,
          audio_url: file_url,
          score: result.score,
          feedback: result.message,
          analysis_details: {
              lesson: currentLesson.title,
              item: currentItem.char,
              transcription: studentText,
              correction: result.correction
          }
      });

      // B. Save Progress (Upsert)
      if (result.isCorrect) {
          const { error: upsertError } = await supabase
              .from('noorania_progress')
              .upsert({
                  student_id: student.id,
                  lesson_id: currentLessonIdx,
                  item_index: selectedItemIdx,
                  score: result.score,
                  is_completed: true,
                  updated_at: new Date()
              }, { onConflict: 'student_id,lesson_id,item_index' });
          
          if (!upsertError) {
              triggerConfetti();
              // Update local state
              setCompletedItems(prev => ({ ...prev, [`${currentLessonIdx}_${selectedItemIdx}`]: true }));
              setTotalPoints(prev => prev + 10);
          }
      }

    } catch (error) {
      console.error("Analysis Error:", error);
      toast({ title: "خطأ", description: "حدث خطأ أثناء المعالجة، يرجى المحاولة.", variant: "destructive" });
    } finally {
      setIsProcessing(false);
    }
  };

  /* ------------------------------------------------------------------------------------------------
   * 🤖 AI Teacher Chat Logic
   * ------------------------------------------------------------------------------------------------ */

  const askAiTeacher = async () => {
    setLoadingExplanation(true);
    setShowTeacherChat(true);
    try {
      const prompt = `
        اشرح للطفل كيفية نطق: "${currentItem.char}" في درس "${currentLesson.title}".
        استخدم لغة بسيطة جداً، وشبه المخرج بشيء مألوف للأطفال.
        مثال: "حرف الباء يخرج عندما نطبق شفتينا معاً بقوة، مثلما نفعل عندما نقول بيب بيب!"
      `;
      const response = await InvokeLLM({ prompt });
      setAiExplanation(response);
    } catch (error) {
        setAiExplanation("المعلم مشغول حالياً، حاول مرة أخرى.");
    } finally {
        setLoadingExplanation(false);
    }
  };

  const triggerConfetti = () => {
    const duration = 2000;
    const end = Date.now() + duration;
    (function frame() {
      confetti({ particleCount: 5, angle: 60, spread: 55, origin: { x: 0 } });
      confetti({ particleCount: 5, angle: 120, spread: 55, origin: { x: 1 } });
      if (Date.now() < end) requestAnimationFrame(frame);
    }());
  };

  /* ------------------------------------------------------------------------------------------------
   * 🖥️ Sub-Components
   * ------------------------------------------------------------------------------------------------ */

  const LessonItemButton = ({ item, index, isActive, isCompleted }) => (
    <motion.button
        whileHover={{ scale: 1.05, y: -2 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setSelectedItemIdx(index)}
        className={`
            relative aspect-square rounded-2xl flex flex-col items-center justify-center border-2 shadow-sm transition-all duration-300
            ${isActive 
                ? `bg-${currentLesson.color}-600 border-${currentLesson.color}-600 text-white ring-4 ring-${currentLesson.color}-100 z-10 scale-105` 
                : "bg-white border-slate-200 text-slate-700 hover:border-indigo-300 hover:shadow-md"}
        `}
    >
        {isCompleted && (
            <div className="absolute top-2 right-2 bg-green-500 rounded-full p-0.5 border-2 border-white shadow-sm">
                <CheckCircle2 className="w-3 h-3 text-white" />
            </div>
        )}
        <span className={`text-3xl sm:text-4xl md:text-5xl font-black arabic-text mb-1 ${isActive ? "text-white" : "text-slate-800"}`}>
            {item.char}
        </span>
        <span className={`text-[10px] opacity-0 group-hover:opacity-100 transition-opacity ${isActive ? "text-white/80" : "text-slate-400"}`}>
            {item.sound}
        </span>
    </motion.button>
  );

  if (!student) return <div className="flex h-screen items-center justify-center"><Loader2 className="animate-spin w-8 h-8 text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col font-sans" dir="rtl" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      
      {/* 🟢 Header Section */}
      <header className="bg-white border-b border-slate-200 sticky top-0 z-30 px-4 h-16 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => setSidebarOpen(!sidebarOpen)} className="text-slate-500 lg:hidden">
                <Menu className="w-6 h-6" />
            </Button>
            <div className="flex items-center gap-3">
                <div className="bg-indigo-600 rounded-lg p-1.5 text-white">
                    <BookOpen className="w-5 h-5" />
                </div>
                <div className="hidden sm:block">
                    <h1 className="font-bold text-slate-800 text-sm leading-tight">القاعدة النورانية</h1>
                    <p className="text-[10px] text-slate-500">المنهج الذكي</p>
                </div>
            </div>
        </div>

        <div className="flex items-center gap-2">
            <div className="hidden md:flex items-center bg-indigo-50 px-3 py-1.5 rounded-full border border-indigo-100">
                <Trophy className="w-4 h-4 text-amber-500 mr-2" />
                <span className="text-xs font-bold text-indigo-900 arabic-text">نقاط: {totalPoints}</span>
            </div>
            
            <Dialog open={settingsOpen} onOpenChange={setSettingsOpen}>
                <DialogTrigger asChild>
                    <Button variant="ghost" size="icon"><Settings className="w-5 h-5 text-slate-500" /></Button>
                </DialogTrigger>
                <DialogContent>
                    <DialogHeader>
                        <DialogTitle className="text-right">إعدادات التعلم</DialogTitle>
                    </DialogHeader>
                    <div className="py-4 space-y-6">
                        <div className="space-y-2">
                            <Label className="text-right block">سرعة القراءة الصوتية</Label>
                            <Slider value={audioSpeed} onValueChange={setAudioSpeed} min={0.5} max={1.2} step={0.1} />
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            <Button variant="outline" size="sm" onClick={() => navigate(createPageUrl("StudentDashboard"))} className="gap-2">
                <ArrowLeft className="w-4 h-4" /> <span className="hidden sm:inline">خروج</span>
            </Button>
        </div>
      </header>

      {/* 🟢 Main Layout */}
      <div className="flex flex-1 overflow-hidden relative">
        
        {/* Sidebar */}
        <AnimatePresence>
            {sidebarOpen && (
                <motion.aside 
                    initial={{ width: 0, opacity: 0 }}
                    animate={{ width: 280, opacity: 1 }}
                    exit={{ width: 0, opacity: 0 }}
                    className="bg-white border-l border-slate-200 h-full overflow-y-auto hidden lg:block custom-scrollbar"
                >
                    <div className="p-4">
                        <h2 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-4 px-2">خريطة المنهج</h2>
                        <div className="space-y-2">
                            {NOORANIA_DATA.map((lesson, idx) => (
                                <div 
                                    key={lesson.id}
                                    onClick={() => { setCurrentLessonIdx(idx); setSelectedItemIdx(0); }}
                                    className={`
                                        group flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border
                                        ${currentLessonIdx === idx 
                                            ? `bg-${lesson.color}-50 border-${lesson.color}-200` 
                                            : "bg-white border-transparent hover:bg-slate-50"}
                                    `}
                                >
                                    <div className={`
                                        w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold transition-colors
                                        ${currentLessonIdx === idx ? `bg-${lesson.color}-600 text-white` : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"}
                                    `}>
                                        {lesson.id}
                                    </div>
                                    <div className="flex-1">
                                        <h3 className={`text-sm font-bold ${currentLessonIdx === idx ? `text-${lesson.color}-900` : "text-slate-700"}`}>
                                            {lesson.title}
                                        </h3>
                                        <p className="text-[10px] text-slate-500 truncate">{lesson.subtitle}</p>
                                    </div>
                                    {currentLessonIdx === idx && <ChevronLeft className={`w-4 h-4 text-${lesson.color}-500`} />}
                                </div>
                            ))}
                        </div>
                    </div>
                </motion.aside>
            )}
        </AnimatePresence>

        {/* Content Area */}
        <main className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 bg-slate-50/50">
            <div className="max-w-6xl mx-auto space-y-6">
                
                {/* 1. Lesson Header */}
                <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-3xl shadow-sm border border-slate-100">
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Badge variant="outline" className={`bg-${currentLesson.color}-50 text-${currentLesson.color}-700 border-${currentLesson.color}-200`}>
                                الدرس {currentLesson.id}
                            </Badge>
                            <span className="text-xs text-slate-500">{currentLesson.description}</span>
                        </div>
                        <h1 className="text-2xl md:text-3xl font-black text-slate-900 arabic-text">{currentLesson.subtitle}</h1>
                    </div>
                    
                    <div className="w-full md:w-48 bg-slate-50 p-3 rounded-2xl border border-slate-100">
                        <div className="flex justify-between text-xs mb-1 font-medium text-slate-600">
                            <span>الإنجاز</span>
                            <span>{progressPercent}%</span>
                        </div>
                        <Progress value={progressPercent} className={`h-2.5 bg-slate-200`} indicatorClassName={`bg-${currentLesson.color}-600`} />
                    </div>
                </div>

                <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 h-auto min-h-[600px]">
                    
                    {/* 2. Items Grid */}
                    <div className="xl:col-span-7 order-2 xl:order-1">
                        <Card className="border-0 shadow-lg h-full bg-white">
                            <CardContent className="p-6">
                                <div className="grid grid-cols-4 sm:grid-cols-5 md:grid-cols-6 gap-3 md:gap-4">
                                    {currentLesson.items.map((item, idx) => (
                                        <LessonItemButton 
                                            key={idx} 
                                            item={item} 
                                            index={idx} 
                                            isActive={selectedItemIdx === idx}
                                            isCompleted={completedItems[`${currentLessonIdx}_${idx}`]}
                                        />
                                    ))}
                                </div>
                            </CardContent>
                            <CardFooter className="border-t border-slate-100 p-4 bg-slate-50/50 flex justify-between items-center">
                                <Button variant="outline" onClick={() => setSelectedItemIdx(Math.max(0, selectedItemIdx - 1))} disabled={selectedItemIdx === 0} className="gap-2">
                                    <ChevronRight className="w-4 h-4" /> السابق
                                </Button>
                                <span className="text-sm font-bold text-slate-400">
                                    {selectedItemIdx + 1} / {currentLesson.items.length}
                                </span>
                                <Button variant="outline" onClick={() => setSelectedItemIdx(Math.min(currentLesson.items.length - 1, selectedItemIdx + 1))} disabled={selectedItemIdx === currentLesson.items.length - 1} className="gap-2">
                                    التالي <ChevronLeft className="w-4 h-4" />
                                </Button>
                            </CardFooter>
                        </Card>
                    </div>

                    {/* 3. Learning Stage */}
                    <div className="xl:col-span-5 order-1 xl:order-2 space-y-6">
                        
                        <div className="relative group">
                             <div className={`absolute -inset-1 bg-gradient-to-r from-${currentLesson.color}-600 to-purple-600 rounded-[2rem] blur opacity-25 group-hover:opacity-50 transition duration-1000`}></div>
                             
                             <Card className="relative border-0 shadow-2xl bg-white rounded-[1.8rem] overflow-hidden">
                                <CardContent className="p-8 text-center flex flex-col items-center">
                                    
                                    <div className="mb-2">
                                        <Badge variant="secondary" className="mb-4">{currentItem.name}</Badge>
                                        <motion.div 
                                            key={currentItem.char}
                                            initial={{ scale: 0.5, opacity: 0 }}
                                            animate={{ scale: 1, opacity: 1 }}
                                            className={`text-[8rem] leading-none font-black text-${currentLesson.color}-600 drop-shadow-sm arabic-text py-4`}
                                        >
                                            {currentItem.char}
                                        </motion.div>
                                    </div>

                                    <div className="flex gap-4 w-full mb-8">
                                        <Button onClick={() => playAudio(currentItem.char)} disabled={isPlayingAudio} className={`flex-1 h-14 text-lg rounded-2xl shadow-lg bg-${currentLesson.color}-600 hover:bg-${currentLesson.color}-700 text-white`}>
                                            {isPlayingAudio ? <Loader2 className="animate-spin" /> : <Volume2 className="w-6 h-6 mr-2" />} استمع
                                        </Button>
                                        <Button variant="outline" onClick={askAiTeacher} className="h-14 w-14 rounded-2xl border-2 border-amber-200 bg-amber-50 text-amber-600 hover:bg-amber-100">
                                            <Brain className="w-6 h-6" />
                                        </Button>
                                    </div>

                                    <div className="w-full bg-slate-50 rounded-3xl p-1 border border-slate-100 relative overflow-hidden">
                                        <canvas ref={canvasRef} className="absolute inset-0 w-full h-full opacity-30 pointer-events-none" width="300" height="100"/>
                                        <div className="relative z-10 flex flex-col items-center py-6">
                                            {isProcessing ? (
                                                <div className="flex flex-col items-center gap-3">
                                                    <Loader2 className="w-10 h-10 text-indigo-600 animate-spin" />
                                                    <span className="text-sm text-slate-500 font-medium">جاري التحليل...</span>
                                                </div>
                                            ) : (
                                                <>
                                                    <button onClick={isRecording ? stopRecording : startRecording} className={`w-20 h-20 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${isRecording ? "bg-red-500 shadow-red-200 scale-110 ring-4 ring-red-100" : `bg-${currentLesson.color}-100 text-${currentLesson.color}-600 hover:bg-${currentLesson.color}-200`}`}>
                                                        {isRecording ? <div className="w-8 h-8 bg-white rounded-md animate-pulse" /> : <Mic className="w-10 h-10" />}
                                                    </button>
                                                    <p className="mt-4 text-sm font-medium text-slate-400">
                                                        {isRecording ? "جاري الاستماع..." : "اضغط وسجّل نطقك"}
                                                    </p>
                                                </>
                                            )}
                                        </div>
                                    </div>

                                </CardContent>
                             </Card>
                        </div>

                        {/* Feedback Area */}
                        <AnimatePresence mode="wait">
                            {feedback && (
                                <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}>
                                    <Card className={`border-0 shadow-lg ${feedback.isCorrect ? "bg-green-50 border-2 border-green-100" : "bg-red-50 border-2 border-red-100"}`}>
                                        <CardContent className="p-5 flex items-start gap-4">
                                            <div className={`p-3 rounded-full ${feedback.isCorrect ? "bg-green-200 text-green-700" : "bg-red-200 text-red-700"}`}>
                                                {feedback.isCorrect ? <Sparkles className="w-6 h-6" /> : <RefreshCw className="w-6 h-6" />}
                                            </div>
                                            <div>
                                                <h3 className={`font-bold text-lg mb-1 ${feedback.isCorrect ? "text-green-800" : "text-red-800"}`}>
                                                    {feedback.isCorrect ? "ممتاز! نطق صحيح" : "حاول مرة أخرى"}
                                                </h3>
                                                <p className="text-slate-700 text-sm leading-relaxed">{feedback.message}</p>
                                                {feedback.correction && <div className="mt-2 text-xs bg-white/50 p-2 rounded text-slate-600">💡 {feedback.correction}</div>}
                                            </div>
                                        </CardContent>
                                    </Card>
                                </motion.div>
                            )}

                            {showTeacherChat && (
                                <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} className="bg-white border border-indigo-100 rounded-2xl shadow-lg overflow-hidden">
                                    <div className="bg-indigo-50 px-4 py-2 flex items-center justify-between border-b border-indigo-100">
                                        <span className="text-xs font-bold text-indigo-900">المعلم الذكي</span>
                                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => setShowTeacherChat(false)}><X className="w-3 h-3" /></Button>
                                    </div>
                                    <div className="p-4 bg-slate-50 min-h-[100px]">
                                        {loadingExplanation ? <div className="flex items-center gap-2 text-xs text-slate-400"><Loader2 className="w-3 h-3 animate-spin" /> جاري الشرح...</div> : <p className="text-sm text-slate-700 leading-relaxed">{aiExplanation}</p>}
                                    </div>
                                </motion.div>
                            )}
                        </AnimatePresence>
                    </div>
                </div>
            </div>
        </main>
      </div>
    </div>
  );
}
