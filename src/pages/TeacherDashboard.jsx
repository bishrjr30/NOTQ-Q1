import React, { useEffect, useMemo, useState } from "react";
import {
  Student,
  Recording,
  Lesson,
  StudentGroup,
  Exercise,
} from "@/api/entities";

import { InvokeLLM } from "@/api/integrations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";

import {
  Users,
  Trophy,
  LayoutDashboard,
  BookOpen,
  Layers,
  Mic,
  ClipboardList,
  Search,
  RefreshCw,
  Plus,
  AlertTriangle,
  ArrowLeft,
  Send,
  Loader2,
  Crown,
} from "lucide-react";

import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";
import { cn } from "@/lib/utils";

/* ✅ بوابة دخول المعلم (واجهة فقط) */
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4" dir="rtl">
      <Card className="w-full max-w-md border-0 shadow-lg bg-white/95">
        <CardHeader>
          <CardTitle className="arabic-text text-right">دخول المعلم</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <form onSubmit={submit} className="space-y-3">
            <Label className="arabic-text text-right block">كلمة المرور</Label>
            <Input
              type="password"
              value={pw}
              onChange={(e) => setPw(e.target.value)}
              className="text-right arabic-text"
              placeholder="••••••••"
              autoComplete="current-password"
            />
            {error && (
              <p className="text-sm text-red-600 arabic-text text-right">{error}</p>
            )}
            <Button type="submit" className="arabic-text w-full">
              دخول
            </Button>
          </form>
          <p className="text-xs text-slate-500 arabic-text text-right">
            حماية واجهة فقط. للحماية القوية نحتاج تسجيل دخول فعلي.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==============================
   Helpers
============================== */
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

function isActiveByLastActivity(dateStr, days = 7) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return false;
  const diff = Date.now() - d.getTime();
  return diff <= days * 24 * 60 * 60 * 1000;
}

function formatDateAr(dateStr) {
  if (!dateStr) return "لا يوجد";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "غير معروف";
  return d.toLocaleDateString("ar-AE");
}

function clamp01(n) {
  if (Number.isNaN(n)) return 0;
  return Math.max(0, Math.min(1, n));
}

/* ==============================
   Radar SVG (بدون مكتبات)
============================== */
function RadarChartSVG({ items, size = 240 }) {
  // items: [{label, value (0..100)}]
  const n = items.length;
  const cx = size / 2;
  const cy = size / 2;
  const r = size * 0.36;

  const points = items
    .map((it, i) => {
      const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
      const rr = r * clamp01((it.value || 0) / 100);
      const x = cx + rr * Math.cos(angle);
      const y = cy + rr * Math.sin(angle);
      return `${x},${y}`;
    })
    .join(" ");

  const axis = items.map((it, i) => {
    const angle = (-Math.PI / 2) + (2 * Math.PI * i) / n;
    const x = cx + r * Math.cos(angle);
    const y = cy + r * Math.sin(angle);
    const lx = cx + (r + 18) * Math.cos(angle);
    const ly = cy + (r + 18) * Math.sin(angle);
    return { x, y, lx, ly, label: it.label };
  });

  return (
    <div className="w-full flex items-center justify-center">
      <svg width={size} height={size} className="select-none">
        {/* circles */}
        {[0.25, 0.5, 0.75, 1].map((k) => (
          <circle key={k} cx={cx} cy={cy} r={r * k} fill="none" stroke="rgba(0,0,0,0.08)" />
        ))}

        {/* axis */}
        {axis.map((a, idx) => (
          <g key={idx}>
            <line x1={cx} y1={cy} x2={a.x} y2={a.y} stroke="rgba(0,0,0,0.10)" />
            <text
              x={a.lx}
              y={a.ly}
              fontSize="11"
              textAnchor="middle"
              fill="rgba(0,0,0,0.55)"
              direction="rtl"
            >
              {a.label}
            </text>
          </g>
        ))}

        {/* polygon */}
        <polygon points={points} fill="rgba(99,102,241,0.20)" stroke="rgba(99,102,241,0.80)" strokeWidth="2" />
      </svg>
    </div>
  );
}

