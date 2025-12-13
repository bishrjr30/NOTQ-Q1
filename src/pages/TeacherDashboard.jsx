import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Users, TrendingUp, Award, Volume2, MessageSquare, CheckCircle, Trash2, AlertTriangle, Mic, RefreshCw, BookOpen, Play, UserX, Image, Video, ExternalLink, Plus, FolderPlus, Activity, Zap, Settings, Trophy } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, Radar } from 'recharts';
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import AudioPlayerModal from "../components/teacher/AudioPlayerModal";
import CommentModal from "../components/teacher/CommentModal";
import DeleteConfirmDialog from "../components/teacher/DeleteConfirmDialog";
import AudioCommentModal from "../components/teacher/AudioCommentModal";
import { Checkbox } from "@/components/ui/checkbox";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from "@/components/ui/dialog";

function SettingsTab() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await base44.entities.SystemSetting.list();
      const keySetting = settings.find(s => s.key === "openai_api_key");
      if (keySetting) setApiKey(keySetting.value);
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const saveSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await base44.entities.SystemSetting.list();
      const existing = settings.find(s => s.key === "openai_api_key");

      if (existing) {
        await base44.entities.SystemSetting.update(existing.id, { value: apiKey });
      } else {
        await base44.entities.SystemSetting.create({
          key: "openai_api_key",
          value: apiKey,
          description: "OpenAI API Key for Audio Analysis"
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      alert("فشل حفظ الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-slate-900 arabic-text flex items-center gap-2">
          <Settings className="w-6 h-6" />
          إعدادات الذكاء الاصطناعي
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
          <h3 className="font-bold text-yellow-800 mb-2 arabic-text">⚠️ هام جداً لضمان عمل التحليل</h3>
          <p className="text-yellow-700 arabic-text text-sm">
            لضمان حصول الطلاب على تحليل دقيق ومضمون 100%، يرجى إدخال مفتاح OpenAI API الخاص بك (Your Own Key).
            <br />
            المفاتيح المجانية قد تتوقف عن العمل وتسبب أخطاء في التحليل.
          </p>
        </div>

        <div className="space-y-2">
          <Label className="arabic-text">OpenAI API Key (sk-...)</Label>
          <div className="flex gap-2">
            <Input 
              type="password" 
              value={apiKey} 
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="font-mono"
            />
            <Button onClick={saveSettings} disabled={isLoading} className="arabic-text min-w-[100px]">
              {isLoading ? "جاري الحفظ..." : "حفظ"}
            </Button>
          </div>
          {saved && <p className="text-green-600 text-sm arabic-text font-bold">✅ تم حفظ المفتاح بنجاح</p>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function TeacherDashboard() {
  const [students, setStudents] = useState([]);
  const [recordings, setRecordings] = useState([]);
  const [lessons, setLessons] = useState([]);
  const [groups, setGroups] = useState([]);
  const [newGroupData, setNewGroupData] = useState({ name: "", description: "" });
  const [isGroupDialogOpen, setIsGroupDialogOpen] = useState(false);
  const [selectedStudentsForGroup, setSelectedStudentsForGroup] = useState([]);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [emergencyLoading, setEmergencyLoading] = useState(null);

  // Mock Radar Data for Class Overview
  const radarData = [
    { subject: 'الحروف الحلقية', A: 85, fullMark: 100 },
    { subject: 'المدود', A: 65, fullMark: 100 },
    { subject: 'الشدة', A: 40, fullMark: 100 },
    { subject: 'اللام الشمسية', A: 90, fullMark: 100 },
    { subject: 'التنوين', A: 70, fullMark: 100 },
    { subject: 'مخارج الحروف', A: 55, fullMark: 100 },
  ];
  const [password, setPassword] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [lastRefresh, setLastRefresh] = useState(Date.now());
  const [error, setError] = useState(null);

  // State for modals
  const [audioModalState, setAudioModalState] = useState({ isOpen: false, url: '', studentName: '' });
  const [commentModalState, setCommentModalState] = useState({ isOpen: false, recording: null });
  const [deleteModalState, setDeleteModalState] = useState({
    isOpen: false,
    type: '',
    recordingId: null,
    lessonId: null,
    studentId: null, // Added studentId to state
    isDeleting: false
  });
  const [audioCommentModalState, setAudioCommentModalState] = useState({ isOpen: false, recording: null });

  const TEACHER_PASSWORD = "teacher123";

  // Format UAE time
  const formatUAETime = (date) => {
    return new Intl.DateTimeFormat('ar-AE', {
      timeZone: 'Asia/Dubai',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false
    }).format(date);
  };

  useEffect(() => {
    if (isAuthenticated) {
      loadData();
      const interval = setInterval(() => {
        loadData(true);
      }, 30000);
      return () => clearInterval(interval);
    } else {
      setIsLoading(false);
    }
  }, [isAuthenticated]);

  const loadData = async (isBackground = false) => {
    if (isBackground !== true) setIsLoading(true);
    setError(null);
    try {
      const studentsData = await base44.entities.Student.list("-last_activity");
      setStudents(studentsData || []);

      const recordingsData = await base44.entities.Recording.list("-created_date", 100);
      setRecordings(recordingsData || []);

      const lessonsData = await base44.entities.Lesson.list("-created_date");
      setLessons(lessonsData || []);

      const groupsData = await base44.entities.StudentGroup.list();
      setGroups(groupsData || []);

      setLastRefresh(Date.now());
    } catch (error) {
      console.error("Failed to load data:", error);
      setError(`فشل في تحميل البيانات: ${error.message}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLogin = () => {
    if (password === TEACHER_PASSWORD) {
      setIsAuthenticated(true);
    } else {
      alert("كلمة المرور غير صحيحة");
    }
  };

  const handleCommentSent = (recordingId, newComment, type = 'text') => {
    setRecordings(prev =>
      prev.map(r => r.id === recordingId ? {
        ...r,
        ...(type === 'text' ? { teacher_comment: newComment } : { teacher_audio_comment: newComment })
      } : r)
    );
    setTimeout(() => loadData(), 1000);
  };

  const handleScoreUpdate = async (recordingId, score) => {
    try {
      await base44.entities.Recording.update(recordingId, { score: parseInt(score) });
      setRecordings(prev =>
        prev.map(r => r.id === recordingId ? { ...r, score: parseInt(score) } : r)
      );
    } catch (error) {
      console.error("Failed to update score:", error);
      alert("فشل في تحديث الدرجة.");
    }
  };

  const handleDeleteStudent = async (studentId) => {
    setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

    try {
      // حذف جميع تسجيلات الطالب أولاً
      const studentRecordings = recordings.filter(r => r.student_id === studentId);
      for (const recording of studentRecordings) {
        await base44.entities.Recording.delete(recording.id);
      }
      
      // حذف الطالب
      await base44.entities.Student.delete(studentId);
      setStudents(prev => prev.filter(s => s.id !== studentId));
      setDeleteModalState({ isOpen: false, type: '', recordingId: null, lessonId: null, studentId: null, isDeleting: false });
      
      // إعادة تحميل البيانات
      loadData();
    } catch (error) {
      console.error("Failed to delete student:", error);
      alert("فشل في حذف الطالب. يرجى المحاولة مرة أخرى.");
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleDeleteSingle = async (recordingId) => {
    setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

    try {
      await base44.entities.Recording.delete(recordingId);
      setRecordings(prev => prev.filter(r => r.id !== recordingId));
      setDeleteModalState({ isOpen: false, type: '', recordingId: null, lessonId: null, studentId: null, isDeleting: false });
    } catch (error) {
      console.error("Failed to delete recording:", error);
      alert("فشل في حذف التسجيل. يرجى المحاولة مرة أخرى.");
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleDeleteLesson = async (lessonId) => {
    setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

    try {
      await base44.entities.Lesson.delete(lessonId);
      setLessons(prev => prev.filter(l => l.id !== lessonId));
      setDeleteModalState({ isOpen: false, type: '', recordingId: null, lessonId: null, studentId: null, isDeleting: false });
    } catch (error) {
      console.error("Failed to delete lesson:", error);
      alert("فشل في حذف الدرس. يرجى المحاولة مرة أخرى.");
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleDeleteAll = async () => {
    setDeleteModalState(prev => ({ ...prev, isDeleting: true }));

    try {
      for (const recording of recordings) {
        await base44.entities.Recording.delete(recording.id);
      }
      setRecordings([]);
      setDeleteModalState({ isOpen: false, type: '', recordingId: null, lessonId: null, studentId: null, isDeleting: false });
    } catch (error) {
      console.error("Failed to delete all recordings:", error);
      alert("فشل في حذف التسجيلات. يرجى المحاولة مرة أخرى.");
      setDeleteModalState(prev => ({ ...prev, isDeleting: false }));
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupData.name) return;

    try {
      await base44.entities.StudentGroup.create({
        name: newGroupData.name,
        description: newGroupData.description,
        student_ids: selectedStudentsForGroup,
        teacher_id: "admin" // In real app, this would be the logged in user ID
      });

      setNewGroupData({ name: "", description: "" });
      setSelectedStudentsForGroup([]);
      setIsGroupDialogOpen(false);
      loadData();
    } catch (error) {
      console.error("Failed to create group:", error);
      alert("فشل إنشاء المجموعة");
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("هل أنت متأكد من حذف هذه المجموعة؟")) return;
    try {
      await base44.entities.StudentGroup.delete(groupId);
      loadData();
    } catch (error) {
      console.error("Failed to delete group:", error);
    }
  };

  const toggleLeaderboardVisibility = async (student) => {
    try {
      const newValue = student.show_on_leaderboard === false ? true : false;
      await base44.entities.Student.update(student.id, { show_on_leaderboard: newValue });
      setStudents(prev => prev.map(s => s.id === student.id ? { ...s, show_on_leaderboard: newValue } : s));
    } catch (e) {
      console.error("Failed to update leaderboard visibility", e);
      alert("فشل التحديث");
    }
  };

  const handleEmergencyDrill = async (student) => {
        setEmergencyLoading(student.id);
      try {
          // Generate targeted content via LLM
          const prompt = `
            أنشئ "وصفة علاجية لغوية" سريعة للطالب: ${student.name}.
            مستواه: ${student.level}.

            المطلوب:
            فقرة قصيرة جداً (30 كلمة) مشكولة بالكامل تشكيلاً تاماً وصحيحاً (100% Fully Vowelized).
            تركز الفقرة على مخارج الحروف الصعبة والشدة.

            المخرجات JSON:
            { "text": "النص المشكول هنا" }
          `;

          const res = await base44.integrations.Core.InvokeLLM({
              prompt: prompt,
              response_json_schema: { type: "object", properties: { text: { type: "string" } } }
          });

          if (res && res.text) {
               await base44.entities.Exercise.create({
                  sentence: res.text,
                  level: student.level,
                  stage: student.current_stage || 1,
                  category: "علاج لغوي",
                  difficulty_points: 20,
                  word_count: res.text.split(" ").length
               });
               alert(`تم إنشاء تمرين علاجي للطالب ${student.name} بنجاح!`);
          }
      } catch (e) {
          console.error(e);
          alert("حدث خطأ أثناء إنشاء تمرين الطوارئ.");
      } finally {
          setEmergencyLoading(null);
      }
  };

  const getOverallStats = () => {
    const totalStudents = students.length;
    const totalRecordings = recordings.length;
    const averageScore = recordings.length > 0
      ? Math.round(recordings.filter(r => r.score).reduce((sum, r) => sum + (r.score || 0), 0) / recordings.filter(r => r.score).length)
      : 0;
    const activeStudents = students.filter(s => {
      const lastActivity = new Date(s.last_activity || s.created_date);
      const daysSinceActivity = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24);
      return daysSinceActivity <= 7;
    }).length;

    return { totalStudents, totalRecordings, averageScore, activeStudents };
  };

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-slate-50 to-blue-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5 }}
        >
          <Card className="w-full max-w-md shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
            <CardHeader className="text-center pb-4">
              <div className="w-16 h-16 bg-gradient-to-r from-blue-500 to-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="w-8 h-8 text-white" />
              </div>
              <CardTitle className="text-2xl font-bold text-slate-900 arabic-text">
                تسجيل دخول المعلم
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <Input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="كلمة المرور"
                  className="text-right arabic-text"
                  onKeyPress={(e) => e.key === 'Enter' && handleLogin()}
                />
              </div>

              <Button
                onClick={handleLogin}
                className="w-full bg-gradient-to-r from-blue-500 to-blue-600 hover:from-blue-600 hover:to-blue-700 text-white py-6 rounded-xl arabic-text"
              >
                دخول
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center arabic-text">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-slate-600">جارٍ تحميل البيانات...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Card className="max-w-md w-full mx-4">
          <CardContent className="p-6 text-center">
            <AlertTriangle className="w-16 h-16 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-red-600 mb-2 arabic-text">خطأ في التحميل</h3>
            <p className="text-red-500 mb-4 arabic-text">{error}</p>
            <Button onClick={loadData} className="arabic-text">
              <RefreshCw className="w-4 h-4 ml-2" />
              إعادة المحاولة
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const stats = getOverallStats();

  return (
    <>
      <AudioPlayerModal
        isOpen={audioModalState.isOpen}
        onClose={() => setAudioModalState({ isOpen: false, url: '', studentName: '' })}
        audioUrl={audioModalState.url}
        studentName={audioModalState.studentName}
      />
      <CommentModal
        isOpen={commentModalState.isOpen}
        onClose={() => setCommentModalState({ isOpen: false, recording: null })}
        recording={commentModalState.recording}
        onCommentSent={handleCommentSent}
      />
      <DeleteConfirmDialog
        isOpen={deleteModalState.isOpen}
        onClose={() => setDeleteModalState({ isOpen: false, type: '', recordingId: null, lessonId: null, studentId: null, isDeleting: false })}
        onConfirm={
          deleteModalState.type === 'all' 
            ? handleDeleteAll 
            : deleteModalState.type === 'lesson'
              ? () => handleDeleteLesson(deleteModalState.lessonId)
              : deleteModalState.type === 'student'
                ? () => handleDeleteStudent(deleteModalState.studentId)
                : () => handleDeleteSingle(deleteModalState.recordingId)
        }
        type={deleteModalState.type}
        isDeleting={deleteModalState.isDeleting}
      />

      <AudioCommentModal
        isOpen={audioCommentModalState.isOpen}
        onClose={() => setAudioCommentModalState({ isOpen: false, recording: null })}
        recording={audioCommentModalState.recording}
        onCommentSent={handleCommentSent}
      />

      <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50 p-6">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="mb-8"
          >
            <div className="flex items-center justify-between mb-6">
              <div>
                <h1 className="text-3xl font-bold text-slate-900 arabic-text">
                  لوحة تحكم المعلم 👩‍🏫
                </h1>
                <p className="text-slate-600 arabic-text mt-1">
                  متابعة أداء الطلاب وتقدمهم في تعلّم النطق
                </p>
                <p className="text-xs text-slate-400 mt-1">
                  آخر تحديث (توقيت الإمارات): {formatUAETime(new Date(lastRefresh))}
                </p>
              </div>
              <div className="flex gap-2 flex-wrap">
                <Link to="/CreateLesson">
                  <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white arabic-text">
                    <BookOpen className="w-4 h-4 ml-2" />
                    شرح درس جديد
                  </Button>
                </Link>
                <Button
                  onClick={loadData}
                  variant="outline"
                  size="sm"
                  className="arabic-text"
                  disabled={isLoading}
                >
                  <RefreshCw className={`w-4 h-4 ml-1 ${isLoading ? 'animate-spin' : ''}`} />
                  تحديث
                </Button>
                <Button
                  onClick={() => setIsAuthenticated(false)}
                  variant="outline"
                  className="arabic-text"
                >
                  تسجيل الخروج
                </Button>
              </div>
            </div>
          </motion.div>

          {/* Stats Cards */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.1 }}
            className="grid md:grid-cols-4 gap-6 mb-8"
          >
            <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-blue-100 text-sm arabic-text">إجمالي الطلاب</p>
                    <p className="text-3xl font-bold">{stats.totalStudents}</p>
                  </div>
                  <Users className="w-12 h-12 text-blue-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-emerald-500 to-emerald-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-emerald-100 text-sm arabic-text">الطلاب النشطون</p>
                    <p className="text-3xl font-bold">{stats.activeStudents}</p>
                  </div>
                  <TrendingUp className="w-12 h-12 text-emerald-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-500 to-orange-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-orange-100 text-sm arabic-text">إجمالي التسجيلات</p>
                    <p className="text-3xl font-bold">{stats.totalRecordings}</p>
                  </div>
                  <Volume2 className="w-12 h-12 text-orange-200" />
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg bg-gradient-to-r from-purple-500 to-purple-600 text-white">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-purple-100 text-sm arabic-text">متوسط الدرجات</p>
                    <p className="text-3xl font-bold">{stats.averageScore}%</p>
                  </div>
                  <Award className="w-12 h-12 text-purple-200" />
                </div>
              </CardContent>
            </Card>
            </motion.div>

            {/* Class Radar Chart */}
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mb-8">
             <Card className="border-0 shadow-xl bg-white/90 backdrop-blur">
                <CardHeader>
                   <CardTitle className="arabic-text text-xl flex items-center gap-2">
                      <Activity className="w-6 h-6 text-indigo-600" />
                      رادار الصف (نقاط القوة والضعف الجماعية)
                   </CardTitle>
                </CardHeader>
                <CardContent>
                   <div className="h-[300px] w-full flex items-center justify-center">
                      <ResponsiveContainer width="100%" height="100%">
                         <RadarChart cx="50%" cy="50%" outerRadius="80%" data={radarData}>
                            <PolarGrid />
                            <PolarAngleAxis dataKey="subject" fontFamily="Cairo" fontSize={14} />
                            <PolarRadiusAxis angle={30} domain={[0, 100]} />
                            <Radar name="الصف" dataKey="A" stroke="#8884d8" fill="#8884d8" fillOpacity={0.6} />
                            <Tooltip />
                         </RadarChart>
                      </ResponsiveContainer>
                   </div>
                   <p className="text-center text-slate-500 text-sm arabic-text mt-4">
                      يُظهر هذا المخطط متوسط أداء الطلاب في المهارات اللغوية المختلفة
                   </p>
                </CardContent>
             </Card>
            </motion.div>

          {/* Main Content */}
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
          >
            <Tabs defaultValue="recordings" className="space-y-6">
              <TabsList className="flex w-full flex-wrap bg-white/60 backdrop-blur-sm h-auto p-1 gap-1">
                <TabsTrigger value="recordings" className="arabic-text flex-1 min-w-[120px]">التسجيلات ({recordings.length})</TabsTrigger>
                <TabsTrigger value="lessons" className="arabic-text flex-1 min-w-[100px]">الدروس</TabsTrigger>
                <TabsTrigger value="students" className="arabic-text flex-1 min-w-[100px]">الطلاب</TabsTrigger>
                <TabsTrigger value="leaderboard" className="arabic-text flex-1 min-w-[120px]">لوحة الصدارة 🏆</TabsTrigger>
                <TabsTrigger value="groups" className="arabic-text flex-1 min-w-[100px]">المجموعات</TabsTrigger>
                <TabsTrigger value="classboard" className="arabic-text flex-1 min-w-[120px]">لوحة الصف</TabsTrigger>
                <TabsTrigger value="settings" className="arabic-text flex-1 min-w-[100px]">الإعدادات</TabsTrigger>
              </TabsList>

              <TabsContent value="recordings">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-slate-900 arabic-text">
                        التسجيلات الصوتية للتقييم
                      </CardTitle>
                      {recordings.length > 0 && (
                        <Button
                          variant="destructive"
                          size="sm"
                          onClick={() => setDeleteModalState({ isOpen: true, type: 'all', recordingId: null, lessonId: null, studentId: null, isDeleting: false })}
                          className="arabic-text flex items-center gap-2"
                        >
                          <Trash2 className="w-4 h-4" />
                          حذف جميع التسجيلات
                        </Button>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {recordings.length > 0 ? recordings.map((recording) => {
                        const student = students.find(s => s.id === recording.student_id);

                        return (
                          <div key={recording.id} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-all bg-white">
                            <div className="flex items-center justify-between mb-4">
                              <div className="flex items-center gap-3">
                                <div className="font-semibold text-lg text-slate-900 arabic-text">
                                  {student?.name || "طالب غير معروف"}
                                </div>
                                <Badge variant="outline" className="arabic-text">
                                  {student?.level}
                                </Badge>
                                <span className="text-sm text-slate-500">
                                  {formatUAETime(new Date(recording.created_date))}
                                </span>
                              </div>
                              <div className="flex items-center gap-2">
                                <Input
                                  type="number"
                                  min="0"
                                  max="100"
                                  value={recording.score || ''}
                                  onChange={(e) => handleScoreUpdate(recording.id, e.target.value)}
                                  placeholder="الدرجة"
                                  className="w-20 text-center"
                                />
                                <span className="text-sm font-medium">/ 100</span>
                              </div>
                            </div>

                            {recording.feedback && (
                              <div className="bg-slate-50 rounded-lg p-3 mb-4">
                                <p className="text-sm text-slate-700 arabic-text">
                                  <strong>الملاحظات:</strong> {recording.feedback}
                                </p>
                              </div>
                            )}

                             {recording.teacher_comment && (
                                <div className="bg-blue-50 rounded-lg p-3 mb-4 border-r-4 border-blue-500">
                                  <p className="text-sm text-blue-800 arabic-text flex items-start gap-2">
                                    <MessageSquare className="w-4 h-4 mt-1 flex-shrink-0" />
                                    <span><strong>تعليقك:</strong> {recording.teacher_comment}</span>
                                  </p>
                                </div>
                              )}

                            {recording.teacher_audio_comment && (
                              <div className="bg-green-50 rounded-lg p-3 mb-4 border-r-4 border-green-500">
                                <p className="text-sm text-green-800 arabic-text flex items-center gap-2 mb-2">
                                  <Volume2 className="w-4 h-4" />
                                  <strong>تعليقك الصوتي:</strong>
                                </p>
                                <audio controls className="w-full">
                                  <source src={recording.teacher_audio_comment} type="audio/webm" />
                                  <source src={recording.teacher_audio_comment} type="audio/mp4" />
                                  متصفحك لا يدعم تشغيل الصوت.
                                </audio>
                              </div>
                            )}

                            <div className="flex items-center gap-3 flex-wrap">
                              {recording.audio_url === 'pending_upload' ? (
                                <Button
                                  size="sm"
                                  disabled
                                  className="arabic-text bg-gray-400 cursor-not-allowed"
                                  title="لم يتم حفظ الملف الصوتي بسبب تجاوز حد الباقة"
                                >
                                  <AlertTriangle className="w-4 h-4 ml-1" />
                                  تسجيل غير محفوظ
                                </Button>
                              ) : (
                                <Button
                                  size="sm"
                                  className="arabic-text bg-blue-600 hover:bg-blue-700"
                                  onClick={() => setAudioModalState({ isOpen: true, url: recording.audio_url, studentName: student?.name || '' })}
                                >
                                  <Volume2 className="w-4 h-4 ml-1" />
                                  استمع للتسجيل
                                </Button>
                              )}

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setCommentModalState({ isOpen: true, recording: recording })}
                                className="arabic-text border-green-500 text-green-700 hover:bg-green-50"
                              >
                                {recording.teacher_comment ? <CheckCircle className="w-4 h-4 ml-1 text-green-600" /> : <MessageSquare className="w-4 h-4 ml-1" />}
                                {recording.teacher_comment ? 'تعديل التعليق' : 'أضف تعليق'}
                              </Button>

                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => setAudioCommentModalState({ isOpen: true, recording: recording })}
                                className="arabic-text border-purple-500 text-purple-700 hover:bg-purple-50"
                              >
                                <Mic className="w-4 h-4 ml-1" />
                                {recording.teacher_audio_comment ? 'تعديل التعليق الصوتي' : 'تعليق صوتي'}
                              </Button>

                              <Button
                                size="sm"
                                variant="destructive"
                                onClick={() => setDeleteModalState({ isOpen: true, type: 'single', recordingId: recording.id, lessonId: null, studentId: null, isDeleting: false })}
                                className="arabic-text"
                              >
                                <Trash2 className="w-4 h-4 ml-1" />
                                حذف
                              </Button>
                            </div>
                          </div>
                        );
                      }) : (
                        <div className="text-center py-12 text-slate-500 arabic-text">
                          <AlertTriangle className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">لا توجد تسجيلات جديدة</h3>
                          <p>لم يرسل الطلاب أي تسجيلات صوتية بعد.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="lessons">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 arabic-text">
                      إدارة الدروس المسجلة
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {lessons.length > 0 ? lessons.map((lesson) => (
                        <div key={lesson.id} className="border border-slate-200 rounded-lg p-6 hover:shadow-md transition-all bg-white">
                          <div className="flex items-start justify-between mb-4">
                            <div className="flex-1">
                              <h3 className="text-lg font-bold text-slate-900 arabic-text mb-2">
                                {lesson.title}
                              </h3>
                              <div className="flex items-center gap-3 flex-wrap mb-3">
                                <Badge className="bg-blue-100 text-blue-800 arabic-text">
                                  {lesson.grade}
                                </Badge>
                                {lesson.subject && (
                                  <Badge className="bg-green-100 text-green-800 arabic-text">
                                    {lesson.subject}
                                  </Badge>
                                )}
                                {lesson.audio_url && (
                                  <Badge variant="outline" className="arabic-text">
                                    {lesson.audio_duration || 0} دقيقة
                                  </Badge>
                                )}
                                {lesson.video_url && (
                                  <Badge className="bg-purple-100 text-purple-800 arabic-text">
                                    <Video className="w-3 h-3 ml-1" />
                                    فيديو
                                  </Badge>
                                )}
                                {lesson.image_url && (
                                  <Badge className="bg-pink-100 text-pink-800 arabic-text">
                                    <Image className="w-3 h-3 ml-1" />
                                    صورة
                                  </Badge>
                                )}
                                {lesson.external_link && (
                                  <Badge className="bg-orange-100 text-orange-800 arabic-text">
                                    <ExternalLink className="w-3 h-3 ml-1" />
                                    رابط خارجي
                                  </Badge>
                                )}
                                <span className="text-sm text-slate-500 flex items-center gap-1">
                                  <Play className="w-4 h-4" />
                                  {lesson.views_count || 0} مشاهدة
                                </span>
                              </div>
                              <p className="text-sm text-slate-600 arabic-text mb-2">
                                <strong>المعلم:</strong> {lesson.teacher_name || "المعلم"}
                              </p>
                              <p className="text-xs text-slate-400">
                                {formatUAETime(new Date(lesson.created_date))}
                              </p>
                            </div>
                          </div>

                          {lesson.content_text && (
                            <div className="bg-slate-50 rounded-lg p-3 mb-4">
                              <p className="text-sm text-slate-700 arabic-text line-clamp-3">
                                {lesson.content_text}
                              </p>
                            </div>
                          )}

                          <div className="flex items-center gap-3 flex-wrap">
                            {lesson.audio_url && (
                              <Button
                                size="sm"
                                className="arabic-text bg-blue-600 hover:bg-blue-700"
                                onClick={() => setAudioModalState({ isOpen: true, url: lesson.audio_url, studentName: `درس: ${lesson.title}` })}
                              >
                                <Volume2 className="w-4 h-4 ml-1" />
                                استمع للشرح
                              </Button>
                            )}
                            
                            {lesson.external_link && (
                              <Button
                                size="sm"
                                className="arabic-text bg-purple-600 hover:bg-purple-700"
                                onClick={() => window.open(lesson.external_link, '_blank')}
                              >
                                <ExternalLink className="w-4 h-4 ml-1" />
                                فتح الرابط
                              </Button>
                            )}

                            <Button
                              size="sm"
                              variant="destructive"
                              onClick={() => setDeleteModalState({ isOpen: true, type: 'lesson', recordingId: null, lessonId: lesson.id, studentId: null, isDeleting: false })}
                              className="arabic-text"
                            >
                              <Trash2 className="w-4 h-4 ml-1" />
                              حذف الدرس
                            </Button>
                          </div>
                        </div>
                      )) : (
                        <div className="text-center py-12 text-slate-500 arabic-text">
                          <BookOpen className="w-16 h-16 text-slate-400 mx-auto mb-4" />
                          <h3 className="text-lg font-semibold mb-2">لا توجد دروس مسجلة</h3>
                          <p className="mb-4">لم تقم بإنشاء أي دروس بعد</p>
                          <Link to="/CreateLesson">
                            <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white arabic-text">
                              <BookOpen className="w-4 h-4 ml-2" />
                              إنشاء درس جديد
                            </Button>
                          </Link>
                        </div>
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="students">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <CardTitle className="text-xl font-bold text-slate-900 arabic-text">
                      إدارة الطلاب 👨‍🎓
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="text-right arabic-text">الاسم</TableHead>
                            <TableHead className="text-right arabic-text">المستوى</TableHead>
                            <TableHead className="text-right arabic-text">التمارين المكتملة</TableHead>
                            <TableHead className="text-right arabic-text">متوسط الدرجات</TableHead>
                            <TableHead className="text-right arabic-text">آخر نشاط</TableHead>
                            <TableHead className="text-right arabic-text">الحالة</TableHead>
                            <TableHead className="text-right arabic-text">الإجراءات</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {students.map((student) => {
                            const lastActivity = new Date(student.last_activity || student.created_date);
                            const isActive = (Date.now() - lastActivity.getTime()) / (1000 * 60 * 60 * 24) <= 7;

                            return (
                              <TableRow
                                key={student.id}
                                className="hover:bg-slate-50 transition-colors"
                              >
                                <TableCell className="font-medium arabic-text">
                                  {student.name}
                                </TableCell>
                                <TableCell>
                                  <Badge variant="outline" className="arabic-text">
                                    {student.level}
                                  </Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  {student.total_exercises || 0}
                                </TableCell>
                                <TableCell className="text-center">
                                  <span className={`font-semibold ${
                                    (student.average_score || 0) >= 80 ? 'text-green-600' :
                                    (student.average_score || 0) >= 60 ? 'text-yellow-600' :
                                    'text-red-600'
                                  }`}>
                                    {student.average_score || 0}%
                                  </span>
                                </TableCell>
                                <TableCell className="arabic-text text-sm">
                                  {formatUAETime(lastActivity)}
                                </TableCell>
                                <TableCell>
                                  <Badge className={isActive
                                    ? "bg-green-100 text-green-800"
                                    : "bg-gray-100 text-gray-800"
                                  }>
                                    {isActive ? "نشط" : "غير نشط"}
                                  </Badge>
                                </TableCell>
                                <TableCell>
                                  <div className="flex gap-2">
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => handleEmergencyDrill(student)}
                                      disabled={emergencyLoading === student.id}
                                      className="arabic-text border-red-200 bg-red-50 text-red-700 hover:bg-red-100 hover:text-red-800"
                                      title="إنشاء تمرين علاجي فوري"
                                    >
                                      {emergencyLoading === student.id ? <div className="animate-spin rounded-full h-3 w-3 border-2 border-red-600 mr-1" /> : <Zap className="w-3 h-3 ml-1" />}
                                      طوارئ
                                    </Button>
                                    <Button
                                      size="sm"
                                      variant="destructive"
                                      onClick={() => setDeleteModalState({ 
                                        isOpen: true, 
                                        type: 'student', 
                                        recordingId: null, 
                                        lessonId: null, 
                                        studentId: student.id, 
                                        isDeleting: false 
                                      })}
                                      className="arabic-text"
                                    >
                                      <UserX className="w-4 h-4" />
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
                </TabsContent>

                <TabsContent value="leaderboard">
                  <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                    <CardHeader>
                      <CardTitle className="text-xl font-bold text-slate-900 arabic-text flex items-center gap-2">
                        <Trophy className="w-6 h-6 text-yellow-500" />
                        إدارة لوحة الصدارة
                      </CardTitle>
                      <p className="text-slate-500 text-sm arabic-text">
                        يمكنك إخفاء الطلاب من لوحة الصدارة العامة في الصفحة الرئيسية.
                      </p>
                    </CardHeader>
                    <CardContent>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="text-right arabic-text">الترتيب (بالنقاط)</TableHead>
                              <TableHead className="text-right arabic-text">الطالب</TableHead>
                              <TableHead className="text-right arabic-text">النقاط</TableHead>
                              <TableHead className="text-center arabic-text">الظهور في اللوحة</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {students
                              .sort((a, b) => ((b.total_exercises || 0) * 10) - ((a.total_exercises || 0) * 10))
                              .map((student, idx) => (
                              <TableRow key={student.id}>
                                <TableCell className="font-bold text-slate-700">#{idx + 1}</TableCell>
                                <TableCell className="arabic-text font-medium">{student.name}</TableCell>
                                <TableCell>{(student.total_exercises || 0) * 10}</TableCell>
                                <TableCell className="text-center">
                                  <div className="flex justify-center">
                                    <Button 
                                      size="sm" 
                                      variant={student.show_on_leaderboard !== false ? "default" : "secondary"}
                                      className={`arabic-text w-24 ${student.show_on_leaderboard !== false ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 text-gray-500"}`}
                                      onClick={() => toggleLeaderboardVisibility(student)}
                                    >
                                      {student.show_on_leaderboard !== false ? "ظاهر ✅" : "مخفي 🚫"}
                                    </Button>
                                  </div>
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </CardContent>
                  </Card>
                </TabsContent>

                <TabsContent value="groups">
                <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                  <CardHeader>
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-xl font-bold text-slate-900 arabic-text">
                        المجموعات الدراسية 👥
                      </CardTitle>
                      <Dialog open={isGroupDialogOpen} onOpenChange={setIsGroupDialogOpen}>
                        <DialogTrigger asChild>
                          <Button className="bg-purple-600 hover:bg-purple-700 text-white arabic-text">
                            <Plus className="w-4 h-4 ml-2" />
                            مجموعة جديدة
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="max-h-[80vh] overflow-y-auto">
                          <DialogHeader>
                            <DialogTitle className="text-right arabic-text">إنشاء مجموعة جديدة</DialogTitle>
                          </DialogHeader>
                          <div className="space-y-4 py-4">
                            <div>
                              <Label className="text-right block mb-2 arabic-text">اسم المجموعة</Label>
                              <Input 
                                value={newGroupData.name} 
                                onChange={(e) => setNewGroupData({...newGroupData, name: e.target.value})}
                                className="text-right arabic-text" 
                                placeholder="مثلاً: المتفوقين - الصف الخامس"
                              />
                            </div>
                            <div>
                              <Label className="text-right block mb-2 arabic-text">وصف المجموعة</Label>
                              <Textarea 
                                value={newGroupData.description} 
                                onChange={(e) => setNewGroupData({...newGroupData, description: e.target.value})}
                                className="text-right arabic-text" 
                                placeholder="وصف للمجموعة..."
                              />
                            </div>
                            <div>
                              <Label className="text-right block mb-2 arabic-text">اختر الطلاب</Label>
                              <div className="border rounded-lg p-4 max-h-60 overflow-y-auto space-y-2">
                                {students.map(student => (
                                  <div key={student.id} className="flex items-center justify-end gap-2">
                                    <Label htmlFor={`student-${student.id}`} className="arabic-text cursor-pointer">
                                      {student.name} ({student.level})
                                    </Label>
                                    <Checkbox 
                                      id={`student-${student.id}`}
                                      checked={selectedStudentsForGroup.includes(student.id)}
                                      onCheckedChange={(checked) => {
                                        if (checked) {
                                          setSelectedStudentsForGroup([...selectedStudentsForGroup, student.id]);
                                        } else {
                                          setSelectedStudentsForGroup(selectedStudentsForGroup.filter(id => id !== student.id));
                                        }
                                      }}
                                    />
                                  </div>
                                ))}
                              </div>
                            </div>
                          </div>
                          <DialogFooter>
                            <Button onClick={handleCreateGroup} className="w-full arabic-text">إنشاء</Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
                      {groups.map(group => (
                        <Card key={group.id} className="border border-slate-200 hover:shadow-md transition-all">
                          <CardHeader className="bg-slate-50 rounded-t-xl pb-3">
                            <CardTitle className="text-lg arabic-text flex justify-between items-start">
                              <span>{group.name}</span>
                              <Button 
                                variant="ghost" 
                                size="icon" 
                                className="text-red-500 hover:text-red-700 hover:bg-red-50 h-6 w-6"
                                onClick={() => handleDeleteGroup(group.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </CardTitle>
                          </CardHeader>
                          <CardContent className="pt-4">
                            <p className="text-sm text-slate-600 mb-4 arabic-text">{group.description || "لا يوجد وصف"}</p>
                            <div className="flex items-center justify-between text-sm text-slate-500">
                              <span className="flex items-center gap-1">
                                <Users className="w-4 h-4" />
                                {group.student_ids?.length || 0} طلاب
                              </span>
                              <Badge variant="secondary" className="arabic-text">نشطة</Badge>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                      {groups.length === 0 && (
                        <div className="col-span-full text-center py-12 text-slate-500">
                          <FolderPlus className="w-16 h-16 mx-auto mb-4 text-slate-300" />
                          <p className="arabic-text">لا توجد مجموعات بعد. قم بإنشاء مجموعة لتنظيم طلابك.</p>
                        </div>
                      )}
                    </div>
                  </CardContent>
                  </Card>
                  </TabsContent>

                  <TabsContent value="leaderboard">
                    <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                      <CardHeader>
                        <CardTitle className="text-xl font-bold text-slate-900 arabic-text flex items-center gap-2">
                          <Trophy className="w-6 h-6 text-yellow-500" />
                          إدارة لوحة الصدارة
                        </CardTitle>
                        <p className="text-slate-500 text-sm arabic-text">
                          يمكنك إخفاء الطلاب من لوحة الصدارة العامة في الصفحة الرئيسية.
                        </p>
                      </CardHeader>
                      <CardContent>
                        <div className="overflow-x-auto">
                          <Table>
                            <TableHeader>
                              <TableRow>
                                <TableHead className="text-right arabic-text">الترتيب (بالنقاط)</TableHead>
                                <TableHead className="text-right arabic-text">الطالب</TableHead>
                                <TableHead className="text-right arabic-text">النقاط</TableHead>
                                <TableHead className="text-center arabic-text">الظهور في اللوحة</TableHead>
                              </TableRow>
                            </TableHeader>
                            <TableBody>
                              {students
                                .sort((a, b) => ((b.total_exercises || 0) * 10) - ((a.total_exercises || 0) * 10))
                                .map((student, idx) => (
                                <TableRow key={student.id}>
                                  <TableCell className="font-bold text-slate-700">#{idx + 1}</TableCell>
                                  <TableCell className="arabic-text font-medium">{student.name}</TableCell>
                                  <TableCell>{(student.total_exercises || 0) * 10}</TableCell>
                                  <TableCell className="text-center">
                                    <div className="flex justify-center">
                                      <Button 
                                        size="sm" 
                                        variant={student.show_on_leaderboard !== false ? "default" : "secondary"}
                                        className={`arabic-text w-24 ${student.show_on_leaderboard !== false ? "bg-green-600 hover:bg-green-700" : "bg-gray-200 text-gray-500"}`}
                                        onClick={() => toggleLeaderboardVisibility(student)}
                                      >
                                        {student.show_on_leaderboard !== false ? "ظاهر ✅" : "مخفي 🚫"}
                                      </Button>
                                    </div>
                                  </TableCell>
                                </TableRow>
                              ))}
                            </TableBody>
                          </Table>
                        </div>
                      </CardContent>
                    </Card>
                  </TabsContent>

                  <TabsContent value="classboard">
                     <Card className="border-0 shadow-xl bg-white/80 backdrop-blur-sm">
                        <CardHeader>
                           <CardTitle className="text-xl font-bold text-slate-900 arabic-text">لوحة الصف (Class Board) 🏫</CardTitle>
                        </CardHeader>
                        <CardContent>
                           <div className="space-y-6">
                              {/* Class Selection (Mock for now, effectively "All Students") */}
                              <div className="flex items-center gap-4 mb-6">
                                 <Label className="arabic-text">اختر الصف:</Label>
                                 <select className="border rounded p-2 arabic-text w-48">
                                    <option>الكل</option>
                                    <option>الصف الأول</option>
                                    <option>الصف الثاني</option>
                                    {/* ... more options */}
                                 </select>
                              </div>

                              {/* Announcements */}
                              <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                                 <h3 className="font-bold text-blue-900 arabic-text mb-2">📢 إعلان صفّي جديد</h3>
                                 <div className="flex gap-2">
                                    <Input className="text-right arabic-text bg-white" placeholder="اكتب إعلاناً للطلاب وأولياء الأمور..." />
                                    <Button className="arabic-text bg-blue-600 hover:bg-blue-700">إرسال</Button>
                                 </div>
                              </div>

                              {/* Student List */}
                              <div className="overflow-x-auto">
                                 <Table>
                                    <TableHeader>
                                       <TableRow>
                                          <TableHead className="text-right arabic-text">اسم الطالب</TableHead>
                                          <TableHead className="text-right arabic-text">الصف</TableHead>
                                          <TableHead className="text-center arabic-text">النشاط</TableHead>
                                          <TableHead className="text-center arabic-text">التمارين المنجزة</TableHead>
                                       </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                       {students.map(student => (
                                          <TableRow key={student.id}>
                                             <TableCell className="font-medium arabic-text">{student.name}</TableCell>
                                             <TableCell className="arabic-text">{student.grade || '-'}</TableCell>
                                             <TableCell className="text-center">
                                                {/* Simple Activity Indicator */}
                                                <Badge className={
                                                   (student.total_exercises > 5) ? "bg-green-500" : 
                                                   (student.total_exercises > 2) ? "bg-yellow-500" : "bg-red-500"
                                                }>
                                                   {(student.total_exercises > 5) ? "عالٍ" : (student.total_exercises > 2) ? "متوسط" : "منخفض"}
                                                </Badge>
                                             </TableCell>
                                             <TableCell className="text-center">{student.total_exercises}</TableCell>
                                          </TableRow>
                                       ))}
                                    </TableBody>
                                 </Table>
                              </div>
                           </div>
                        </CardContent>
                     </Card>
                  </TabsContent>

                  <TabsContent value="settings">
                  <SettingsTab />
                  </TabsContent>
                  </Tabs>
                  </motion.div>
        </div>
      </div>
    </>
  );
}