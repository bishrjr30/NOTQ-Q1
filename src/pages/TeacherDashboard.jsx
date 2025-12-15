import React, { useState, useEffect } from "react";
import {
  Student,
  Recording,
  Lesson,
  StudentGroup,
  Exercise,
  SystemSetting,
  InvokeLLM,
} from "@/api/entities";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
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
  Edit,
  Eye,
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
  Award,
  AlertTriangle,
  BarChart2,
  Settings,
  MessageCircle,
  RefreshCw,
  ArrowLeft,
  Calendar,
  FileSpreadsheet,
} from "lucide-react";
import { useToast } from "@/components/ui/use-toast";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import AudioCommentModal from "../components/teacher/AudioCommentModal";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

/* =========================
   ✅ Helpers (Supabase توافق)
   ========================= */
const normalizeExercise = (ex) => ({
  ...ex,
  text: ex?.text ?? ex?.sentence ?? "",
});

async function safeCreateExercise(payload) {
  try {
    return await Exercise.create(payload);
  } catch (e1) {
    const fallback = { ...payload };
    if ("sentence" in fallback && !("text" in fallback)) {
      fallback.text = fallback.sentence;
      delete fallback.sentence;
    } else if ("text" in fallback && !("sentence" in fallback)) {
      fallback.sentence = fallback.text;
      delete fallback.text;
    }
    return await Exercise.create(fallback);
  }
}

async function safeUpdateRecording(id, patch) {
  try {
    return await Recording.update(id, patch);
  } catch (e1) {
    // دعم اختلاف اسم teacher_audio_comment في بعض المشاريع
    if (patch.teacher_audio_comment && !patch.teacher_audio) {
      const { teacher_audio_comment, ...rest } = patch;
      return await Recording.update(id, {
        ...rest,
        teacher_audio: teacher_audio_comment,
      });
    }
    throw e1;
  }
}

const pickTeacherAudio = (r) =>
  r.teacher_audio_comment || r.teacher_audio || "";
const pickAiFeedback = (r) =>
  r.feedback ||
  r.analysis_details?.feedback ||
  r.analysis_details?.ai_feedback ||
  "";
const pickReadText = (r) =>
  r.analysis_details?.original_text ||
  r.analysis_details?.text ||
  r.analysis_details?.sentence ||
  "";

