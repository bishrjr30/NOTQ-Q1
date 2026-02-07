// src/pages/StudentDashboard.jsx

import React, { 
  useState, 
  useEffect, 
  useCallback 
} from "react";

// استيراد مكونات واجهة المستخدم
import { Button } from "@/components/ui/button";
import { 
  Card, 
  CardContent, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardFooter
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Separator } from "@/components/ui/separator";

// استيراد الأيقونات
import {
  Trophy, // ✅ تمت إضافتها
  Star,   // ✅ تمت إضافتها
  TrendingUp,
  Play,
  Wand2,
  MessageCircle,
  Crown,
  Target,
  Zap,
  Award,
  BookOpen,
  Sparkles,
  Flame,
  Gift,
  Clock,
  Activity,
  User,
  Mic,
  Medal,
  PenTool, 
  Keyboard,
  ChevronRight,
  CheckCircle2,
  AlertCircle
} from "lucide-react";

import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

// استيراد الاتصال بقاعدة البيانات والكيانات
import { supabase } from "@/api/supabaseClient";
import {
  Student,
  Exercise,
  Recording,
  FamilyChallenge,
} from "@/api/entities";

// استيراد التمارين المحلية (لدمجها مع تمارين قاعدة البيانات)
import { staticExercises } from "@/data/staticExercises";

/**
 * 🎓 StudentDashboard - لوحة تحكم الطالب الشاملة
 * * تعرض هذه الصفحة ملخصاً كاملاً لأداء الطالب:
 * 1. إحصائيات دقيقة (المتوسط، النقاط، الشارات).
 * 2. تحليل أسبوعي للتقدم في كافة الأنشطة (نطق، كتابة، إملاء).
 * 3. خارطة الطريق التعليمية.
 * 4. آخر النشاطات والإنجازات.
 */
