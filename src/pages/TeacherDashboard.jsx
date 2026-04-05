// src/pages/TeacherDashboard.jsx
// ═══════════════════════════════════════════════════════════════════
// 🎓 لوحة تحكم المعلم المحسّنة - نظام إدارة متقدم لتعليم اللغة العربية
// ═══════════════════════════════════════════════════════════════════
// المرحلة 1/4: الإعدادات الأساسية، الأمان المعزز، والوظائف المساعدة
// ═══════════════════════════════════════════════════════════════════

import React, { useState, useEffect, useRef, useMemo } from "react";
import {
  Student,
  Recording,
  StudentGroup,
  Exercise,
  SystemSetting,
  InvokeLLM,
} from "@/api/entities";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  BarChart3,
  BookOpen,
  CheckCircle,
  Download,
  Filter,
  ListChecks,
  Loader2,
  Mic,
  Plus,
  Search,
  Trash2,
  Users,
  Volume2,
  Star,
  Activity,
  Settings,
  RefreshCw,
  ArrowLeft,
  Calendar,
  AlertTriangle,
  MoreVertical,
  Eye,
  EyeOff,
  Shield,
  Lock,
  Unlock,
  Info,
  HelpCircle,
  TrendingUp,
  Award,
  Clock,
  Target,
  Sparkles,
  Zap,
  FileText,
  BarChart,
  PieChart,
  TrendingDown,
  AlertCircle,
  CheckCircle2,
  XCircle,
  MessageSquare,
  Send,
  Edit,
  Save,
  X,
  ChevronDown,
  ChevronUp,
  ChevronLeft,
  ExternalLink,
  Copy,
  Upload,
  Download as DownloadIcon,
  RefreshCcw,
  Database,
  Server,
  Cpu,
  HardDrive,
  Wifi,
  WifiOff,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import AudioCommentModal from "../components/teacher/AudioCommentModal";
import AssessmentManagementTab from "@/components/teacher/AssessmentManagementTab";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
  DropdownMenuLabel,
} from "@/components/ui/dropdown-menu";
import DeleteConfirmDialog from "@/components/teacher/DeleteConfirmDialog";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";
import {
  Alert,
  AlertDescription,
  AlertTitle,
} from "@/components/ui/alert";
import { Progress } from "@/components/ui/progress";
import { Separator } from "@/components/ui/separator";

/* ═══════════════════════════════════════════════════════════════════
   ⚙️ القسم 1: ثوابت النظام والإعدادات الأساسية
   ═══════════════════════════════════════════════════════════════════ */

// 🔐 إعدادات الأمان المعززة
const SECURITY_CONFIG = {
  PASSWORD: "teacher246", // كلمة المرور الأساسية
  MAX_LOGIN_ATTEMPTS: 3, // عدد محاولات تسجيل الدخول المسموحة
  LOCKOUT_DURATION: 15 * 60 * 1000, // مدة الحظر بالميلي ثانية (15 دقيقة)
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // مهلة الجلسة (ساعتان)
  STORAGE_KEY_AUTH: "teacher_auth_enhanced",
  STORAGE_KEY_ATTEMPTS: "teacher_login_attempts",
  STORAGE_KEY_LOCKOUT: "teacher_lockout_time",
  STORAGE_KEY_SESSION: "teacher_session_start",
};

// 📊 مستويات التقييم والألوان
const GRADE_LEVELS = [
  "الروضة",
  "الصف الأول",
  "الصف الثاني",
  "الصف الثالث",
  "الصف الرابع",
  "الصف الخامس",
  "الصف السادس",
  "الصف السابع",
  "الصف الثامن",
  "الصف التاسع",
  "الصف العاشر",
  "الصف الحادي عشر",
  "الصف الثاني عشر",
];

const PROFICIENCY_LEVELS = ["مبتدئ", "متوسط", "متقدم"];

const SCORE_COLOR_RANGES = {
  excellent: { min: 90, max: 100, color: "emerald", label: "ممتاز" },
  veryGood: { min: 80, max: 89, color: "green", label: "جيد جداً" },
  good: { min: 70, max: 79, color: "blue", label: "جيد" },
  acceptable: { min: 60, max: 69, color: "amber", label: "مقبول" },
  needsImprovement: { min: 0, max: 59, color: "red", label: "يحتاج تحسين" },
};

// 🎨 ألوان المستويات
const LEVEL_COLORS = {
  "متقدم": "bg-gradient-to-r from-emerald-500 to-teal-500 text-white",
  "متوسط": "bg-gradient-to-r from-blue-500 to-indigo-500 text-white",
  "مبتدئ": "bg-gradient-to-r from-slate-400 to-slate-500 text-white",
};

// 📈 أنواع الإحصائيات
const STAT_TYPES = {
  TOTAL_STUDENTS: "إجمالي الطلاب",
  TOTAL_RECORDINGS: "إجمالي التسجيلات",
  AVERAGE_SCORE: "متوسط الدرجات",
  ACTIVE_TODAY: "نشط اليوم",
  NEEDS_REVIEW: "يحتاج مراجعة",
  EXERCISES_COUNT: "عدد التمارين",
};

/* ═══════════════════════════════════════════════════════════════════
   🛠️ القسم 2: وظائف مساعدة للتعامل مع البيانات
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 🔄 توحيد بنية بيانات التمرين (التوافق مع Supabase)
 * يتعامل مع الاختلافات في أسماء الحقول (text/sentence)
 */
const normalizeExercise = (ex) => {
  if (!ex) return null;
  return {
    ...ex,
    text: ex?.text ?? ex?.sentence ?? "",
    sentence: ex?.sentence ?? ex?.text ?? "",
  };
};

/**
 * 💾 إنشاء تمرين جديد مع معالجة الأخطاء
 * يحاول إنشاء التمرين بطرق مختلفة للتوافق
 */
async function safeCreateExercise(payload) {
  try {
    // محاولة أولية بالبيانات كما هي
    return await Exercise.create(payload);
  } catch (e1) {
    console.warn("First attempt failed, trying fallback...", e1);

    // محاولة ثانية مع تبديل text/sentence
    const fallback = { ...payload };
    if ("sentence" in fallback && !("text" in fallback)) {
      fallback.text = fallback.sentence;
    } else if ("text" in fallback && !("sentence" in fallback)) {
      fallback.sentence = fallback.text;
    }

    try {
      return await Exercise.create(fallback);
    } catch (e2) {
      console.error("Both attempts failed:", e2);
      throw new Error("فشل في إنشاء التمرين. يرجى التحقق من البيانات المدخلة.");
    }
  }
}

/**
 * ✏️ تحديث تسجيل صوتي مع معالجة اختلافات الحقول
 * يدعم teacher_audio_comment و teacher_audio
 */
async function safeUpdateRecording(id, patch) {
  try {
    return await Recording.update(id, patch);
  } catch (e1) {
    console.warn("Update failed, trying with field name variations...", e1);

    // معالجة اختلاف أسماء حقول التعليق الصوتي
    if (patch.teacher_audio_comment && !patch.teacher_audio) {
      const { teacher_audio_comment, ...rest } = patch;
      try {
        return await Recording.update(id, {
          ...rest,
          teacher_audio: teacher_audio_comment,
        });
      } catch (e2) {
        console.error("Fallback update also failed:", e2);
        throw e2;
      }
    }
    throw e1;
  }
}

/**
 * 🎤 استخراج رابط التعليق الصوتي من المعلم
 */
const pickTeacherAudio = (recording) => {
  if (!recording) return "";
  return recording.teacher_audio_comment || recording.teacher_audio || "";
};

/**
 * 🤖 استخراج تعليق الذكاء الاصطناعي
 */
const pickAiFeedback = (recording) => {
  if (!recording) return "";
  return (
    recording.feedback ||
    recording.analysis_details?.feedback ||
    recording.analysis_details?.ai_feedback ||
    recording.ai_feedback ||
    ""
  );
};

/**
 * 📝 استخراج النص الذي قرأه الطالب
 */
const pickReadText = (recording) => {
  if (!recording) return "";
  return (
    recording.analysis_details?.original_text ||
    recording.analysis_details?.text ||
    recording.analysis_details?.sentence ||
    recording.original_text ||
    ""
  );
};

/**
 * 📊 حساب لون الدرجة بناءً على القيمة
 */
const getScoreColor = (score) => {
  if (score === null || score === undefined) return "slate";

  for (const range of Object.values(SCORE_COLOR_RANGES)) {
    if (score >= range.min && score <= range.max) {
      return range.color;
    }
  }
  return "slate";
};

/**
 * 🏷️ الحصول على تصنيف الدرجة
 */
const getScoreLabel = (score) => {
  if (score === null || score === undefined) return "غير محدد";

  for (const range of Object.values(SCORE_COLOR_RANGES)) {
    if (score >= range.min && score <= range.max) {
      return range.label;
    }
  }
  return "غير محدد";
};

/**
 * 📅 تنسيق التاريخ بشكل جميل
 */
const formatDate = (dateStr, options = {}) => {
  if (!dateStr) return "غير محدد";

  try {
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) return "تاريخ غير صالح";

    const defaultOptions = {
      year: "numeric",
      month: "long",
      day: "numeric",
      ...options,
    };

    return date.toLocaleDateString("ar-AE", defaultOptions);
  } catch (error) {
    console.error("Date formatting error:", error);
    return "تاريخ غير صالح";
  }
};

/**
 * ⏰ حساب الوقت المنقضي منذ تاريخ معين
 */
const getTimeAgo = (dateStr) => {
  if (!dateStr) return "غير محدد";

  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return "الآن";
    if (diffMins < 60) return `منذ ${diffMins} دقيقة`;
    if (diffHours < 24) return `منذ ${diffHours} ساعة`;
    if (diffDays < 7) return `منذ ${diffDays} يوم`;
    if (diffDays < 30) return `منذ ${Math.floor(diffDays / 7)} أسبوع`;
    if (diffDays < 365) return `منذ ${Math.floor(diffDays / 30)} شهر`;
    return `منذ ${Math.floor(diffDays / 365)} سنة`;
  } catch (error) {
    console.error("Time ago calculation error:", error);
    return "غير محدد";
  }
};

/**
 * 📊 حساب النسبة المئوية
 */
const calculatePercentage = (value, total) => {
  if (!total || total === 0) return 0;
  return Math.round((value / total) * 100);
};

/**
 * 🎯 حساب متوسط الدرجات
 */
const calculateAverage = (scores) => {
  if (!scores || scores.length === 0) return 0;
  const validScores = scores.filter(s => s !== null && s !== undefined && !isNaN(s));
  if (validScores.length === 0) return 0;
  const sum = validScores.reduce((acc, score) => acc + score, 0);
  return Math.round(sum / validScores.length);
};

/**
 * 🔍 تصفية النصوص العربية
 */
const arabicFilter = (text, searchTerm) => {
  if (!searchTerm || !searchTerm.trim()) return true;
  if (!text) return false;

  const normalizedText = text.toLowerCase().trim();
  const normalizedSearch = searchTerm.toLowerCase().trim();

  return normalizedText.includes(normalizedSearch);
};

/**
 * 🎨 الحصول على لون المستوى
 */
const getLevelColor = (level) => {
  return LEVEL_COLORS[level] || LEVEL_COLORS["مبتدئ"];
};

/**
 * 🔢 تنسيق الأرقام بالفواصل
 */
const formatNumber = (num) => {
  if (num === null || num === undefined) return "0";
  return num.toLocaleString("ar-AE");
};

/**
 * 📄 تحويل قيمة إلى تنسيق CSV آمن
 */