/* ✅ بوابة دخول المعلم (حماية بسيطة بكلمة مرور) */
function TeacherGate({ children }) {
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  const authed = sessionStorage.getItem("teacher_authed") === "1";

  const submit = (e) => {
    e.preventDefault();
    if (pw === "teacher246") {
      sessionStorage.setItem("teacher_authed", "1");
      setError("");
      window.location.reload();
    } else {
      setError("كلمة المرور غير صحيحة.");
    }
  };

  if (authed) return children;

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-slate-50">
      <Card className="w-full max-w-md border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg">
            دخول المعلم
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={submit} className="space-y-3">
            <div className="space-y-1 text-right">
              <Label className="arabic-text">كلمة المرور</Label>
              <Input
                type="password"
                value={pw}
                onChange={(e) => setPw(e.target.value)}
                className="text-right arabic-text"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div className="text-right arabic-text text-sm text-red-600">
                {error}
              </div>
            )}

            <Button type="submit" className="arabic-text w-full">
              دخول
            </Button>
          </form>

          <p className="text-xs text-slate-500 arabic-text text-right">
            ملاحظة: هذه حماية بسيطة على الواجهة فقط. للحماية القوية نحتاج تسجيل
            دخول فعلي.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsTab() {
  const [apiKey, setApiKey] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const settings = await SystemSetting.list();
      const keySetting = settings.find((s) => s.key === "openai_api_key");
      if (keySetting) setApiKey(keySetting.value || "");
    } catch (e) {
      console.error("Failed to load settings", e);
    }
  };

  const handleSave = async () => {
    setIsLoading(true);
    try {
      const settings = await SystemSetting.list();
      const existing = settings.find((s) => s.key === "openai_api_key");

      if (existing) {
        await SystemSetting.update(existing.id, { value: apiKey });
      } else {
        await SystemSetting.create({
          key: "openai_api_key",
          value: apiKey,
          description: "OpenAI API Key for audio transcription and analysis",
        });
      }

      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) {
      console.error("Failed to save settings", e);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="border-0 shadow-none bg-transparent">
      <CardHeader className="px-0">
        <CardTitle className="arabic-text text-right text-lg">
          إعدادات النظام المتقدمة
        </CardTitle>
      </CardHeader>

      <CardContent className="px-0 space-y-3">
        <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 space-y-2">
          <div className="arabic-text text-right font-semibold">
            🔐 مفتاح OpenAI API
          </div>
          <p className="text-sm text-slate-600 arabic-text text-right">
            هذا المفتاح يُستخدم لتحويل الصوت إلى نص وتحليل النطق في صفحة التدريب
            الخاص. يتم تخزينه في قاعدة البيانات ولا يظهر للطلاب.
          </p>

          <div className="space-y-2">
            <Label className="arabic-text font-semibold text-right block text-slate-700">
              مفتاح OpenAI API
            </Label>
            <Input
              type="password"
              value={apiKey}
              onChange={(e) => setApiKey(e.target.value)}
              placeholder="sk-..."
              className="font-mono text-sm"
              autoComplete="off"
            />
            <p className="text-xs text-slate-400 arabic-text text-right">
              تأكد من أن خطتك تسمح باستخدام Whisper و GPT-4o.
            </p>
          </div>

          <div className="flex justify-end">
            <Button
              onClick={handleSave}
              disabled={isLoading}
              className="arabic-text"
            >
              {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
              حفظ الإعدادات
            </Button>
          </div>

          {saved && (
            <p className="text-xs text-green-600 arabic-text text-right">
              ✅ تم حفظ الإعدادات بنجاح.
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function StudentsTab({ onSelectStudent }) {
  const [students, setStudents] = useState([]);
  const [filterGrade, setFilterGrade] = useState("");
  const [searchName, setSearchName] = useState("");
  const [groups, setGroups] = useState([]);
  const [selectedGroupFilter, setSelectedGroupFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(false);
  const [expandedStudentId, setExpandedStudentId] = useState(null);

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
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = (students || []).filter((s) => {
    let ok = true;
    if (filterGrade) ok = ok && s.grade === filterGrade;
    if (searchName.trim()) {
      ok =
        ok &&
        (s.name || "")
          .toLowerCase()
          .includes(searchName.trim().toLowerCase());
    }
    if (selectedGroupFilter !== "all") {
      ok = ok && s.group_id && selectedGroupFilter === s.group_id;
    }
    return ok;
  });

  const getLastActiveText = (dateStr) => {
    if (!dateStr) return "لا يوجد";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "تاريخ غير معروف";
    return d.toLocaleDateString("ar-AE");
  };

  const getLevelBadgeColor = (level) => {
    switch (level) {
      case "متقدم":
        return "bg-emerald-100 text-emerald-800";
      case "متوسط":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-slate-100 text-slate-800";
    }
  };

  const gradeLevels = [
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

  const getGroupName = (groupId) => {
    if (!groupId) return "غير منضم لمجموعة";
    const group = (groups || []).find((g) => g.id === groupId);
    return group ? group.name : "مجموعة غير معروفة";
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              تصفية الطلاب
            </span>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setFilterGrade("");
                setSearchName("");
                setSelectedGroupFilter("all");
              }}
              className="arabic-text text-xs text-slate-500"
            >
              إعادة ضبط
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-3 gap-4">
          <div className="space-y-1 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              البحث بالاسم
            </Label>
            <div className="relative">
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
              <Input
                placeholder="اكتب اسم الطالب..."
                value={searchName}
                onChange={(e) => setSearchName(e.target.value)}
                className="pr-3 pl-9 text-right arabic-text"
              />
            </div>
          </div>

          <div className="space-y-1 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              الصف الدراسي
            </Label>
            <Select value={filterGrade} onValueChange={setFilterGrade}>
              <SelectTrigger className="text-right arabic-text">
                <SelectValue placeholder="جميع الصفوف" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((g) => (
                  <SelectItem key={g} value={g} className="arabic-text">
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              المجموعة
            </Label>
            <Select
              value={selectedGroupFilter}
              onValueChange={setSelectedGroupFilter}
            >
              <SelectTrigger className="text-right arabic-text">
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
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="arabic-text text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              قائمة الطلاب ({filteredStudents.length})
            </span>
            {isLoading && (
              <span className="flex items-center gap-2 text-xs text-slate-500 arabic-text">
                <Loader2 className="w-3 h-3 animate-spin" />
                يتم تحميل البيانات...
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {filteredStudents.length === 0 && !isLoading ? (
            <div className="text-center py-8 text-slate-500 arabic-text">
              لا يوجد طلاب مطابقون للبحث الحالي.
            </div>
          ) : null}

          <div className="overflow-x-auto">
            <table className="w-full text-right border-collapse">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    الاسم
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    الصف
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    المجموعة
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    آخر نشاط
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    مستوى النطق
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    تمارين
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    المتوسط
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">
                    تفاصيل
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((s) => (
                  <React.Fragment key={s.id}>
                    <tr className="border-b border-slate-100 hover:bg-slate-50/60 transition">
                      <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text whitespace-nowrap">
                        {s.name}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                        {s.grade}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                        <span className="inline-flex items-center px-2 py-1 rounded-full bg-slate-100 text-slate-700">
                          {getGroupName(s.group_id)}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                        {getLastActiveText(s.last_activity)}
                      </td>
                      <td className="py-2 px-3">
                        <span
                          className={cn(
                            "inline-flex items-center px-2 py-1 rounded-full text-xs arabic-text",
                            getLevelBadgeColor(s.level || "مبتدئ")
                          )}
                        >
                          <Star className="w-3 h-3 ml-1" />
                          {s.level || "مبتدئ"}
                        </span>
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 text-center">
                        {s.total_exercises || 0}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 text-center">
                        {s.average_score ? `${s.average_score}%` : "-"}
                      </td>
                      <td className="py-2 px-3 text-xs text-slate-700 text-center">
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() =>
                            setExpandedStudentId(
                              expandedStudentId === s.id ? null : s.id
                            )
                          }
                          className="arabic-text text-xs"
                        >
                          {expandedStudentId === s.id ? "إخفاء" : "عرض"}
                        </Button>
                      </td>
                    </tr>

                    {expandedStudentId === s.id && (
                      <tr className="bg-slate-50/50 border-b border-slate-100">
                        <td colSpan={8} className="p-3">
                          <div className="flex flex-wrap gap-2 items-center justify-between">
                            <div className="flex flex-wrap gap-2">
                              <Badge className="bg-emerald-100 text-emerald-800 arabic-text">
                                حروف متقنة:{" "}
                                {s.mastered_letters &&
                                s.mastered_letters.length > 0
                                  ? s.mastered_letters.join("، ")
                                  : "لا يوجد"}
                              </Badge>
                              <Badge className="bg-orange-100 text-orange-800 arabic-text">
                                يحتاج تدريب:{" "}
                                {s.needs_practice_letters &&
                                s.needs_practice_letters.length > 0
                                  ? s.needs_practice_letters.join("، ")
                                  : "لا يوجد"}
                              </Badge>
                            </div>

                            <div className="flex gap-2">
                              <Button
                                size="sm"
                                variant="outline"
                                onClick={() => onSelectStudent(s)}
                                className="arabic-text text-xs"
                              >
                                سجل الطالب
                              </Button>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

function GroupsTab() {
  const [groups, setGroups] = useState([]);
  const [students, setStudents] = useState([]);
  const [newGroupName, setNewGroupName] = useState("");
  const [selectedGroupId, setSelectedGroupId] = useState("");
  const [selectedStudents, setSelectedStudents] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [groupFilter, setGroupFilter] = useState("all");

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateGroup = async () => {
    if (!newGroupName.trim()) return;
    setIsLoading(true);
    try {
      const g = await StudentGroup.create({ name: newGroupName.trim() });
      setGroups((prev) => [g, ...prev]);
      setNewGroupName("");
      toast({
        title: "تم إنشاء المجموعة",
        description: "يمكنك الآن إضافة الطلاب إلى هذه المجموعة.",
      });
    } catch (e) {
      console.error("Create group failed", e);
      alert("فشل إنشاء المجموعة");
    } finally {
      setIsLoading(false);
    }
  };

  const handleAssignStudents = async () => {
    if (!selectedGroupId || selectedStudents.length === 0) return;
    setIsLoading(true);
    try {
      await Promise.all(
        selectedStudents.map((studentId) =>
          Student.update(studentId, { group_id: selectedGroupId })
        )
      );
      toast({
        title: "تم التحديث",
        description: "تم ربط الطلاب بالمجموعة المحددة.",
      });
      await loadData();
      setSelectedStudents([]);
    } catch (e) {
      console.error("Assign students failed", e);
      alert("فشل في ربط الطلاب بالمجموعة");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteGroup = async (groupId) => {
    if (!window.confirm("هل تريد حذف هذه المجموعة؟")) return;
    setIsLoading(true);
    try {
      await StudentGroup.delete(groupId);
      toast({ title: "تم حذف المجموعة" });
      setGroups((prev) => prev.filter((g) => g.id !== groupId));
    } catch (e) {
      console.error("Delete group failed", e);
      alert("فشل في حذف المجموعة");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = (students || []).filter((s) => {
    if (groupFilter === "all") return true;
    if (groupFilter === "ungrouped") return !s.group_id;
    return s.group_id === groupFilter;
  });

  const getGroupName = (groupId) => {
    const group = (groups || []).find((g) => g.id === groupId);
    return group ? group.name : "غير منضم لمجموعة";
  };

  const toggleStudentSelection = (id) => {
    setSelectedStudents((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              إدارة المجموعات
            </span>
            {isLoading && (
              <span className="flex items-center gap-2 text-xs text-slate-500 arabic-text">
                <Loader2 className="w-3 h-3 animate-spin" />
                جاري التحميل...
              </span>
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              إنشاء مجموعة جديدة
            </Label>
            <Input
              placeholder="اسم المجموعة (مثلاً: الصف 5/أ)"
              value={newGroupName}
              onChange={(e) => setNewGroupName(e.target.value)}
              className="text-right arabic-text"
            />
            <Button
              onClick={handleCreateGroup}
              disabled={!newGroupName.trim() || isLoading}
              className="arabic-text w-full"
            >
              <Plus className="w-4 h-4 ml-1" />
              إنشاء مجموعة
            </Button>
          </div>

          <div className="space-y-3 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              اختر مجموعة للربط
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

            <Button
              onClick={handleAssignStudents}
              disabled={!selectedGroupId || selectedStudents.length === 0}
              className="arabic-text w-full"
            >
              <CheckCircle className="w-4 h-4 ml-1" />
              ربط الطلاب المحددين
            </Button>
          </div>

          <div className="space-y-3 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              تصفية الطلاب حسب المجموعة
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
                  بدون مجموعة
                </SelectItem>
                {groups.map((g) => (
                  <SelectItem key={g.id} value={g.id} className="arabic-text">
                    {g.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button
              variant="destructive"
              className="arabic-text w-full"
              disabled={!selectedGroupId || isLoading}
              onClick={() => handleDeleteGroup(selectedGroupId)}
            >
              <Trash2 className="w-4 h-4 ml-1" />
              حذف المجموعة المحددة
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            الطلاب
          </CardTitle>
        </CardHeader>

        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    اختيار
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    الاسم
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    الصف
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    المجموعة الحالية
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredStudents.map((s) => (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="py-2 px-3 text-center">
                      <Checkbox
                        checked={selectedStudents.includes(s.id)}
                        onCheckedChange={() => toggleStudentSelection(s.id)}
                      />
                    </td>
                    <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text whitespace-nowrap">
                      {s.name}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                      {s.grade}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                      {getGroupName(s.group_id)}
                    </td>
                  </tr>
                ))}

                {filteredStudents.length === 0 && (
                  <tr>
                    <td
                      colSpan={4}
                      className="text-center py-4 text-slate-500 arabic-text"
                    >
                      لا يوجد طلاب في هذه التصفية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-red-50/80 border border-red-100">
        <CardContent className="text-right arabic-text text-xs text-red-700 flex items-start gap-2">
          <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
          <p>
            ملاحظة: عند حذف مجموعة، لن يتم حذف الطلاب، لكن سيفقدون ارتباطهم بتلك
            المجموعة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   ✅ ExercisesTab (توافق sentence/text)
   ========================= */
function ExercisesTab() {
  const ALL = "__all__";

  const [exercises, setExercises] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newText, setNewText] = useState("");
  const [newGrade, setNewGrade] = useState("");
  const [newLevel, setNewLevel] = useState("مبتدئ");
  const [newStage, setNewStage] = useState(1);

  const [filterGrade, setFilterGrade] = useState(ALL);
  const [filterLevel, setFilterLevel] = useState(ALL);
  const [filterStage, setFilterStage] = useState("");
  const [searchText, setSearchText] = useState("");

  const gradeLevels = [
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
      setExercises([]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!newTitle.trim() || !newText.trim() || !newGrade) return;

    setIsLoading(true);
    try {
      const ex = await safeCreateExercise({
        title: newTitle.trim(),
        sentence: newText.trim(), // ✅ supabase غالبًا sentence
        grade: newGrade,
        level: newLevel,
        stage: parseInt(newStage, 10) || 1,
        is_active: true,
      });

      setExercises((prev) => [normalizeExercise(ex), ...prev]);
      setNewTitle("");
      setNewText("");
      setNewGrade("");
      setNewStage(1);
    } catch (e) {
      console.error("Create exercise failed", e);
      alert("فشل في إنشاء التمرين");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteExercise = async (id) => {
    if (!window.confirm("هل تريد حذف هذا التمرين؟")) return;
    setIsLoading(true);
    try {
      await Exercise.delete(id);
      setExercises((prev) => prev.filter((x) => x.id !== id));
    } catch (e) {
      console.error("Delete exercise failed", e);
      alert("فشل في حذف التمرين");
    } finally {
      setIsLoading(false);
    }
  };

  const filteredExercises = (exercises || []).filter((ex) => {
    let ok = true;
    if (filterGrade !== ALL) ok = ok && ex.grade === filterGrade;
    if (filterLevel !== ALL) ok = ok && ex.level === filterLevel;
    if (filterStage) ok = ok && ex.stage === parseInt(filterStage, 10);
    if (searchText.trim()) {
      const t = searchText.trim().toLowerCase();
      ok =
        ok &&
        ((ex.title || "").toLowerCase().includes(t) ||
          (ex.text || "").toLowerCase().includes(t));
    }
    return ok;
  });

  const levelOptions = ["مبتدئ", "متوسط", "متقدم"];

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Plus className="w-5 h-5 text-slate-500" />
            إنشاء تمرين جديد
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-6">
          <div className="space-y-3 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              عنوان التمرين
            </Label>
            <Input
              value={newTitle}
              onChange={(e) => setNewTitle(e.target.value)}
              placeholder="مثال: قراءة فقرة عن الصدق"
              className="text-right arabic-text"
            />

            <Label className="arabic-text text-sm text-slate-700 mt-3">
              الصف الدراسي
            </Label>
            <Select value={newGrade} onValueChange={setNewGrade}>
              <SelectTrigger className="text-right arabic-text">
                <SelectValue placeholder="اختر الصف" />
              </SelectTrigger>
              <SelectContent>
                {gradeLevels.map((g) => (
                  <SelectItem key={g} value={g} className="arabic-text">
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <div className="grid grid-cols-2 gap-4 mt-3">
              <div className="space-y-1 text-right">
                <Label className="arabic-text text-sm text-slate-700">
                  المستوى
                </Label>
                <Select value={newLevel} onValueChange={setNewLevel}>
                  <SelectTrigger className="text-right arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {levelOptions.map((lvl) => (
                      <SelectItem
                        key={lvl}
                        value={lvl}
                        className="arabic-text"
                      >
                        {lvl}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1 text-right">
                <Label className="arabic-text text-sm text-slate-700">
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

          <div className="space-y-3 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              نص التمرين
            </Label>
            <Textarea
              value={newText}
              onChange={(e) => setNewText(e.target.value)}
              placeholder="اكتب النص الذي سيقرأه الطالب هنا..."
              className="min-h-[160px] text-right arabic-text"
            />
            <Button
              onClick={handleCreateExercise}
              disabled={!newTitle.trim() || !newText.trim() || !newGrade || isLoading}
              className="arabic-text w-full mt-2"
            >
              {isLoading && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
              حفظ التمرين
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <ListChecks className="w-5 h-5 text-slate-500" />
            قائمة التمارين ({filteredExercises.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4 text-right">
          <div className="grid md:grid-cols-4 gap-3">
            <div className="space-y-1">
              <Label className="arabic-text text-sm text-slate-700">بحث</Label>
              <div className="relative">
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
                <Input
                  placeholder="عنوان أو جزء من النص..."
                  value={searchText}
                  onChange={(e) => setSearchText(e.target.value)}
                  className="pr-3 pl-9 text-right arabic-text"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="arabic-text text-sm text-slate-700">الصف</Label>
              <Select value={filterGrade} onValueChange={setFilterGrade}>
                <SelectTrigger className="text-right arabic-text">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="arabic-text">
                    الكل
                  </SelectItem>
                  {gradeLevels.map((g) => (
                    <SelectItem key={g} value={g} className="arabic-text">
                      {g}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="arabic-text text-sm text-slate-700">
                المستوى
              </Label>
              <Select value={filterLevel} onValueChange={setFilterLevel}>
                <SelectTrigger className="text-right arabic-text">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={ALL} className="arabic-text">
                    الكل
                  </SelectItem>
                  {levelOptions.map((lvl) => (
                    <SelectItem key={lvl} value={lvl} className="arabic-text">
                      {lvl}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1">
              <Label className="arabic-text text-sm text-slate-700">المرحلة</Label>
              <Input
                type="number"
                value={filterStage}
                onChange={(e) => setFilterStage(e.target.value)}
                placeholder="الكل"
                className="text-right arabic-text"
              />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    العنوان
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    الصف
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    المستوى
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    المرحلة
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    نشط؟
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    الإجراءات
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredExercises.map((ex) => (
                  <tr
                    key={ex.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text">
                      {ex.title}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-700 arabic-text">
                      {ex.grade}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-700 arabic-text">
                      {ex.level}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-700 arabic-text text-center">
                      {ex.stage}
                    </td>
                    <td className="py-2 px-3 text-xs text-center">
                      <span
                        className={cn(
                          "inline-flex items-center px-2 py-1 rounded-full text-xs",
                          ex.is_active
                            ? "bg-emerald-100 text-emerald-700"
                            : "bg-slate-100 text-slate-500"
                        )}
                      >
                        {ex.is_active ? "نعم" : "لا"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-xs text-center">
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => handleDeleteExercise(ex.id)}
                      >
                        <Trash2 className="w-4 h-4 text-red-500" />
                      </Button>
                    </td>
                  </tr>
                ))}

                {filteredExercises.length === 0 && (
                  <tr>
                    <td
                      colSpan={6}
                      className="text-center py-4 text-slate-500 arabic-text"
                    >
                      لا توجد تمارين مطابقة للتصفية الحالية.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>

          {isLoading && (
            <div className="text-center py-3">
              <Loader2 className="w-5 h-5 animate-spin mx-auto text-slate-500" />
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   ✅ RecordingsTab (لوحة التحكم/التسجيلات)
   - عرض رد الذكاء + الدرجة /100 قابلة للتعديل
   - رد نصي + رد صوتي (AudioCommentModal)
   ========================= */
function RecordingsTab() {
  const ALL = "__all__";

  const [recordings, setRecordings] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(ALL);
  const [selectedGrade, setSelectedGrade] = useState(ALL);
  const [filterScore, setFilterScore] = useState(0);
  const [onlyWithComments, setOnlyWithComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const [selectedRecording, setSelectedRecording] = useState(null);
  const [teacherComment, setTeacherComment] = useState("");
  const [isSavingComment, setIsSavingComment] = useState(false);

  const [editScore, setEditScore] = useState("");
  const [editScoreRecordingId, setEditScoreRecordingId] = useState(null);

  const gradeLevels = [
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
      setStudents([]);
      setRecordings([]);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentById = (id) => (students || []).find((s) => s.id === id);

  const filteredRecordings = (recordings || []).filter((r) => {
    let ok = true;

    if (selectedStudentId !== ALL) ok = ok && r.student_id === selectedStudentId;

    if (selectedGrade !== ALL) {
      const st = getStudentById(r.student_id);
      ok = ok && st?.grade === selectedGrade;
    }

    if (filterScore > 0) ok = ok && (r.score || 0) >= filterScore;

    if (onlyWithComments) ok = ok && (r.teacher_comment || pickTeacherAudio(r));

    return ok;
  });

  const openReplyDialog = (recording) => {
    setSelectedRecording(recording);
    setTeacherComment(recording.teacher_comment || "");
  };

  const saveReply = async () => {
    if (!selectedRecording) return;
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

      setSelectedRecording(null);
      setTeacherComment("");
    } catch (e) {
      console.error("Failed to save teacher reply", e);
      alert("فشل حفظ رد المعلم.");
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
      alert("الرجاء إدخال درجة صحيحة بين 0 و 100");
      return;
    }

    try {
      await safeUpdateRecording(recordingId, { score: newScore });
      setRecordings((prev) =>
        prev.map((r) => (r.id === recordingId ? { ...r, score: newScore } : r))
      );
      setEditScoreRecordingId(null);
      setEditScore("");
    } catch (error) {
      console.error("Failed to update score", error);
      alert("حدث خطأ أثناء تحديث الدرجة");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              تصفية التسجيلات
            </span>

            <Button
              variant="outline"
              className="arabic-text text-xs"
              onClick={loadData}
              disabled={isLoading}
            >
              <RefreshCw className="w-4 h-4 ml-1" />
              تحديث
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-4 gap-4 text-right">
          <div className="space-y-1">
            <Label className="arabic-text text-sm text-slate-700">الطالب</Label>
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

          <div className="space-y-1">
            <Label className="arabic-text text-sm text-slate-700">الصف</Label>
            <Select value={selectedGrade} onValueChange={setSelectedGrade}>
              <SelectTrigger className="text-right arabic-text">
                <SelectValue placeholder="الكل" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL} className="arabic-text">
                  الكل
                </SelectItem>
                {gradeLevels.map((g) => (
                  <SelectItem key={g} value={g} className="arabic-text">
                    {g}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="space-y-1">
            <Label className="arabic-text text-sm text-slate-700">أقل درجة</Label>
            <div className="flex items-center gap-2">
              <Slider
                value={[filterScore]}
                min={0}
                max={100}
                step={5}
                onValueChange={(v) => setFilterScore(v[0])}
              />
              <span className="w-10 text-center text-xs font-semibold">
                {filterScore}
              </span>
            </div>
          </div>

          <div className="space-y-1">
            <Label className="arabic-text text-sm text-slate-700">تعليقات المعلم</Label>
            <div className="flex items-center gap-2 justify-end">
              <Switch checked={onlyWithComments} onCheckedChange={setOnlyWithComments} />
              <span className="text-xs text-slate-700 arabic-text">
                إظهار التي تحتوي على رد فقط
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Mic className="w-5 h-5 text-slate-500" />
            جميع تسجيلات الطلاب ({filteredRecordings.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-3">
          {isLoading && (
            <div className="text-center py-4">
              <Loader2 className="w-6 h-6 animate-spin mx-auto text-slate-500" />
            </div>
          )}

          {!isLoading && filteredRecordings.length === 0 && (
            <div className="text-center py-8 text-slate-500 arabic-text">
              لا توجد تسجيلات مطابقة للتصفية الحالية.
            </div>
          )}

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    الطالب
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    التاريخ
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    الدرجة /100
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    رد الذكاء
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    محاولة الطالب
                  </th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                    رد المعلم
                  </th>
                </tr>
              </thead>

              <tbody>
                {filteredRecordings.map((r) => {
                  const st = getStudentById(r.student_id);
                  const dateStr = r.created_date
                    ? new Date(r.created_date).toLocaleDateString("ar-AE", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "—";

                  const ai = pickAiFeedback(r);
                  const readText = pickReadText(r);
                  const teacherAudioUrl = pickTeacherAudio(r);

                  const scoreVal = r.score ?? null;
                  const scoreColor =
                    scoreVal >= 90
                      ? "bg-emerald-100 text-emerald-800"
                      : scoreVal >= 70
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800";

                  return (
                    <tr
                      key={r.id}
                      className="border-b border-slate-100 hover:bg-slate-50/60 align-top"
                    >
                      <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text whitespace-nowrap">
                        {st?.name || "طالب"}
                        <div className="text-[11px] text-slate-500">
                          {st?.grade || ""}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                        {dateStr}
                      </td>

                      <td className="py-2 px-3 text-xs text-center">
                        {editScoreRecordingId === r.id ? (
                          <div className="flex items-center justify-center gap-1">
                            <Input
                              type="number"
                              value={editScore}
                              onChange={(e) => setEditScore(e.target.value)}
                              className="h-8 w-16 text-center text-xs"
                            />
                            <Button
                              className="px-2 py-1 text-xs"
                              onClick={() => handleManualScoreSave(r.id)}
                            >
                              حفظ
                            </Button>
                          </div>
                        ) : (
                          <span
                            className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-semibold cursor-pointer ${scoreColor}`}
                            onClick={() => handleScoreClick(r)}
                            title="اضغط لتعديل الدرجة"
                          >
                            {scoreVal != null ? scoreVal : "—"}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-xs text-slate-800 arabic-text max-w-sm">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <div className="text-[11px] text-slate-500 mb-1">
                            🤖 رد الذكاء
                          </div>
                          <p className="line-clamp-3">
                            {ai || "لا يوجد رد ذكاء مسجل."}
                          </p>
                        </div>
                      </td>

                      <td className="py-2 px-3 text-xs text-slate-700 arabic-text max-w-sm">
                        <div className="space-y-2">
                          <div className="bg-slate-50 rounded-lg p-2">
                            <div className="text-[11px] text-slate-500 mb-1">
                              النص المقروء
                            </div>
                            <p className="line-clamp-2">{readText || "—"}</p>
                          </div>
                          <audio controls src={r.audio_url} className="w-full" />
                        </div>
                      </td>

                      <td className="py-2 px-3 text-xs text-slate-800 arabic-text max-w-xs">
                        <div className="space-y-2">
                          {r.teacher_comment && (
                            <div className="bg-emerald-50 rounded p-2 text-[11px] text-emerald-800">
                              👩‍🏫 {r.teacher_comment}
                            </div>
                          )}

                          {teacherAudioUrl && (
                            <audio
                              controls
                              src={teacherAudioUrl}
                              className="w-full"
                            />
                          )}

                          <div className="flex gap-2 justify-end">
                            <Button
                              variant="outline"
                              size="sm"
                              className="arabic-text text-xs"
                              onClick={() => openReplyDialog(r)}
                            >
                              رد نصي
                            </Button>

                            {/* ✅ رد صوتي (موجود مسبقًا ويرفع للـ bucket ويحدث التسجيل) */}
                            <AudioCommentModal recording={r} />
                          </div>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* ✅ Dialog: رد نصي */}
          <Dialog
            open={!!selectedRecording}
            onOpenChange={(v) => !v && setSelectedRecording(null)}
          >
            <DialogContent className="max-w-lg">
              <DialogHeader>
                <DialogTitle className="arabic-text text-right">
                  إرسال رد نصي للطالب
                </DialogTitle>
              </DialogHeader>

              <div className="space-y-2 text-right">
                <Label className="arabic-text">ملاحظة المعلم</Label>
                <Textarea
                  value={teacherComment}
                  onChange={(e) => setTeacherComment(e.target.value)}
                  className="min-h-[140px] text-right arabic-text"
                  placeholder="اكتب ملاحظة واضحة..."
                />
                <p className="text-xs text-slate-500 arabic-text">
                  سيتم حفظ هذا الرد داخل نفس التسجيل ليظهر للطالب في سجل التعليقات
                  الذكي.
                </p>
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
                  disabled={isSavingComment}
                  className="arabic-text"
                >
                  {isSavingComment && (
                    <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                  )}
                  حفظ الرد
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </CardContent>
      </Card>
    </div>
  );
}

/* ✅ لوحة التحكم = جميع التسجيلات (نفس تسجيلات الطلاب) */
function DashboardTab() {
  return <RecordingsTab />;
}

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

  const gradeLevels = [
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

  const handleGenerate = async () => {
    if (!prompt.trim()) return;
    setIsLoading(true);
    try {
      const res = await InvokeLLM({
        prompt: `أنت معلم لغة عربية للمرحلة الابتدائية. قم بإنشاء فقرة قراءة عربية فصحى (بدون تشكيل كامل، لكن لغة سليمة) بناءً على طلب المعلم التالي: "${prompt}"

ارسل الفقرة النهائية فقط، بدون أي تعليق إضافي.`,
      });

      const text = res?.text || res?.content || "";
      setGeneratedText((text || "").trim());
    } catch (e) {
      console.error("Emergency drill generation failed", e);
      alert("فشل في توليد النص. تأكد من إعدادات OpenAI API في صفحة الإعدادات.");
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveAsExercise = async () => {
    if (!generatedText.trim() || !grade) {
      alert("يرجى اختيار الصف وإدخال عنوان مناسب قبل الحفظ.");
      return;
    }
    try {
      await safeCreateExercise({
        title: title.trim() || "تمرين طارئ",
        sentence: generatedText.trim(),
        grade,
        level,
        stage: stage || 1,
        is_active: true,
      });

      alert("تم حفظ التمرين بنجاح، ويمكن للطلاب استخدامه.");
    } catch (e) {
      console.error("Failed to save emergency exercise", e);
      alert("فشل في حفظ التمرين الطارئ.");
    }
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-slate-500" />
            توليد تمرين طارئ بالذكاء الاصطناعي
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-2 gap-6 text-right">
          <div className="space-y-3">
            <Label className="arabic-text text-sm text-slate-700">
              وصف التمرين المطلوب
            </Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[180px] text-right arabic-text"
            />
            <Button
              onClick={handleGenerate}
              disabled={isLoading}
              className="arabic-text w-full"
            >
              {isLoading && <Loader2 className="w-4 h-4 ml-1 animate-spin" />}
              توليد النص
            </Button>
            <p className="text-xs text-slate-500 arabic-text">
              مثال: "فقرة للصف الرابع عن أهمية النظافة الشخصية، جمل قصيرة وواضحة."
            </p>
          </div>

          <div className="space-y-3">
            <Label className="arabic-text text-sm text-slate-700">النص الناتج</Label>
            <Textarea
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              className="min-h-[180px] text-right arabic-text"
              placeholder="سيظهر هنا النص الذي تم توليده..."
            />

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="arabic-text text-sm text-slate-700">عنوان التمرين</Label>
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="text-right arabic-text"
                />
              </div>

              <div className="space-y-1">
                <Label className="arabic-text text-sm text-slate-700">الصف</Label>
                <Select value={grade} onValueChange={setGrade}>
                  <SelectTrigger className="text-right arabic-text">
                    <SelectValue placeholder="اختر الصف" />
                  </SelectTrigger>
                  <SelectContent>
                    {gradeLevels.map((g) => (
                      <SelectItem key={g} value={g} className="arabic-text">
                        {g}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="arabic-text text-sm text-slate-700">المستوى</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="text-right arabic-text">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="مبتدئ" className="arabic-text">مبتدئ</SelectItem>
                    <SelectItem value="متوسط" className="arabic-text">متوسط</SelectItem>
                    <SelectItem value="متقدم" className="arabic-text">متقدم</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1">
                <Label className="arabic-text text-sm text-slate-700">المرحلة</Label>
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

            <Button
              onClick={handleSaveAsExercise}
              disabled={!generatedText.trim() || !grade}
              className="arabic-text w-full bg-emerald-600 hover:bg-emerald-700"
            >
              <CheckCircle className="w-4 h-4 ml-1" />
              حفظ كتمرين جاهز للطلاب
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   ✅ TeacherDashboard (مُحدّث)
   - إضافة "لوحة التحكم"
   - إزالة الفراغ: SettingsTab داخل Dialog وليس أسفل الصفحة
   ========================= */
export default function TeacherDashboard() {
  const navigate = useNavigate();

  return (
    <TeacherGate>
      <div className="min-h-screen bg-slate-50">
        <div className="max-w-7xl mx-auto p-4 md:p-8 space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-start">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(createPageUrl("Home"))}
                className="rounded-full bg-white/80"
                title="رجوع"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <div className="text-right">
                <div className="arabic-text text-xl md:text-2xl font-bold text-slate-900">
                  لوحة تحكم المعلم 👩‍🏫
                </div>
                <div className="arabic-text text-sm text-slate-600">
                  إدارة الطلاب، التمارين، المجموعات، والتسجيلات الصوتية
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center gap-2 justify-end">
              <Badge className="bg-indigo-100 text-indigo-800 arabic-text">
                <Users className="w-3 h-3 ml-1" />
                معلم اللغة العربية - مرحلة أساسية
              </Badge>

              <Badge className="bg-emerald-100 text-emerald-800 arabic-text">
                <Mic className="w-3 h-3 ml-1" />
                منصة تحليل النطق الذكي
              </Badge>

              {/* ✅ SettingsTab داخل Dialog = لا يوجد فراغ أسفل الصفحة */}
              <Dialog>
                <DialogTrigger asChild>
                  <Button variant="outline" className="arabic-text bg-white/80">
                    <Settings className="w-4 h-4 ml-1" />
                    إعدادات متقدمة
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-2xl">
                  <DialogHeader>
                    <DialogTitle className="arabic-text text-right">
                      إعدادات متقدمة
                    </DialogTitle>
                  </DialogHeader>
                  <SettingsTab />
                </DialogContent>
              </Dialog>
            </div>
          </motion.div>

          <Tabs defaultValue="dashboard" className="space-y-4">
            <TabsList className="bg-white shadow-md rounded-2xl p-1 grid grid-cols-6">
              <TabsTrigger value="dashboard" className="arabic-text text-xs md:text-sm">
                <BarChart3 className="w-4 h-4 ml-1" />
                لوحة التحكم
              </TabsTrigger>

              <TabsTrigger value="students" className="arabic-text text-xs md:text-sm">
                <Users className="w-4 h-4 ml-1" />
                الطلاب
              </TabsTrigger>

              <TabsTrigger value="groups" className="arabic-text text-xs md:text-sm">
                <ListChecks className="w-4 h-4 ml-1" />
                المجموعات
              </TabsTrigger>

              <TabsTrigger value="exercises" className="arabic-text text-xs md:text-sm">
                <BookOpen className="w-4 h-4 ml-1" />
                التمارين
              </TabsTrigger>

              <TabsTrigger value="recordings" className="arabic-text text-xs md:text-sm">
                <Mic className="w-4 h-4 ml-1" />
                التسجيلات
              </TabsTrigger>

              <TabsTrigger value="emergency" className="arabic-text text-xs md:text-sm">
                <AlertTriangle className="w-4 h-4 ml-1" />
                تمرين طارئ
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardTab />
            </TabsContent>

            <TabsContent value="students">
              <StudentsTab
                onSelectStudent={(s) =>
                  navigate(createPageUrl(`StudentDashboard?studentId=${s.id}`))
                }
              />
            </TabsContent>

            <TabsContent value="groups">
              <GroupsTab />
            </TabsContent>

            <TabsContent value="exercises">
              <ExercisesTab />
            </TabsContent>

            <TabsContent value="recordings">
              <RecordingsTab />
            </TabsContent>

            <TabsContent value="emergency">
              <EmergencyDrillTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </TeacherGate>
  );
}