export default function StudentDashboard() {
  const navigate = useNavigate();

  // ==========================================
  // 1. إدارة الحالة (State Management)
  // ==========================================
  
  // بيانات الطالب والتحميل
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // البيانات التعليمية
  const [exercises, setExercises] = useState([]); // تمارين النطق
  const [completedExerciseIds, setCompletedExerciseIds] = useState([]);
  
  // سجلات النشاط (من كافة المصادر)
  const [unifiedHistory, setUnifiedHistory] = useState([]); // السجل الموحد
  const [recentActivities, setRecentActivities] = useState([]); // آخر 5 نشاطات
  
  // بيانات التحليل البياني
  const [weeklyStats, setWeeklyStats] = useState([]);
  const [averageScore, setAverageScore] = useState(0);
  const [totalPoints, setTotalPoints] = useState(0);
  
  // التحديات والشخصية
  const [challenges, setChallenges] = useState([]);
  const [teacherPersona, setTeacherPersona] = useState(
    localStorage.getItem("teacherPersona") || "calm"
  );

  // ==========================================
  // 2. الدوال المساعدة (Helper Functions)
  // ==========================================

  /**
   * تبديل شخصية المعلم (Gamification)
   */
  const togglePersona = () => {
    const personas = ["calm", "strict", "fun"];
    const nextIndex = (personas.indexOf(teacherPersona) + 1) % personas.length;
    const nextPersona = personas[nextIndex];
    setTeacherPersona(nextPersona);
    localStorage.setItem("teacherPersona", nextPersona);
  };

  const getPersonaLabel = (p) => {
    switch (p) {
      case "calm": return "المعلم الهادئ 🌿";
      case "strict": return "المعلم الحازم 👨‍🏫";
      case "fun": return "المعلم المرح 🤡";
      default: return "المعلم الهادئ";
    }
  };

  /**
   * حساب مستوى التقدم في المرحلة الحالية
   */
  const getLevelProgress = () => {
    if (!student) return 0;
    // نفترض أن كل مستوى يتكون من 10 مراحل
    const maxStage = 10; 
    const progress = ((student.current_stage - 1) / (maxStage - 1)) * 100;
    return Math.min(Math.max(progress, 5), 100); // لا تقل عن 5% ولا تزيد عن 100%
  };

  /**
   * تحديد الشارة التالية بناءً على النقاط
   */
  const getNextBadge = () => {
    if (!totalPoints) return "البداية 🎯";
    
    if (totalPoints >= 5000) return "ملك اللغة 👑";
    if (totalPoints >= 3000) return "الأديب الصغير 📜";
    if (totalPoints >= 1000) return "خبير النطق 🏆";
    if (totalPoints >= 500) return "قارئ ماهر 📖";
    if (totalPoints >= 100) return "طالب مجتهد 🌟";
    return "بداية موفقة 🚀";
  };

  /**
   * تسجيل الدخول أو إنشاء حساب طالب جديد
   */
  const findOrCreateStudent = useCallback(async (name) => {
    setIsLoading(true);
    try {
      const trimmedName = name.trim();
      const allStudents = await Student.list();
      const existingStudent = allStudents.find((s) => s.name === trimmedName);

      if (existingStudent) {
        await Student.update(existingStudent.id, {
          last_login: new Date().toISOString(),
        });
        setStudent(existingStudent);
        localStorage.setItem("studentId", existingStudent.id);
      } else {
        // إنشاء كود دخول عشوائي
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let accessCode = "";
        for (let i = 0; i < 8; i++) {
          accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const newStudent = await Student.create({
          name: trimmedName,
          level: "مبتدئ",
          access_code: accessCode,
          current_stage: 1,
          last_activity: new Date().toISOString(),
          last_login: new Date().toISOString(),
        });
        setStudent(newStudent);
        localStorage.setItem("studentId", newStudent.id);
      }
      localStorage.setItem("studentName", trimmedName);
    } catch (error) {
      console.error("Failed to find/create student:", error);
      alert("حدث خطأ في تحميل البيانات. يرجى التحديث.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  /**
   * 🚀 الدالة الرئيسية: تحميل ودمج جميع بيانات الطالب
   * تقوم بجلب البيانات من 3 جداول مختلفة وتوحيدها لعرضها
   */
  const loadStudentData = useCallback(async () => {
    if (!student) return;

    setIsLoading(true);
    try {
      // 1. جلب التمارين الأساسية (النطق)
      const dbExercises = await Exercise.list();
      const allExercises = [...dbExercises, ...staticExercises];
      setExercises(allExercises);

      // 2. جلب سجلات النطق (Voice Recordings)
      const { data: voiceData } = await supabase
        .from('recordings')
        .select('*')
        .eq('student_id', student.id)
        .order('created_date', { ascending: false });

      // 3. جلب سجلات الكتابة (Writing Submissions)
      const { data: writingData } = await supabase
        .from('writing_submissions')
        .select('*, writing_exercises(title)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      // 4. جلب سجلات الإملاء (Dictation Submissions)
      const { data: dictationData } = await supabase
        .from('dictation_submissions')
        .select('*, dictation_exercises(title)')
        .eq('student_id', student.id)
        .order('created_at', { ascending: false });

      // 5. دمج كل البيانات في "تاريخ موحد" (Unified History)
      let combinedHistory = [];

      // أضف الصوتيات
      if (voiceData) {
        combinedHistory = combinedHistory.concat(voiceData.map(item => ({
          id: `voice-${item.id}`,
          type: 'voice',
          title: 'تمرين نطق', // يمكن تحسينه بجلب اسم التمرين
          score: item.score || 0,
          date: new Date(item.created_date),
          feedback: item.feedback || 'أحسنت المحاولة!'
        })));
        setCompletedExerciseIds(voiceData.map(r => r.exercise_id));
      }

      // أضف الكتابة
      if (writingData) {
        combinedHistory = combinedHistory.concat(writingData.map(item => ({
          id: `write-${item.id}`,
          type: 'writing',
          title: item.writing_exercises?.title || 'ورشة كتابة',
          score: item.score || 0,
          date: new Date(item.created_at),
          feedback: item.ai_analysis?.feedback || 'تم التصحيح'
        })));
      }

      // أضف الإملاء
      if (dictationData) {
        combinedHistory = combinedHistory.concat(dictationData.map(item => ({
          id: `dict-${item.id}`,
          type: 'dictation',
          title: item.dictation_exercises?.title || 'إملاء ذكي',
          score: item.score || 0,
          date: new Date(item.created_at),
          feedback: item.mistakes_analysis?.feedback || 'نتيجة الإملاء'
        })));
      }

      // ترتيب حسب التاريخ (الأحدث أولاً)
      combinedHistory.sort((a, b) => b.date - a.date);
      setUnifiedHistory(combinedHistory);
      setRecentActivities(combinedHistory.slice(0, 5));

      // 6. حساب الإحصائيات العامة (المتوسط والنقاط)
      if (combinedHistory.length > 0) {
        const totalScoreSum = combinedHistory.reduce((sum, item) => sum + item.score, 0);
        const avg = Math.round(totalScoreSum / combinedHistory.length);
        setAverageScore(avg);

        // النقاط: كل نشاط = 10 نقاط + (الدرجة / 2)
        const points = combinedHistory.reduce((sum, item) => sum + 10 + Math.round(item.score / 2), 0);
        setTotalPoints(points);
      }

      // 7. تجهيز بيانات الرسم البياني (آخر 7 أيام)
      const last7Days = [...Array(7)].map((_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - i);
        return d.toISOString().split('T')[0]; // YYYY-MM-DD
      }).reverse();

      const chartData = last7Days.map(dateStr => {
        // البحث عن نشاطات في هذا اليوم
        const daysActivities = combinedHistory.filter(item => 
          item.date.toISOString().split('T')[0] === dateStr
        );
        
        // حساب متوسط اليوم
        let dayScore = 0;
        if (daysActivities.length > 0) {
          dayScore = Math.round(daysActivities.reduce((sum, act) => sum + act.score, 0) / daysActivities.length);
        }

        return {
          date: new Date(dateStr).toLocaleDateString('ar-AE', { weekday: 'short' }), // السبت، الأحد...
          score: dayScore,
          fullDate: dateStr
        };
      });
      setWeeklyStats(chartData);

      // 8. جلب التحديات
      try {
        const allChallenges = await FamilyChallenge.list("-created_date");
        const myChallenges = allChallenges.filter(
          (c) => c.student_id === student.id && !c.is_completed
        );
        setChallenges(myChallenges);
      } catch (e) {
        console.error("Challenges error", e);
      }

    } catch (error) {
      console.error("Failed to load student data:", error);
    } finally {
      setIsLoading(false);
    }
  }, [student]);

  // ==========================================
  // 3. Effect Hooks
  // ==========================================

  useEffect(() => {
    const savedStudentId = localStorage.getItem("studentId");
    if (savedStudentId) {
      Student.get(savedStudentId)
        .then((s) => {
          setStudent(s);
          setStudentName(s.name);
        })
        .catch(() => {
          const savedName = localStorage.getItem("studentName");
          if (savedName) findOrCreateStudent(savedName);
          else setIsLoading(false);
        });
    } else {
      const savedName = localStorage.getItem("studentName");
      if (savedName) {
        setStudentName(savedName);
        findOrCreateStudent(savedName);
      } else {
        setIsLoading(false);
      }
    }
  }, [findOrCreateStudent]);

  useEffect(() => {
    if (student) {
      loadStudentData();
    }
  }, [student, loadStudentData]);

  // ==========================================
  // 4. خوارزمية الخريطة اللانهائية (Infinite Map)
  // ==========================================
  
  const generateInfiniteStages = () => {
    const stages = [];
    const currentStage = student?.current_stage || 1;

    // عرض 5 مراحل (الحالية + 4 بعدها)
    for (let i = currentStage; i <= currentStage + 4; i++) {
      const isUnlocked = i === currentStage;
      const isCompleted = i < currentStage;

      // تصفية التمارين الخاصة بهذه المرحلة
      const stageExercises = exercises.filter(
        (ex) => ex.level === student?.level && parseInt(ex.stage) === i
      );

      const completedCount = stageExercises.filter((ex) =>
        completedExerciseIds.includes(ex.id)
      ).length;

      stages.push({
        stage: i,
        isUnlocked,
        isCompleted,
        title: `المرحلة ${i}`,
        totalExercises: stageExercises.length,
        completedExercises: completedCount,
        icon: isCompleted ? "✅" : isUnlocked ? "🔓" : "🔒",
      });
    }
    return stages;
  };

  const infiniteStages = generateInfiniteStages();
  const currentStageExercises = exercises.filter(
    (ex) =>
      ex.level === student?.level &&
      parseInt(ex.stage) === student?.current_stage &&
      !completedExerciseIds.includes(ex.id)
  );

  // ==========================================
  // 5. واجهة المستخدم (Render)
  // ==========================================

  if (isLoading && !student) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-indigo-50 to-blue-100">
        <div className="relative">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin"></div>
          <div className="absolute top-0 left-0 w-16 h-16 border-4 border-purple-400 border-b-transparent rounded-full animate-spin-slow opacity-60"></div>
        </div>
        <p className="mt-4 text-indigo-900 font-bold text-lg animate-pulse arabic-text">
          جارٍ تجهيز مساحة التعلم الخاصة بك... 🚀
        </p>
      </div>
    );
  }

  if (!student) {
    window.location.href = createPageUrl("StudentOnboarding");
    return null;
  }

  return (
    <div className="min-h-screen w-full bg-slate-50 pb-20 font-sans overflow-x-hidden" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      
      {/* خلفية جمالية */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden -z-10 pointer-events-none">
        <div className="absolute top-[-10%] right-[-5%] w-96 h-96 bg-purple-200/30 rounded-full blur-3xl"></div>
        <div className="absolute bottom-[-10%] left-[-5%] w-96 h-96 bg-blue-200/30 rounded-full blur-3xl"></div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-6">
        
        {/* ================= HEADER SECTION ================= */}
        <motion.div 
          initial={{ y: -20, opacity: 0 }} 
          animate={{ y: 0, opacity: 1 }} 
          transition={{ duration: 0.5 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-indigo-600 via-purple-600 to-blue-600 text-white overflow-hidden relative">
            {/* زخارف الخلفية */}
            <div className="absolute top-0 right-0 p-10 opacity-10 transform rotate-12">
              <Trophy className="w-64 h-64 text-white" />
            </div>
            
            <CardContent className="p-6 md:p-8 relative z-10">
              <div className="flex flex-col md:flex-row items-center justify-between gap-6">
                
                {/* معلومات الطالب */}
                <div className="flex flex-col md:flex-row items-center gap-6 text-center md:text-right w-full md:w-auto">
                  <div className="relative">
                    <div className="w-24 h-24 bg-white/20 backdrop-blur-md rounded-full flex items-center justify-center border-4 border-white/30 shadow-lg">
                      <span className="text-4xl">🎓</span>
                    </div>
                    <div className="absolute -bottom-2 -right-2 bg-yellow-400 text-yellow-900 text-xs font-bold px-2 py-1 rounded-full shadow-sm animate-bounce">
                      {student.level}
                    </div>
                  </div>
                  
                  <div>
                    <h1 className="text-3xl md:text-4xl font-bold mb-2 arabic-text">
                      مرحباً يا بطل، {student.name}! 👋
                    </h1>
                    <div className="flex flex-wrap gap-2 justify-center md:justify-start">
                      <Badge className="bg-black/20 hover:bg-black/30 text-white border-0 backdrop-blur-sm px-3 py-1">
                        <Flame className="w-4 h-4 mr-1 text-orange-300" /> 
                        المرحلة {student.current_stage}
                      </Badge>
                      <Badge className="bg-black/20 hover:bg-black/30 text-white border-0 backdrop-blur-sm px-3 py-1">
                        <Star className="w-4 h-4 mr-1 text-yellow-300" /> 
                        {totalPoints} نقطة
                      </Badge>
                    </div>
                  </div>
                </div>

                {/* كود الدخول وزر الشخصية */}
                <div className="flex flex-col items-center gap-3 bg-white/10 p-4 rounded-xl backdrop-blur-sm border border-white/20">
                  <p className="text-xs text-indigo-100 font-medium">🔑 كود ولي الأمر</p>
                  <code 
                    className="text-2xl font-mono font-black tracking-widest bg-black/20 px-4 py-2 rounded-lg cursor-pointer hover:bg-black/30 transition-colors"
                    onClick={() => { navigator.clipboard.writeText(student.access_code); alert("تم نسخ الكود!"); }}
                  >
                    {student.access_code}
                  </code>
                  <Button 
                    size="sm" 
                    variant="ghost" 
                    onClick={togglePersona} 
                    className="text-white hover:bg-white/20 w-full"
                  >
                    <User className="w-4 h-4 ml-2" />
                    {getPersonaLabel(teacherPersona)}
                  </Button>
                </div>

              </div>

              {/* شريط التقدم للمستوى */}
              <div className="mt-8">
                <div className="flex justify-between text-xs text-indigo-100 mb-1">
                  <span>التقدم في المستوى الحالي</span>
                  <span>{Math.round(getLevelProgress())}%</span>
                </div>
                <Progress value={getLevelProgress()} className="h-3 bg-black/20" indicatorClassName="bg-gradient-to-r from-yellow-400 to-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* ================= NAVIGATION GRID ================= */}
        {/* أزرار التنقل الرئيسية للصفحات الجديدة */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
          
          {/* 1. الإملاء الذكي */}
          <Link to={createPageUrl("SmartDictation")}>
            <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
              <Card className="bg-gradient-to-br from-emerald-500 to-teal-600 text-white border-0 shadow-lg cursor-pointer h-full relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <Keyboard className="w-32 h-32" />
                </div>
                <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
                  <div>
                    <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Mic className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1 arabic-text">الإملاء الذكي</h3>
                    <p className="text-emerald-100 text-sm opacity-90 leading-relaxed arabic-text">
                      استمع، اكتب، وتحدى أخطائك مع المصحح الآلي الفوري 🎧
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-bold">
                    ابدأ الآن <ChevronRight className="w-4 h-4 mr-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          {/* 2. ورشة الكتابة */}
          <Link to={createPageUrl("WritingWorkshop")}>
            <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
              <Card className="bg-gradient-to-br from-indigo-500 to-blue-600 text-white border-0 shadow-lg cursor-pointer h-full relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <PenTool className="w-32 h-32" />
                </div>
                <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
                  <div>
                    <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Sparkles className="w-6 h-6 text-yellow-300" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1 arabic-text">ورشة الكتابة</h3>
                    <p className="text-indigo-100 text-sm opacity-90 leading-relaxed arabic-text">
                      أطلق العنان لقلمك! اكتب مواضيع تعبير وصحح أسلوبك ✍️
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-bold">
                    ابدأ الآن <ChevronRight className="w-4 h-4 mr-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          {/* 3. جدار الشهادات */}
          <Link to={createPageUrl("Certificates")}>
            <motion.div whileHover={{ y: -5 }} whileTap={{ scale: 0.98 }}>
              <Card className="bg-gradient-to-br from-amber-400 to-orange-500 text-white border-0 shadow-lg cursor-pointer h-full relative overflow-hidden group">
                <div className="absolute right-0 bottom-0 opacity-10 transform translate-x-4 translate-y-4 group-hover:scale-110 transition-transform duration-500">
                  <Medal className="w-32 h-32" />
                </div>
                <CardContent className="p-6 flex flex-col h-full justify-between relative z-10">
                  <div>
                    <div className="bg-white/20 w-12 h-12 rounded-full flex items-center justify-center mb-4">
                      <Trophy className="w-6 h-6 text-white" />
                    </div>
                    <h3 className="text-2xl font-bold mb-1 arabic-text">جدار الشهادات</h3>
                    <p className="text-orange-100 text-sm opacity-90 leading-relaxed arabic-text">
                      شاهد ثمار جهدك! شهادات تقدير موثقة لكل إنجاز تحققه 🏆
                    </p>
                  </div>
                  <div className="mt-4 flex items-center text-sm font-bold">
                    عرض الشهادات <ChevronRight className="w-4 h-4 mr-1" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </div>

        {/* ================= STATS ROW ================= */}
        <motion.div 
          className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8"
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
        >
          {/* 1. Average Score */}
          <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold mb-1">المتوسط العام</p>
                <div className="text-3xl font-bold text-slate-800">{averageScore}%</div>
              </div>
              <div className={`w-12 h-12 rounded-full flex items-center justify-center ${averageScore >= 90 ? 'bg-green-100 text-green-600' : averageScore >= 70 ? 'bg-yellow-100 text-yellow-600' : 'bg-red-100 text-red-600'}`}>
                <TrendingUp className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* 2. Total Points */}
          <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold mb-1">نقاط الخبرة</p>
                <div className="text-3xl font-bold text-purple-600">{totalPoints}</div>
              </div>
              <div className="w-12 h-12 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center">
                <Zap className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* 3. Completed Exercises */}
          <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold mb-1">تمارين مكتملة</p>
                <div className="text-3xl font-bold text-blue-600">{unifiedHistory.length}</div>
              </div>
              <div className="w-12 h-12 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center">
                <CheckCircle2 className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>

          {/* 4. Next Badge */}
          <Card className="bg-white border-slate-100 shadow-sm hover:shadow-md transition-shadow">
            <CardContent className="p-4 flex items-center justify-between">
              <div>
                <p className="text-slate-500 text-xs font-bold mb-1">هدفك القادم</p>
                <div className="text-lg font-bold text-orange-600 truncate">{getNextBadge()}</div>
              </div>
              <div className="w-12 h-12 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center animate-pulse">
                <Target className="w-6 h-6" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* ================= LEFT COLUMN (Main Content) ================= */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* 1. WEEKLY PROGRESS CHART */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <Activity className="w-5 h-5" />
                  تحليل الأداء الأسبوعي (نطق، كتابة، إملاء)
                </CardTitle>
                <CardDescription>متابعة دقيقة لمستواك في آخر 7 أيام</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-[300px] w-full mt-4" dir="ltr">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={weeklyStats}>
                      <defs>
                        <linearGradient id="colorScore" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#6366f1" stopOpacity={0.8}/>
                          <stop offset="95%" stopColor="#6366f1" stopOpacity={0}/>
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.1} />
                      <XAxis dataKey="date" stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#94a3b8" fontSize={12} tickLine={false} axisLine={false} domain={[0, 100]} />
                      <Tooltip 
                        contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 20px rgba(0,0,0,0.1)' }}
                        formatter={(value) => [`${value}%`, 'الدرجة']}
                        labelStyle={{ textAlign: 'right', fontWeight: 'bold', color: '#1e293b' }}
                      />
                      <Area 
                        type="monotone" 
                        dataKey="score" 
                        stroke="#6366f1" 
                        strokeWidth={3} 
                        fillOpacity={1} 
                        fill="url(#colorScore)" 
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* 2. INFINITE JOURNEY MAP */}
            <Card className="border-0 shadow-lg bg-white/50 backdrop-blur-sm">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-indigo-900">
                  <Zap className="w-5 h-5 text-yellow-500" />
                  رحلة التعلم الخاصة بك
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="relative pl-8 pr-4 py-4">
                  {/* Timeline Line */}
                  <div className="absolute left-1/2 top-0 bottom-0 w-1 bg-gradient-to-b from-indigo-200 via-purple-200 to-transparent transform -translate-x-1/2 hidden md:block"></div>

                  <div className="space-y-8">
                    {infiniteStages.map((stage, index) => (
                      <motion.div 
                        key={stage.stage}
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: index * 0.1 }}
                        className={`relative flex items-center gap-6 ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col`}
                      >
                        {/* Status Icon */}
                        <div className={`z-10 w-14 h-14 rounded-full flex items-center justify-center border-4 shadow-xl transition-all duration-500 ${
                          stage.isCompleted ? "bg-green-100 border-green-500 text-2xl" : 
                          stage.isUnlocked ? "bg-white border-indigo-500 text-2xl animate-pulse ring-4 ring-indigo-100" : 
                          "bg-slate-100 border-slate-300 text-xl grayscale"
                        }`}>
                          {stage.isCompleted ? "🌟" : stage.isUnlocked ? "🚀" : "🔒"}
                        </div>

                        {/* Content Card */}
                        <div className="flex-1 w-full md:w-auto">
                          <div className={`bg-white p-5 rounded-2xl border shadow-sm hover:shadow-md transition-all ${stage.isUnlocked ? 'border-indigo-200' : 'border-slate-100 opacity-70'}`}>
                            <div className="flex justify-between items-start mb-2">
                              <h4 className="font-bold text-lg text-indigo-900">{stage.title}</h4>
                              <Badge variant={stage.isCompleted ? "success" : "outline"}>
                                {stage.completedExercises}/{stage.totalExercises}
                              </Badge>
                            </div>
                            <p className="text-sm text-slate-500 mb-4">تمارين نطق متقدمة وممتعة</p>
                            
                            {stage.isUnlocked && !stage.isCompleted && (
                              <Link to={createPageUrl(`Exercise?id=${currentStageExercises[0]?.id || ""}&studentId=${student.id}`)}>
                                <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white shadow-md shadow-indigo-200">
                                  <Play className="w-4 h-4 ml-2" /> ابدأ الآن
                                </Button>
                              </Link>
                            )}
                          </div>
                        </div>
                        
                        <div className="flex-1 hidden md:block"></div>
                      </motion.div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

          </div>

          {/* ================= RIGHT COLUMN (Sidebar) ================= */}
          <div className="space-y-8">
            
            {/* 1. LINGUISTIC IDENTITY (Strengths & Weaknesses) */}
            <Card className="border-0 shadow-lg overflow-hidden">
              <div className="h-2 bg-gradient-to-r from-green-400 to-blue-500"></div>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-slate-500">
                  <Activity className="w-4 h-4" /> تقرير نقاط القوة
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                
                {/* Mastered Letters */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-green-700 flex items-center gap-2">
                      <CheckCircle2 className="w-4 h-4" /> حروف أتقنتها
                    </span>
                    <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">{student.mastered_letters?.length || 0}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {student.mastered_letters && student.mastered_letters.length > 0 ? (
                      student.mastered_letters.slice(0, 8).map(char => (
                        <div key={char} className="w-8 h-8 rounded-lg bg-green-50 border border-green-200 text-green-700 flex items-center justify-center font-bold shadow-sm">
                          {char}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic w-full text-center py-2">لا توجد بيانات بعد، واصل التدريب!</p>
                    )}
                  </div>
                </div>

                <Separator />

                {/* Needs Practice */}
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-bold text-orange-700 flex items-center gap-2">
                      <AlertCircle className="w-4 h-4" /> ركز على هذه
                    </span>
                    <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">{student.needs_practice_letters?.length || 0}</span>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    {student.needs_practice_letters && student.needs_practice_letters.length > 0 ? (
                      student.needs_practice_letters.slice(0, 8).map(char => (
                        <div key={char} className="w-8 h-8 rounded-lg bg-orange-50 border border-orange-200 text-orange-700 flex items-center justify-center font-bold shadow-sm">
                          {char}
                        </div>
                      ))
                    ) : (
                      <p className="text-xs text-slate-400 italic w-full text-center py-2">ممتاز! لا توجد نقاط ضعف حالياً.</p>
                    )}
                  </div>
                </div>

              </CardContent>
            </Card>

            {/* 2. RECENT ACTIVITY FEED */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-sm uppercase tracking-wider text-slate-500">
                  <Clock className="w-4 h-4" /> آخر النشاطات
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[300px] pr-4">
                  <div className="space-y-4">
                    {recentActivities.length > 0 ? (
                      recentActivities.map((item, i) => (
                        <div key={item.id} className="flex gap-3 relative pb-4 border-b border-slate-50 last:border-0 last:pb-0">
                          {/* Icon based on type */}
                          <div className={`w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center border-2 ${
                            item.type === 'voice' ? 'bg-indigo-50 border-indigo-200 text-indigo-600' :
                            item.type === 'writing' ? 'bg-blue-50 border-blue-200 text-blue-600' :
                            'bg-emerald-50 border-emerald-200 text-emerald-600'
                          }`}>
                            {item.type === 'voice' ? <Mic className="w-5 h-5" /> : 
                             item.type === 'writing' ? <PenTool className="w-5 h-5" /> : 
                             <Keyboard className="w-5 h-5" />}
                          </div>
                          
                          <div className="flex-1">
                            <div className="flex justify-between items-start">
                              <h5 className="font-bold text-slate-800 text-sm">{item.title}</h5>
                              <span className="text-[10px] text-slate-400 bg-slate-100 px-2 py-0.5 rounded-full">
                                {item.date.toLocaleDateString('ar-AE')}
                              </span>
                            </div>
                            <p className="text-xs text-slate-500 mt-1 line-clamp-1">{item.feedback}</p>
                            <div className="mt-2 flex items-center gap-2">
                              <Badge variant={item.score >= 90 ? "default" : "secondary"} className="text-[10px] h-5">
                                {item.score}%
                              </Badge>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="text-center py-10 text-slate-400">
                        <BookOpen className="w-12 h-12 mx-auto mb-2 opacity-20" />
                        <p className="text-sm">لم تقم بأي نشاط بعد</p>
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
              <CardFooter className="bg-slate-50 p-3">
                <Link to={createPageUrl("FeedbackLog")} className="w-full">
                  <Button variant="ghost" size="sm" className="w-full text-slate-500 hover:text-indigo-600">
                    عرض السجل الكامل <ChevronRight className="w-4 h-4 mr-1" />
                  </Button>
                </Link>
              </CardFooter>
            </Card>

            {/* 3. DAILY CHALLENGE */}
            <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white overflow-hidden relative">
              <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 pattern-dots"></div>
              <CardContent className="p-6 relative z-10 text-center">
                <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                  <Crown className="w-8 h-8 text-yellow-100" />
                </div>
                <h3 className="text-2xl font-bold mb-2 arabic-text">
                  تحدي اليوم! 🌟
                </h3>
                <p className="mb-6 arabic-text text-yellow-50 text-sm">
                  نص قصير ممتع عن "الفضاء" بانتظارك لتقرأه
                </p>
                <Link
                  to={createPageUrl(
                    `CreateCustomExercise?topic=space&studentId=${student.id}&mode=challenge`
                  )}
                >
                  <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold shadow-lg border-0">
                    اقبل التحدي
                  </Button>
                </Link>
              </CardContent>
            </Card>

          </div>
        </div>
      </div>
    </div>
  );
}