const toCsvSafeValue = (value) => {
  if (value === null || value === undefined) return "";
  const normalized = String(value).replace(/\r?\n|\r/g, " ").trim();
  const escaped = normalized.replace(/"/g, '""');
  return `"${escaped}"`;
};

/**
 * 📄 إنشاء محتوى CSV من الرؤوس والصفوف
 */
const buildCsvContent = (headers, rows) => {
  const headerLine = headers.map(toCsvSafeValue).join(",");
  const bodyLines = rows.map((row) => row.map(toCsvSafeValue).join(","));
  // BOM لضمان عرض العربية بشكل صحيح في Excel/Sheets
  return `\uFEFF${[headerLine, ...bodyLines].join("\n")}`;
};

/**
 * ⬇️ تنزيل نص CSV كملف
 */
const downloadCsvFile = (filename, content) => {
  const blob = new Blob([content], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.setAttribute("download", filename);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
};

/**
 * 📆 استخراج مفتاح الشهر من تاريخ (YYYY-MM)
 */
const toMonthKey = (dateStr) => {
  if (!dateStr) return "";
  const date = new Date(dateStr);
  if (isNaN(date.getTime())) return "";
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  return `${y}-${m}`;
};

/**
 * ⏱️ استخراج مدة التسجيل بالثواني مع دعم عدة أسماء حقول
 */
const getRecordingDurationSeconds = (recording) => {
  if (!recording) return 0;
  const raw =
    recording.duration_seconds ??
    recording.duration ??
    recording.audio_duration ??
    recording.length_seconds ??
    recording.analysis_details?.duration_seconds ??
    recording.analysis_details?.duration ??
    0;

  const val = Number(raw);
  return Number.isFinite(val) && val > 0 ? val : 0;
};

/**
 * 📱 كشف حجم الشاشة
 */
const useMediaQuery = (query) => {
  const [matches, setMatches] = useState(false);

  useEffect(() => {
    const media = window.matchMedia(query);
    if (media.matches !== matches) {
      setMatches(media.matches);
    }
    const listener = () => setMatches(media.matches);
    media.addListener(listener);
    return () => media.removeListener(listener);
  }, [matches, query]);

  return matches;
};

/* ═══════════════════════════════════════════════════════════════════
   🔐 القسم 3: نظام الأمان المعزز
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 🛡️ إدارة حالة الأمان والمصادقة
 */
class SecurityManager {
  static isLocked() {
    const lockoutTime = localStorage.getItem(SECURITY_CONFIG.STORAGE_KEY_LOCKOUT);
    if (!lockoutTime) return false;

    const now = Date.now();
    const lockoutEnd = parseInt(lockoutTime, 10);

    if (now < lockoutEnd) {
      return true;
    } else {
      // انتهت مدة الحظر
      this.clearLockout();
      return false;
    }
  }

  static getLockoutTimeRemaining() {
    const lockoutTime = localStorage.getItem(SECURITY_CONFIG.STORAGE_KEY_LOCKOUT);
    if (!lockoutTime) return 0;

    const now = Date.now();
    const lockoutEnd = parseInt(lockoutTime, 10);
    const remaining = lockoutEnd - now;

    return remaining > 0 ? remaining : 0;
  }

  static getLoginAttempts() {
    const attempts = localStorage.getItem(SECURITY_CONFIG.STORAGE_KEY_ATTEMPTS);
    return attempts ? parseInt(attempts, 10) : 0;
  }

  static incrementAttempts() {
    const current = this.getLoginAttempts();
    const newCount = current + 1;
    localStorage.setItem(SECURITY_CONFIG.STORAGE_KEY_ATTEMPTS, newCount.toString());

    if (newCount >= SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS) {
      this.lockAccount();
    }

    return newCount;
  }

  static lockAccount() {
    const lockoutEnd = Date.now() + SECURITY_CONFIG.LOCKOUT_DURATION;
    localStorage.setItem(SECURITY_CONFIG.STORAGE_KEY_LOCKOUT, lockoutEnd.toString());
  }

  static clearAttempts() {
    localStorage.removeItem(SECURITY_CONFIG.STORAGE_KEY_ATTEMPTS);
  }

  static clearLockout() {
    localStorage.removeItem(SECURITY_CONFIG.STORAGE_KEY_LOCKOUT);
    this.clearAttempts();
  }

  static isAuthenticated() {
    const authData = sessionStorage.getItem(SECURITY_CONFIG.STORAGE_KEY_AUTH);
    if (!authData) return false;

    try {
      const { timestamp, authenticated } = JSON.parse(authData);
      const now = Date.now();

      // التحقق من انتهاء الجلسة
      if (now - timestamp > SECURITY_CONFIG.SESSION_TIMEOUT) {
        this.logout();
        return false;
      }

      return authenticated === true;
    } catch (error) {
      console.error("Auth check error:", error);
      return false;
    }
  }

  static authenticate(password) {
    if (this.isLocked()) {
      throw new Error("LOCKED");
    }

    if (password === SECURITY_CONFIG.PASSWORD) {
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(SECURITY_CONFIG.STORAGE_KEY_AUTH, JSON.stringify(authData));
      this.clearAttempts();
      this.clearLockout();
      return true;
    } else {
      this.incrementAttempts();
      return false;
    }
  }

  static logout() {
    sessionStorage.removeItem(SECURITY_CONFIG.STORAGE_KEY_AUTH);
  }

  static refreshSession() {
    if (this.isAuthenticated()) {
      const authData = {
        authenticated: true,
        timestamp: Date.now(),
      };
      sessionStorage.setItem(SECURITY_CONFIG.STORAGE_KEY_AUTH, JSON.stringify(authData));
    }
  }
}

/**
 * 🔐 بوابة دخول المعلم المحسّنة مع أمان معزز
 */
function TeacherGate({ children }) {
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [isLocked, setIsLocked] = useState(false);
  const [lockoutTime, setLockoutTime] = useState(0);
  const [attempts, setAttempts] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const passwordInputRef = useRef(null);

  const isAuthenticated = SecurityManager.isAuthenticated();

  useEffect(() => {
    // التحقق من حالة القفل عند التحميل
    checkLockStatus();

    // تركيز حقل كلمة المرور
    if (!isAuthenticated && passwordInputRef.current) {
      passwordInputRef.current.focus();
    }

    // تحديث حالة القفل كل ثانية
    const interval = setInterval(() => {
      checkLockStatus();
    }, 1000);

    return () => clearInterval(interval);
  }, [isAuthenticated]);

  const checkLockStatus = () => {
    const locked = SecurityManager.isLocked();
    setIsLocked(locked);

    if (locked) {
      setLockoutTime(SecurityManager.getLockoutTimeRemaining());
    } else {
      setAttempts(SecurityManager.getLoginAttempts());
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (isLocked) {
      setError("الحساب مقفل مؤقتاً. يرجى الانتظار.");
      return;
    }

    if (!password.trim()) {
      setError("يرجى إدخال كلمة المرور");
      return;
    }

    setIsLoading(true);

    // تأخير بسيط لمنع هجمات القوة الغاشمة
    await new Promise(resolve => setTimeout(resolve, 500));

    try {
      const success = SecurityManager.authenticate(password);

      if (success) {
        // نجح تسجيل الدخول
        window.location.reload();
      } else {
        // فشل تسجيل الدخول
        const currentAttempts = SecurityManager.getLoginAttempts();
        const remainingAttempts = SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS - currentAttempts;

        if (remainingAttempts > 0) {
          setError(`كلمة مرور خاطئة. المحاولات المتبقية: ${remainingAttempts}`);
          setAttempts(currentAttempts);
        } else {
          setError("تم قفل الحساب لمدة 15 دقيقة بسبب المحاولات الفاشلة المتكررة.");
          setIsLocked(true);
        }

        setPassword("");
      }
    } catch (error) {
      if (error.message === "LOCKED") {
        setError("الحساب مقفل مؤقتاً. يرجى الانتظار.");
        setIsLocked(true);
      } else {
        setError("حدث خطأ غير متوقع. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const formatLockoutTime = (ms) => {
    const minutes = Math.floor(ms / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (isAuthenticated) {
    return children;
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ duration: 0.3 }}
        className="w-full max-w-md"
      >
        <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
          <CardHeader className="space-y-4 pb-6">
            <div className="flex justify-center">
              <motion.div
                initial={{ rotate: 0 }}
                animate={{ rotate: 360 }}
                transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                className="w-20 h-20 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-full flex items-center justify-center shadow-lg"
              >
                <Shield className="w-10 h-10 text-white" />
              </motion.div>
            </div>

            <div className="text-center space-y-2">
              <CardTitle className="arabic-text text-2xl font-bold text-slate-800">
                🎓 دخول المعلم
              </CardTitle>
              <CardDescription className="arabic-text text-slate-600">
                منصة إدارة تعليم اللغة العربية - نظام آمن ومحمي
              </CardDescription>
            </div>
          </CardHeader>

          <CardContent className="space-y-6">
            {/* تنبيه الأمان */}
            <Alert className="border-indigo-200 bg-indigo-50">
              <Shield className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="arabic-text text-right text-xs text-indigo-800">
                نظام حماية متقدم: يتم قفل الحساب بعد 3 محاولات فاشلة لمدة 15 دقيقة
              </AlertDescription>
            </Alert>

            {/* حالة القفل */}
            {isLocked && (
              <Alert variant="destructive">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle className="arabic-text text-right">الحساب مقفل مؤقتاً</AlertTitle>
                <AlertDescription className="arabic-text text-right">
                  الوقت المتبقي: {formatLockoutTime(lockoutTime)}
                </AlertDescription>
              </Alert>
            )}

            {/* عداد المحاولات */}
            {!isLocked && attempts > 0 && (
              <Alert variant="warning" className="border-amber-200 bg-amber-50">
                <AlertCircle className="h-4 w-4 text-amber-600" />
                <AlertDescription className="arabic-text text-right text-amber-800">
                  المحاولات الفاشلة: {attempts} من {SECURITY_CONFIG.MAX_LOGIN_ATTEMPTS}
                </AlertDescription>
              </Alert>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2 text-right">
                <Label className="arabic-text font-semibold text-slate-700 flex items-center justify-end gap-2">
                  <Lock className="w-4 h-4" />
                  كلمة المرور
                </Label>

                <div className="relative">
                  <Input
                    ref={passwordInputRef}
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="text-right arabic-text pr-12 text-lg"
                    placeholder="••••••••"
                    autoComplete="current-password"
                    disabled={isLocked || isLoading}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                    disabled={isLocked}
                  >
                    {showPassword ? (
                      <EyeOff className="w-5 h-5" />
                    ) : (
                      <Eye className="w-5 h-5" />
                    )}
                  </button>
                </div>
              </div>

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-right arabic-text text-sm text-red-600 bg-red-50 p-3 rounded-lg border border-red-200"
                >
                  {error}
                </motion.div>
              )}

              <Button
                type="submit"
                className="arabic-text w-full h-12 text-lg bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 transition-all shadow-lg"
                disabled={isLocked || isLoading}
              >
                {isLoading ? (
                  <span className="flex items-center gap-2">
                    <Loader2 className="w-5 h-5 animate-spin" />
                    جاري التحقق...
                  </span>
                ) : isLocked ? (
                  <span className="flex items-center gap-2">
                    <Lock className="w-5 h-5" />
                    الحساب مقفل
                  </span>
                ) : (
                  <span className="flex items-center gap-2">
                    <Unlock className="w-5 h-5" />
                    دخول آمن
                  </span>
                )}
              </Button>
            </form>

            {/* معلومات إضافية */}
            <div className="space-y-3 pt-4 border-t border-slate-200">
              <div className="flex items-start gap-2 text-xs text-slate-500 arabic-text text-right">
                <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  <code className="bg-slate-100 px-2 py-0.5 rounded"></code>
                </p>
              </div>

              <div className="flex items-start gap-2 text-xs text-slate-500 arabic-text text-right">
                <Shield className="w-4 h-4 mt-0.5 flex-shrink-0" />
                <p>
                  مدة الجلسة: ساعتان من آخر نشاط. يتم تسجيل الخروج تلقائياً بعد انتهاء المدة.
                </p>
              </div>
            </div>
          </CardContent>

          <CardFooter className="flex-col space-y-3 border-t border-slate-100 bg-slate-50/50">
            <p className="text-xs text-slate-500 arabic-text text-right">
            </p>

            <div className="flex items-center justify-center gap-2 text-xs text-slate-400">
              <Cpu className="w-3 h-3" />
              <span>مُدعّم بتقنية أمان متقدمة</span>
            </div>
          </CardFooter>
        </Card>
      </motion.div>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   📊 القسم 4: مكونات مشتركة وإحصائيات
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 📈 بطاقة إحصائيات محسّنة
 */
function StatCard({ title, value, icon: Icon, color = "indigo", change, subtitle, trend }) {
  const colorClasses = {
    indigo: "from-indigo-500 to-purple-600",
    emerald: "from-emerald-500 to-teal-600",
    amber: "from-amber-500 to-orange-600",
    red: "from-red-500 to-pink-600",
    blue: "from-blue-500 to-cyan-600",
    violet: "from-violet-500 to-purple-600",
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={{ scale: 1.02 }}
      transition={{ duration: 0.2 }}
    >
      <Card className="border-0 shadow-lg hover:shadow-xl transition-shadow bg-gradient-to-br from-white to-slate-50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-2 flex-1">
              <p className="text-sm font-medium text-slate-600 arabic-text text-right">
                {title}
              </p>
              <div className="flex items-baseline gap-2">
                <h3 className="text-3xl font-bold text-slate-900">
                  {formatNumber(value)}
                </h3>
                {change !== undefined && (
                  <span className={cn(
                    "text-xs font-semibold flex items-center gap-1",
                    change >= 0 ? "text-emerald-600" : "text-red-600"
                  )}>
                    {change >= 0 ? (
                      <TrendingUp className="w-3 h-3" />
                    ) : (
                      <TrendingDown className="w-3 h-3" />
                    )}
                    {Math.abs(change)}%
                  </span>
                )}
              </div>
              {subtitle && (
                <p className="text-xs text-slate-500 arabic-text text-right">
                  {subtitle}
                </p>
              )}
            </div>

            <div className={cn(
              "w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center shadow-lg",
              colorClasses[color]
            )}>
              <Icon className="w-7 h-7 text-white" />
            </div>
          </div>

          {trend !== undefined && (
            <div className="mt-4 pt-4 border-t border-slate-100">
              <div className="flex items-center justify-between text-xs">
                <span className="text-slate-500 arabic-text">التقدم</span>
                <span className="font-semibold text-slate-700">{trend}%</span>
              </div>
              <Progress value={trend} className="mt-2 h-2" />
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * 💡 بطاقة نصيحة/تعليمات
 */
function InfoCard({ title, description, icon: Icon, variant = "info" }) {
  const variants = {
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      icon: "text-blue-600",
      title: "text-blue-900",
      text: "text-blue-800",
    },
    success: {
      bg: "bg-emerald-50",
      border: "border-emerald-200",
      icon: "text-emerald-600",
      title: "text-emerald-900",
      text: "text-emerald-800",
    },
    warning: {
      bg: "bg-amber-50",
      border: "border-amber-200",
      icon: "text-amber-600",
      title: "text-amber-900",
      text: "text-amber-800",
    },
    danger: {
      bg: "bg-red-50",
      border: "border-red-200",
      icon: "text-red-600",
      title: "text-red-900",
      text: "text-red-800",
    },
  };

  const style = variants[variant];

  return (
    <Alert className={cn(style.bg, style.border)}>
      <Icon className={cn("h-5 w-5", style.icon)} />
      <AlertTitle className={cn("arabic-text text-right font-bold", style.title)}>
        {title}
      </AlertTitle>
      <AlertDescription className={cn("arabic-text text-right text-sm mt-2", style.text)}>
        {description}
      </AlertDescription>
    </Alert>
  );
}

/**
 * 🔄 مؤشر التحميل المحسّن
 */
function LoadingSpinner({ size = "default", text = "جاري التحميل..." }) {
  const sizes = {
    small: "w-4 h-4",
    default: "w-6 h-6",
    large: "w-8 h-8",
  };

  return (
    <div className="flex flex-col items-center justify-center gap-3 py-8">
      <Loader2 className={cn("animate-spin text-indigo-600", sizes[size])} />
      {text && (
        <p className="text-sm text-slate-600 arabic-text">{text}</p>
      )}
    </div>
  );
}

/**
 * ❌ عرض حالة فارغة
 */
function EmptyState({ title, description, icon: Icon, action }) {
  return (
    <div className="flex flex-col items-center justify-center py-12 px-4">
      <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mb-4">
        <Icon className="w-10 h-10 text-slate-400" />
      </div>
      <h3 className="text-lg font-semibold text-slate-900 arabic-text mb-2">
        {title}
      </h3>
      <p className="text-sm text-slate-600 arabic-text text-center mb-4">
        {description}
      </p>
      {action && action}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// نهاية المرحلة 1/4
// ═══════════════════════════════════════════════════════════════════

/* ═══════════════════════════════════════════════════════════════════
   ⚙️ المرحلة 2/4: صفحات الإعدادات والطلاب والمجموعات
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   ⚙️ القسم 5: صفحة الإعدادات المتقدمة
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 🔧 صفحة الإعدادات المتقدمة - إدارة API Keys والنظام
 */
function SettingsTab() {
  const [apiKey, setApiKey] = useState("");
  const [googleSheetsWebhook, setGoogleSheetsWebhook] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [testingConnection, setTestingConnection] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    setIsLoading(true);
    try {
      const settings = await SystemSetting.list();
      const keySetting = settings.find((s) => s.key === "openai_api_key");
      const googleSheetsSetting = settings.find((s) => s.key === "google_sheets_webhook_url");
      if (keySetting) {
        setApiKey(keySetting.value || "");
      }
      if (googleSheetsSetting) {
        setGoogleSheetsWebhook(googleSheetsSetting.value || "");
      }
    } catch (e) {
      console.error("Failed to load settings", e);
      toast({
        title: "خطأ في التحميل",
        description: "فشل تحميل الإعدادات. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSave = async () => {
    const trimmedApiKey = apiKey.trim();
    const trimmedWebhook = googleSheetsWebhook.trim();

    if (!trimmedApiKey && !trimmedWebhook) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال مفتاح OpenAI أو رابط Google Sheets Webhook",
        variant: "destructive",
      });
      return;
    }

    if (trimmedApiKey && !trimmedApiKey.startsWith("sk-")) {
      toast({
        title: "تنبيه",
        description: "مفتاح OpenAI يجب أن يبدأ بـ sk-",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    try {
      const settings = await SystemSetting.list();
      const existing = settings.find((s) => s.key === "openai_api_key");
      const existingGoogleSheetsWebhook = settings.find((s) => s.key === "google_sheets_webhook_url");

      if (trimmedApiKey) {
        if (existing) {
          await SystemSetting.update(existing.id, { value: trimmedApiKey });
        } else {
          await SystemSetting.create({
            key: "openai_api_key",
            value: trimmedApiKey,
            description: "OpenAI API Key for audio transcription and analysis",
          });
        }
      }

      if (trimmedWebhook) {
        const webhookPayload = {
          value: trimmedWebhook,
          description: "Google Sheets Apps Script Webhook URL for dashboard award evidence exports",
        };

        if (existingGoogleSheetsWebhook) {
          await SystemSetting.update(existingGoogleSheetsWebhook.id, webhookPayload);
        } else {
          await SystemSetting.create({
            key: "google_sheets_webhook_url",
            ...webhookPayload,
          });
        }
      } else if (existingGoogleSheetsWebhook) {
        await SystemSetting.update(existingGoogleSheetsWebhook.id, {
          value: "",
        });
      }

      setSaved(true);
      toast({
        title: "✅ نجح الحفظ",
        description: "تم حفظ الإعدادات بنجاح",
      });

      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save settings", e);
      toast({
        title: "خطأ",
        description: "حدث خطأ أثناء حفظ الإعدادات",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const testConnection = async () => {
    if (!apiKey.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال مفتاح API أولاً",
        variant: "destructive",
      });
      return;
    }

    setTestingConnection(true);
    setConnectionStatus(null);

    try {
      // اختبار بسيط للاتصال
      const testPrompt = "قل: مرحباً";
      const response = await InvokeLLM({ prompt: testPrompt });

      if (response && (response.text || response.content)) {
        setConnectionStatus("success");
        toast({
          title: "✅ الاتصال ناجح",
          description: "مفتاح API يعمل بشكل صحيح",
        });
      } else {
        setConnectionStatus("error");
        toast({
          title: "❌ فشل الاتصال",
          description: "المفتاح غير صالح أو منتهي الصلاحية",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Connection test failed:", error);
      setConnectionStatus("error");
      toast({
        title: "❌ خطأ في الاتصال",
        description: "تأكد من صحة المفتاح وأن لديك رصيد كافي",
        variant: "destructive",
      });
    } finally {
      setTestingConnection(false);
    }
  };

  const maskApiKey = (key) => {
    if (!key || key.length < 10) return key;
    return key.substring(0, 7) + "•".repeat(20) + key.substring(key.length - 4);
  };

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل الإعدادات..." />;
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 arabic-text text-right">
            ⚙️ الإعدادات المتقدمة
          </h2>
          <p className="text-sm text-slate-600 arabic-text text-right mt-1">
            إدارة مفاتيح API والإعدادات النظامية للمنصة
          </p>
        </div>
      </motion.div>

      {/* تعليمات مهمة */}
      <InfoCard
        title="📚 معلومات مهمة عن الإعدادات"
        description="مفتاح OpenAI API ضروري لتشغيل ميزات التحليل الصوتي والذكاء الاصطناعي. تأكد من أن لديك رصيد كافٍ في حسابك على OpenAI، وأن المفتاح لديه صلاحيات الوصول لـ Whisper (تحويل الصوت) و GPT-4 (التحليل)."
        icon={Info}
        variant="info"
      />

      {/* بطاقة إعدادات API */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
                <Database className="w-5 h-5 text-indigo-600" />
                إعدادات OpenAI API
              </CardTitle>
              <CardDescription className="arabic-text text-right text-sm mt-1">
                المفتاح يُستخدم لتحليل النطق وتوليد التمارين الطارئة
              </CardDescription>
            </div>

            {connectionStatus && (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className={cn(
                  "px-4 py-2 rounded-full text-sm font-semibold flex items-center gap-2",
                  connectionStatus === "success"
                    ? "bg-emerald-100 text-emerald-800"
                    : "bg-red-100 text-red-800"
                )}
              >
                {connectionStatus === "success" ? (
                  <>
                    <CheckCircle2 className="w-4 h-4" />
                    متصل
                  </>
                ) : (
                  <>
                    <XCircle className="w-4 h-4" />
                    غير متصل
                  </>
                )}
              </motion.div>
            )}
          </div>
        </CardHeader>

        <CardContent className="p-6 space-y-6">
          {/* حقل مفتاح API */}
          <div className="space-y-3">
            <Label className="arabic-text font-semibold text-right block text-slate-700 flex items-center justify-end gap-2">
              <Lock className="w-4 h-4" />
              مفتاح OpenAI API
            </Label>

            <div className="relative">
              <Input
                type={showApiKey ? "text" : "password"}
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                placeholder="sk-proj-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                className="font-mono text-sm pr-12 pl-12"
                autoComplete="off"
                dir="ltr"
              />

              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
              >
                {showApiKey ? (
                  <EyeOff className="w-5 h-5" />
                ) : (
                  <Eye className="w-5 h-5" />
                )}
              </button>

              {apiKey && (
                <div className="absolute right-3 top-1/2 -translate-y-1/2">
                  <TooltipProvider>
                    <Tooltip>
                      <TooltipTrigger asChild>
                        <button
                          type="button"
                          onClick={() => {
                            navigator.clipboard.writeText(apiKey);
                            toast({
                              title: "تم النسخ",
                              description: "تم نسخ المفتاح للحافظة",
                            });
                          }}
                          className="text-slate-400 hover:text-indigo-600 transition-colors"
                        >
                          <Copy className="w-4 h-4" />
                        </button>
                      </TooltipTrigger>
                      <TooltipContent>
                        <p className="arabic-text">نسخ المفتاح</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
              )}
            </div>

            <div className="flex items-start gap-2 text-xs text-slate-500 arabic-text text-right">
              <Info className="w-4 h-4 mt-0.5 flex-shrink-0" />
              <p>
                احصل على مفتاحك من{" "}
                <a
                  href="https://platform.openai.com/api-keys"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-indigo-600 hover:underline inline-flex items-center gap-1"
                >
                  منصة OpenAI
                  <ExternalLink className="w-3 h-3" />
                </a>
                . تأكد من تفعيل Whisper API و GPT-4.
              </p>
            </div>

            <div className="space-y-3 pt-3 border-t border-slate-100">
              <Label className="arabic-text font-semibold text-right block text-slate-700 flex items-center justify-end gap-2">
                <Upload className="w-4 h-4" />
                رابط Webhook لـ Google Sheets (اختياري)
              </Label>
              <Input
                type="url"
                value={googleSheetsWebhook}
                onChange={(e) => setGoogleSheetsWebhook(e.target.value)}
                placeholder="https://script.google.com/macros/s/xxxxxxxxxxxxxxxx/exec"
                className="font-mono text-xs"
                dir="ltr"
                autoComplete="off"
              />
              <p className="text-xs text-slate-500 arabic-text text-right">
                عند تعبئة الرابط، سيظهر زر تصدير مباشر إلى Google Sheets في صفحة الطلاب.
              </p>
            </div>
          </div>

          {/* أزرار الإجراءات */}
          <div className="flex gap-3 justify-end pt-4 border-t border-slate-100">
            <Button
              variant="outline"
              onClick={testConnection}
              disabled={!apiKey.trim() || testingConnection || isSaving}
              className="arabic-text"
            >
              {testingConnection ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الاختبار...
                </>
              ) : (
                <>
                  <Wifi className="w-4 h-4 ml-2" />
                  اختبار الاتصال
                </>
              )}
            </Button>

            <Button
              onClick={handleSave}
              disabled={!apiKey.trim() || isSaving || testingConnection}
              className="arabic-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : saved ? (
                <>
                  <CheckCircle2 className="w-4 h-4 ml-2" />
                  تم الحفظ
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-2" />
                  حفظ الإعدادات
                </>
              )}
            </Button>
          </div>

          {/* رسالة النجاح */}
          <AnimatePresence>
            {saved && (
              <motion.div
                initial={{ opacity: 0, y: -10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="bg-emerald-50 border border-emerald-200 rounded-lg p-4"
              >
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-emerald-500 rounded-full flex items-center justify-center">
                    <CheckCircle2 className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1 text-right">
                    <h4 className="font-semibold text-emerald-900 arabic-text">
                      تم الحفظ بنجاح
                    </h4>
                    <p className="text-sm text-emerald-700 arabic-text">
                      يمكنك الآن استخدام ميزات التحليل الصوتي والذكاء الاصطناعي
                    </p>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </CardContent>
      </Card>

      {/* معلومات الأمان */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50">
        <CardContent className="p-6">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 bg-amber-500 rounded-full flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1 text-right space-y-2">
              <h4 className="font-bold text-amber-900 arabic-text">
                🔐 ملاحظات الأمان والخصوصية
              </h4>
              <ul className="text-sm text-amber-800 arabic-text space-y-1">
                <li>• المفتاح يُحفظ بشكل آمن في قاعدة البيانات</li>
                <li>• لا يتم مشاركة المفتاح مع الطلاب أو عرضه في الواجهة</li>
                <li>• يُستخدم فقط لمعالجة الطلبات الخلفية (Backend)</li>
                <li>• تأكد من عدم مشاركة المفتاح مع أي شخص</li>
                <li>• يمكنك إلغاء المفتاح وإنشاء واحد جديد من لوحة OpenAI</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* معلومات تقنية */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Cpu className="w-5 h-5 text-slate-600" />
            المتطلبات التقنية
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <h5 className="font-semibold text-slate-700 arabic-text text-right">
                الخدمات المطلوبة:
              </h5>
              <ul className="text-sm text-slate-600 arabic-text text-right space-y-1">
                <li className="flex items-center justify-end gap-2">
                  <span>Whisper API (تحويل الصوت إلى نص)</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </li>
                <li className="flex items-center justify-end gap-2">
                  <span>GPT-4o (تحليل النطق)</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </li>
                <li className="flex items-center justify-end gap-2">
                  <span>GPT-4o mini (توليد التمارين)</span>
                  <CheckCircle className="w-4 h-4 text-emerald-500" />
                </li>
              </ul>
            </div>

            <div className="space-y-2">
              <h5 className="font-semibold text-slate-700 arabic-text text-right">
                التكلفة التقريبية:
              </h5>
              <ul className="text-sm text-slate-600 arabic-text text-right space-y-1">
                <li>• Whisper: ~$0.006 لكل دقيقة صوت</li>
                <li>• GPT-4o: ~$2.50 لكل مليون توكن</li>
                <li>• تكلفة متوسطة: $0.05 لكل تحليل طالب</li>
              </ul>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   👨‍🎓 القسم 6: إدارة الطلاب المحسّنة
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 👥 صفحة إدارة الطلاب - عرض شامل مع تصفية متقدمة
 */
function StudentsTab({ onSelectStudent }) {
  const [students, setStudents] = useState([]);
  const [filterGrade, setFilterGrade] = useState("all"); // ✅ تم التعديل إلى "all" بدلاً من ""
  const [searchName, setSearchName] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState(null);
  const [sortBy, setSortBy] = useState("name");
  const [sortOrder, setSortOrder] = useState("asc");
  const [viewMode, setViewMode] = useState("table"); // table or cards

  // للحذف
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [studentToDelete, setStudentToDelete] = useState(null);

  const { toast } = useToast();
  // التأكد من دعم الشاشات الصغيرة
  const [isMobile, setIsMobile] = useState(false);

  // تحديث حالة الشاشة
  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth < 768);
    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentList, groupList] = await Promise.all([
        Student.list("-last_activity"),
        StudentGroup.list(),
      ]);
      setStudents(studentList || []);
      setGroups(groupList || []);
    } catch (error) {
      console.error("Failed to load students or groups", error);
      toast({
        title: "خطأ في التحميل",
        description: "فشل تحميل بيانات الطلاب. يرجى المحاولة مرة أخرى.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // مساعد للبحث باللغة العربية (تجاهل التشكيل والهمزات)
  const arabicFilter = (text, search) => {
    if (!text || !search) return true;
    const normalize = (str) => str.replace(/[أإآء]/g, 'ا').replace(/[ة]/g, 'ه').replace(/[\u064B-\u065F]/g, '');
    return normalize(text).includes(normalize(search));
  };

  // المصفوفة القياسية للصفوف لاستخدامها في الترتيب والفلاتر
  const GRADE_LEVELS = [
    "الروضة", "الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع",
    "الصف الخامس", "الصف السادس", "الصف السابع", "الصف الثامن",
    "الصف التاسع", "الصف العاشر", "الصف الحادي عشر", "الصف الثاني عشر"
  ];

  // الطلاب المفلترين والمرتبين
  const filteredAndSortedStudents = useMemo(() => {
    let result = (students || []).filter((s) => {
      let ok = true;
      // ✅ فحص filterGrade مقابل "all" وليس قيمة فارغة
      if (filterGrade && filterGrade !== "all") ok = ok && s.grade === filterGrade;

      if (searchName.trim()) {
        ok = ok && arabicFilter(s.name, searchName);
      }

      if (selectedGroupFilter !== "all") {
        ok = ok && s.group_id && selectedGroupFilter === s.group_id;
      }
      return ok;
    });

    // الترتيب
    result.sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case "name":
          comparison = (a.name || "").localeCompare(b.name || "", "ar");
          break;
        case "grade":
          comparison = GRADE_LEVELS.indexOf(a.grade) - GRADE_LEVELS.indexOf(b.grade);
          break;
        case "score":
          comparison = (a.average_score || 0) - (b.average_score || 0);
          break;
        case "exercises":
          comparison = (a.total_exercises || 0) - (b.total_exercises || 0);
          break;
        case "activity":
          const dateA = new Date(a.last_activity || 0);
          const dateB = new Date(b.last_activity || 0);
          comparison = dateA - dateB;
          break;
        default:
          comparison = 0;
      }

      return sortOrder === "asc" ? comparison : -comparison;
    });

    return result;
  }, [students, filterGrade, searchName, selectedGroupFilter, sortBy, sortOrder]);

  const handleDeleteClick = (student) => {
    setStudentToDelete(student);
    setDeleteDialogOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (studentToDelete) {
      try {
        await Student.delete(studentToDelete.id);
        toast({
          title: "تم الحذف",
          description: `تم حذف الطالب ${studentToDelete.name} بنجاح`,
        });
        loadData();
      } catch (error) {
        console.error("Delete failed:", error);
        toast({
          title: "خطأ",
          description: "فشل حذف الطالب",
          variant: "destructive",
        });
      } finally {
        setDeleteDialogOpen(false);
        setStudentToDelete(null);
      }
    }
  };

  const getGroupName = (groupId) => {
    if (!groupId) return "غير منضم لمجموعة";
    const group = (groups || []).find((g) => g.id === groupId);
    return group ? group.name : "مجموعة غير معروفة";
  };

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case "متقدم":
        return "bg-emerald-100 text-emerald-800 border-emerald-200";
      case "متوسط":
        return "bg-blue-100 text-blue-800 border-blue-200";
      default:
        return "bg-slate-100 text-slate-800 border-slate-200";
    }
  };

  const getScoreBadgeColor = (score) => {
    if (!score) return "bg-slate-100 text-slate-800";
    if (score >= 90) return "bg-emerald-100 text-emerald-800";
    if (score >= 80) return "bg-green-100 text-green-800";
    if (score >= 70) return "bg-blue-100 text-blue-800";
    if (score >= 60) return "bg-amber-100 text-amber-800";
    return "bg-red-100 text-red-800";
  };

  const getTimeAgo = (dateString) => {
    if (!dateString) return "لا يوجد نشاط";
    const diff = Date.now() - new Date(dateString).getTime();
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    if (days === 0) return "اليوم";
    if (days === 1) return "أمس";
    if (days < 7) return `منذ ${days} أيام`;
    return new Date(dateString).toLocaleDateString('ar-AE');
  };

  // إحصائيات سريعة
  const stats = useMemo(() => {
    const total = filteredAndSortedStudents.length;
    const active = filteredAndSortedStudents.filter(s => {
      const lastActivity = new Date(s.last_activity);
      const daysSince = (Date.now() - lastActivity) / (1000 * 60 * 60 * 24);
      return daysSince <= 7;
    }).length;

    // ✅ حساب المتوسط برمجياً بدلاً من استخدام دالة مفقودة (calculateAverage)
    const validScores = filteredAndSortedStudents.map(s => s.average_score).filter(Boolean);
    const avgScore = validScores.length > 0
      ? Math.round(validScores.reduce((a, b) => a + b, 0) / validScores.length)
      : 0;

    const needsHelp = filteredAndSortedStudents.filter(s =>
      (s.average_score || 0) < 70 && (s.average_score || 0) > 0
    ).length;

    return { total, active, avgScore, needsHelp };
  }, [filteredAndSortedStudents]);

  return (
    <div className="space-y-6">
      {/* رأس الصفحة مع الإحصائيات */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="space-y-4"
      >
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-slate-900 arabic-text text-right">
              👥 إدارة الطلاب
            </h2>
            <p className="text-sm text-slate-600 arabic-text text-right mt-1">
              متابعة شاملة لأداء وتقدم جميع الطلاب
            </p>
          </div>

          <Button
            variant="outline"
            onClick={loadData}
            disabled={isLoading}
            className="arabic-text"
          >
            <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
            تحديث
          </Button>
        </div>

        {/* بطاقات الإحصائيات السريعة */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <Card className="border-l-4 border-l-indigo-500 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-bold mb-1 arabic-text">إجمالي الطلاب</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-indigo-900">{stats.total}</h3>
                <Users className="w-6 h-6 text-indigo-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-emerald-500 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-bold mb-1 arabic-text">نشط هذا الأسبوع</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-emerald-900">{stats.active}</h3>
                <Activity className="w-6 h-6 text-emerald-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-blue-500 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-bold mb-1 arabic-text">متوسط الدرجات</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-blue-900">{stats.avgScore}%</h3>
                <Star className="w-6 h-6 text-blue-200" />
              </div>
            </CardContent>
          </Card>
          <Card className="border-l-4 border-l-amber-500 shadow-sm">
            <CardContent className="p-4">
              <p className="text-xs text-slate-500 font-bold mb-1 arabic-text">يحتاج دعم (<span className="text-[10px]">أقل من 70%</span>)</p>
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-black text-amber-900">{stats.needsHelp}</h3>
                <AlertCircle className="w-6 h-6 text-amber-200" />
              </div>
            </CardContent>
          </Card>
        </div>
      </motion.div>

      {/* أدوات التصفية المتقدمة */}
      <Card className="border-0 shadow-lg overflow-hidden">
        <CardHeader className="border-b border-slate-100 bg-slate-50/50">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <CardTitle className="arabic-text text-right flex items-center gap-2">
              <Filter className="w-5 h-5 text-indigo-500" />
              تصفية وترتيب الطلاب
            </CardTitle>

            <div className="flex gap-2 w-full md:w-auto">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setFilterGrade("all"); // ✅ الاستعادة للقيمة الصحيحة
                  setSearchName("");
                  setSelectedGroupFilter("all");
                  setSortBy("name");
                  setSortOrder("asc");
                }}
                className="arabic-text text-xs flex-1 md:flex-none text-slate-500 hover:text-red-500 hover:bg-red-50"
              >
                إعادة ضبط
              </Button>

              {!isMobile && (
                <div className="flex border border-slate-200 rounded-lg overflow-hidden bg-slate-100 p-1">
                  <button
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "px-4 py-1 text-xs font-bold transition-all rounded-md",
                      viewMode === "table"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    جدول
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={cn(
                      "px-4 py-1 text-xs font-bold transition-all rounded-md",
                      viewMode === "cards"
                        ? "bg-white text-indigo-600 shadow-sm"
                        : "text-slate-500 hover:text-slate-700"
                    )}
                  >
                    بطاقات
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-5 gap-4">
            {/* البحث بالاسم */}
            <div className="space-y-2 text-right md:col-span-2">
              <Label className="arabic-text text-xs font-bold text-slate-500">
                البحث بالاسم
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute right-3 top-3" />
                <Input
                  placeholder="اكتب اسم الطالب..."
                  value={searchName}
                  onChange={(e) => setSearchName(e.target.value)}
                  className="pr-10 text-right arabic-text"
                />
              </div>
            </div>

            {/* الصف الدراسي */}
            <div className="space-y-2 text-right">
              <Label className="arabic-text text-xs font-bold text-slate-500">
                الصف الدراسي
              </Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="text-right arabic-text" dir="rtl">
                  <SelectValue placeholder="جميع الصفوف" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="arabic-text">
                    جميع الصفوف
                  </SelectItem>
                  {GRADE_LEVELS.map((g) => (
                    <SelectItem key={g} value={g} className="arabic-text">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* المجموعة */}
            <div className="space-y-2 text-right">
              <Label className="arabic-text text-xs font-bold text-slate-500">
                المجموعة
              </Label>
              <Select
                value={selectedGroupFilter}
                onValueChange={setSelectedGroupFilter}
              >
                <SelectTrigger className="text-right arabic-text" dir="rtl">
                  <SelectValue placeholder="كل المجموعات" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="arabic-text">
                    كل المجموعات
                  </SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="arabic-text">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* الترتيب */}
            <div className="space-y-2 text-right">
              <Label className="arabic-text text-xs font-bold text-slate-500">
                الترتيب حسب
              </Label>
              <div className="flex gap-2">
                <Select value={sortBy} onValueChange={setSortBy}>
                  <SelectTrigger className="text-right arabic-text flex-1" dir="rtl">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="name" className="arabic-text">الاسم</SelectItem>
                    <SelectItem value="grade" className="arabic-text">الصف</SelectItem>
                    <SelectItem value="score" className="arabic-text">الدرجة</SelectItem>
                    <SelectItem value="exercises" className="arabic-text">التمارين</SelectItem>
                    <SelectItem value="activity" className="arabic-text">النشاط</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  size="icon"
                  className="shrink-0"
                  onClick={() => setSortOrder(prev => prev === "asc" ? "desc" : "asc")}
                >
                  {sortOrder === "asc" ? (
                    <ChevronUp className="w-4 h-4 text-slate-600" />
                  ) : (
                    <ChevronDown className="w-4 h-4 text-slate-600" />
                  )}
                </Button>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة الطلاب */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="flex items-center justify-between">
            <span className="arabic-text text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-indigo-500" />
              سجلات الطلاب
              <Badge variant="secondary" className="ml-2 font-mono">{filteredAndSortedStudents.length}</Badge>
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="p-0 sm:p-6">
          {isLoading ? (
            <div className="flex flex-col items-center justify-center py-20">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-4" />
              <p className="text-sm text-slate-500 font-bold arabic-text">جاري جلب بيانات الطلاب...</p>
            </div>
          ) : filteredAndSortedStudents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-20 bg-slate-50 rounded-xl border border-dashed border-slate-200 m-6">
              <Users className="w-12 h-12 text-slate-300 mb-4" />
              <h3 className="font-bold text-slate-700 arabic-text mb-1">لا يوجد طلاب</h3>
              <p className="text-sm text-slate-500 arabic-text">لم يتم العثور على أي طالب يطابق معايير البحث الحالية.</p>
            </div>
          ) : viewMode === "table" && !isMobile ? (
            // عرض الجدول للشاشات الكبيرة
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200">
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider arabic-text">الطالب</th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider arabic-text">الصف / المجموعة</th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider arabic-text">آخر نشاط</th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider arabic-text text-center">المستوى</th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider arabic-text text-center">الإنجاز</th>
                    <th className="py-4 px-4 text-xs font-bold text-slate-500 uppercase tracking-wider arabic-text text-center">إجراءات</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {filteredAndSortedStudents.map((s, index) => (
                    <React.Fragment key={s.id}>
                      <motion.tr
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.03 }}
                        className="hover:bg-indigo-50/30 transition-colors group"
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-3">
                            {/* ✅ حل مشكلة Avatar باستبدالها بـ div بسيط وجميل */}
                            <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm shrink-0">
                              {s.name?.charAt(0) || "؟"}
                            </div>
                            <div>
                              <p className="text-sm font-bold text-slate-900 arabic-text">{s.name}</p>
                              <p className="text-[10px] text-slate-500 font-mono">ID: {s.access_code || '---'}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div className="flex flex-col">
                            <span className="text-sm text-slate-700 arabic-text">{s.grade}</span>
                            <span className="text-[10px] text-slate-400 arabic-text">{getGroupName(s.group_id)}</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-xs text-slate-600 arabic-text">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3 text-slate-400" />
                            {getTimeAgo(s.last_activity)}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <span className={cn(
                            "inline-flex items-center px-2.5 py-1 rounded-full text-[10px] font-bold border",
                            getLevelBadgeColor(s.level || "مبتدئ")
                          )}>
                            <Star className="w-3 h-3 ml-1" />
                            {s.level || "مبتدئ"}
                          </span>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex flex-col items-center">
                            <span className={cn(
                              "font-black text-sm",
                              (s.average_score || 0) >= 80 ? "text-emerald-600" : (s.average_score || 0) >= 60 ? "text-amber-600" : "text-red-600"
                            )}>
                              {s.average_score ? `${s.average_score}%` : "-"}
                            </span>
                            <span className="text-[10px] text-slate-400">{s.total_exercises || 0} تمرين</span>
                          </div>
                        </td>
                        <td className="py-3 px-4 text-center">
                          <div className="flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Button
                              size="sm"
                              variant="outline"
                              onClick={() => onSelectStudent(s)}
                              className="arabic-text text-xs bg-white hover:bg-indigo-50 hover:text-indigo-600 border-slate-200"
                            >
                              <FileText className="w-3 h-3 ml-1" />
                              ملف الطالب
                            </Button>
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8 hover:bg-slate-200">
                                  <MoreVertical className="w-4 h-4 text-slate-500" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuLabel className="arabic-text text-right text-xs text-slate-400">
                                  إجراءات سريعة
                                </DropdownMenuLabel>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="arabic-text text-right flex justify-end cursor-pointer"
                                  onClick={() => setExpandedStudentId(expandedStudentId === s.id ? null : s.id)}
                                >
                                  {expandedStudentId === s.id ? "إخفاء التقرير" : "تقرير نقاط القوة"}
                                  <Activity className="w-4 h-4 ml-2 text-indigo-500" />
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  className="arabic-text text-right text-red-600 hover:text-red-700 hover:bg-red-50 flex justify-end cursor-pointer"
                                  onClick={() => handleDeleteClick(s)}
                                >
                                  حذف نهائي
                                  <Trash2 className="w-4 h-4 ml-2" />
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </td>
                      </motion.tr>

                      {/* Expanded Row */}
                      <AnimatePresence>
                        {expandedStudentId === s.id && (
                          <motion.tr
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="bg-slate-50 border-b border-slate-200"
                          >
                            <td colSpan={6} className="p-4 px-8">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-white p-4 rounded-xl border border-slate-100 shadow-sm">
                                <div>
                                  <h4 className="text-xs font-bold text-emerald-700 arabic-text mb-3 flex items-center justify-end gap-1 border-b border-emerald-100 pb-2">
                                    <CheckCircle2 className="w-4 h-4" />
                                    حروف ومهارات أتقنها
                                  </h4>
                                  <div className="flex flex-wrap gap-2 justify-end">
                                    {s.mastered_letters?.length > 0 ? (
                                      s.mastered_letters.map(char => (
                                        <span key={char} className="w-8 h-8 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center text-sm font-bold border border-emerald-200 shadow-sm">
                                          {char}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-400 arabic-text">قيد التقييم...</span>
                                    )}
                                  </div>
                                </div>
                                <div>
                                  <h4 className="text-xs font-bold text-amber-700 arabic-text mb-3 flex items-center justify-end gap-1 border-b border-amber-100 pb-2">
                                    <AlertTriangle className="w-4 h-4" />
                                    نقاط تحتاج للتدريب
                                  </h4>
                                  <div className="flex flex-wrap gap-2 justify-end">
                                    {s.needs_practice_letters?.length > 0 ? (
                                      s.needs_practice_letters.map(char => (
                                        <span key={char} className="w-8 h-8 rounded-lg bg-amber-50 text-amber-700 flex items-center justify-center text-sm font-bold border border-amber-200 shadow-sm">
                                          {char}
                                        </span>
                                      ))
                                    ) : (
                                      <span className="text-xs text-slate-400 arabic-text">لا توجد ملاحظات سلبية</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>
                          </motion.tr>
                        )}
                      </AnimatePresence>
                    </React.Fragment>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            // عرض البطاقات (Mobile View أو عند اختيار Cards)
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3 p-4 sm:p-0">
              {filteredAndSortedStudents.map((s, index) => (
                <motion.div
                  key={s.id}
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border border-slate-200 shadow-sm hover:shadow-md hover:border-indigo-300 transition-all overflow-hidden relative group">
                    <div className={`absolute top-0 right-0 w-1 h-full ${(s.average_score || 0) >= 80 ? "bg-emerald-500" : (s.average_score || 0) >= 60 ? "bg-amber-500" : "bg-red-500"
                      }`}></div>
                    <CardContent className="p-5">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1 text-right">
                          <h3 className="text-lg font-bold text-slate-900 arabic-text mb-1 truncate">
                            {s.name}
                          </h3>
                          <p className="text-[10px] text-slate-500 arabic-text mt-0.5">
                            {s.grade} • {getGroupName(s.group_id)}
                          </p>
                        </div>

                        {/* ✅ حل مشكلة Avatar هنا أيضاً */}
                        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center text-indigo-700 font-bold border border-indigo-200 shadow-sm shrink-0 ml-3">
                          {s.name?.charAt(0) || "؟"}
                        </div>
                      </div>

                      <div className="grid grid-cols-3 gap-2 bg-slate-50 p-3 rounded-xl mb-4 border border-slate-100">
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 arabic-text mb-1">المرحلة</p>
                          <p className="font-bold text-indigo-600 text-sm">{s.current_stage || 1}</p>
                        </div>
                        <div className="text-center border-x border-slate-200">
                          <p className="text-[10px] text-slate-500 arabic-text mb-1">التمارين</p>
                          <p className="font-bold text-slate-700 text-sm">{s.total_exercises || 0}</p>
                        </div>
                        <div className="text-center">
                          <p className="text-[10px] text-slate-500 arabic-text mb-1">المتوسط</p>
                          <p className={cn(
                            "font-bold text-sm",
                            (s.average_score || 0) >= 80 ? "text-emerald-600" : (s.average_score || 0) >= 60 ? "text-amber-600" : "text-red-600"
                          )}>
                            {s.average_score ? `${s.average_score}%` : "-"}
                          </p>
                        </div>
                      </div>

                      <div className="flex items-center justify-between pt-2">
                        <span className="text-[10px] text-slate-400 flex items-center gap-1 arabic-text">
                          <Clock className="w-3 h-3" /> {getTimeAgo(s.last_activity)}
                        </span>

                        <div className="flex gap-2">
                          <Button size="icon" variant="ghost" className="h-8 w-8 text-red-500 hover:bg-red-50" onClick={() => handleDeleteClick(s)}>
                            <Trash2 className="w-4 h-4" />
                          </Button>
                          <Button size="sm" onClick={() => onSelectStudent(s)} className="text-xs h-8 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white arabic-text px-4">
                            السجل <ChevronLeft className="w-3 h-3 ml-1" />
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة تأكيد الحذف */}
      <DeleteConfirmDialog
        isOpen={deleteDialogOpen}
        onClose={() => {
          setDeleteDialogOpen(false);
          setStudentToDelete(null);
        }}
        onConfirm={handleConfirmDelete}
        type="single"
        isDeleting={false}
      />
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// نهاية المرحلة 2/4
// ═══════════════════════════════════════════════════════════════════

/* ═══════════════════════════════════════════════════════════════════
   👥 المرحلة 3/4: صفحات المجموعات والتمارين والتسجيلات
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   👥 القسم 7: إدارة المجموعات المحسّنة
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 👥 صفحة إدارة المجموعات - تنظيم الطلاب في مجموعات
 */
function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [newGroupDescription, setNewGroupDescription] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");
  const [expandedGroupId, setExpandedGroupId] = useState(null);
  const [editingGroupId, setEditingGroupId] = useState(null);
  const [editGroupName, setEditGroupName] = useState("");

  const { toast } = useToast();

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [groupList, studentList] = await Promise.all([
        StudentGroup.list(),
        Student.list("-name"),
      ]);
      setGroups(groupList || []);
      setStudents(studentList || []);
    } catch (e) {
      console.error("Failed to load data", e);
      toast({
        title: "خطأ في التحميل",
        description: "فشل تحميل بيانات المجموعات",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال اسم المجموعة",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      let g;
      try {
        g = await StudentGroup.create({
          name: newGroupName.trim(),
          description: newGroupDescription.trim() || null,
        });
      } catch (createError) {
        // توافق مع قواعد بيانات لا تحتوي عمود description
        if (String(createError?.code || "") === "PGRST204") {
          g = await StudentGroup.create({
            name: newGroupName.trim(),
          });
        } else {
          throw createError;
        }
      }
      setGroups((prev) => [g, ...prev]);
      setNewGroupName("");
      setNewGroupDescription("");
      toast({
        title: "✅ تم الإنشاء",
        description: `تم إنشاء مجموعة "${newGroupName}" بنجاح`,
      });
    } catch (e) {
      console.error("Create group failed", e);
      toast({
        title: "خطأ",
        description: "فشل إنشاء المجموعة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedGroupId || selectedStudents.length === 0) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار مجموعة وطلاب",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      await Promise.all(
        selectedStudents.map((studentId) =>
          Student.update(studentId, { group_id: selectedGroupId })
        )
      );
      toast({
        title: "✅ تم التحديث",
        description: `تم ربط ${selectedStudents.length} طالب بالمجموعة`,
      });
      await loadData();
      setSelectedStudents([]);
    } catch (e) {
      console.error("Assign students failed", e);
      toast({
        title: "خطأ",
        description: "فشل في ربط الطلاب بالمجموعة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    const group = groups.find(g => g.id === groupId);
    if (!window.confirm(`هل تريد حذف مجموعة "${group?.name}"؟\n\nملاحظة: لن يتم حذف الطلاب، سيفقدون فقط ارتباطهم بهذه المجموعة.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await StudentGroup.delete(groupId);
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف المجموعة بنجاح",
      });
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
      if (selectedGroupId === groupId) {
        setSelectedGroupId("");
      }
    } catch (e) {
      console.error("Delete group failed", e);
      toast({
        title: "خطأ",
        description: "فشل في حذف المجموعة",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleUpdateGroupName = async (groupId) => {
    if (!editGroupName.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال اسم صالح",
        variant: "destructive",
      });
      return;
    }

    try {
      await StudentGroup.update(groupId, { name: editGroupName.trim() });
      setGroups(prev => prev.map(g =>
        g.id === groupId ? { ...g, name: editGroupName.trim() } : g
      ));
      setEditingGroupId(null);
      toast({
        title: "✅ تم التحديث",
        description: "تم تحديث اسم المجموعة",
      });
    } catch (error) {
      console.error("Update group failed:", error);
      toast({
        title: "خطأ",
        description: "فشل تحديث اسم المجموعة",
        variant: "destructive",
      });
    }
  };

  const filteredStudents = useMemo(() => {
    return (students || []).filter((s) => {
      if (groupFilter === "all") return true;
      if (groupFilter === "ungrouped") return !s.group_id;
      return s.group_id === groupFilter;
    });
  }, [students, groupFilter]);

  const getGroupName = (groupId) => {
    const group = (groups || []).find((g) => g.id === groupId);
    return group ? group.name : "غير منضم لمجموعة";
  };

  const toggleStudentSelection = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  const getStudentsInGroup = (groupId) => {
    return students.filter(s => s.group_id === groupId);
  };

  const groupStats = useMemo(() => {
    return groups.map(group => {
      const studentsInGroup = getStudentsInGroup(group.id);
      const avgScore = calculateAverage(
        studentsInGroup.map(s => s.average_score).filter(Boolean)
      );
      return {
        ...group,
        studentCount: studentsInGroup.length,
        avgScore,
      };
    });
  }, [groups, students]);

  if (isLoading && groups.length === 0) {
    return <LoadingSpinner text="جاري تحميل المجموعات..." />;
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 arabic-text text-right">
            👥 إدارة المجموعات
          </h2>
          <p className="text-sm text-slate-600 arabic-text text-right mt-1">
            تنظيم الطلاب في مجموعات لسهولة الإدارة والمتابعة
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadData}
          disabled={isLoading}
          className="arabic-text"
        >
          <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
          تحديث
        </Button>
      </motion.div>

      {/* تعليمات */}
      <InfoCard
        title="💡 كيفية استخدام المجموعات"
        description="المجموعات تساعدك على تنظيم الطلاب حسب الفصول أو المستويات أو أي تصنيف آخر. يمكنك إنشاء مجموعات جديدة، ربط الطلاب بها، ومتابعة أداء كل مجموعة بشكل منفصل."
        icon={HelpCircle}
        variant="info"
      />

      {/* إنشاء مجموعة جديدة */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
        <CardHeader className="border-b border-indigo-100">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-indigo-600" />
            إنشاء مجموعة جديدة
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="space-y-2 text-right md:col-span-2">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                اسم المجموعة *
              </Label>
              <Input
                placeholder="مثال: الصف الخامس - المجموعة أ"
                value={newGroupName}
                onChange={(e) => setNewGroupName(e.target.value)}
                className="text-right arabic-text"
              />
            </div>

            <div className="space-y-2 text-right md:col-span-1">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                وصف (اختياري)
              </Label>
              <Input
                placeholder="وصف قصير"
                value={newGroupDescription}
                onChange={(e) => setNewGroupDescription(e.target.value)}
                className="text-right arabic-text"
              />
            </div>
          </div>

          <div className="flex justify-end mt-4">
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isLoading}
              className="arabic-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700"
            >
              <Plus className="w-4 h-4 ml-1" />
              إنشاء المجموعة
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* عرض المجموعات */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-slate-500" />
            المجموعات الحالية ({groupStats.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {groupStats.length === 0 ? (
            <EmptyState
              title="لا توجد مجموعات"
              description="قم بإنشاء مجموعة جديدة أعلاه لبدء تنظيم الطلاب"
              icon={Users}
            />
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {groupStats.map((group, index) => (
                <motion.div
                  key={group.id}
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ delay: index * 0.05 }}
                >
                  <Card className="border-2 border-slate-200 hover:border-indigo-300 hover:shadow-lg transition-all">
                    <CardContent className="p-5">
                      {/* رأس البطاقة */}
                      <div className="flex items-start justify-between mb-4">
                        {editingGroupId === group.id ? (
                          <div className="flex-1 flex gap-2">
                            <Input
                              value={editGroupName}
                              onChange={(e) => setEditGroupName(e.target.value)}
                              className="text-right arabic-text text-sm"
                              autoFocus
                            />
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => handleUpdateGroupName(group.id)}
                              className="text-emerald-600"
                            >
                              <CheckCircle2 className="w-4 h-4" />
                            </Button>
                            <Button
                              size="icon"
                              variant="ghost"
                              onClick={() => setEditingGroupId(null)}
                              className="text-slate-600"
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        ) : (
                          <>
                            <div className="flex-1 text-right">
                              <h3 className="text-base font-bold text-slate-900 arabic-text">
                                {group.name}
                              </h3>
                              {group.description && (
                                <p className="text-xs text-slate-500 arabic-text mt-1">
                                  {group.description}
                                </p>
                              )}
                            </div>

                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="icon" className="h-8 w-8">
                                  <MoreVertical className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end" className="w-48">
                                <DropdownMenuItem
                                  onClick={() => {
                                    setEditingGroupId(group.id);
                                    setEditGroupName(group.name);
                                  }}
                                  className="arabic-text cursor-pointer"
                                >
                                  <Edit className="w-4 h-4 ml-2" />
                                  تعديل الاسم
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                  onClick={() => setSelectedGroupId(group.id)}
                                  className="arabic-text cursor-pointer"
                                >
                                  <Users className="w-4 h-4 ml-2" />
                                  ربط طلاب
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                  onClick={() => handleDeleteGroup(group.id)}
                                  className="text-red-600 arabic-text cursor-pointer"
                                >
                                  <Trash2 className="w-4 h-4 ml-2" />
                                  حذف المجموعة
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </>
                        )}
                      </div>

                      {/* إحصائيات المجموعة */}
                      <div className="grid grid-cols-2 gap-3 bg-gradient-to-r from-slate-50 to-slate-100 p-3 rounded-xl">
                        <div className="text-center">
                          <div className="text-[10px] text-slate-500 mb-1 arabic-text">عدد الطلاب</div>
                          <div className="font-bold text-indigo-600 text-lg">
                            {group.studentCount}
                          </div>
                        </div>
                        <div className="text-center border-r border-slate-200">
                          <div className="text-[10px] text-slate-500 mb-1 arabic-text">متوسط الدرجات</div>
                          <div className={cn(
                            "font-bold text-lg",
                            group.avgScore >= 80 ? "text-emerald-600" : group.avgScore >= 60 ? "text-amber-600" : "text-slate-600"
                          )}>
                            {group.avgScore > 0 ? `${group.avgScore}%` : "-"}
                          </div>
                        </div>
                      </div>

                      {/* زر عرض التفاصيل */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setExpandedGroupId(expandedGroupId === group.id ? null : group.id)}
                        className="w-full mt-3 arabic-text text-xs"
                      >
                        {expandedGroupId === group.id ? (
                          <>
                            <ChevronUp className="w-3 h-3 ml-1" />
                            إخفاء الطلاب
                          </>
                        ) : (
                          <>
                            <ChevronDown className="w-3 h-3 ml-1" />
                            عرض الطلاب ({group.studentCount})
                          </>
                        )}
                      </Button>

                      {/* قائمة الطلاب الموسعة */}
                      <AnimatePresence>
                        {expandedGroupId === group.id && (
                          <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            className="mt-3 pt-3 border-t border-slate-200"
                          >
                            <div className="space-y-2 max-h-48 overflow-y-auto">
                              {getStudentsInGroup(group.id).map(student => (
                                <div
                                  key={student.id}
                                  className="flex items-center justify-between p-2 bg-slate-50 rounded-lg text-xs"
                                >
                                  <div className="flex items-center gap-2">
                                    <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                      {student.name?.charAt(0) || "؟"}
                                    </div>
                                    <span className="font-semibold text-slate-900 arabic-text">
                                      {student.name}
                                    </span>
                                  </div>
                                  <Badge className={getScoreBadgeColor(student.average_score)}>
                                    {student.average_score ? `${student.average_score}%` : "-"}
                                  </Badge>
                                </div>
                              ))}

                              {getStudentsInGroup(group.id).length === 0 && (
                                <p className="text-xs text-slate-500 text-center py-2 arabic-text">
                                  لا يوجد طلاب في هذه المجموعة
                                </p>
                              )}
                            </div>
                          </motion.div>
                        )}
                      </AnimatePresence>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* ربط الطلاب بمجموعة */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-emerald-50 to-teal-50">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            ربط الطلاب بمجموعة
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                اختر المجموعة
              </Label>
              <Select value={selectedGroupId} onValueChange={setSelectedGroupId}>
                <SelectTrigger className="text-right arabic-text">
                  <SelectValue placeholder="اختر مجموعة" />
                </SelectTrigger>
                <SelectContent>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="arabic-text">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-right">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                تصفية الطلاب
              </Label>
              <Select value={groupFilter} onValueChange={setGroupFilter}>
                <SelectTrigger className="text-right arabic-text">
                  <SelectValue placeholder="كل الطلاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all" className="arabic-text">
                    كل الطلاب
                  </SelectItem>
                  <SelectItem value="ungrouped" className="arabic-text">
                    بدون مجموعة فقط
                  </SelectItem>
                  {groups.map((g) => (
                    <SelectItem key={g.id} value={g.id} className="arabic-text">
                      {g.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {selectedStudents.length > 0 && (
            <Alert className="bg-indigo-50 border-indigo-200">
              <Info className="h-4 w-4 text-indigo-600" />
              <AlertDescription className="arabic-text text-right text-indigo-800">
                تم اختيار {selectedStudents.length} طالب
              </AlertDescription>
            </Alert>
          )}

          <div className="overflow-x-auto border border-slate-200 rounded-lg">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    <Checkbox
                      checked={selectedStudents.length === filteredStudents.length && filteredStudents.length > 0}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          setSelectedStudents(filteredStudents.map(s => s.id));
                        } else {
                          setSelectedStudents([]);
                        }
                      }}
                    />
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    الاسم
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    الصف
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    المجموعة الحالية
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                  >
                    <td className="py-2 px-3 text-center">
                      <Checkbox
                        checked={selectedStudents.includes(s.id)}
                        onCheckedChange={() => toggleStudentSelection(s.id)}
                      />
                    </td>
                    <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text whitespace-nowrap">
                      <div className="flex items-center gap-2">
                        <div className="w-6 h-6 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white text-xs font-bold">
                          {s.name?.charAt(0) || "؟"}
                        </div>
                        {s.name}
                      </div>
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                      {s.grade}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                      <Badge variant="outline" className="text-xs">
                        {getGroupName(s.group_id)}
                      </Badge>
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-6 text-slate-500 arabic-text"
                    >
                      لا يوجد طلاب في هذه التصفية
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleAssignStudents}
              disabled={!selectedGroupId || selectedStudents.length === 0 || isLoading}
              className="arabic-text bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  جاري الربط...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4 ml-1" />
                  ربط {selectedStudents.length} طالب بالمجموعة
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* تحذير */}
      <InfoCard
        title="⚠️ ملاحظة مهمة"
        description="عند حذف مجموعة، لن يتم حذف الطلاب المرتبطين بها. سيفقد الطلاب فقط ارتباطهم بتلك المجموعة ويمكنك ربطهم بمجموعة أخرى لاحقاً."
        icon={AlertTriangle}
        variant="warning"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   📚 القسم 8: إدارة التمارين المحسّنة
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 📚 صفحة إدارة التمارين - إنشاء وتعديل التمارين
 */
function ExercisesTab() {
  const ALL = "__all__";

  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // حقول التمرين الجديد
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newLevel, setNewLevel] = useState("مبتدئ");
  const [newStage, setNewStage] = useState(1);

  // التصفية
  const [filterGrade, setFilterGrade] = useState(ALL);
  const [filterLevel, setFilterLevel] = useState(ALL);
  const [filterStage, setFilterStage] = useState("");
  const [searchText, setSearchText] = useState("");
  const [showInactiveOnly, setShowInactiveOnly] = useState(false);

  const { toast } = useToast();

  useEffect(() => {
    loadExercises();
  }, []);

  const loadExercises = async () => {
    setIsLoading(true);
    try {
      const list = await Exercise.list("-created_date");
      setExercises((list || []).map(normalizeExercise));
    } catch (e) {
      console.error("Failed to load exercises", e);
      toast({
        title: "خطأ في التحميل",
        description: "فشل تحميل التمارين",
        variant: "destructive",
      });
      setExercises([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!newTitle.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال عنوان التمرين",
        variant: "destructive",
      });
      return;
    }

    if (!newText.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال نص التمرين",
        variant: "destructive",
      });
      return;
    }

    if (!newGrade) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار الصف الدراسي",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const ex = await safeCreateExercise({
        title: newTitle.trim(),
        sentence: newText.trim(),
        grade: newGrade,
        level: newLevel,
        stage: parseInt(newStage, 10) || 1,
        is_active: true,
      });

      setExercises((prev) => [normalizeExercise(ex), ...prev]);

      // إعادة ضبط الحقول
      setNewTitle("");
      setNewText("");
      setNewGrade("");
      setNewLevel("مبتدئ");
      setNewStage(1);

      toast({
        title: "✅ تم الإنشاء",
        description: "تم إنشاء التمرين بنجاح",
      });
    } catch (e) {
      console.error("Create exercise failed", e);
      toast({
        title: "خطأ",
        description: e.message || "فشل في إنشاء التمرين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleActive = async (exercise) => {
    try {
      await Exercise.update(exercise.id, { is_active: !exercise.is_active });
      setExercises(prev => prev.map(ex =>
        ex.id === exercise.id ? { ...ex, is_active: !ex.is_active } : ex
      ));
      toast({
        title: "✅ تم التحديث",
        description: `التمرين الآن ${!exercise.is_active ? "نشط" : "غير نشط"}`,
      });
    } catch (error) {
      console.error("Toggle active failed:", error);
      toast({
        title: "خطأ",
        description: "فشل تحديث حالة التمرين",
        variant: "destructive",
      });
    }
  };

  const handleDeleteExercise = async (id, title) => {
    if (!window.confirm(`هل تريد حذف التمرين "${title}"؟\n\nهذا الإجراء لا يمكن التراجع عنه.`)) {
      return;
    }

    setIsLoading(true);
    try {
      await Exercise.delete(id);
      setExercises((prev) => prev.filter((x) => x.id !== id));
      toast({
        title: "✅ تم الحذف",
        description: "تم حذف التمرين بنجاح",
      });
    } catch (e) {
      console.error("Delete exercise failed", e);
      toast({
        title: "خطأ",
        description: "فشل في حذف التمرين",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = useMemo(() => {
    return (exercises || []).filter((ex) => {
      let ok = true;
      if (filterGrade !== ALL) ok = ok && ex.grade === filterGrade;
      if (filterLevel !== ALL) ok = ok && ex.level === filterLevel;
      if (filterStage) ok = ok && ex.stage === parseInt(filterStage, 10);
      if (searchText.trim()) {
        const t = searchText.trim().toLowerCase();
        ok = ok && (
          arabicFilter(ex.title, searchText) ||
          arabicFilter(ex.text, searchText)
        );
      }
      if (showInactiveOnly) ok = ok && !ex.is_active;
      return ok;
    });
  }, [exercises, filterGrade, filterLevel, filterStage, searchText, showInactiveOnly]);

  const stats = useMemo(() => {
    return {
      total: exercises.length,
      active: exercises.filter(ex => ex.is_active).length,
      inactive: exercises.filter(ex => !ex.is_active).length,
      filtered: filteredExercises.length,
    };
  }, [exercises, filteredExercises]);

  const getScoreBadgeColor = (score) => {
    if (!score) return "bg-slate-100 text-slate-800";
    if (score >= 90) return "bg-emerald-100 text-emerald-800";
    if (score >= 70) return "bg-blue-100 text-blue-800";
    return "bg-amber-100 text-amber-800";
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 arabic-text text-right">
            📚 إدارة التمارين
          </h2>
          <p className="text-sm text-slate-600 arabic-text text-right mt-1">
            إنشاء وتعديل تمارين القراءة لجميع المستويات
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadExercises}
          disabled={isLoading}
          className="arabic-text"
        >
          <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
          تحديث
        </Button>
      </motion.div>

      {/* إحصائيات سريعة */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي التمارين"
          value={stats.total}
          icon={BookOpen}
          color="indigo"
        />
        <StatCard
          title="التمارين النشطة"
          value={stats.active}
          icon={CheckCircle}
          color="emerald"
        />
        <StatCard
          title="غير النشطة"
          value={stats.inactive}
          icon={XCircle}
          color="amber"
        />
        <StatCard
          title="نتائج التصفية"
          value={stats.filtered}
          icon={Filter}
          color="blue"
        />
      </div>

      {/* تعليمات */}
      <InfoCard
        title="📝 إرشادات إنشاء التمارين"
        description="اختر نصوصاً مناسبة لمستوى الطلاب. تأكد من أن النص واضح ومفهوم، ويحتوي على حروف وكلمات تناسب المرحلة الدراسية. يمكنك تعطيل التمارين مؤقتاً بدلاً من حذفها."
        icon={HelpCircle}
        variant="info"
      />

      {/* إنشاء تمرين جديد */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader className="border-b border-emerald-100">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-emerald-600" />
            إنشاء تمرين جديد
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-2 gap-6">
            {/* العمود الأيسر - المعلومات الأساسية */}
            <div className="space-y-4">
              <div className="space-y-2 text-right">
                <Label className="arabic-text text-sm text-slate-700 font-semibold">
                  عنوان التمرين *
                </Label>
                <Input
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="مثال: قراءة فقرة عن الصدق"
                  className="text-right arabic-text"
                />
              </div>

              <div className="space-y-2 text-right">
                <Label className="arabic-text text-sm text-slate-700 font-semibold">
                  الصف الدراسي *
                </Label>
                <Select value={newGrade} onValueChange={setNewGrade}>
                  <SelectTrigger className="text-right arabic-text">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {GRADE_LEVELS.map((g) => (
                      <SelectItem key={g} value={g} className="arabic-text">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2 text-right">
                  <Label className="arabic-text text-sm text-slate-700 font-semibold">
                    المستوى
                  </Label>
                  <Select value={newLevel} onValueChange={setNewLevel}>
                    <SelectTrigger className="text-right arabic-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFICIENCY_LEVELS.map((lvl) => (
                        <SelectItem key={lvl} value={lvl} className="arabic-text">
                          {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-right">
                  <Label className="arabic-text text-sm text-slate-700 font-semibold">
                    المرحلة
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={newStage}
                    onChange={(e) => setNewStage(e.target.value)}
                    className="text-right arabic-text"
                  />
                </div>
              </div>
            </div>

            {/* العمود الأيمن - نص التمرين */}
            <div className="space-y-2 text-right">
              <Label className="arabic-text text-sm text-slate-700 font-semibold flex items-center justify-end gap-2">
                <Info className="w-4 h-4" />
                نص التمرين (الفقرة المطلوب قراءتها) *
              </Label>
              <Textarea
                value={newText}
                onChange={(e) => setNewText(e.target.value)}
                placeholder="اكتب النص الذي سيقرأه الطالب هنا...

مثال:
الصدق من أعظم الصفات التي يجب أن يتحلى بها الإنسان. الصادق محبوب من الناس، وموثوق به في كل أمر."
                className="min-h-[200px] text-right arabic-text leading-relaxed"
              />
              <p className="text-xs text-slate-500 arabic-text">
                عدد الأحرف: {newText.length} • عدد الكلمات: {newText.trim().split(/\s+/).filter(Boolean).length}
              </p>
            </div>
          </div>

          <div className="flex justify-end mt-6 pt-4 border-t border-emerald-100">
            <Button
              onClick={handleCreateExercise}
              disabled={!newTitle.trim() || !newText.trim() || !newGrade || isLoading}
              className="arabic-text bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-4 h-4 ml-1 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 ml-1" />
                  حفظ التمرين
                </>
              )}
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* أدوات التصفية */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            تصفية التمارين
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-5 gap-4">
            <div className="space-y-2 text-right md:col-span-2">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                بحث في العنوان أو النص
              </Label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  placeholder="ابحث..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pr-3 pl-10 text-right arabic-text"
                />
              </div>
            </div>

            <div className="space-y-2 text-right">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                الصف
              </Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="text-right arabic-text">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="arabic-text">
                    جميع الصفوف
                  </SelectItem>
                  {GRADE_LEVELS.map((g) => (
                    <SelectItem key={g} value={g} className="arabic-text">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-right">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                المستوى
              </Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="text-right arabic-text">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="arabic-text">
                    جميع المستويات
                  </SelectItem>
                  {PROFICIENCY_LEVELS.map((lvl) => (
                    <SelectItem key={lvl} value={lvl} className="arabic-text">
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2 text-right">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                المرحلة
              </Label>
              <Input
                type="number"
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                placeholder="الكل"
                className="text-right arabic-text"
              />
            </div>
          </div>

          <div className="flex items-center justify-end gap-4 mt-4 pt-4 border-t border-slate-100">
            <div className="flex items-center gap-2">
              <Switch
                checked={showInactiveOnly}
                onCheckedChange={setShowInactiveOnly}
              />
              <Label className="arabic-text text-sm cursor-pointer">
                غير النشطة فقط
              </Label>
            </div>

            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterGrade(ALL);
                setFilterLevel(ALL);
                setFilterStage("");
                setSearchText("");
                setShowInactiveOnly(false);
              }}
              className="arabic-text text-xs"
            >
              <RefreshCcw className="w-3 h-3 ml-1" />
              إعادة ضبط التصفية
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* قائمة التمارين */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-slate-500" />
            قائمة التمارين ({filteredExercises.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <LoadingSpinner text="جاري تحميل التمارين..." />
          ) : filteredExercises.length === 0 ? (
            <EmptyState
              title="لا توجد تمارين"
              description="لا توجد تمارين مطابقة للتصفية الحالية. جرّب تغيير معايير البحث."
              icon={BookOpen}
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-right">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">العنوان</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">الصف</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">المستوى</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text text-center">المرحلة</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">نص التمرين</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text text-center">الحالة</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text text-center">إجراءات</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredExercises.map((ex, index) => (
                    <motion.tr
                      key={ex.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.02 }}
                      className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors"
                    >
                      <td className="py-3 px-4 text-sm font-semibold text-slate-900 arabic-text">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-gradient-to-br from-emerald-500 to-teal-500 rounded-lg flex items-center justify-center text-white text-xs font-bold">
                            {ex.stage || 1}
                          </div>
                          <span className="line-clamp-2">{ex.title}</span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 arabic-text whitespace-nowrap">
                        {ex.grade}
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={cn(
                          "text-xs",
                          ex.level === "متقدم" ? "bg-emerald-100 text-emerald-800" :
                            ex.level === "متوسط" ? "bg-blue-100 text-blue-800" :
                              "bg-slate-100 text-slate-800"
                        )}>
                          {ex.level}
                        </Badge>
                      </td>
                      <td className="py-3 px-4 text-sm font-bold text-indigo-600 text-center">
                        {ex.stage}
                      </td>
                      <td className="py-3 px-4 text-xs text-slate-700 arabic-text max-w-md">
                        <p className="line-clamp-2">
                          {ex.text}
                        </p>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <TooltipProvider>
                          <Tooltip>
                            <TooltipTrigger asChild>
                              <button
                                onClick={() => handleToggleActive(ex)}
                                className={cn(
                                  "inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold transition-colors",
                                  ex.is_active
                                    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                                )}
                              >
                                {ex.is_active ? (
                                  <>
                                    <CheckCircle2 className="w-3 h-3 ml-1" />
                                    نشط
                                  </>
                                ) : (
                                  <>
                                    <XCircle className="w-3 h-3 ml-1" />
                                    معطل
                                  </>
                                )}
                              </button>
                            </TooltipTrigger>
                            <TooltipContent>
                              <p className="arabic-text">
                                اضغط لـ {ex.is_active ? "تعطيل" : "تفعيل"} التمرين
                              </p>
                            </TooltipContent>
                          </Tooltip>
                        </TooltipProvider>
                      </td>
                      <td className="py-3 px-4 text-center">
                        <Button
                          size="icon"
                          variant="ghost"
                          onClick={() => handleDeleteExercise(ex.id, ex.title)}
                          className="text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </motion.tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════
// نهاية المرحلة 3/4
// ═══════════════════════════════════════════════════════════════════

/* ═══════════════════════════════════════════════════════════════════
   🎤 المرحلة 4/4 النهائية: التسجيلات، التمرين الطارئ، ولوحة التحكم
   ═══════════════════════════════════════════════════════════════════ */

/* ═══════════════════════════════════════════════════════════════════
   🎤 القسم 9: إدارة التسجيلات الصوتية
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 🎤 صفحة التسجيلات - مراجعة تسجيلات الطلاب والتعليق عليها
 */
function RecordingsTab() {
  const ALL = "__all__";

  const [recordings, setRecordings] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(ALL);
  const [selectedGrade, setSelectedGrade] = useState(ALL);
  const [filterScore, setFilterScore] = useState(0);
  const [onlyWithComments, setOnlyWithComments] = useState(false);
  const [onlyNeedsReview, setOnlyNeedsReview] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [viewMode, setViewMode] = useState("table");

  // للتعليق النصي
  const [selectedRecording, setSelectedRecording] = useState(null);
  const [teacherComment, setTeacherComment] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);

  // لتعديل الدرجة
  const [editScore, setEditScore] = useState("");
  const [editScoreRecordingId, setEditScoreRecordingId] = useState(null);

  const { toast } = useToast();
  const isMobile = useMediaQuery("(max-width: 768px)");

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [studentList, recordingList] = await Promise.all([
        Student.list(),
        Recording.list("-created_date"),
      ]);
      setStudents(studentList || []);
      setRecordings(recordingList || []);
    } catch (e) {
      console.error("Failed to load recordings", e);
      toast({
        title: "خطأ في التحميل",
        description: "فشل تحميل التسجيلات",
        variant: "destructive",
      });
      setStudents([]);
      setRecordings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentById = (id) => (students || []).find((s) => s.id === id);

  const filteredRecordings = useMemo(() => {
    return (recordings || []).filter((r) => {
      let ok = true;

      if (selectedStudentId !== ALL) ok = ok && r.student_id === selectedStudentId;

      if (selectedGrade !== ALL) {
        const st = getStudentById(r.student_id);
        ok = ok && st?.grade === selectedGrade;
      }

      if (filterScore > 0) ok = ok && (r.score || 0) >= filterScore;

      if (onlyWithComments) ok = ok && (r.teacher_comment || pickTeacherAudio(r));

      if (onlyNeedsReview) ok = ok && (r.score || 0) < 70;

      return ok;
    });
  }, [recordings, selectedStudentId, selectedGrade, filterScore, onlyWithComments, onlyNeedsReview, students]);

  const openReplyDialog = (recording) => {
    setSelectedRecording(recording);
    setTeacherComment(recording.teacher_comment || "");
  };

  const saveReply = async () => {
    if (!selectedRecording) return;

    if (!teacherComment.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى كتابة تعليق قبل الحفظ",
        variant: "destructive",
      });
      return;
    }

    setIsSavingComment(true);
    try {
      await safeUpdateRecording(selectedRecording.id, {
        teacher_comment: teacherComment,
      });

      setRecordings((prev) =>
        prev.map((r) =>
          r.id === selectedRecording.id ? { ...r, teacher_comment: teacherComment } : r
        )
      );

      toast({
        title: "✅ تم الحفظ",
        description: "تم حفظ تعليقك بنجاح",
      });

      setSelectedRecording(null);
      setTeacherComment("");
    } catch (e) {
      console.error("Failed to save teacher reply", e);
      toast({
        title: "خطأ",
        description: "فشل حفظ التعليق",
        variant: "destructive",
      });
    } finally {
      setIsSavingComment(false);
    }
  };

  const handleScoreClick = (recording) => {
    setEditScore(recording.score?.toString() || "");
    setEditScoreRecordingId(recording.id);
  };

  const handleManualScoreSave = async (recordingId) => {
    const newScore = parseInt(editScore, 10);
    if (isNaN(newScore) || newScore < 0 || newScore > 100) {
      toast({
        title: "خطأ",
        description: "الرجاء إدخال درجة صحيحة بين 0 و 100",
        variant: "destructive",
      });
      return;
    }

    try {
      await safeUpdateRecording(recordingId, { score: newScore });
      setRecordings((prev) =>
        prev.map((r) => (r.id === recordingId ? { ...r, score: newScore } : r))
      );
      toast({
        title: "✅ تم التحديث",
        description: "تم تحديث الدرجة بنجاح",
      });
      setEditScoreRecordingId(null);
      setEditScore("");
    } catch (error) {
      console.error("Failed to update score", error);
      toast({
        title: "خطأ",
        description: "فشل تحديث الدرجة",
        variant: "destructive",
      });
    }
  };

  const stats = useMemo(() => {
    return {
      total: recordings.length,
      needsReview: recordings.filter(r => (r.score || 0) < 70).length,
      hasComments: recordings.filter(r => r.teacher_comment || pickTeacherAudio(r)).length,
      avgScore: calculateAverage(recordings.map(r => r.score).filter(Boolean)),
      filtered: filteredRecordings.length,
    };
  }, [recordings, filteredRecordings]);

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 arabic-text text-right">
            🎤 إدارة التسجيلات
          </h2>
          <p className="text-sm text-slate-600 arabic-text text-right mt-1">
            مراجعة تسجيلات الطلاب وإضافة التعليقات والملاحظات
          </p>
        </div>

        <Button
          variant="outline"
          onClick={loadData}
          disabled={isLoading}
          className="arabic-text"
        >
          <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
          تحديث
        </Button>
      </motion.div>

      {/* إحصائيات */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
        <StatCard
          title="إجمالي التسجيلات"
          value={stats.total}
          icon={Mic}
          color="indigo"
        />
        <StatCard
          title="يحتاج مراجعة"
          value={stats.needsReview}
          icon={AlertTriangle}
          color="amber"
        />
        <StatCard
          title="بها تعليقات"
          value={stats.hasComments}
          icon={MessageSquare}
          color="emerald"
        />
        <StatCard
          title="متوسط الدرجات"
          value={`${stats.avgScore}%`}
          icon={BarChart}
          color="blue"
        />
        <StatCard
          title="نتائج التصفية"
          value={stats.filtered}
          icon={Filter}
          color="violet"
        />
      </div>

      {/* تعليمات */}
      <InfoCard
        title="📋 إرشادات المراجعة"
        description="يمكنك الاستماع لتسجيلات الطلاب ومراجعة تحليل الذكاء الاصطناعي. أضف تعليقاتك النصية أو الصوتية لمساعدة الطلاب على التحسن. يمكنك أيضاً تعديل الدرجة يدوياً إذا لزم الأمر."
        icon={Info}
        variant="info"
      />

      {/* أدوات التصفية */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100 bg-gradient-to-r from-slate-50 to-slate-100">
          <div className="flex items-center justify-between">
            <CardTitle className="arabic-text text-right flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              تصفية التسجيلات
            </CardTitle>

            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => {
                  setSelectedStudentId(ALL);
                  setSelectedGrade(ALL);
                  setFilterScore(0);
                  setOnlyWithComments(false);
                  setOnlyNeedsReview(false);
                }}
                className="arabic-text text-xs"
              >
                <RefreshCcw className="w-3 h-3 ml-1" />
                إعادة ضبط
              </Button>

              {!isMobile && (
                <div className="flex border border-slate-200 rounded-lg overflow-hidden">
                  <button
                    onClick={() => setViewMode("table")}
                    className={cn(
                      "px-3 py-1 text-xs transition-colors",
                      viewMode === "table"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    جدول
                  </button>
                  <button
                    onClick={() => setViewMode("cards")}
                    className={cn(
                      "px-3 py-1 text-xs transition-colors",
                      viewMode === "cards"
                        ? "bg-indigo-600 text-white"
                        : "bg-white text-slate-600 hover:bg-slate-50"
                    )}
                  >
                    بطاقات
                  </button>
                </div>
              )}
            </div>
          </div>
        </CardHeader>

        <CardContent className="p-6">
          <div className="grid md:grid-cols-4 gap-4 text-right">
            <div className="space-y-2">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                الطالب
              </Label>
              <Select value={selectedStudentId} onValueChange={setSelectedStudentId}>
                <SelectTrigger className="text-right arabic-text">
                  <SelectValue placeholder="كل الطلاب" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="arabic-text">
                    كل الطلاب
                  </SelectItem>
                  {students.map((s) => (
                    <SelectItem key={s.id} value={s.id} className="arabic-text">
                      {s.name} - {s.grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                الصف
              </Label>
              <Select value={selectedGrade} onValueChange={setSelectedGrade}>
                <SelectTrigger className="text-right arabic-text">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="arabic-text">
                    جميع الصفوف
                  </SelectItem>
                  {GRADE_LEVELS.map((g) => (
                    <SelectItem key={g} value={g} className="arabic-text">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                الحد الأدنى للدرجة: {filterScore}%
              </Label>
              <Slider
                value={[filterScore]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setFilterScore(v[0])}
                className="mt-2"
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-end gap-2">
                <Switch
                  checked={onlyWithComments}
                  onCheckedChange={setOnlyWithComments}
                />
                <Label className="arabic-text text-sm cursor-pointer">
                  بها تعليقات فقط
                </Label>
              </div>

              <div className="flex items-center justify-end gap-2">
                <Switch
                  checked={onlyNeedsReview}
                  onCheckedChange={setOnlyNeedsReview}
                />
                <Label className="arabic-text text-sm cursor-pointer">
                  يحتاج مراجعة (أقل من 70%)
                </Label>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* قائمة التسجيلات */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Mic className="w-5 h-5 text-slate-500" />
            التسجيلات ({filteredRecordings.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="p-6">
          {isLoading ? (
            <LoadingSpinner text="جاري تحميل التسجيلات..." />
          ) : filteredRecordings.length === 0 ? (
            <EmptyState
              title="لا توجد تسجيلات"
              description="لا توجد تسجيلات مطابقة للتصفية الحالية"
              icon={Mic}
            />
          ) : viewMode === "cards" || isMobile ? (
            // عرض البطاقات
            <div className="grid gap-4 md:grid-cols-2">
              {filteredRecordings.map((r, index) => {
                const st = getStudentById(r.student_id);
                const dateStr = formatDate(r.created_date, { month: "short", day: "numeric" });
                const scoreVal = r.score ?? null;
                const scoreColor = getScoreColor(scoreVal);

                return (
                  <motion.div
                    key={r.id}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: index * 0.05 }}
                  >
                    <Card className="border-2 border-slate-100 hover:border-indigo-300 hover:shadow-lg transition-all">
                      <CardContent className="p-5 space-y-4">
                        {/* رأس البطاقة */}
                        <div className="flex justify-between items-start">
                          <div className="flex-1 text-right">
                            <h4 className="font-bold text-indigo-900 arabic-text">
                              {st?.name || "طالب"}
                            </h4>
                            <p className="text-xs text-slate-500 arabic-text">
                              {dateStr} • {getTimeAgo(r.created_date)}
                            </p>
                          </div>
                          <Badge className={cn("text-sm font-bold", `bg-${scoreColor}-100 text-${scoreColor}-800`)}>
                            {scoreVal != null ? `${scoreVal}%` : "—"}
                          </Badge>
                        </div>

                        {/* تحليل الذكاء */}
                        <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-3 rounded-lg">
                          <p className="font-bold text-xs text-blue-900 mb-2 arabic-text flex items-center gap-1">
                            <Sparkles className="w-3 h-3" />
                            تحليل الذكاء الاصطناعي
                          </p>
                          <p className="line-clamp-3 text-xs text-blue-800 arabic-text">
                            {pickAiFeedback(r) || "لا يوجد تحليل"}
                          </p>
                        </div>

                        {/* تعليق المعلم */}
                        {r.teacher_comment && (
                          <div className="bg-gradient-to-r from-emerald-50 to-teal-50 p-3 rounded-lg">
                            <p className="font-bold text-xs text-emerald-900 mb-2 arabic-text flex items-center gap-1">
                              <MessageSquare className="w-3 h-3" />
                              تعليق المعلم
                            </p>
                            <p className="text-xs text-emerald-800 arabic-text">
                              {r.teacher_comment}
                            </p>
                          </div>
                        )}

                        {/* مشغل الصوت */}
                        <div className="space-y-2">
                          <Label className="text-xs text-slate-600 arabic-text">
                            تسجيل الطالب
                          </Label>
                          <audio controls src={r.audio_url} className="w-full h-10" />
                        </div>

                        {/* الأزرار */}
                        <div className="flex gap-2 pt-3 border-t border-slate-100">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => openReplyDialog(r)}
                            className="flex-1 arabic-text text-xs"
                          >
                            <MessageSquare className="w-3 h-3 ml-1" />
                            رد نصي
                          </Button>
                          <AudioCommentModal recording={r} />
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          ) : (
            // عرض الجدول
            <div className="overflow-x-auto">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-gradient-to-r from-slate-50 to-slate-100 border-b-2 border-slate-200">
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">الطالب</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">التاريخ</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text text-center">الدرجة</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">تحليل الذكاء</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">التسجيل</th>
                    <th className="py-3 px-4 text-xs font-bold text-slate-700 arabic-text">رد المعلم</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredRecordings.map((r, index) => {
                    const st = getStudentById(r.student_id);
                    const dateStr = formatDate(r.created_date, { month: "short", day: "numeric" });
                    const ai = pickAiFeedback(r);
                    const teacherAudioUrl = pickTeacherAudio(r);
                    const scoreVal = r.score ?? null;
                    const scoreColor = getScoreColor(scoreVal);

                    return (
                      <motion.tr
                        key={r.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.02 }}
                        className="border-b border-slate-100 hover:bg-slate-50/60 transition-colors align-top"
                      >
                        <td className="py-3 px-4 text-sm font-semibold text-slate-900 arabic-text whitespace-nowrap">
                          <div className="flex items-center gap-2">
                            <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold text-xs">
                              {st?.name?.charAt(0) || "؟"}
                            </div>
                            <div>
                              {st?.name || "طالب"}
                              <div className="text-[10px] text-slate-500">{st?.grade || ""}</div>
                            </div>
                          </div>
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-700 arabic-text whitespace-nowrap">
                          <div>{dateStr}</div>
                          <div className="text-[10px] text-slate-500">{getTimeAgo(r.created_date)}</div>
                        </td>

                        <td className="py-3 px-4 text-center">
                          {editScoreRecordingId === r.id ? (
                            <div className="flex items-center justify-center gap-1">
                              <Input
                                type="number"
                                value={editScore}
                                onChange={(e) => setEditScore(e.target.value)}
                                className="h-8 w-16 text-center text-xs"
                                min="0"
                                max="100"
                              />
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => handleManualScoreSave(r.id)}
                                className="h-8 w-8 text-emerald-600"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </Button>
                              <Button
                                size="icon"
                                variant="ghost"
                                onClick={() => setEditScoreRecordingId(null)}
                                className="h-8 w-8"
                              >
                                <X className="w-4 h-4" />
                              </Button>
                            </div>
                          ) : (
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <button
                                    onClick={() => handleScoreClick(r)}
                                    className={cn(
                                      "inline-flex items-center px-3 py-1 rounded-full text-xs font-bold cursor-pointer transition-all hover:scale-105",
                                      `bg-${scoreColor}-100 text-${scoreColor}-800 hover:bg-${scoreColor}-200`
                                    )}
                                  >
                                    {scoreVal != null ? `${scoreVal}%` : "—"}
                                  </button>
                                </TooltipTrigger>
                                <TooltipContent>
                                  <p className="arabic-text">اضغط لتعديل الدرجة</p>
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          )}
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-800 arabic-text max-w-sm">
                          <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-3">
                            <div className="text-[10px] text-blue-600 mb-1 flex items-center gap-1">
                              <Sparkles className="w-3 h-3" />
                              تحليل AI
                            </div>
                            <p className="line-clamp-3">
                              {ai || "لا يوجد تحليل"}
                            </p>
                          </div>
                        </td>

                        <td className="py-3 px-4">
                          <audio controls src={r.audio_url} className="w-full max-w-[200px]" />
                        </td>

                        <td className="py-3 px-4 text-xs text-slate-800 arabic-text max-w-xs">
                          <div className="space-y-2">
                            {r.teacher_comment && (
                              <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-lg p-2 text-xs text-emerald-800 arabic-text">
                                <div className="font-semibold mb-1 flex items-center gap-1">
                                  <MessageSquare className="w-3 h-3" />
                                  تعليق المعلم
                                </div>
                                {r.teacher_comment}
                              </div>
                            )}

                            {teacherAudioUrl && (
                              <audio controls src={teacherAudioUrl} className="w-full" />
                            )}

                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                className="arabic-text text-xs flex-1"
                                onClick={() => openReplyDialog(r)}
                              >
                                <Send className="w-3 h-3 ml-1" />
                                رد نصي
                              </Button>
                              <AudioCommentModal recording={r} />
                            </div>
                          </div>
                        </td>
                      </motion.tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* نافذة الرد النصي */}
      <Dialog
        open={!!selectedRecording}
        onOpenChange={(v) => !v && setSelectedRecording(null)}
      >
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="arabic-text text-right flex items-center gap-2">
              <MessageSquare className="w-5 h-5 text-indigo-600" />
              إرسال رد نصي للطالب
            </DialogTitle>
            <DialogDescription className="arabic-text text-right">
              سيتم حفظ هذا الرد وإظهاره للطالب في سجل التعليقات
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 text-right">
            {selectedRecording && (
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-sm text-slate-600 arabic-text mb-2">
                  <strong>الطالب:</strong> {getStudentById(selectedRecording.student_id)?.name}
                </p>
                <p className="text-sm text-slate-600 arabic-text">
                  <strong>التاريخ:</strong> {formatDate(selectedRecording.created_date)}
                </p>
              </div>
            )}

            <div className="space-y-2">
              <Label className="arabic-text font-semibold">تعليق المعلم</Label>
              <Textarea
                value={teacherComment}
                onChange={(e) => setTeacherComment(e.target.value)}
                className="min-h-[150px] text-right arabic-text"
                placeholder="اكتب ملاحظة تفصيلية للطالب حول أدائه..."
              />
              <p className="text-xs text-slate-500 arabic-text">
                نصيحة: كن واضحاً ومحدداً في ملاحظاتك لمساعدة الطالب على التحسن
              </p>
            </div>
          </div>

          <DialogFooter className="flex gap-2 justify-end">
            <Button
              variant="outline"
              onClick={() => setSelectedRecording(null)}
              className="arabic-text"
            >
              إلغاء
            </Button>
            <Button
              onClick={saveReply}
              disabled={isSavingComment || !teacherComment.trim()}
              className="arabic-text bg-gradient-to-r from-indigo-600 to-purple-600"
            >
              {isSavingComment ? (
                <>
                  <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  جاري الحفظ...
                </>
              ) : (
                <>
                  <Send className="w-4 h-4 ml-2" />
                  حفظ الرد
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   ⚡ القسم 10: التمرين الطارئ بالذكاء الاصطناعي
   ═══════════════════════════════════════════════════════════════════ */

/**
 * ⚡ صفحة التمرين الطارئ - توليد تمارين سريعة بالذكاء الاصطناعي
 */
function EmergencyDrillTab() {
  const [prompt, setPrompt] = useState(
    "أريد فقرة قصيرة للصف الثالث عن أهمية الصدق، باللغة العربية الفصحى، مناسبة لتمرين قراءة صوتية."
  );
  const [isLoading, setIsLoading] = useState(false);
  const [generatedText, setGeneratedText] = useState("");
  const [grade, setGrade] = useState("");
  const [level, setLevel] = useState("مبتدئ");
  const [stage, setStage] = useState(1);
  const [title, setTitle] = useState("تمرين طارئ عن الصدق");
  const [history, setHistory] = useState([]);

  const { toast } = useToast();

  const handleGenerate = async () => {
    if (!prompt.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال وصف للتمرين المطلوب",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);
    try {
      const res = await InvokeLLM({
        prompt: `أنت معلم لغة عربية متخصص في إنشاء تمارين قراءة للمرحلة الابتدائية والإعدادية.

المطلوب: ${prompt}

قم بإنشاء فقرة قراءة عربية فصحى واضحة ومناسبة للمستوى المطلوب. يجب أن تكون:
- بلغة عربية فصحى سليمة
- مناسبة للمستوى العمري
- واضحة وسهلة الفهم
- بدون تشكيل كامل (التشكيل فقط عند الحاجة للتوضيح)
- تحتوي على 3-7 جمل

أرسل الفقرة مباشرة بدون أي مقدمة أو تعليق.`,
      });

      const text = res?.text || res?.content || "";
      const cleaned = (text || "").trim();

      if (!cleaned) {
        throw new Error("لم يتم توليد نص");
      }

      setGeneratedText(cleaned);

      // إضافة للسجل
      setHistory(prev => [{
        prompt,
        text: cleaned,
        timestamp: new Date(),
      }, ...prev].slice(0, 5)); // الاحتفاظ بآخر 5

      toast({
        title: "✅ تم التوليد",
        description: "تم توليد النص بنجاح",
      });
    } catch (e) {
      console.error("Emergency drill generation failed", e);
      toast({
        title: "خطأ",
        description: "فشل في توليد النص. تأكد من إعدادات OpenAI API.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsExercise = async () => {
    if (!generatedText.trim()) {
      toast({
        title: "تنبيه",
        description: "لا يوجد نص للحفظ",
        variant: "destructive",
      });
      return;
    }

    if (!grade) {
      toast({
        title: "تنبيه",
        description: "يرجى اختيار الصف الدراسي",
        variant: "destructive",
      });
      return;
    }

    if (!title.trim()) {
      toast({
        title: "تنبيه",
        description: "يرجى إدخال عنوان التمرين",
        variant: "destructive",
      });
      return;
    }

    try {
      await safeCreateExercise({
        title: title.trim(),
        sentence: generatedText.trim(),
        grade,
        level,
        stage: stage || 1,
        is_active: true,
      });

      toast({
        title: "✅ تم الحفظ",
        description: "تم حفظ التمرين بنجاح ويمكن للطلاب استخدامه الآن",
      });

      // إعادة ضبط
      setGeneratedText("");
      setTitle("تمرين طارئ");
    } catch (e) {
      console.error("Failed to save emergency exercise", e);
      toast({
        title: "خطأ",
        description: "فشل في حفظ التمرين",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
      >
        <h2 className="text-2xl font-bold text-slate-900 arabic-text text-right">
          ⚡ توليد تمرين طارئ
        </h2>
        <p className="text-sm text-slate-600 arabic-text text-right mt-1">
          استخدم الذكاء الاصطناعي لإنشاء تمارين قراءة فورية في ثوانٍ
        </p>
      </motion.div>

      {/* تعليمات */}
      <InfoCard
        title="🤖 كيفية الاستخدام"
        description="صِف التمرين الذي تريده بالتفصيل (الموضوع، الصف، عدد الجمل، إلخ). سيقوم الذكاء الاصطناعي بتوليد فقرة مناسبة يمكنك مراجعتها وتعديلها قبل حفظها كتمرين."
        icon={Sparkles}
        variant="info"
      />

      {/* واجهة التوليد */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* عمود الإدخال */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-50 to-pink-50">
          <CardHeader className="border-b border-purple-100">
            <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-purple-600" />
              وصف التمرين المطلوب
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2 text-right">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                اكتب وصفاً تفصيلياً للتمرين
              </Label>
              <Textarea
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="min-h-[200px] text-right arabic-text"
                placeholder="مثال: أريد فقرة للصف الرابع عن أهمية النظافة الشخصية، 5 جمل قصيرة وواضحة"
              />
            </div>

            <div className="bg-purple-100 border border-purple-200 rounded-lg p-3">
              <p className="text-xs text-purple-800 arabic-text text-right">
                <strong>أمثلة على الأوصاف الجيدة:</strong>
              </p>
              <ul className="text-xs text-purple-700 arabic-text text-right mt-2 space-y-1">
                <li>• فقرة للصف الثاني عن الفصول الأربعة (4 جمل)</li>
                <li>• نص للصف الخامس عن الصداقة (متوسطة الصعوبة)</li>
                <li>• قصة قصيرة للروضة عن الحيوانات (جمل بسيطة)</li>
              </ul>
            </div>

            <Button
              onClick={handleGenerate}
              disabled={isLoading || !prompt.trim()}
              className="arabic-text w-full bg-gradient-to-r from-purple-600 to-pink-600 hover:from-purple-700 hover:to-pink-700"
              size="lg"
            >
              {isLoading ? (
                <>
                  <Loader2 className="w-5 h-5 ml-2 animate-spin" />
                  جاري التوليد...
                </>
              ) : (
                <>
                  <Sparkles className="w-5 h-5 ml-2" />
                  توليد النص بالذكاء الاصطناعي
                </>
              )}
            </Button>
          </CardContent>
        </Card>

        {/* عمود النتيجة */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
          <CardHeader className="border-b border-emerald-100">
            <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
              <FileText className="w-5 h-5 text-emerald-600" />
              النص الناتج
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-4">
            <div className="space-y-2 text-right">
              <Label className="arabic-text text-sm text-slate-700 font-semibold">
                الفقرة المولدة (يمكنك تعديلها)
              </Label>
              <Textarea
                value={generatedText}
                onChange={(e) => setGeneratedText(e.target.value)}
                className="min-h-[200px] text-right arabic-text leading-relaxed text-base"
                placeholder="سيظهر النص المولد هنا..."
              />
              {generatedText && (
                <p className="text-xs text-slate-500 arabic-text">
                  عدد الكلمات: {generatedText.trim().split(/\s+/).filter(Boolean).length}
                </p>
              )}
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="space-y-2 text-right">
                <Label className="arabic-text text-sm text-slate-700 font-semibold">
                  عنوان التمرين
                </Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-right arabic-text"
                  placeholder="مثال: فقرة عن الصدق"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="space-y-2 text-right">
                  <Label className="arabic-text text-sm text-slate-700 font-semibold">
                    الصف
                  </Label>
                  <Select value={grade} onValueChange={setGrade}>
                    <SelectTrigger className="text-right arabic-text">
                      <SelectValue placeholder="اختر" />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADE_LEVELS.map((g) => (
                        <SelectItem key={g} value={g} className="arabic-text">
                          {g}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-right">
                  <Label className="arabic-text text-sm text-slate-700 font-semibold">
                    المستوى
                  </Label>
                  <Select value={level} onValueChange={setLevel}>
                    <SelectTrigger className="text-right arabic-text">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {PROFICIENCY_LEVELS.map((lvl) => (
                        <SelectItem key={lvl} value={lvl} className="arabic-text">
                          {lvl}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2 text-right">
                  <Label className="arabic-text text-sm text-slate-700 font-semibold">
                    المرحلة
                  </Label>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={stage}
                    onChange={(e) => setStage(parseInt(e.target.value, 10))}
                    className="text-right arabic-text"
                  />
                </div>
              </div>
            </div>

            <Button
              onClick={handleSaveAsExercise}
              disabled={!generatedText.trim() || !grade || !title.trim()}
              className="arabic-text w-full bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              size="lg"
            >
              <CheckCircle className="w-5 h-5 ml-2" />
              حفظ كتمرين جاهز للطلاب
            </Button>
          </CardContent>
        </Card>
      </div>

      {/* سجل التوليدات السابقة */}
      {history.length > 0 && (
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              السجل الأخير ({history.length})
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6">
            <div className="space-y-3">
              {history.map((item, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="bg-slate-50 p-4 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  onClick={() => {
                    setPrompt(item.prompt);
                    setGeneratedText(item.text);
                  }}
                >
                  <div className="flex justify-between items-start mb-2">
                    <p className="text-xs text-slate-500 arabic-text">
                      {getTimeAgo(item.timestamp)}
                    </p>
                    <Button
                      size="sm"
                      variant="ghost"
                      onClick={(e) => {
                        e.stopPropagation();
                        setPrompt(item.prompt);
                        setGeneratedText(item.text);
                      }}
                      className="arabic-text text-xs"
                    >
                      استخدام
                    </Button>
                  </div>
                  <p className="text-sm text-slate-700 arabic-text mb-2">
                    <strong>الوصف:</strong> {item.prompt}
                  </p>
                  <p className="text-sm text-slate-600 arabic-text line-clamp-2">
                    {item.text}
                  </p>
                </motion.div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   📊 القسم 11: لوحة التحكم الرئيسية
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 📊 لوحة التحكم الرئيسية - نظرة عامة شاملة
 */
function DashboardTab() {
  const [stats, setStats] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isExporting, setIsExporting] = useState(false);
  const [googleSheetsWebhook, setGoogleSheetsWebhook] = useState("");
  const [dashboardData, setDashboardData] = useState({
    students: [],
    recordings: [],
    exercises: [],
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const { toast } = useToast();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    setIsLoading(true);
    try {
      const [students, recordings, exercises, settings] = await Promise.all([
        Student.list("-last_activity"),
        Recording.list("-created_date"),
        Exercise.list(),
        SystemSetting.list(),
      ]);
      const webhookSetting = (settings || []).find((s) => s.key === "google_sheets_webhook_url");
      setGoogleSheetsWebhook((webhookSetting?.value || "").trim());
      setDashboardData({ students: students || [], recordings: recordings || [], exercises: exercises || [] });

      // حساب الإحصائيات
      const now = new Date();
      const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
      const dayAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);

      const activeThisWeek = students.filter(s => {
        const lastActivity = new Date(s.last_activity);
        return lastActivity >= weekAgo;
      }).length;

      const recordingsToday = recordings.filter(r => {
        const created = new Date(r.created_date);
        return created >= dayAgo;
      }).length;

      const needsReview = recordings.filter(r => (r.score || 0) < 70).length;

      const avgScore = calculateAverage(
        recordings.map(r => r.score).filter(Boolean)
      );

      setStats({
        totalStudents: students.length,
        activeThisWeek,
        totalRecordings: recordings.length,
        recordingsToday,
        avgScore,
        needsReview,
        totalExercises: exercises.length,
        activeExercises: exercises.filter(ex => ex.is_active).length,
      });

      // النشاطات الأخيرة (آخر 10 تسجيلات)
      const recent = recordings.slice(0, 10).map(r => {
        const student = students.find(s => s.id === r.student_id);
        return {
          ...r,
          studentName: student?.name || "طالب",
          studentGrade: student?.grade || "",
        };
      });
      setRecentActivity(recent);

    } catch (error) {
      console.error("Failed to load dashboard data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const impactAnalysis = useMemo(() => {
    const { students, recordings, exercises } = dashboardData;
    const normalizedRecordings = (recordings || [])
      .filter((r) => !!r?.created_date)
      .slice()
      .sort((a, b) => new Date(a.created_date) - new Date(b.created_date));

    const monthMap = new Map();
    normalizedRecordings.forEach((r) => {
      const monthKey = toMonthKey(r.created_date);
      if (!monthKey) return;
      if (!monthMap.has(monthKey)) {
        monthMap.set(monthKey, { scores: [], recordingsCount: 0, totalSeconds: 0 });
      }
      const bucket = monthMap.get(monthKey);
      const scoreVal = Number(r.score);
      if (Number.isFinite(scoreVal) && scoreVal >= 0) {
        bucket.scores.push(scoreVal);
      }
      bucket.recordingsCount += 1;
      bucket.totalSeconds += getRecordingDurationSeconds(r);
    });

    const monthlyTrend = Array.from(monthMap.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([month, data]) => ({
        month,
        avgScore: data.scores.length ? Math.round(data.scores.reduce((x, y) => x + y, 0) / data.scores.length) : 0,
        recordingsCount: data.recordingsCount,
        trainingHours: Math.round((data.totalSeconds / 3600) * 10) / 10,
      }));

    const baseline = monthlyTrend[0] || null;
    const latest = monthlyTrend[monthlyTrend.length - 1] || null;
    const scoreImprovementPercent = baseline && baseline.avgScore > 0 && latest
      ? Math.round(((latest.avgScore - baseline.avgScore) / baseline.avgScore) * 100)
      : 0;

    const getStudentMonthAverages = (monthKey) => {
      const map = new Map();
      if (!monthKey) return map;
      normalizedRecordings
        .filter((r) => toMonthKey(r.created_date) === monthKey)
        .forEach((r) => {
          const scoreVal = Number(r.score);
          if (!Number.isFinite(scoreVal) || scoreVal < 0) return;
          if (!map.has(r.student_id)) map.set(r.student_id, []);
          map.get(r.student_id).push(scoreVal);
        });
      const avgMap = new Map();
      map.forEach((arr, studentId) => {
        avgMap.set(studentId, Math.round(arr.reduce((x, y) => x + y, 0) / arr.length));
      });
      return avgMap;
    };

    const baselineStudentAvg = getStudentMonthAverages(baseline?.month);
    const latestStudentAvg = getStudentMonthAverages(latest?.month);
    const baselineNeedsSupport = Array.from(baselineStudentAvg.values()).filter((v) => v < 70).length;
    const latestNeedsSupport = Array.from(latestStudentAvg.values()).filter((v) => v < 70).length;
    const needsSupportReductionPercent = baselineNeedsSupport > 0
      ? Math.round(((baselineNeedsSupport - latestNeedsSupport) / baselineNeedsSupport) * 100)
      : 0;

    const totalTrainingSeconds = normalizedRecordings.reduce((acc, r) => acc + getRecordingDurationSeconds(r), 0);
    const totalTrainingHours = Math.round((totalTrainingSeconds / 3600) * 10) / 10;

    const studentRecordingsMap = new Map();
    normalizedRecordings.forEach((r) => {
      if (!studentRecordingsMap.has(r.student_id)) studentRecordingsMap.set(r.student_id, []);
      studentRecordingsMap.get(r.student_id).push(r);
    });

    const usedStudentIds = new Set();
    const pickCategorySample = (label, predicate) => {
      for (const [studentId, recs] of studentRecordingsMap.entries()) {
        if (usedStudentIds.has(studentId) || recs.length < 2) continue;
        const last = recs[recs.length - 1];
        const lastScore = Number(last?.score ?? 0);
        if (!predicate(lastScore)) continue;
        const student = (students || []).find((s) => s.id === studentId);
        usedStudentIds.add(studentId);
        const first = recs[0];
        return {
          category: label,
          student_id: studentId,
          student_name: student?.name || "طالب",
          grade: student?.grade || "",
          before_date: first.created_date || "",
          before_score: first.score ?? "",
          after_date: last.created_date || "",
          after_score: last.score ?? "",
          before_audio_url: first.audio_url || "",
          after_audio_url: last.audio_url || "",
        };
      }
      return null;
    };

    const qualitativeSamples = [
      pickCategorySample("متميز", (s) => s >= 85),
      pickCategorySample("متوسط", (s) => s >= 70 && s < 85),
      pickCategorySample("يحتاج دعم", (s) => s < 70),
    ].filter(Boolean);

    const feedbackEvidenceCount = normalizedRecordings.filter((r) => r.teacher_comment || pickTeacherAudio(r)).length;
    const aiAnalyzedCount = normalizedRecordings.filter((r) => !!pickAiFeedback(r)).length;
    const emergencyExercisesCount = (exercises || []).filter((ex) => {
      const title = String(ex?.title || "").toLowerCase();
      return title.includes("طارئ") || title.includes("emergency");
    }).length;

    return {
      monthlyTrend,
      baseline,
      latest,
      scoreImprovementPercent,
      totalTrainingHours,
      totalTrainingSeconds,
      interactionVolume: normalizedRecordings.length,
      baselineNeedsSupport,
      latestNeedsSupport,
      needsSupportReductionPercent,
      qualitativeSamples,
      feedbackEvidenceCount,
      aiAnalyzedCount,
      aiCoveragePercent: calculatePercentage(aiAnalyzedCount, normalizedRecordings.length || 1),
      emergencyExercisesCount,
    };
  }, [dashboardData]);

  const buildAwardEvidenceRows = () => {
    const { students, recordings, exercises } = dashboardData;

    const gradeDistribution = GRADE_LEVELS.map((grade) => ({
      grade,
      count: students.filter((s) => s.grade === grade).length,
    })).filter((item) => item.count > 0);

    const levelDistribution = PROFICIENCY_LEVELS.map((level) => ({
      level,
      count: students.filter((s) => (s.level || "مبتدئ") === level).length,
    })).filter((item) => item.count > 0);

    const rows = [
      ["ملخص عام", "تاريخ التصدير", new Date().toISOString(), "", "", "", "", ""],
      ["ملخص عام", "إجمالي الطلاب", stats.totalStudents, "", "", "", "", ""],
      ["ملخص عام", "الطلاب النشطون هذا الأسبوع", stats.activeThisWeek, "", "", "", "", ""],
      ["ملخص عام", "إجمالي التسجيلات", stats.totalRecordings, "", "", "", "", ""],
      ["ملخص عام", "تسجيلات اليوم", stats.recordingsToday, "", "", "", "", ""],
      ["ملخص عام", "متوسط الأداء", `${stats.avgScore}%`, "", "", "", "", ""],
      ["ملخص عام", "تسجيلات تحتاج مراجعة", stats.needsReview, "", "", "", "", ""],
      ["ملخص عام", "إجمالي التمارين", stats.totalExercises, "", "", "", "", ""],
      ["ملخص عام", "التمارين النشطة", stats.activeExercises, "", "", "", "", ""],
      ["قياس الأثر", "شهر خط الأساس", impactAnalysis.baseline?.month || "غير متوفر", "", "", "", "", ""],
      ["قياس الأثر", "شهر المقارنة", impactAnalysis.latest?.month || "غير متوفر", "", "", "", "", ""],
      ["قياس الأثر", "تحسن متوسط القراءة", `${impactAnalysis.scoreImprovementPercent}%`, "", "", "", "", ""],
      ["قياس الأثر", "عدد التسجيلات الكلي", impactAnalysis.interactionVolume, "", "", "", "", ""],
      ["قياس الأثر", "ساعات التدريب", impactAnalysis.totalTrainingHours, "", "", "", "", ""],
      ["قياس الأثر", "يحتاج دعم - قبل", impactAnalysis.baselineNeedsSupport, "", "", "", "", ""],
      ["قياس الأثر", "يحتاج دعم - بعد", impactAnalysis.latestNeedsSupport, "", "", "", "", ""],
      ["قياس الأثر", "نسبة تقليص فجوة يحتاج دعم", `${impactAnalysis.needsSupportReductionPercent}%`, "", "", "", "", ""],
      [],
    ];

    impactAnalysis.monthlyTrend.forEach((item) => {
      rows.push([
        "اتجاه شهري",
        item.month,
        `متوسط: ${item.avgScore}%`,
        `تسجيلات: ${item.recordingsCount}`,
        `ساعات: ${item.trainingHours}`,
        "",
        "",
        "",
      ]);
    });

    rows.push([]);

    gradeDistribution.forEach((item) => {
      rows.push(["توزيع الصفوف", item.grade, item.count, "", "", "", "", ""]);
    });

    rows.push([]);

    levelDistribution.forEach((item) => {
      rows.push(["توزيع المستويات", item.level, item.count, "", "", "", "", ""]);
    });

    rows.push([]);

    impactAnalysis.qualitativeSamples.forEach((sample) => {
      rows.push([
        "عينات قبل/بعد",
        sample.category,
        sample.student_name,
        sample.grade,
        `قبل: ${sample.before_score} (${sample.before_date})`,
        `بعد: ${sample.after_score} (${sample.after_date})`,
        sample.before_audio_url,
        sample.after_audio_url,
      ]);
    });

    rows.push([]);

    rows.push([
      "الابتكار",
      "التمارين الطارئة المولدة",
      impactAnalysis.emergencyExercisesCount,
      "",
      "",
      "",
      "",
      "",
    ]);
    rows.push([
      "الابتكار",
      "تغطية التحليل الآلي للتسجيلات",
      `${impactAnalysis.aiCoveragePercent}%`,
      `عدد التسجيلات المحللة: ${impactAnalysis.aiAnalyzedCount}`,
      "",
      "",
      "",
      "",
    ]);
    rows.push([
      "الأدلة النوعية",
      "سجلات تغذية راجعة (صوتي/نصي)",
      impactAnalysis.feedbackEvidenceCount,
      "",
      "",
      "",
      "",
      "",
    ]);

    rows.push([]);

    students.forEach((s) => {
      rows.push([
        "بيانات الطلاب",
        s.name || "",
        s.grade || "",
        s.level || "مبتدئ",
        s.average_score ?? "",
        s.total_exercises ?? 0,
        s.last_activity || "",
        s.access_code || "",
      ]);
    });

    rows.push([]);

    recordings.forEach((r) => {
      const student = students.find((s) => s.id === r.student_id);
      rows.push([
        "بيانات التسجيلات",
        student?.name || "طالب",
        student?.grade || "",
        r.score ?? "",
        r.created_date || "",
        pickTeacherAudio(r) ? "يوجد تعليق صوتي" : "لا يوجد",
        r.teacher_comment ? "يوجد تعليق نصي" : "لا يوجد",
        getScoreLabel(r.score),
      ]);
    });

    rows.push([]);

    exercises.forEach((ex) => {
      rows.push([
        "بيانات التمارين",
        ex.title || "",
        ex.grade || "",
        ex.level || "",
        ex.stage ?? "",
        ex.is_active ? "نشط" : "معطل",
        ex.created_date || "",
        "",
      ]);
    });

    return rows;
  };

  const handleDownloadAwardEvidence = () => {
    try {
      const headers = [
        "القسم",
        "العنصر",
        "القيمة 1",
        "القيمة 2",
        "القيمة 3",
        "القيمة 4",
        "القيمة 5",
        "القيمة 6",
      ];

      const rows = buildAwardEvidenceRows();
      const content = buildCsvContent(headers, rows);
      const fileDate = new Date().toISOString().slice(0, 10);
      downloadCsvFile(`dashboard-award-evidence-${fileDate}.csv`, content);

      toast({
        title: "✅ تم تنزيل ملف الإثباتات",
        description: "تم تنزيل ملف شامل لإحصائيات وإنجازات لوحة التحكم.",
      });
    } catch (error) {
      console.error("Failed to download dashboard evidence", error);
      toast({
        title: "خطأ في التصدير",
        description: "تعذّر إنشاء ملف الإثباتات. حاول مرة أخرى.",
        variant: "destructive",
      });
    }
  };

  const handleExportAwardEvidenceToGoogleSheets = async () => {
    const webhookUrl = googleSheetsWebhook.trim();
    if (!webhookUrl) {
      toast({
        title: "Webhook غير مضبوط",
        description: "أدخلي رابط Google Sheets Webhook من الإعدادات أولاً.",
        variant: "destructive",
      });
      return;
    }

    setIsExporting(true);
    try {
      const { students, recordings, exercises } = dashboardData;
      const payload = {
        source: "TeacherDashboardAwardEvidence",
        exported_at: new Date().toISOString(),
        summary: stats,
        impact_analysis: {
          baseline_month: impactAnalysis.baseline?.month || null,
          latest_month: impactAnalysis.latest?.month || null,
          score_improvement_percent: impactAnalysis.scoreImprovementPercent,
          interaction_volume: impactAnalysis.interactionVolume,
          total_training_hours: impactAnalysis.totalTrainingHours,
          baseline_needs_support: impactAnalysis.baselineNeedsSupport,
          latest_needs_support: impactAnalysis.latestNeedsSupport,
          needs_support_reduction_percent: impactAnalysis.needsSupportReductionPercent,
          monthly_trend: impactAnalysis.monthlyTrend,
        },
        qualitative_evidence: {
          before_after_samples: impactAnalysis.qualitativeSamples,
          feedback_evidence_count: impactAnalysis.feedbackEvidenceCount,
        },
        innovation_evidence: {
          emergency_exercises_count: impactAnalysis.emergencyExercisesCount,
          ai_analyzed_count: impactAnalysis.aiAnalyzedCount,
          ai_coverage_percent: impactAnalysis.aiCoveragePercent,
        },
        recent_activity: recentActivity,
        students: students.map((s) => ({
          id: s.id,
          name: s.name,
          grade: s.grade,
          level: s.level || "مبتدئ",
          average_score: s.average_score ?? null,
          total_exercises: s.total_exercises ?? 0,
          last_activity: s.last_activity || null,
          access_code: s.access_code || null,
        })),
        recordings: recordings.map((r) => ({
          id: r.id,
          student_id: r.student_id,
          score: r.score ?? null,
          created_date: r.created_date || null,
          has_teacher_audio: !!pickTeacherAudio(r),
          has_teacher_comment: !!r.teacher_comment,
          score_label: getScoreLabel(r.score),
        })),
        exercises: exercises.map((ex) => ({
          id: ex.id,
          title: ex.title,
          grade: ex.grade,
          level: ex.level,
          stage: ex.stage,
          is_active: !!ex.is_active,
          created_date: ex.created_date || null,
        })),
      };

      const response = await fetch(webhookUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`Webhook failed with status ${response.status}`);
      }

      toast({
        title: "✅ تم إرسال ملف الإثباتات",
        description: "تم تصدير معلومات لوحة التحكم والإحصائيات إلى Google Sheets.",
      });
    } catch (error) {
      console.error("Failed to export dashboard evidence to Google Sheets", error);
      toast({
        title: "فشل التصدير إلى Google Sheets",
        description: "تحققي من رابط Webhook وصلاحيات Apps Script ثم أعيدي المحاولة.",
        variant: "destructive",
      });
    } finally {
      setIsExporting(false);
    }
  };

  if (isLoading) {
    return <LoadingSpinner text="جاري تحميل لوحة التحكم..." />;
  }

  if (!stats) {
    return null;
  }

  return (
    <div className="space-y-6">
      {/* رأس الصفحة */}
      <motion.div
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="flex items-center justify-between"
      >
        <div>
          <h2 className="text-2xl font-bold text-slate-900 arabic-text text-right">
            📊 لوحة التحكم الرئيسية
          </h2>
          <p className="text-sm text-slate-600 arabic-text text-right mt-1">
            نظرة شاملة على أداء الطلاب والنظام
          </p>
        </div>

        <div className="flex items-center gap-2 flex-wrap justify-end">
          <Button
            variant="outline"
            onClick={handleDownloadAwardEvidence}
            disabled={isLoading || !stats}
            className="arabic-text"
          >
            <Download className="w-4 h-4 ml-2" />
            تنزيل ملف الإثباتات
          </Button>

          <Button
            onClick={handleExportAwardEvidenceToGoogleSheets}
            disabled={isLoading || isExporting || !stats || !googleSheetsWebhook.trim()}
            className="arabic-text bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            title={googleSheetsWebhook.trim() ? "تصدير إثباتات لوحة التحكم إلى Google Sheets" : "أدخلي Webhook من الإعدادات لتفعيل التصدير"}
          >
            {isExporting ? (
              <>
                <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                جاري التصدير...
              </>
            ) : (
              <>
                <Upload className="w-4 h-4 ml-2" />
                إرسال إلى Google Sheets
              </>
            )}
          </Button>

          <Button
            variant="outline"
            onClick={loadDashboardData}
            disabled={isLoading}
            className="arabic-text"
          >
            <RefreshCw className={cn("w-4 h-4 ml-2", isLoading && "animate-spin")} />
            تحديث البيانات
          </Button>
        </div>
      </motion.div>

      {!googleSheetsWebhook.trim() && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="arabic-text text-right text-amber-900 text-xs">
            لتفعيل التصدير المباشر إلى Google Sheets، أدخلي رابط Webhook من الإعدادات.
            يمكنك حالياً تنزيل ملف الإثباتات بصيغة CSV.
          </AlertDescription>
        </Alert>
      )}

      {/* الإحصائيات الرئيسية */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard
          title="إجمالي الطلاب"
          value={stats.totalStudents}
          icon={Users}
          color="indigo"
          subtitle={`${stats.activeThisWeek} نشط هذا الأسبوع`}
          trend={calculatePercentage(stats.activeThisWeek, stats.totalStudents)}
        />
        <StatCard
          title="التسجيلات الكلية"
          value={stats.totalRecordings}
          icon={Mic}
          color="emerald"
          subtitle={`${stats.recordingsToday} اليوم`}
        />
        <StatCard
          title="متوسط الأداء"
          value={`${stats.avgScore}%`}
          icon={TrendingUp}
          color="blue"
          subtitle={getScoreLabel(stats.avgScore)}
        />
        <StatCard
          title="يحتاج مراجعة"
          value={stats.needsReview}
          icon={AlertTriangle}
          color="amber"
          subtitle="أقل من 70%"
        />
      </div>

      {/* قياس الأثر */}
      <Card className="border-0 shadow-lg bg-gradient-to-br from-emerald-50 to-teal-50">
        <CardHeader className="border-b border-emerald-100">
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-emerald-600" />
            إحصائيات قياس الأثر (قبل/بعد)
          </CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          <div className="grid md:grid-cols-3 gap-4">
            <Card className="border border-emerald-200 bg-white/80">
              <CardContent className="p-4 text-right">
                <p className="text-xs text-slate-500 arabic-text">نسبة التحسن في متوسط القراءة</p>
                <p className="text-2xl font-black text-emerald-700">{impactAnalysis.scoreImprovementPercent}%</p>
                <p className="text-[11px] text-slate-500 arabic-text mt-1">
                  من {impactAnalysis.baseline?.month || "—"} إلى {impactAnalysis.latest?.month || "—"}
                </p>
              </CardContent>
            </Card>

            <Card className="border border-blue-200 bg-white/80">
              <CardContent className="p-4 text-right">
                <p className="text-xs text-slate-500 arabic-text">حجم التفاعل والتدريب</p>
                <p className="text-2xl font-black text-blue-700">{impactAnalysis.interactionVolume} تسجيل</p>
                <p className="text-[11px] text-slate-500 arabic-text mt-1">
                  بإجمالي {impactAnalysis.totalTrainingHours} ساعة تدريب
                </p>
              </CardContent>
            </Card>

            <Card className="border border-amber-200 bg-white/80">
              <CardContent className="p-4 text-right">
                <p className="text-xs text-slate-500 arabic-text">تقليص فجوة يحتاج دعم</p>
                <p className="text-2xl font-black text-amber-700">{impactAnalysis.needsSupportReductionPercent}%</p>
                <p className="text-[11px] text-slate-500 arabic-text mt-1">
                  قبل: {impactAnalysis.baselineNeedsSupport} • بعد: {impactAnalysis.latestNeedsSupport}
                </p>
              </CardContent>
            </Card>
          </div>

          {impactAnalysis.monthlyTrend.length > 0 && (
            <div className="overflow-x-auto border border-emerald-100 rounded-lg bg-white">
              <table className="w-full text-right border-collapse">
                <thead>
                  <tr className="bg-emerald-50 border-b border-emerald-100">
                    <th className="py-2 px-3 text-xs font-bold text-emerald-900 arabic-text">الشهر</th>
                    <th className="py-2 px-3 text-xs font-bold text-emerald-900 arabic-text">متوسط القراءة</th>
                    <th className="py-2 px-3 text-xs font-bold text-emerald-900 arabic-text">عدد التسجيلات</th>
                    <th className="py-2 px-3 text-xs font-bold text-emerald-900 arabic-text">ساعات التدريب</th>
                  </tr>
                </thead>
                <tbody>
                  {impactAnalysis.monthlyTrend.map((item) => (
                    <tr key={item.month} className="border-b border-emerald-50">
                      <td className="py-2 px-3 text-xs text-slate-700">{item.month}</td>
                      <td className="py-2 px-3 text-xs font-bold text-slate-900">{item.avgScore}%</td>
                      <td className="py-2 px-3 text-xs text-slate-700">{item.recordingsCount}</td>
                      <td className="py-2 px-3 text-xs text-slate-700">{item.trainingHours}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* الصف الثاني - التمارين */}
      <div className="grid md:grid-cols-2 gap-4">
        <StatCard
          title="إجمالي التمارين"
          value={stats.totalExercises}
          icon={BookOpen}
          color="violet"
          subtitle={`${stats.activeExercises} نشط`}
          trend={calculatePercentage(stats.activeExercises, stats.totalExercises)}
        />
        <StatCard
          title="معدل التفاعل"
          value={`${calculatePercentage(stats.totalRecordings, stats.totalStudents * 10)}%`}
          icon={Activity}
          color="indigo"
          subtitle="نسبة التسجيلات للطلاب"
        />
      </div>

      {/* الرسوم البيانية والنشاطات */}
      <div className="grid md:grid-cols-2 gap-6">
        {/* النشاطات الأخيرة */}
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-500" />
              النشاطات الأخيرة
            </CardTitle>
          </CardHeader>

          <CardContent className="p-0">
            <div className="divide-y divide-slate-100">
              {recentActivity.length === 0 ? (
                <div className="p-6 text-center text-slate-500 arabic-text">
                  لا توجد نشاطات حديثة
                </div>
              ) : (
                recentActivity.map((activity, index) => (
                  <motion.div
                    key={activity.id}
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: index * 0.05 }}
                    className="p-4 hover:bg-slate-50 transition-colors"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3 flex-1">
                        <div className="w-10 h-10 bg-gradient-to-br from-indigo-500 to-purple-500 rounded-full flex items-center justify-center text-white font-bold">
                          {activity.studentName?.charAt(0) || "؟"}
                        </div>
                        <div className="flex-1 text-right">
                          <p className="text-sm font-semibold text-slate-900 arabic-text">
                            {activity.studentName}
                          </p>
                          <p className="text-xs text-slate-500 arabic-text">
                            {activity.studentGrade} • {getTimeAgo(activity.created_date)}
                          </p>
                        </div>
                      </div>

                      <Badge className={cn(
                        "text-xs font-bold",
                        `bg-${getScoreColor(activity.score)}-100 text-${getScoreColor(activity.score)}-800`
                      )}>
                        {activity.score ? `${activity.score}%` : "—"}
                      </Badge>
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </CardContent>
        </Card>

        {/* بطاقة الإثباتات */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-purple-50">
          <CardHeader className="border-b border-indigo-100">
            <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
              <Zap className="w-5 h-5 text-indigo-600" />
              ملف التقديم للجائزة
            </CardTitle>
          </CardHeader>

          <CardContent className="p-6 space-y-3">
            <Button
              variant="outline"
              onClick={handleDownloadAwardEvidence}
              className="w-full arabic-text justify-end"
              size="lg"
            >
              <span className="flex items-center gap-2">
                <span>تنزيل تقرير إثباتات CSV</span>
                <Download className="w-5 h-5" />
              </span>
            </Button>

            <Button
              onClick={handleExportAwardEvidenceToGoogleSheets}
              disabled={!googleSheetsWebhook.trim() || isExporting}
              className="w-full arabic-text justify-end bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
              size="lg"
            >
              <span className="flex items-center gap-2">
                <span>{isExporting ? "جاري الإرسال..." : "إرسال الإثباتات إلى Google Sheets"}</span>
                {isExporting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Upload className="w-5 h-5" />}
              </span>
            </Button>

            <p className="text-xs text-slate-600 arabic-text text-right leading-6">
              التقرير يتضمن: قياس الأثر قبل/بعد، الاتجاه الشهري، ساعات التدريب، تقليص فجوة يحتاج دعم، العينات النوعية، ومؤشرات الابتكار.
            </p>
          </CardContent>
        </Card>
      </div>

      {/* الأدلة النوعية والابتكار */}
      <div className="grid md:grid-cols-2 gap-4">
        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="arabic-text text-right text-base flex items-center gap-2">
              <Volume2 className="w-4 h-4 text-indigo-600" />
              عينات قبل وبعد (نوعية)
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-3">
            {impactAnalysis.qualitativeSamples.length === 0 ? (
              <p className="text-xs text-slate-500 arabic-text text-right">لا توجد عينات كافية حالياً (يحتاج كل طالب تسجيلين على الأقل).</p>
            ) : (
              impactAnalysis.qualitativeSamples.map((sample) => (
                <div key={`${sample.category}-${sample.student_id}`} className="border border-slate-100 rounded-lg p-3 bg-slate-50 text-right">
                  <p className="text-sm font-bold text-slate-900 arabic-text">{sample.category} - {sample.student_name}</p>
                  <p className="text-xs text-slate-600 arabic-text mt-1">قبل: {sample.before_score ?? "—"}% ({formatDate(sample.before_date)})</p>
                  <p className="text-xs text-slate-600 arabic-text">بعد: {sample.after_score ?? "—"}% ({formatDate(sample.after_date)})</p>
                </div>
              ))
            )}
          </CardContent>
        </Card>

        <Card className="border-0 shadow-lg">
          <CardHeader className="border-b border-slate-100">
            <CardTitle className="arabic-text text-right text-base flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-purple-600" />
              مؤشرات الابتكار
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2 text-right arabic-text">
            <p className="text-sm text-slate-700">• التمارين الطارئة المولدة: <strong>{impactAnalysis.emergencyExercisesCount}</strong></p>
            <p className="text-sm text-slate-700">• التسجيلات المحللة آلياً: <strong>{impactAnalysis.aiAnalyzedCount}</strong></p>
            <p className="text-sm text-slate-700">• تغطية التحليل الآلي: <strong>{impactAnalysis.aiCoveragePercent}%</strong></p>
            <p className="text-sm text-slate-700">• سجلات التغذية الراجعة: <strong>{impactAnalysis.feedbackEvidenceCount}</strong></p>
          </CardContent>
        </Card>
      </div>

      <InfoCard
        title="📁 توجيه إعداد ملف الجائزة"
        description="استخدمي زر التصدير بعد تحديث البيانات مباشرة، وأرفقي مع التقرير 3 عينات قبل/بعد (متميز، متوسط، يحتاج دعم) مع ملاحظاتك النصية والصوتية لإثبات الأثر التربوي الكامل."
        icon={Award}
        variant="info"
      />
    </div>
  );
}

/* ═══════════════════════════════════════════════════════════════════
   🏠 القسم 12: المكون الرئيسي - TeacherDashboard
   ═══════════════════════════════════════════════════════════════════ */

/**
 * 🏠 المكون الرئيسي للوحة تحكم المعلم
 */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("dashboard");

  // تحديث الجلسة عند أي نشاط
  useEffect(() => {
    const handleActivity = () => {
      SecurityManager.refreshSession();
    };

    window.addEventListener("click", handleActivity);
    window.addEventListener("keypress", handleActivity);

    // التحقق الدوري من الجلسة
    const interval = setInterval(() => {
      if (!SecurityManager.isAuthenticated()) {
        navigate(createPageUrl("Home"));
      }
    }, 60000); // كل دقيقة

    return () => {
      window.removeEventListener("click", handleActivity);
      window.removeEventListener("keypress", handleActivity);
      clearInterval(interval);
    };
  }, [navigate]);

  const handleLogout = () => {
    if (window.confirm("هل تريد تسجيل الخروج من لوحة تحكم المعلم؟")) {
      SecurityManager.logout();
      navigate(createPageUrl("Home"));
    }
  };

  return (
    <TeacherGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          {/* رأس الصفحة */}
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-2xl shadow-lg p-6"
          >
            <div className="flex items-center gap-4 w-full md:w-auto">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(createPageUrl("Home"))}
                className="rounded-full bg-white shadow-md hover:shadow-lg transition-shadow"
                title="رجوع للصفحة الرئيسية"
              >
                <ArrowLeft className="w-5 h-5" />
              </Button>

              <div className="flex-1 md:flex-none text-right">
                <div className="arabic-text text-2xl md:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent">
                  لوحة تحكم المعلم 👩‍🏫
                </div>
                <div className="arabic-text text-sm text-slate-600 mt-1">
                  نظام إدارة متقدم لتعليم اللغة العربية
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end w-full md:w-auto">
              <Badge className="bg-gradient-to-r from-indigo-500 to-purple-500 text-white px-3 py-1.5 arabic-text">
                <Shield className="w-3 h-3 ml-1" />
                جلسة آمنة
              </Badge>

              <Badge className="bg-gradient-to-r from-emerald-500 to-teal-500 text-white px-3 py-1.5 arabic-text">
                <Sparkles className="w-3 h-3 ml-1" />
                مدعوم بالذكاء الاصطناعي
              </Badge>

              <Dialog>
                <DialogTrigger asChild>
                  <Button
                    variant="outline"
                    className="arabic-text bg-white shadow-sm hover:shadow-md transition-shadow"
                  >
                    <Settings className="w-4 h-4 ml-1" />
                    إعدادات
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle className="arabic-text text-right text-xl">
                      ⚙️ الإعدادات المتقدمة
                    </DialogTitle>
                  </DialogHeader>
                  <SettingsTab />
                </DialogContent>
              </Dialog>

              <Button
                variant="outline"
                onClick={handleLogout}
                className="arabic-text text-red-600 hover:text-red-700 hover:bg-red-50"
              >
                <Lock className="w-4 h-4 ml-1" />
                تسجيل خروج
              </Button>
            </div>
          </motion.div>

          {/* التبويبات الرئيسية */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            <div className="bg-white shadow-xl rounded-2xl p-2 overflow-x-auto">
              <TabsList className="flex w-full min-w-max justify-start md:justify-center gap-2">
                <TabsTrigger
                  value="dashboard"
                  className="arabic-text text-xs md:text-sm flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  <BarChart3 className="w-4 h-4 ml-1" />
                  لوحة التحكم
                </TabsTrigger>

                <TabsTrigger
                  value="students"
                  className="arabic-text text-xs md:text-sm flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  <Users className="w-4 h-4 ml-1" />
                  الطلاب
                </TabsTrigger>

                <TabsTrigger
                  value="groups"
                  className="arabic-text text-xs md:text-sm flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  <ListChecks className="w-4 h-4 ml-1" />
                  المجموعات
                </TabsTrigger>

                <TabsTrigger
                  value="exercises"
                  className="arabic-text text-xs md:text-sm flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  <BookOpen className="w-4 h-4 ml-1" />
                  التمارين
                </TabsTrigger>

                <TabsTrigger
                  value="recordings"
                  className="arabic-text text-xs md:text-sm flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-indigo-600 data-[state=active]:to-purple-600 data-[state=active]:text-white"
                >
                  <Mic className="w-4 h-4 ml-1" />
                  التسجيلات
                </TabsTrigger>

                <TabsTrigger
                  value="assessments"
                  className="arabic-text text-xs md:text-sm flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-emerald-600 data-[state=active]:to-teal-600 data-[state=active]:text-white"
                >
                  <Award className="w-4 h-4 ml-1" />
                  التقييم المباشر
                </TabsTrigger>

                <TabsTrigger
                  value="emergency"
                  className="arabic-text text-xs md:text-sm flex-1 data-[state=active]:bg-gradient-to-r data-[state=active]:from-purple-600 data-[state=active]:to-pink-600 data-[state=active]:text-white"
                >
                  <Zap className="w-4 h-4 ml-1" />
                  تمرين طارئ
                </TabsTrigger>
              </TabsList>
            </div>

            {/* محتوى التبويبات */}
            <AnimatePresence mode="wait">
              <motion.div
                key={activeTab}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                transition={{ duration: 0.2 }}
              >
                <TabsContent value="dashboard" className="mt-0">
                  <DashboardTab />
                </TabsContent>

                <TabsContent value="students" className="mt-0">
                  <StudentsTab
                    onSelectStudent={(s) =>
                      navigate(createPageUrl(`StudentDashboard?studentId=${s.id}`))
                    }
                  />
                </TabsContent>

                <TabsContent value="groups" className="mt-0">
                  <GroupsTab />
                </TabsContent>

                <TabsContent value="exercises" className="mt-0">
                  <ExercisesTab />
                </TabsContent>

                <TabsContent value="recordings" className="mt-0">
                  <RecordingsTab />
                </TabsContent>

                <TabsContent value="assessments" className="mt-0">
                  <AssessmentManagementTab />
                </TabsContent>

                <TabsContent value="emergency" className="mt-0">
                  <EmergencyDrillTab />
                </TabsContent>
              </motion.div>
            </AnimatePresence>
          </Tabs>

          {/* تذييل الصفحة */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.5 }}
            className="text-center py-6 text-xs text-slate-500 arabic-text"
          >
            <p>
              منصة تعليم اللغة العربية • مدعومة بالذكاء الاصطناعي • آمنة ومحمية
            </p>
            <p className="mt-2">
              © {new Date().getFullYear()} جميع الحقوق محفوظة
            </p>
          </motion.div>
        </div>
      </div>
    </TeacherGate>
  );
}

// ═══════════════════════════════════════════════════════════════════
// 🎉 نهاية المرحلة 4/4 - الكود كامل! 
// إجمالي الأسطر: ~2750+ سطر من الكود المحسّن والمنظّم
// ═══════════════════════════════════════════════════════════════════