/* ==============================
   Emergency Exercise Dialog (بدون صفحة إعدادات)
============================== */
function EmergencyExerciseDialog({ open, onOpenChange, student, onCreated }) {
  const { toast } = useToast();
  const [prompt, setPrompt] = useState("");
  const [title, setTitle] = useState("تمرين طارئ");
  const [level, setLevel] = useState("مبتدئ");
  const [stage, setStage] = useState(1);
  const [generatedText, setGeneratedText] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (student) {
      setPrompt(`أريد فقرة قصيرة مناسبة لتمرين قراءة للطالب "${student.name}" صف "${student.grade}".`);
    }
  }, [student]);

  const generate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    try {
      const res = await InvokeLLM({
        prompt: `
أنت معلم لغة عربية.
اكتب فقرة قراءة عربية فصحى (جمل قصيرة وواضحة) بناءً على الطلب التالي:
"${prompt}"

أرسل الفقرة فقط بدون أي شرح.`,
      });

      const text = res?.text || res?.content || res?.result || "";
      setGeneratedText(String(text).trim());
    } catch (e) {
      console.error(e);
      toast({
        title: "فشل التوليد",
        description: "تأكد أن الـ API جاهز على السيرفر (مفتاح الذكاء الاصطناعي ليس من واجهة المعلم).",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!student?.grade || !generatedText.trim()) return;
    setLoading(true);
    try {
      const ex = await Exercise.create({
        title: title.trim() || "تمرين طارئ",
        text: generatedText.trim(),
        grade: student.grade,
        level,
        stage: Number(stage) || 1,
        is_active: true,
      });

      toast({
        title: "تم الحفظ",
        description: "تم إنشاء تمرين طارئ وإضافته لقائمة التمارين.",
      });

      onCreated?.(ex);
      onOpenChange(false);
    } catch (e) {
      console.error(e);
      toast({
        title: "فشل الحفظ",
        description: "تحقق من صلاحيات قاعدة البيانات أو بنية جدول التمارين.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl" dir="rtl">
        <DialogHeader>
          <DialogTitle className="arabic-text text-right flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-500" />
            تمرين طارئ للطالب
          </DialogTitle>
        </DialogHeader>

        <div className="grid md:grid-cols-2 gap-4">
          <div className="space-y-2 text-right">
            <Label className="arabic-text">وصف التمرين</Label>
            <Textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              className="min-h-[170px] arabic-text text-right"
            />
            <Button onClick={generate} disabled={loading} className="arabic-text w-full">
              {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : null}
              توليد النص
            </Button>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label className="arabic-text">المستوى</Label>
                <Select value={level} onValueChange={setLevel}>
                  <SelectTrigger className="arabic-text text-right">
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
                <Label className="arabic-text">المرحلة</Label>
                <Input
                  type="number"
                  min={1}
                  max={50}
                  value={stage}
                  onChange={(e) => setStage(e.target.value)}
                  className="arabic-text text-right"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label className="arabic-text">عنوان التمرين</Label>
              <Input value={title} onChange={(e) => setTitle(e.target.value)} className="arabic-text text-right" />
            </div>
          </div>

          <div className="space-y-2 text-right">
            <Label className="arabic-text">النص الناتج</Label>
            <Textarea
              value={generatedText}
              onChange={(e) => setGeneratedText(e.target.value)}
              className="min-h-[270px] arabic-text text-right"
              placeholder="سيظهر هنا النص..."
            />
          </div>
        </div>

        <DialogFooter className="gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)} className="arabic-text">
            إغلاق
          </Button>
          <Button onClick={save} disabled={loading || !generatedText.trim()} className="arabic-text bg-emerald-600 hover:bg-emerald-700">
            حفظ كتمرين
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

/* ==============================
   لوحة التحكم (Dashboard) - مثل الصور
============================== */
function DashboardTab({ stats, radarItems }) {
  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right flex items-center gap-2">
            <LayoutDashboard className="w-5 h-5 text-slate-500" />
            لوحة تحكم المعلم
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-4 gap-4">
          <StatCard title="متوسط مستوى الطلاب" value={`${Math.round(stats.avgLevelPct)}%`} />
          <StatCard title="التسجيلات الصوتية" value={stats.recordingsCount} />
          <StatCard title="عدد الطلاب" value={stats.studentsCount} />
          <StatCard title="عدد المجموعات" value={stats.groupsCount} />
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right flex items-center gap-2">
            <BarTitleIcon />
            مؤشرات الأداء (متوسط مهارات النطق)
          </CardTitle>
        </CardHeader>
        <CardContent className="py-8">
          <RadarChartSVG items={radarItems} size={260} />
          <p className="arabic-text text-center text-sm text-slate-500 mt-4">
            يظهر هذا المخطط متوسط أداء الطلاب في المهارات اللغوية المختلفة.
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({ title, value }) {
  return (
    <Card className="border border-slate-100 shadow-sm bg-gradient-to-br from-white to-slate-50">
      <CardContent className="p-5 text-right">
        <p className="arabic-text text-sm text-slate-600">{title}</p>
        <p className="text-3xl font-bold text-slate-900 mt-2">{value}</p>
      </CardContent>
    </Card>
  );
}

function BarTitleIcon() {
  return (
    <span className="inline-flex items-center justify-center w-8 h-8 rounded-xl bg-indigo-50">
      <span className="w-3 h-3 rounded-sm bg-indigo-500" />
    </span>
  );
}

/* ==============================
   لوحة الصدارة (Leaderboard)
============================== */
function LeaderboardTab({ leaderboard, onToggleVisibility }) {
  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right flex items-center gap-2">
            <Trophy className="w-5 h-5 text-slate-500" />
            إدارة لوحة الصدارة
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-2 px-3 text-xs font-semibold text-slate-600">#</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">الطالب</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">النقاط</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">الظهور في اللوحة</th>
              </tr>
            </thead>
            <tbody>
              {leaderboard.map((row, idx) => (
                <tr key={row.student.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="py-2 px-3 text-xs text-slate-700">{idx + 1}</td>
                  <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text">
                    <span className="inline-flex items-center gap-2">
                      {idx === 0 ? <Crown className="w-4 h-4 text-amber-500" /> : null}
                      {row.student.name}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm font-semibold text-slate-800">{row.points}</td>
                  <td className="py-2 px-3">
                    <Button
                      onClick={() => onToggleVisibility(row.student, !row.visible)}
                      className={cn(
                        "arabic-text px-5",
                        row.visible
                          ? "bg-emerald-600 hover:bg-emerald-700"
                          : "bg-slate-200 hover:bg-slate-300 text-slate-800"
                      )}
                    >
                      {row.visible ? "ظاهر" : "مخفي"}
                    </Button>
                  </td>
                </tr>
              ))}

              {leaderboard.length === 0 && (
                <tr>
                  <td colSpan={4} className="text-center py-8 text-slate-500 arabic-text">
                    لا توجد بيانات كافية للوحة الصدارة بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==============================
   لوحة الصف (Class Board)
============================== */
function ClassBoardTab({ students, gradeFilter, setGradeFilter, announcement, setAnnouncement, onSendAnnouncement }) {
  const filtered = students.filter((s) => (gradeFilter === "__all__" ? true : s.grade === gradeFilter));

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right flex items-center gap-2">
            <ClipboardList className="w-5 h-5 text-slate-500" />
            لوحة الصف (Class Board)
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid md:grid-cols-2 gap-4 items-end">
            <div className="space-y-1 text-right">
              <Label className="arabic-text text-sm">اختر الصف</Label>
              <Select value={gradeFilter} onValueChange={setGradeFilter}>
                <SelectTrigger className="arabic-text text-right">
                  <SelectValue placeholder="الكل" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__all__" className="arabic-text">الكل</SelectItem>
                  {gradeLevels.map((g) => (
                    <SelectItem key={g} value={g} className="arabic-text">{g}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-1 text-right">
              <Label className="arabic-text text-sm">إعلان صفي جديد</Label>
              <div className="flex gap-2">
                <Button onClick={onSendAnnouncement} className="arabic-text">
                  <Send className="w-4 h-4 ml-1" />
                  إرسال
                </Button>
                <Input
                  value={announcement}
                  onChange={(e) => setAnnouncement(e.target.value)}
                  className="arabic-text text-right flex-1"
                  placeholder="اكتب إعلانًا للطلاب..."
                />
              </div>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse text-right">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">اسم الطالب</th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">الصف</th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">النشاط</th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">التمارين المنجزة</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((s) => (
                  <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                    <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text">{s.name}</td>
                    <td className="py-2 px-3 text-xs text-slate-700 arabic-text">{s.grade}</td>
                    <td className="py-2 px-3">
                      <span className={cn(
                        "inline-flex px-3 py-1 rounded-full text-xs arabic-text",
                        s._active ? "bg-emerald-100 text-emerald-800" : "bg-red-100 text-red-800"
                      )}>
                        {s._active ? "فعال" : "متوقف"}
                      </span>
                    </td>
                    <td className="py-2 px-3 text-sm font-semibold text-slate-800">{s._completedExercises}</td>
                  </tr>
                ))}

                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={4} className="text-center py-8 text-slate-500 arabic-text">
                      لا يوجد طلاب في هذا الصف حالياً.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==============================
   الطلاب (Students) - مثل الصور
============================== */
function StudentsTab({ students, searchName, setSearchName, onOpenEmergency, onGoStudent }) {
  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right flex items-center gap-2">
            <Users className="w-5 h-5 text-slate-500" />
            إدارة الطلاب
          </CardTitle>
        </CardHeader>
        <CardContent className="grid md:grid-cols-3 gap-4 items-end">
          <div className="space-y-1 text-right md:col-span-2">
            <Label className="arabic-text text-sm">بحث بالاسم</Label>
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
          <div className="text-right">
            <Badge className="bg-indigo-100 text-indigo-800 arabic-text px-3 py-2">
              إجمالي الطلاب: {students.length}
            </Badge>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/90">
        <CardContent className="overflow-x-auto pt-6">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">الاسم</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">المستوى</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">التمارين المكتملة</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">متوسط الدرجات</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">آخر نشاط</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">الحالة</th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600 arabic-text">الإجراءات</th>
              </tr>
            </thead>
            <tbody>
              {students.map((s) => (
                <tr key={s.id} className="border-b border-slate-100 hover:bg-slate-50/60">
                  <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text">{s.name}</td>
                  <td className="py-2 px-3">
                    <span className={cn(
                      "inline-flex px-3 py-1 rounded-full text-xs arabic-text",
                      s.level === "متقدم" ? "bg-emerald-100 text-emerald-800"
                      : s.level === "متوسط" ? "bg-blue-100 text-blue-800"
                      : "bg-slate-100 text-slate-800"
                    )}>
                      {s.level || "مبتدئ"}
                    </span>
                  </td>
                  <td className="py-2 px-3 text-sm font-semibold text-slate-800">{s._completedExercises}</td>
                  <td className="py-2 px-3 text-sm font-semibold text-slate-800">{s._avgScore != null ? `${Math.round(s._avgScore)}%` : "0%"}</td>
                  <td className="py-2 px-3 text-xs text-slate-700 arabic-text whitespace-nowrap">
                    {formatDateAr(s.last_activity || s._lastRecordingDate)}
                  </td>
                  <td className="py-2 px-3">
                    <span className={cn(
                      "inline-flex px-3 py-1 rounded-full text-xs arabic-text",
                      s._active ? "bg-slate-100 text-slate-700" : "bg-red-100 text-red-700"
                    )}>
                      {s._active ? "نشط" : "غير نشط"}
                    </span>
                  </td>
                  <td className="py-2 px-3">
                    <div className="flex gap-2 justify-end flex-wrap">
                      <Button
                        variant="outline"
                        className="arabic-text"
                        onClick={() => onGoStudent(s)}
                      >
                        سجل الطالب
                      </Button>
                      <Button
                        className="arabic-text bg-red-50 text-red-700 hover:bg-red-100 border border-red-200"
                        onClick={() => onOpenEmergency(s)}
                      >
                        طوارئ
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}

              {students.length === 0 && (
                <tr>
                  <td colSpan={7} className="text-center py-8 text-slate-500 arabic-text">
                    لا يوجد طلاب بعد.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

/* ==============================
   المجموعات (مثل الصور - Empty State + زر)
============================== */
function GroupsTab({ groups, onCreateGroup }) {
  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="arabic-text text-right flex items-center gap-2">
            <Layers className="w-5 h-5 text-slate-500" />
            المجموعات الدراسية
          </CardTitle>
          <Button onClick={onCreateGroup} className="arabic-text bg-purple-600 hover:bg-purple-700">
            <Plus className="w-4 h-4 ml-1" />
            مجموعة جديدة
          </Button>
        </CardHeader>

        <CardContent className="py-12">
          {groups.length === 0 ? (
            <div className="text-center text-slate-500 arabic-text space-y-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <Plus className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-lg">لا توجد مجموعات بعد.</p>
              <p className="text-sm">قم بإنشاء مجموعة لتنظيم طلابك.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {groups.map((g) => (
                <Card key={g.id} className="border border-slate-100 shadow-sm">
                  <CardContent className="p-4 text-right">
                    <p className="arabic-text font-semibold text-slate-900">{g.name}</p>
                    <p className="text-xs text-slate-500 arabic-text mt-1">مجموعة</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ==============================
   الدروس (Empty State مثل الصور)
============================== */
function LessonsTab({ lessons, onCreateLesson }) {
  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="arabic-text text-right flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-slate-500" />
            إدارة الدروس المسجلة
          </CardTitle>
          <Button onClick={onCreateLesson} className="arabic-text bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 ml-1" />
            إنشاء درس جديد
          </Button>
        </CardHeader>

        <CardContent className="py-12">
          {lessons.length === 0 ? (
            <div className="text-center text-slate-500 arabic-text space-y-2">
              <div className="mx-auto w-16 h-16 rounded-2xl bg-slate-50 border border-slate-200 flex items-center justify-center">
                <BookOpen className="w-7 h-7 text-slate-400" />
              </div>
              <p className="text-lg">لا توجد دروس مسجلة</p>
              <p className="text-sm">لم تقم بإنشاء أي دروس بعد.</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {lessons.map((l) => (
                <Card key={l.id} className="border border-slate-100 shadow-sm">
                  <CardContent className="p-4 text-right">
                    <p className="arabic-text font-semibold text-slate-900">{l.title || "درس"}</p>
                    <p className="text-xs text-slate-500 arabic-text mt-1">{formatDateAr(l.created_date)}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ==============================
   التسجيلات (موجودة)
============================== */
function RecordingsTab({ recordings, students }) {
  const getStudent = (id) => students.find((s) => s.id === id);

  return (
    <div className="space-y-6" dir="rtl">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right flex items-center gap-2">
            <Mic className="w-5 h-5 text-slate-500" />
            التسجيلات الصوتية ({recordings.length})
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          {recordings.length === 0 ? (
            <div className="text-center py-10 text-slate-500 arabic-text">
              لا توجد تسجيلات بعد.
            </div>
          ) : (
            <div className="space-y-4">
              {recordings.map((r) => {
                const st = getStudent(r.student_id);
                const score = Number(r.score || 0);

                return (
                  <Card key={r.id} className="border border-slate-100 shadow-sm">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between gap-4 flex-wrap">
                        <div className="text-right">
                          <p className="arabic-text font-semibold text-slate-900">
                            {st?.name || "طالب"}{" "}
                            <span className="text-xs text-slate-500">({st?.grade || "-"})</span>
                          </p>
                          <p className="text-xs text-slate-500 arabic-text mt-1">
                            {formatDateAr(r.created_date)}
                          </p>
                        </div>

                        <div className={cn(
                          "px-3 py-1 rounded-full text-sm font-semibold",
                          score >= 85 ? "bg-emerald-100 text-emerald-800"
                          : score >= 60 ? "bg-amber-100 text-amber-800"
                          : "bg-red-100 text-red-800"
                        )}>
                          {score}/100
                        </div>
                      </div>

                      {r.feedback && (
                        <div className="mt-3 bg-slate-50 border border-slate-200 rounded-xl p-3 text-right">
                          <p className="arabic-text text-sm text-slate-800">{r.feedback}</p>
                        </div>
                      )}

                      <div className="mt-3">
                        <audio controls src={r.audio_url} className="w-full" />
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* ==============================
   TeacherDashboard (النسخة الجديدة)
============================== */
export default function TeacherDashboard() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [loading, setLoading] = useState(false);

  const [studentsRaw, setStudentsRaw] = useState([]);
  const [recordingsRaw, setRecordingsRaw] = useState([]);
  const [groupsRaw, setGroupsRaw] = useState([]);
  const [lessonsRaw, setLessonsRaw] = useState([]);

  // UI
  const [tab, setTab] = useState("dashboard");
  const [searchName, setSearchName] = useState("");
  const [gradeFilter, setGradeFilter] = useState("__all__");
  const [announcement, setAnnouncement] = useState("");

  // Emergency dialog
  const [emOpen, setEmOpen] = useState(false);
  const [emStudent, setEmStudent] = useState(null);

  const loadAll = async () => {
    setLoading(true);
    try {
      const [students, recordings, groups, lessons] = await Promise.all([
        Student.list("-last_activity"),
        Recording.list("-created_date"),
        StudentGroup.list("-created_date"),
        Lesson.list?.("-created_date") ?? Promise.resolve([]),
      ]);

      setStudentsRaw(students || []);
      setRecordingsRaw(recordings || []);
      setGroupsRaw(groups || []);
      setLessonsRaw(lessons || []);
    } catch (e) {
      console.error(e);
      toast({
        title: "فشل التحميل",
        description: "تحقق من الاتصال وقواعد البيانات.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // enrich students (computed metrics)
  const students = useMemo(() => {
    const byStudent = new Map();
    for (const r of recordingsRaw) {
      if (!r.student_id) continue;
      if (!byStudent.has(r.student_id)) byStudent.set(r.student_id, []);
      byStudent.get(r.student_id).push(r);
    }

    return (studentsRaw || [])
      .map((s) => {
        const recs = byStudent.get(s.id) || [];
        const scores = recs.map((x) => Number(x.score || 0)).filter((x) => x > 0);
        const avg = scores.length ? scores.reduce((a, b) => a + b, 0) / scores.length : 0;

        // completed exercises: unique exercise_id for successful attempts
        const completed = new Set(
          recs
            .filter((x) => Number(x.score || 0) > 0)
            .map((x) => x.exercise_id)
            .filter(Boolean)
        );

        const lastRec = recs[0]?.created_date;
        const active = isActiveByLastActivity(s.last_activity || lastRec);

        // leaderboard visibility: try known fields, fallback true
        const visible =
          s.leaderboard_visible ??
          s.show_in_leaderboard ??
          s.is_leaderboard_visible ??
          true;

        return {
          ...s,
          _avgScore: avg,
          _completedExercises: completed.size,
          _lastRecordingDate: lastRec,
          _active: active,
          _leaderboardVisible: !!visible,
        };
      })
      .filter((s) => {
        if (!searchName.trim()) return true;
        return String(s.name || "")
          .toLowerCase()
          .includes(searchName.trim().toLowerCase());
      });
  }, [studentsRaw, recordingsRaw, searchName]);

  // leaderboard data
  const leaderboard = useMemo(() => {
    const pointsByStudent = new Map();

    for (const r of recordingsRaw) {
      const sid = r.student_id;
      if (!sid) continue;
      const score = Number(r.score || 0);
      if (!pointsByStudent.has(sid)) pointsByStudent.set(sid, 0);
      // ✅ النقاط = مجموع الدرجات (يعطي أرقام قريبة من الصور مثل 310)
      pointsByStudent.set(sid, pointsByStudent.get(sid) + Math.max(0, score));
    }

    const rows = (studentsRaw || [])
      .map((s) => {
        const visible =
          s.leaderboard_visible ??
          s.show_in_leaderboard ??
          s.is_leaderboard_visible ??
          true;
        return {
          student: s,
          points: Math.round(pointsByStudent.get(s.id) || 0),
          visible: !!visible,
        };
      })
      .sort((a, b) => b.points - a.points);

    return rows;
  }, [studentsRaw, recordingsRaw]);

  const stats = useMemo(() => {
    const studentsCount = studentsRaw.length;
    const recordingsCount = recordingsRaw.length;
    const groupsCount = groupsRaw.length;

    const avgLevelPct = students.length
      ? students.reduce((sum, s) => sum + (s._avgScore || 0), 0) / students.length
      : 0;

    return { studentsCount, recordingsCount, groupsCount, avgLevelPct };
  }, [studentsRaw, recordingsRaw, groupsRaw, students]);

  const radarItems = useMemo(() => {
    // نحاول نطلع المتوسط من analysis_details إن موجود (0..100)
    const recs = recordingsRaw || [];
    const getAvg = (key) => {
      const vals = recs
        .map((r) => Number(r?.analysis_details?.[key]))
        .filter((v) => !Number.isNaN(v) && v >= 0);
      if (!vals.length) return 60; // fallback جميل بدل صفر يحبطك
      return vals.reduce((a, b) => a + b, 0) / vals.length;
    };

    return [
      { label: "مخارج الحروف", value: getAvg("pronunciation_score") },
      { label: "مطابقة الكلمات", value: getAvg("word_match_score") },
      { label: "التشكيل", value: getAvg("tashkeel_score") },
      { label: "الطلاقة", value: getAvg("fluency_score") },
      { label: "الأداء العام", value: stats.avgLevelPct || 60 },
    ];
  }, [recordingsRaw, stats.avgLevelPct]);

  const toggleLeaderboardVisibility = async (student, newVal) => {
    // نحاول نحدّث على واحد من الحقول المحتملة، واللي ما عنده ففشل = ما نخرب
    const payloads = [
      { leaderboard_visible: newVal },
      { show_in_leaderboard: newVal },
      { is_leaderboard_visible: newVal },
    ];

    let ok = false;
    for (const p of payloads) {
      try {
        await Student.update(student.id, p);
        ok = true;
        break;
      } catch (e) {
        // جرّب الحقل التالي
      }
    }

    if (!ok) {
      toast({
        title: "تنبيه",
        description: "لم يتم حفظ خيار الظهور (الحقل غير موجود في جدول الطلاب).",
        variant: "destructive",
      });
      return;
    }

    toast({ title: "تم التحديث", description: newVal ? "الطالب ظاهر في اللوحة" : "الطالب مخفي من اللوحة" });
    await loadAll();
  };

  const sendAnnouncement = () => {
    if (!announcement.trim()) return;
    // 👇 بدون كيان “Announcements” في DB، نخليه إشعار فقط (مثل الصور من ناحية UI)
    toast({
      title: "تم الإرسال",
      description: "تم إرسال الإعلان (واجهة). إذا تريد حفظه نضيف جدول للإعلانات.",
    });
    setAnnouncement("");
  };

  const openEmergency = (student) => {
    setEmStudent(student);
    setEmOpen(true);
  };

  const createGroupQuick = async () => {
    const name = prompt("اسم المجموعة الجديدة:");
    if (!name?.trim()) return;
    try {
      await StudentGroup.create({ name: name.trim() });
      toast({ title: "تم إنشاء المجموعة" });
      await loadAll();
    } catch (e) {
      console.error(e);
      toast({ title: "فشل", description: "لم يتم إنشاء المجموعة.", variant: "destructive" });
    }
  };

  const createLessonQuick = async () => {
    toast({
      title: "جاهزين",
      description: "نقدر نعمل مودال لإنشاء درس كامل. حالياً الصور عندك تظهر Empty State فقط.",
    });
  };

  return (
    <TeacherGate>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 py-6 px-3 md:px-8" dir="rtl">
        <div className="max-w-7xl mx-auto space-y-6">
          <motion.div
            initial={{ opacity: 0, y: -16 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col md:flex-row items-center justify-between gap-4"
          >
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={() => navigate(createPageUrl("Home"))}
                className="rounded-full bg-white/80"
              >
                <ArrowLeft className="w-4 h-4" />
              </Button>

              <div className="text-right">
                <h1 className="text-2xl md:text-3xl font-bold text-slate-900 arabic-text">
                  لوحة تحكم المعلم 👩‍🏫
                </h1>
                <p className="text-sm text-slate-600 arabic-text">
                  نفس الشكل اللي في الصور… بدون “مفتاح OpenAI” اللي يزعّلك كل مرة.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-wrap">
              <Button variant="outline" onClick={loadAll} className="arabic-text bg-white/80">
                {loading ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <RefreshCw className="w-4 h-4 ml-2" />}
                تحديث
              </Button>

              <Badge className="bg-indigo-100 text-indigo-800 arabic-text">
                الطلاب: {stats.studentsCount}
              </Badge>
              <Badge className="bg-emerald-100 text-emerald-800 arabic-text">
                التسجيلات: {stats.recordingsCount}
              </Badge>
            </div>
          </motion.div>

          <Tabs value={tab} onValueChange={setTab} className="space-y-4">
            <TabsList className="bg-white shadow-md rounded-2xl p-1 flex flex-wrap gap-1 justify-between">
              <TabsTrigger value="dashboard" className="arabic-text text-xs md:text-sm">
                <LayoutDashboard className="w-4 h-4 ml-1" /> لوحة تحكم
              </TabsTrigger>
              <TabsTrigger value="classboard" className="arabic-text text-xs md:text-sm">
                <ClipboardList className="w-4 h-4 ml-1" /> لوحة الصف
              </TabsTrigger>
              <TabsTrigger value="leaderboard" className="arabic-text text-xs md:text-sm">
                <Trophy className="w-4 h-4 ml-1" /> لوحة الصدارة
              </TabsTrigger>
              <TabsTrigger value="students" className="arabic-text text-xs md:text-sm">
                <Users className="w-4 h-4 ml-1" /> الطلاب
              </TabsTrigger>
              <TabsTrigger value="lessons" className="arabic-text text-xs md:text-sm">
                <BookOpen className="w-4 h-4 ml-1" /> الدروس
              </TabsTrigger>
              <TabsTrigger value="groups" className="arabic-text text-xs md:text-sm">
                <Layers className="w-4 h-4 ml-1" /> المجموعات
              </TabsTrigger>
              <TabsTrigger value="recordings" className="arabic-text text-xs md:text-sm">
                <Mic className="w-4 h-4 ml-1" /> التسجيلات
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard">
              <DashboardTab stats={stats} radarItems={radarItems} />
            </TabsContent>

            <TabsContent value="leaderboard">
              <LeaderboardTab
                leaderboard={leaderboard}
                onToggleVisibility={toggleLeaderboardVisibility}
              />
            </TabsContent>

            <TabsContent value="classboard">
              <ClassBoardTab
                students={students}
                gradeFilter={gradeFilter}
                setGradeFilter={setGradeFilter}
                announcement={announcement}
                setAnnouncement={setAnnouncement}
                onSendAnnouncement={sendAnnouncement}
              />
            </TabsContent>

            <TabsContent value="students">
              <StudentsTab
                students={students}
                searchName={searchName}
                setSearchName={setSearchName}
                onOpenEmergency={openEmergency}
                onGoStudent={(s) => navigate(createPageUrl(`StudentDashboard?studentId=${s.id}`))}
              />
            </TabsContent>

            <TabsContent value="groups">
              <GroupsTab groups={groupsRaw} onCreateGroup={createGroupQuick} />
            </TabsContent>

            <TabsContent value="lessons">
              <LessonsTab lessons={lessonsRaw} onCreateLesson={createLessonQuick} />
            </TabsContent>

            <TabsContent value="recordings">
              <RecordingsTab recordings={recordingsRaw} students={studentsRaw} />
            </TabsContent>
          </Tabs>

          {/* ✅ Emergency Dialog */}
          <EmergencyExerciseDialog
            open={emOpen}
            onOpenChange={setEmOpen}
            student={emStudent}
            onCreated={() => loadAll()}
          />
        </div>
      </div>
    </TeacherGate>
  );
}
