import React, { useState, useEffect, useCallback } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Progress } from "@/components/ui/progress";
import { 
  GraduationCap, Trophy, Star, TrendingUp, Play, Wand2, MessageCircle, 
  Lock, Unlock, Volume2, Crown, Target, Zap, Award, BookOpen, Sparkles, Flame, Gift, Clock, Activity, Settings, User, Mic, Medal 
} from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, LineChart, Line } from 'recharts';

export default function StudentDashboard() {
  const [student, setStudent] = useState(null);
  const [exercises, setExercises] = useState([]);
  const [recentRecordings, setRecentRecordings] = useState([]);
  const [completedExerciseIds, setCompletedExerciseIds] = useState([]);
  const [studentName, setStudentName] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [statsData, setStatsData] = useState([]);
  const [teacherPersona, setTeacherPersona] = useState(localStorage.getItem('teacherPersona') || 'calm');
  
  // Challenge State
  const [challenges, setChallenges] = useState([]);
  const [activeChallenge, setActiveChallenge] = useState(null);
  const [challengeRecording, setChallengeRecording] = useState(false);
  const [mediaRecorder, setMediaRecorder] = useState(null);
  const [audioChunks, setAudioChunks] = useState([]);

  const togglePersona = () => {
    const personas = ['calm', 'strict', 'fun'];
    const nextIndex = (personas.indexOf(teacherPersona) + 1) % personas.length;
    const nextPersona = personas[nextIndex];
    setTeacherPersona(nextPersona);
    localStorage.setItem('teacherPersona', nextPersona);
  };
  
  const getPersonaLabel = (p) => {
     switch(p) {
        case 'calm': return 'المعلم الهادئ 🌿';
        case 'strict': return 'المعلم الحازم 👨‍🏫';
        case 'fun': return 'المعلم المرح 🤡';
        default: return 'المعلم الهادئ';
     }
  };

  const findOrCreateStudent = useCallback(async (name) => {
    setIsLoading(true);
    try {
      const trimmedName = name.trim();
      const allStudents = await base44.entities.Student.list();
      const existingStudent = allStudents.find(s => s.name === trimmedName);
      
      if (existingStudent) {
        await base44.entities.Student.update(existingStudent.id, { 
          last_login: new Date().toISOString() 
        });
        setStudent(existingStudent);
      } else {
        // Generate Access Code
        const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
        let accessCode = "";
        for (let i = 0; i < 8; i++) {
          accessCode += chars.charAt(Math.floor(Math.random() * chars.length));
        }

        const newStudent = await base44.entities.Student.create({
          name: trimmedName,
          level: "مبتدئ",
          access_code: accessCode,
          current_stage: 1,
          last_activity: new Date().toISOString(),
          last_login: new Date().toISOString(),
        });
        setStudent(newStudent);
      }
      localStorage.setItem("studentName", trimmedName);
    } catch (error) {
      console.error("Failed to find/create student:", error);
      alert("حدث خطأ في تحميل البيانات. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  }, []);

  const loadStudentData = useCallback(async () => {
    if (!student) return;

    setIsLoading(true);
    try {
      const exerciseData = await base44.entities.Exercise.list();
      setExercises(exerciseData);
      
      const allRecordings = await base44.entities.Recording.list("-created_date");
      const studentRecordings = allRecordings.filter(r => r.student_id === student.id);
      setRecentRecordings(studentRecordings.slice(0, 5));
      
      const completedIds = studentRecordings.map(r => r.exercise_id);
      setCompletedExerciseIds(completedIds);

      const chartData = studentRecordings
        .slice(0, 7)
        .reverse()
        .map((rec, idx) => ({
          name: `تمرين ${idx + 1}`,
          score: rec.score || 0,
          date: new Date(rec.created_date).toLocaleDateString('ar-AE', { weekday: 'short' })
        }));
      setStatsData(chartData);

      try {
         const allChallenges = await base44.entities.FamilyChallenge.list("-created_date");
         const myChallenges = allChallenges.filter(c => c.student_id === student.id && !c.is_completed);
         setChallenges(myChallenges);
      } catch (e) { console.error("Challenges error", e); }

      } catch (error) {
      console.error("Failed to load student data:", error);
      } finally {
      setIsLoading(false);
      }
      }, [student]);

  useEffect(() => {
    const savedStudentId = localStorage.getItem("studentId");
    if (savedStudentId) {
       base44.entities.Student.get(savedStudentId).then(s => {
          setStudent(s);
          setStudentName(s.name);
       }).catch(() => {
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

  const getLevelProgress = () => {
    if (!student) return 0;
    const maxStage = 10;
    return ((student.current_stage - 1) / (maxStage - 1)) * 100;
  };

  const getNextBadge = () => {
    if (!student) return null;
    const totalExercises = student.total_exercises || 0;
    const averageScore = student.average_score || 0;
    
    if (totalExercises >= 50 && averageScore >= 90) return "خبير النطق 🏆";
    if (totalExercises >= 30 && averageScore >= 85) return "متقن القراءة ⭐";
    if (totalExercises >= 20 && averageScore >= 80) return "قارئ ماهر 📖";
    if (totalExercises >= 10 && averageScore >= 75) return "طالب متميز 🌟";
    if (totalExercises >= 5) return "بداية جيدة 🎯";
    return "أول تمرين 🎉";
  };

  const getCurrentStageExercises = () => {
    if (!student) return [];
    
    return exercises.filter(ex => 
      ex.level === student.level && 
      ex.stage === student.current_stage &&
      !completedExerciseIds.includes(ex.id)
    );
  };

  const generateInfiniteStages = () => {
    const stages = [];
    const currentStage = student?.current_stage || 1;
    
    for (let i = currentStage; i <= currentStage + 5; i++) {
      const isUnlocked = i === currentStage;
      const isCompleted = i < currentStage;
      
      const stageExercises = exercises.filter(ex => 
        ex.level === student?.level && 
        ex.stage === i
      );
      
      const completedCount = stageExercises.filter(ex => 
        completedExerciseIds.includes(ex.id)
      ).length;
      
      stages.push({
        stage: i,
        isUnlocked,
        isCompleted,
        title: `المرحلة ${i}`,
        totalExercises: stageExercises.length,
        completedExercises: completedCount,
        icon: isCompleted ? '✅' : isUnlocked ? '🔓' : '🔒'
      });
    }
    
    return stages;
  };
  
  if (isLoading && !student) {
  return (
  <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-purple-600 via-pink-500 to-orange-500">
  <div className="text-center arabic-text">
    <motion.div
      animate={{ rotate: 360 }}
      transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      className="w-16 h-16 border-4 border-white border-t-transparent rounded-full mx-auto mb-4"
    />
    <p className="text-white text-xl font-bold">جارٍ التحميل...</p>
  </div>
  </div>
  );
  }

  if (!student) {
  window.location.href = createPageUrl("StudentOnboarding");
  return null;
  }

  const currentStageExercises = getCurrentStageExercises();
  const infiniteStages = generateInfiniteStages();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-pink-50 to-orange-50 p-3 md:p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header with Gamification */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="mb-6 md:mb-8"
        >
          <div className="bg-gradient-to-r from-purple-600 via-pink-600 to-orange-600 rounded-2xl md:rounded-3xl p-4 md:p-6 shadow-2xl mb-4 md:mb-6">
            <div className="flex flex-col md:flex-row items-center md:items-start justify-between gap-4">
              <div className="flex flex-col md:flex-row items-center gap-4 text-center md:text-right w-full">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ duration: 2, repeat: Infinity }}
                  className="w-12 h-12 md:w-16 md:h-16 bg-white/20 rounded-full flex items-center justify-center flex-shrink-0"
                >
                  <Crown className="w-6 h-6 md:w-8 md:h-8 text-yellow-300" />
                </motion.div>
                <div className="w-full">
                  <h1 className="text-xl md:text-3xl font-bold text-white arabic-text">
                    مرحباً {student?.name}! 👋
                  </h1>

                  {/* Access Code Display - Ultra Clear */}
                  <div className="mt-4 md:mt-6 w-full max-w-md md:mx-0 bg-white rounded-xl md:rounded-2xl p-4 md:p-6 shadow-2xl border-2 md:border-4 border-yellow-400 text-center mx-auto">
                     <p className="text-indigo-900 font-bold text-sm md:text-lg arabic-text mb-2 md:mb-3">🔑 كود ولي الأمر (Access Code)</p>
                     <div className="bg-indigo-50 rounded-lg md:rounded-xl p-2 md:p-4 mb-2 md:mb-3 border-2 border-indigo-100 overflow-hidden">
                        <p className="text-2xl md:text-5xl font-mono font-black text-indigo-900 tracking-widest md:tracking-[0.3em] select-all break-all" onClick={() => {navigator.clipboard.writeText(student?.access_code); alert("تم نسخ الكود!")}}>
                           {student?.access_code || "----"}
                        </p>
                     </div>
                     <p className="text-indigo-600 text-xs md:text-sm arabic-text font-semibold">انسخ هذا الكود وأعطه لوالديك للدخول ومتابعتك</p>
                  </div>

                  <div className="flex items-center justify-center md:justify-start gap-2 md:gap-3 mt-4 flex-wrap">
                    <Badge className="bg-white/20 text-white text-xs md:text-sm arabic-text border-0">
                      <Star className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                      {student?.level}
                    </Badge>
                    <Badge className="bg-yellow-400 text-yellow-900 text-xs md:text-sm arabic-text border-0 animate-pulse">
                      <Flame className="w-3 h-3 md:w-4 md:h-4 ml-1" />
                      المرحلة {student?.current_stage}
                    </Badge>
                  </div>
                </div>
              </div>

              <div className="flex flex-row md:flex-col items-center md:items-end gap-3 justify-center w-full md:w-auto mt-2 md:mt-0">
                <div className="text-center md:text-right">
                  <div className="text-3xl md:text-5xl font-bold text-white mb-1">{student?.total_exercises || 0}</div>
                  <div className="text-white/80 text-xs md:text-sm arabic-text">تمرين مكتمل 🎯</div>
                </div>
                <Button 
                   size="sm" 
                   onClick={togglePersona}
                   className="bg-white/20 hover:bg-white/30 text-white border-0 arabic-text backdrop-blur-md"
                >
                   <User className="w-4 h-4 ml-2" />
                   {getPersonaLabel(teacherPersona)}
                </Button>
              </div>
            </div>
            
            {/* Progress Bar */}
            <div className="mt-6 bg-white/20 rounded-full p-1">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${getLevelProgress()}%` }}
                transition={{ duration: 1, ease: "easeOut" }}
                className="bg-gradient-to-r from-yellow-400 to-orange-400 h-4 rounded-full flex items-center justify-end px-2"
              >
                <span className="text-xs font-bold text-white">{Math.round(getLevelProgress())}%</span>
              </motion.div>
            </div>
          </div>
        </motion.div>

        {/* Linguistic Identity Card */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8 grid md:grid-cols-2 gap-6">
           <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50 border-2 border-indigo-100">
              <CardHeader>
                 <CardTitle className="arabic-text flex items-center gap-2 text-indigo-900">
                    <Activity className="w-5 h-5 text-indigo-600" />
                    هويتي اللغوية 🆔
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 <div className="flex justify-between items-center mb-4 bg-white p-3 rounded-lg shadow-sm">
                    <div className="text-right">
                       <p className="text-gray-500 text-xs arabic-text">الاسم</p>
                       <p className="font-bold text-indigo-900 arabic-text">{student?.name}</p>
                    </div>
                    <div className="text-right">
                       <p className="text-gray-500 text-xs arabic-text">الصف</p>
                       <p className="font-bold text-indigo-900 arabic-text">{student?.grade}</p>
                    </div>
                    <div className="text-center">
                       <div className="flex text-yellow-400">
                          {[...Array(5)].map((_, i) => <Star key={i} className={`w-4 h-4 ${i < 3 ? 'fill-current' : 'text-gray-300'}`} />)}
                       </div>
                       <p className="text-xs text-gray-400 mt-1 arabic-text">مستوى النطق</p>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="bg-green-50 p-3 rounded-lg border border-green-200 text-center">
                       <p className="text-green-800 text-sm font-bold mb-2 arabic-text">🌟 حروف أتقنتها</p>
                       <div className="flex justify-center gap-2 flex-wrap">
                          {student?.mastered_letters?.length > 0 ? (
                             student.mastered_letters.slice(0, 5).map(c => <span key={c} className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-green-700 shadow-sm">{c}</span>)
                          ) : (
                             <span className="text-xs text-gray-400 arabic-text font-bold">لا يوجد حروف متقنة بعد</span>
                          )}
                       </div>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg border border-orange-200 text-center">
                       <p className="text-orange-800 text-sm font-bold mb-2 arabic-text">💪 أتدرب عليها</p>
                       <div className="flex justify-center gap-2 flex-wrap">
                          {student?.needs_practice_letters?.length > 0 ? (
                             student.needs_practice_letters.slice(0, 5).map(c => <span key={c} className="w-8 h-8 bg-white rounded-full flex items-center justify-center font-bold text-orange-700 shadow-sm">{c}</span>)
                          ) : (
                             <span className="text-xs text-gray-400 arabic-text font-bold">لا يوجد نقاط ضعف</span>
                          )}
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>

           <div className="space-y-6">
              {student?.encouragement_message && (
                 <Card className="border-0 shadow-lg bg-pink-50 border-2 border-pink-100 relative overflow-hidden">
                    <div className="absolute top-0 left-0 p-2 opacity-10"><MessageCircle className="w-24 h-24 text-pink-500" /></div>
                    <CardContent className="p-6 text-center relative z-10">
                       <p className="text-sm text-pink-500 font-bold mb-2 arabic-text">💌 رسالة من والدي اليوم</p>
                       <p className="text-xl text-pink-700 font-bold arabic-text leading-relaxed">"{student.encouragement_message}"</p>
                    </CardContent>
                 </Card>
              )}

              {challenges.length > 0 && (
                 <Card className="border-0 shadow-lg bg-purple-50 border-2 border-purple-100">
                    <CardHeader className="pb-2">
                       <CardTitle className="text-base text-purple-900 arabic-text flex items-center justify-between">
                          <span>🏆 تحدي العائلة الجديد!</span>
                          <Badge className="bg-purple-500">نشط</Badge>
                       </CardTitle>
                    </CardHeader>
                    <CardContent>
                       <p className="text-purple-800 font-bold text-lg text-center mb-4 arabic-text">"{challenges[0].text}"</p>
                       {challenges[0].parent_audio_url && (
                          <div className="mb-4 flex justify-center">
                             <Button size="sm" variant="outline" onClick={() => window.open(challenges[0].parent_audio_url)} className="arabic-text">
                                <Play className="w-4 h-4 ml-2" /> استمع لتحدي بابا/ماما
                             </Button>
                          </div>
                       )}
                       <Button className="w-full bg-purple-600 hover:bg-purple-700 text-white arabic-text">
                          <Mic className="w-4 h-4 ml-2" /> قبول التحدي وتسجيل صوتي
                       </Button>
                    </CardContent>
                 </Card>
              )}
           </div>
        </motion.div>

        {/* Stats Cards */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.1 }}
          className="grid grid-cols-2 md:grid-cols-5 gap-3 md:gap-4 mb-8"
        >
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm arabic-text">المتوسط</p>
                    <p className="text-4xl font-bold">{student?.average_score || 0}%</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-green-100 text-sm arabic-text">الشارات</p>
                    <p className="text-4xl font-bold">{student?.badges?.length || 0}</p>
                  </div>
                  <Award className="w-12 h-12 text-green-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm arabic-text">النقاط</p>
                    <p className="text-4xl font-bold">{(student?.total_exercises || 0) * 10}</p>
                  </div>
                  <Target className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm arabic-text">الشارة التالية</p>
                    <p className="text-lg font-bold">{getNextBadge()}</p>
                  </div>
                  <Gift className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          <Link to={createPageUrl("StudentLessons")} className="block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-full">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-indigo-500 to-indigo-600 text-white h-full cursor-pointer">
                <CardContent className="p-6 flex flex-col justify-center items-center h-full">
                  <BookOpen className="w-12 h-12 text-indigo-200 mb-2" />
                  <p className="text-indigo-100 text-center arabic-text font-semibold">شروحات المعلم</p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link to={createPageUrl("Certificates")} className="block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-full">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white h-full cursor-pointer">
                <CardContent className="p-6 flex flex-col justify-center items-center h-full">
                  <Medal className="w-12 h-12 text-teal-200 mb-2" />
                  <p className="text-teal-100 text-center arabic-text font-semibold">الشهادات والإنجازات</p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>

          <Link to={createPageUrl("Certificates")} className="block">
            <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} className="h-full">
              <Card className="border-0 shadow-xl bg-gradient-to-br from-teal-500 to-teal-600 text-white h-full cursor-pointer">
                <CardContent className="p-6 flex flex-col justify-center items-center h-full">
                  <Medal className="w-12 h-12 text-teal-200 mb-2" />
                  <p className="text-teal-100 text-center arabic-text font-semibold">الشهادات والإنجازات</p>
                </CardContent>
              </Card>
            </motion.div>
          </Link>
        </motion.div>

        {/* Heatmap Section */}
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
           <Card className="border-0 shadow-lg bg-white/80 backdrop-blur-sm">
              <CardHeader>
                 <CardTitle className="arabic-text flex items-center gap-2">
                    <Activity className="w-5 h-5 text-orange-500" />
                    خارطة نطق الحروف (نقاط قوتك)
                 </CardTitle>
              </CardHeader>
              <CardContent>
                 {student?.mastered_letters && student.mastered_letters.length > 0 ? (
                    <div className="flex flex-wrap gap-2 justify-center" dir="rtl">
                       {student.mastered_letters.map((char) => (
                          <div key={char} className="w-10 h-10 rounded-lg flex items-center justify-center font-bold text-lg border-2 border-green-200 bg-green-100 text-green-700 shadow-sm">
                             {char}
                          </div>
                       ))}
                    </div>
                 ) : (
                    <div className="text-center py-8">
                       <p className="text-gray-500 arabic-text mb-2 text-lg">لم يتم تسجيل حروف متقنة بعد 🔤</p>
                       <p className="text-indigo-600 arabic-text">ابدأ التمارين لملء خارطة حروفك وتلوينها! 🚀</p>
                    </div>
                 )}
              </CardContent>
           </Card>
        </motion.div>

        {/* Detailed Stats Section */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
          className="mb-8"
        >
          <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
            <CardHeader>
               <CardTitle className="text-xl font-bold arabic-text flex items-center gap-2">
                  <Activity className="w-6 h-6 text-blue-600" />
                  تحليل الأداء الأسبوعي
               </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="h-[250px] w-full">
                {statsData.length > 0 ? (
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={statsData}>
                      <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
                      <XAxis dataKey="date" stroke="#888888" fontSize={12} tickLine={false} axisLine={false} />
                      <YAxis stroke="#888888" fontSize={12} tickLine={false} axisLine={false} tickFormatter={(value) => `${value}%`} />
                      <Tooltip 
                        contentStyle={{ backgroundColor: '#fff', borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                        cursor={{ fill: 'rgba(0,0,0,0.05)' }}
                      />
                      <Bar dataKey="score" fill="#8884d8" radius={[4, 4, 0, 0]} name="الدرجة">
                        {statsData.map((entry, index) => (
                          <cell key={`cell-${index}`} fill={entry.score >= 90 ? '#22c55e' : entry.score >= 70 ? '#f59e0b' : '#ef4444'} />
                        ))}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                ) : (
                   <div className="flex items-center justify-center h-full text-gray-400 arabic-text">
                     لا توجد بيانات كافية للعرض بعد
                   </div>
                )}
              </div>

              <div className="mt-6 grid grid-cols-1 md:grid-cols-3 gap-4">
                 <div className="bg-blue-50 p-4 rounded-xl border border-blue-100">
                    <div className="flex items-center gap-2 mb-2 text-blue-800 font-bold arabic-text">
                       <Clock className="w-4 h-4" />
                       وقت التدريب
                    </div>
                    <div className="text-2xl font-bold text-blue-900">{student?.total_minutes || 0} دقيقة</div>
                 </div>
                 <div className="bg-purple-50 p-4 rounded-xl border border-purple-100">
                    <div className="flex items-center gap-2 mb-2 text-purple-800 font-bold arabic-text">
                       <Zap className="w-4 h-4" />
                       أفضل أداء
                    </div>
                    <div className="text-2xl font-bold text-purple-900">
                       {recentRecordings.length > 0 ? Math.max(...recentRecordings.map(r => r.score || 0)) : 0}%
                    </div>
                 </div>
                 <div className="bg-orange-50 p-4 rounded-xl border border-orange-100">
                    <div className="flex items-center gap-2 mb-2 text-orange-800 font-bold arabic-text">
                       <Award className="w-4 h-4" />
                       آخر نشاط
                    </div>
                    <div className="text-lg font-bold text-orange-900 arabic-text">
                       {student?.last_activity ? new Date(student.last_activity).toLocaleDateString('ar-AE') : 'اليوم'}
                    </div>
                    <p className="text-xs text-orange-600 arabic-text">تاريخ آخر تفاعل</p>
                 </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Infinite Journey Map & Skills */}
        <div className="grid lg:grid-cols-3 gap-8">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.2 }}
            className="lg:col-span-2 space-y-6"
          >
            {/* Journey Map Visual */}
            <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
               <CardHeader className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-t-xl">
                  <CardTitle className="text-2xl font-bold arabic-text flex items-center gap-2">
                     <Zap className="w-6 h-6" />
                     🗺️ خريطة رحلة النطق
                  </CardTitle>
               </CardHeader>
               <CardContent className="p-8">
                  <div className="relative">
                     {/* Connecting Line */}
                     <div className="absolute left-1/2 top-0 bottom-0 w-2 bg-indigo-100 -ml-1 rounded-full hidden md:block"></div>
                     
                     <div className="space-y-12">
                        {infiniteStages.map((stage, index) => (
                           <motion.div 
                              key={stage.stage}
                              initial={{ opacity: 0, y: 20 }}
                              animate={{ opacity: 1, y: 0 }}
                              transition={{ delay: index * 0.15 }}
                              className={`relative flex items-center md:justify-center ${index % 2 === 0 ? 'md:flex-row' : 'md:flex-row-reverse'} flex-col gap-8`}
                           >
                              {/* Stage Node */}
                              <div className={`z-10 w-24 h-24 rounded-full flex items-center justify-center border-8 shadow-xl transition-all duration-500 ${
                                 stage.isCompleted ? 'bg-green-500 border-green-200 scale-100' :
                                 stage.isUnlocked ? 'bg-white border-indigo-500 scale-110 ring-4 ring-indigo-200 animate-pulse' :
                                 'bg-gray-200 border-gray-300 grayscale'
                              }`}>
                                 <span className="text-3xl">{stage.isCompleted ? '⭐' : stage.isUnlocked ? '🚀' : '🔒'}</span>
                              </div>
                              
                              {/* Stage Card */}
                              <div className={`md:w-5/12 w-full`}>
                                 <Card className={`border-2 transform transition-all hover:scale-105 ${
                                    stage.isUnlocked ? 'border-indigo-500 bg-indigo-50 shadow-md' : 'border-gray-200 bg-gray-50 opacity-80'
                                 }`}>
                                    <CardContent className="p-4 text-center">
                                       <h3 className="font-bold text-lg arabic-text text-indigo-900 mb-1">{stage.title}</h3>
                                       <div className="text-sm text-gray-600 mb-3 arabic-text">
                                          {stage.completedExercises} / {stage.totalExercises} تمارين
                                       </div>
                                       
                                       {stage.isUnlocked && !stage.isCompleted && (
                                          <Link to={createPageUrl(`Exercise?id=${currentStageExercises[0]?.id || ''}&studentId=${student.id}`)}>
                                             <Button className="w-full bg-indigo-600 hover:bg-indigo-700 text-white arabic-text">
                                                <Play className="w-4 h-4 ml-2" />
                                                تابع الرحلة
                                             </Button>
                                          </Link>
                                       )}
                                    </CardContent>
                                 </Card>
                              </div>
                              
                              {/* Empty space for alignment */}
                              <div className="hidden md:block md:w-5/12"></div>
                           </motion.div>
                        ))}
                     </div>
                  </div>
               </CardContent>
            </Card>

            {/* Skill Cards */}
            <div className="grid md:grid-cols-2 gap-4">
               <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-2 border-green-200">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                           <TrendingUp className="w-6 h-6 text-green-600" />
                        </div>
                        <div>
                           <h3 className="font-bold text-green-900 arabic-text">نقاط القوة 💪</h3>
                           <p className="text-xs text-green-700 arabic-text">أنت مبدع في هذه المهارات</p>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {student?.mastered_letters?.length > 0 
                           ? student.mastered_letters.map(l => <Badge key={l} className="bg-green-200 text-green-800 hover:bg-green-300">{l}</Badge>)
                           : <span className="text-sm text-gray-500 arabic-text">أكمل التمارين لاكتشاف نقاط قوتك!</span>
                        }
                     </div>
                  </CardContent>
               </Card>

               <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-2 border-orange-200">
                  <CardContent className="p-6">
                     <div className="flex items-center gap-3 mb-4">
                        <div className="w-10 h-10 bg-orange-100 rounded-full flex items-center justify-center">
                           <Target className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                           <h3 className="font-bold text-orange-900 arabic-text">تحتاج لتركيز 🎯</h3>
                           <p className="text-xs text-orange-700 arabic-text">فرصتك للتحسن هنا</p>
                        </div>
                     </div>
                     <div className="flex flex-wrap gap-2">
                        {student?.weak_points?.length > 0 
                           ? student.weak_points.map(l => <Badge key={l} variant="outline" className="bg-white text-orange-800 border-orange-300">{l}</Badge>)
                           : <span className="text-sm text-gray-500 arabic-text">نطقك ممتاز! لا توجد ملاحظات حالياً.</span>
                        }
                     </div>
                  </CardContent>
               </Card>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.3 }}
            className="space-y-6"
          >
             {/* Daily Challenge Card */}
             <Card className="border-0 shadow-xl bg-gradient-to-br from-yellow-400 to-orange-500 text-white overflow-hidden relative">
               <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-30 pattern-dots"></div>
               <CardContent className="p-6 relative z-10 text-center">
                  <div className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
                     <Crown className="w-8 h-8 text-yellow-100" />
                  </div>
                  <h3 className="text-2xl font-bold mb-2 arabic-text">تحدي اليوم! 🌟</h3>
                  <p className="mb-6 arabic-text text-yellow-50">نص قصير ممتع عن "الفضاء" بانتظارك</p>
                  <Link to={createPageUrl(`CreateCustomExercise?topic=space&studentId=${student.id}&mode=challenge`)}>
                     <Button className="w-full bg-white text-orange-600 hover:bg-orange-50 font-bold text-lg arabic-text shadow-lg">
                        اقبل التحدي
                     </Button>
                  </Link>
               </CardContent>
             </Card>

             {/* Recent Feedback Link */}
             <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
              <CardHeader className="bg-gradient-to-r from-blue-600 to-cyan-600 text-white rounded-t-xl">
                <CardTitle className="text-lg font-bold arabic-text flex items-center gap-2">
                  <MessageCircle className="w-5 h-5" />
                  📝 سجل التعليقات الذكي
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6">
                <p className="text-sm text-gray-600 mb-4 arabic-text">
                  راجع كل تفاصيل أدائك وتعليقات المعلم في مكان واحد.
                </p>
                <Link to={createPageUrl("FeedbackLog")}>
                  <Button variant="outline" className="w-full border-blue-200 text-blue-700 hover:bg-blue-50 arabic-text">
                     <BookOpen className="w-4 h-4 ml-2" />
                     فتح السجل الكامل
                  </Button>
                </Link>
              </CardContent>
             </Card>

             {/* Recent Feedback Mini View */}
             <Card className="border-0 shadow-lg bg-white/90">
              <CardContent className="p-4">
                 <h4 className="font-bold text-gray-800 mb-3 arabic-text text-sm border-b pb-2">آخر الأنشطة</h4>
                {recentRecordings.length > 0 ? (
                  <div className="space-y-3">
                    {recentRecordings.slice(0, 3).map((recording) => (
                      <div key={recording.id} className="text-right">
                         <div className="flex justify-between items-center mb-1">
                            <span className="text-xs font-bold text-gray-700 arabic-text">
                               {new Date(recording.created_date).toLocaleDateString('ar-AE')}
                            </span>
                            <Badge className={recording.score >= 85 ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-800"}>
                               {recording.score}%
                            </Badge>
                         </div>
                         <p className="text-xs text-gray-500 truncate arabic-text">
                            {recording.feedback || "لا يوجد تعليق"}
                         </p>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-400 text-center py-4 text-sm arabic-text">لا توجد تسجيلات بعد</p>
                )}
              </CardContent>
             </Card>

             {/* Extra Challenge */}
             <Link to={createPageUrl(`CreateCustomExercise?studentId=${student.id}`)} className="block">
               <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                 <Card className="border-0 shadow-2xl bg-gradient-to-br from-orange-500 to-red-500 text-white hover:shadow-3xl transition-all duration-300 cursor-pointer">
                   <CardContent className="p-6 text-center">
                     <motion.div
                       animate={{ rotate: [0, 10, -10, 0] }}
                       transition={{ duration: 2, repeat: Infinity }}
                       className="w-16 h-16 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
                     >
                       <Wand2 className="w-8 h-8" />
                     </motion.div>
                     <h2 className="text-2xl font-bold arabic-text mb-2">🎯 تحدي إضافي!</h2>
                     <p className="arabic-text text-orange-100">أنشئ تمرينك الخاص واختبر نفسك</p>
                   </CardContent>
                 </Card>
               </motion.div>
             </Link>
          </motion.div>
        </div>
      </div>
    </div>
  );
}