import React, { useEffect, useMemo, useState } from "react";
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
  AlertTriangle,
  ArrowLeft,
  BarChart3,
  BookOpen,
  CheckCircle,
  Filter,
  GraduationCap,
  Loader2,
  Megaphone,
  Mic,
  Plus,
  RefreshCw,
  Search,
  Settings,
  Star,
  Trophy,
  Users,
  Volume2,
  Trash2,
  ListChecks,
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

/* =========================
   ✅ بوابة دخول المعلم (حماية بسيطة بكلمة مرور)
   ========================= */
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
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100 p-4">
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
              <p className="text-sm text-red-600 arabic-text text-right">
                {error}
              </p>
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

/* =========================
   ✅ هيدر علوي بشكل قريب من الصور
   ========================= */
function HeroHeader({ onBack }) {
  const [hideImg, setHideImg] = useState(false);

  return (
    <div className="rounded-2xl overflow-hidden shadow-lg bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-500">
      <div className="px-4 py-5 md:px-8 md:py-7 flex items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="icon"
            onClick={onBack}
            className="rounded-full bg-white/90 hover:bg-white"
            title="رجوع"
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>

          <div className="text-right">
            <div className="text-white/95 arabic-text font-bold text-xl md:text-2xl">
              منصة تعلم القراءة في اللغة العربية
            </div>
            <div className="text-white/80 arabic-text text-xs md:text-sm">
              لوحة تحكم المعلم
            </div>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {!hideImg ? (
            <img
              src="/logo.png"
              alt="logo"
              className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/90 p-1"
              onError={() => setHideImg(true)}
            />
          ) : (
            <div className="w-12 h-12 md:w-14 md:h-14 rounded-xl bg-white/90 flex items-center justify-center">
              <GraduationCap className="w-6 h-6 text-indigo-700" />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

/* =========================
   ✅ مخطط رادار بسيط (SVG) بدون مكتبات
   ========================= */
function RadarChartCard({ values, labels, title, subtitle }) {
  // values: [0..100]
  const size = 260;
  const cx = size / 2;
  const cy = size / 2;
  const r = 90;

  const points = useMemo(() => {
    const n = Math.max(labels.length, 3);
    return labels.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const v = Math.max(0, Math.min(100, values[i] ?? 0)) / 100;
      const x = cx + Math.cos(angle) * r * v;
      const y = cy + Math.sin(angle) * r * v;
      return `${x},${y}`;
    });
  }, [labels, values]);

  const gridPolys = [0.25, 0.5, 0.75, 1].map((k) => {
    const n = Math.max(labels.length, 3);
    const pts = labels.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + Math.cos(angle) * r * k;
      const y = cy + Math.sin(angle) * r * k;
      return `${x},${y}`;
    });
    return pts.join(" ");
  });

  const axes = useMemo(() => {
    const n = Math.max(labels.length, 3);
    return labels.map((_, i) => {
      const angle = (Math.PI * 2 * i) / n - Math.PI / 2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      return { x, y };
    });
  }, [labels]);

  return (
    <Card className="border-0 shadow-lg bg-white/90">
      <CardHeader>
        <CardTitle className="arabic-text text-right text-lg flex items-center justify-between">
          <span className="flex items-center gap-2">
            <BarChart3 className="w-5 h-5 text-slate-500" />
            {title}
          </span>
        </CardTitle>
        {subtitle ? (
          <p className="arabic-text text-right text-xs text-slate-500 mt-1">
            {subtitle}
          </p>
        ) : null}
      </CardHeader>

      <CardContent className="flex flex-col items-center">
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* grid */}
          {gridPolys.map((p, idx) => (
            <polygon
              key={idx}
              points={p}
              fill="none"
              stroke="rgba(15,23,42,0.15)"
              strokeWidth="1"
            />
          ))}

          {/* axes */}
          {axes.map((a, idx) => (
            <line
              key={idx}
              x1={cx}
              y1={cy}
              x2={a.x}
              y2={a.y}
              stroke="rgba(15,23,42,0.15)"
              strokeWidth="1"
            />
          ))}

          {/* value poly */}
          <polygon
            points={points.join(" ")}
            fill="rgba(99,102,241,0.25)"
            stroke="rgba(99,102,241,0.85)"
            strokeWidth="2"
          />
        </svg>

        <div className="w-full mt-3 grid grid-cols-2 md:grid-cols-3 gap-2">
          {labels.map((lab, i) => (
            <div
              key={lab}
              className="text-xs arabic-text text-right bg-slate-50 border border-slate-100 rounded-lg px-2 py-2"
            >
              <div className="text-slate-600">{lab}</div>
              <div className="font-bold text-slate-900">
                {Math.round(values[i] ?? 0)}%
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

/* =========================
   ✅ بطاقات إحصائيات أعلى الصفحة (مثل الصور)
   ========================= */
function StatsCards({ stats }) {
  const cards = [
    {
      title: "نسبة التحسن",
      value: stats.improvementPct != null ? `${stats.improvementPct}%` : "-",
      icon: <Star className="w-5 h-5 text-white" />,
      bg: "from-purple-600 to-indigo-600",
    },
    {
      title: "التسجيلات الصوتية",
      value: stats.totalRecordings ?? 0,
      icon: <Mic className="w-5 h-5 text-white" />,
      bg: "from-orange-500 to-amber-500",
    },
    {
      title: "الصفوف/المجموعات",
      value: stats.totalGroups ?? 0,
      icon: <Users className="w-5 h-5 text-white" />,
      bg: "from-emerald-500 to-teal-500",
    },
    {
      title: "إجمالي الطلاب",
      value: stats.totalStudents ?? 0,
      icon: <Users className="w-5 h-5 text-white" />,
      bg: "from-sky-600 to-blue-600",
    },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
      {cards.map((c) => (
        <div
          key={c.title}
          className={cn(
            "rounded-2xl p-4 text-white shadow-lg bg-gradient-to-r",
            c.bg
          )}
        >
          <div className="flex items-center justify-between">
            <div className="text-right">
              <div className="arabic-text text-xs text-white/90">{c.title}</div>
              <div className="arabic-text text-2xl font-bold">{c.value}</div>
            </div>
            <div className="w-10 h-10 rounded-2xl bg-white/15 flex items-center justify-center">
              {c.icon}
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}

/* =========================
   ✅ إعدادات (نفس وظيفتك) لكن بشكل أقرب للصور
   ========================= */
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
          description:
            "OpenAI API Key for audio transcription and analysis (teacher dashboard)",
        });
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (e) {
      console.error("Failed to save settings", e);
      alert("حدث خطأ أثناء حفظ الإعدادات");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Settings className="w-5 h-5 text-slate-500" />
              إعدادات الذكاء الاصطناعي
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-right arabic-text text-sm">
            <div className="font-semibold text-amber-800 mb-1 flex items-center gap-2 justify-end">
              <AlertTriangle className="w-4 h-4" />
              هام جدًا لضمان عمل التحليل
            </div>
            <div className="text-amber-700">
              أدخل مفتاح OpenAI الخاص بك (Your Own Key) لضمان نتائج دقيقة. المفاتيح
              غير الصحيحة أو المقيّدة ستسبب توقف ميزات الذكاء الاصطناعي.
            </div>
          </div>

          <div className="flex flex-col md:flex-row gap-3 md:items-end">
            <div className="flex-1 space-y-2">
              <Label className="arabic-text text-right block text-slate-700">
                OpenAI API Key (sk-...)
              </Label>
              <Input
                type="password"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="font-mono text-sm"
                placeholder="sk-..."
                autoComplete="off"
              />
            </div>

            <div className="md:w-40">
              <Button
                onClick={handleSave}
                disabled={isLoading}
                className="arabic-text w-full"
              >
                {isLoading && <Loader2 className="w-4 h-4 ml-2 animate-spin" />}
                حفظ
              </Button>
            </div>
          </div>

          {saved && (
            <div className="arabic-text text-right text-xs text-green-600">
              ✅ تم حفظ المفتاح بنجاح.
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   ✅ لوحة الصدارة (بدون كسر قواعد البيانات)
   - إذا كان عندك field show_in_leaderboard في Student سيتم حفظه.
   - إذا غير موجود: نخليه محلي (localStorage) فقط.
   ========================= */
function LeaderboardTab({ students }) {
  const { toast } = useToast();

  const localKey = "leaderboard_visibility_map_v1";
  const [localMap, setLocalMap] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(localKey) || "{}");
    } catch {
      return {};
    }
  });

  const hasServerField = useMemo(() => {
    const s0 = students?.[0];
    return s0 && Object.prototype.hasOwnProperty.call(s0, "show_in_leaderboard");
  }, [students]);

  const sorted = useMemo(() => {
    const arr = [...(students || [])];
    // ترتيب بنقاط: total_exercises ثم average_score
    arr.sort((a, b) => {
      const ap = (a.total_exercises || 0) * 10 + (a.average_score || 0);
      const bp = (b.total_exercises || 0) * 10 + (b.average_score || 0);
      return bp - ap;
    });
    return arr;
  }, [students]);

  const isVisible = (s) => {
    if (hasServerField) return !!s.show_in_leaderboard;
    return localMap[s.id] !== false; // default true
  };

  const toggleVisible = async (s) => {
    const next = !isVisible(s);

    if (hasServerField) {
      try {
        await Student.update(s.id, { show_in_leaderboard: next });
        toast({
          title: "تم التحديث",
          description: next ? "تم إظهار الطالب في لوحة الصدارة" : "تم إخفاء الطالب من لوحة الصدارة",
        });
      } catch (e) {
        console.error("Leaderboard toggle failed", e);
        toast({
          title: "تعذر الحفظ",
          description:
            "يبدو أن قاعدة البيانات لا تدعم هذا الحقل. سيتم حفظه محليًا فقط.",
          variant: "destructive",
        });
        // fallback local
        const nm = { ...localMap, [s.id]: next };
        setLocalMap(nm);
        localStorage.setItem(localKey, JSON.stringify(nm));
      }
      return;
    }

    const nm = { ...localMap, [s.id]: next };
    setLocalMap(nm);
    localStorage.setItem(localKey, JSON.stringify(nm));
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Trophy className="w-5 h-5 text-slate-500" />
              إدارة لوحة الصدارة
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="overflow-x-auto">
          <table className="w-full border-collapse text-right">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                  #
                </th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                  الطالب
                </th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                  النقاط
                </th>
                <th className="py-2 px-3 text-xs font-semibold text-slate-600">
                  الظهور في اللوحة
                </th>
              </tr>
            </thead>
            <tbody>
              {sorted.map((s, idx) => {
                const points =
                  (s.total_exercises || 0) * 10 + (s.average_score || 0);
                const visible = isVisible(s);

                return (
                  <tr
                    key={s.id}
                    className="border-b border-slate-100 hover:bg-slate-50/60"
                  >
                    <td className="py-2 px-3 text-xs text-slate-600">
                      #{idx + 1}
                    </td>
                    <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text">
                      {s.name || "—"}
                    </td>
                    <td className="py-2 px-3 text-xs text-slate-700">
                      {points}
                    </td>
                    <td className="py-2 px-3">
                      <Button
                        size="sm"
                        variant={visible ? "default" : "secondary"}
                        className={cn(
                          "arabic-text text-xs",
                          visible ? "bg-emerald-600 hover:bg-emerald-700" : ""
                        )}
                        onClick={() => toggleVisible(s)}
                      >
                        {visible ? "✅ ظاهر" : "🚫 مخفي"}
                      </Button>
                    </td>
                  </tr>
                );
              })}

              {sorted.length === 0 && (
                <tr>
                  <td
                    colSpan={4}
                    className="text-center py-6 text-slate-500 arabic-text"
                  >
                    لا توجد بيانات طلاب.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {!hasServerField && (
            <div className="mt-3 text-xs arabic-text text-right text-slate-500">
              ملاحظة: إعدادات “الظهور” محفوظة محليًا فقط (لأنه لا يوجد حقل
              show_in_leaderboard في جدول الطلاب).
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   ✅ لوحة الصف (إعلانات بسيطة محلية)
   ========================= */
function ClassBoardTab() {
  const storeKey = "class_board_posts_v1";
  const [text, setText] = useState("");
  const [posts, setPosts] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(storeKey) || "[]");
    } catch {
      return [];
    }
  });

  const addPost = () => {
    const t = text.trim();
    if (!t) return;
    const p = {
      id: `${Date.now()}`,
      text: t,
      createdAt: new Date().toISOString(),
    };
    const next = [p, ...posts];
    setPosts(next);
    localStorage.setItem(storeKey, JSON.stringify(next));
    setText("");
  };

  const removePost = (id) => {
    const next = posts.filter((p) => p.id !== id);
    setPosts(next);
    localStorage.setItem(storeKey, JSON.stringify(next));
  };

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <Megaphone className="w-5 h-5 text-slate-500" />
              لوحة الصف
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="space-y-4">
          <div className="rounded-xl border border-slate-200 bg-slate-50 p-4">
            <div className="arabic-text text-right text-sm font-semibold text-slate-800 mb-2">
              📣 إعلان صفّي جديد
            </div>
            <div className="flex gap-2">
              <Button onClick={addPost} className="arabic-text">
                إرسال
              </Button>
              <Input
                value={text}
                onChange={(e) => setText(e.target.value)}
                className="text-right arabic-text"
                placeholder="اكتب إعلانًا للطلاب وأولياء الأمور..."
              />
            </div>
          </div>

          <div className="space-y-3">
            {posts.length === 0 ? (
              <div className="text-center py-8 text-slate-500 arabic-text">
                لا توجد إعلانات بعد.
              </div>
            ) : (
              posts.map((p) => (
                <div
                  key={p.id}
                  className="rounded-xl border border-slate-200 bg-white p-4 flex items-start justify-between gap-3"
                >
                  <div className="text-right">
                    <div className="arabic-text text-sm text-slate-900">
                      {p.text}
                    </div>
                    <div className="text-xs text-slate-500 mt-1">
                      {new Date(p.createdAt).toLocaleString("ar-AE")}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => removePost(p.id)}
                    title="حذف"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   ✅ تبويب الدروس (واجهة مثل الصور + زر إنشاء درس)
   - لا نفترض سكيمة Lesson حتى لا نكسر شيئًا.
   ========================= */
function LessonsTab() {
  const navigate = useNavigate();

  return (
    <div className="space-y-4">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center justify-between">
            <span className="flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-slate-500" />
              إدارة الدروس المسجلة
            </span>
          </CardTitle>
        </CardHeader>

        <CardContent className="text-right">
          <div className="rounded-2xl border border-slate-200 bg-white p-8 text-center">
            <div className="mx-auto w-14 h-14 rounded-2xl bg-slate-50 flex items-center justify-center mb-3">
              <BookOpen className="w-7 h-7 text-slate-400" />
            </div>
            <div className="arabic-text text-slate-800 font-semibold">
              لا توجد دروس مسجلة
            </div>
            <div className="arabic-text text-slate-500 text-sm mt-1">
              لم تقم بإنشاء أي دروس بعد
            </div>
            <Button
              className="arabic-text mt-4 bg-emerald-600 hover:bg-emerald-700"
              onClick={() => navigate(createPageUrl("CreateLesson"))}
            >
              إنشاء درس جديد
            </Button>
          </div>

          {/* ميزاتك السابقة (التمارين + تمرين طارئ) بداخل الدروس */}
          <div className="mt-5">
            <Tabs defaultValue="exercises" className="space-y-3">
              <TabsList className="bg-white shadow-md rounded-2xl p-1 grid grid-cols-2">
                <TabsTrigger
                  value="exercises"
                  className="arabic-text text-xs md:text-sm"
                >
                  <ListChecks className="w-4 h-4 ml-1" />
                  التمارين
                </TabsTrigger>
                <TabsTrigger
                  value="emergency"
                  className="arabic-text text-xs md:text-sm"
                >
                  <AlertTriangle className="w-4 h-4 ml-1" />
                  تمرين طارئ
                </TabsTrigger>
              </TabsList>

              <TabsContent value="exercises">
                <ExercisesTab />
              </TabsContent>
              <TabsContent value="emergency">
                <EmergencyDrillTab />
              </TabsContent>
            </Tabs>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/* =========================
   ✅ طلاب / مجموعات / تمارين / تسجيلات / تمرين طارئ
   (نفس كودك تقريبًا، بدون تغيير وظيفي)
   ========================= */

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
      setStudents(studentList);
      setGroups(groupList);
    } catch (error) {
      console.error("Failed to load students or groups", error);
    } finally {
      setIsLoading(false);
    }
  };

  const filteredStudents = students.filter((s) => {
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
    const group = groups.find((g) => g.id === groupId);
    return group ? group.name : "مجموعة غير معروفة";
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <span className="arabic-text text-lg flex items-center gap-2">
              <Filter className="w-5 h-5 text-slate-500" />
              إدارة الطلاب
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
              <RefreshCw className="w-3 h-3 mr-1" />
            </Button>
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-3 gap-4 items-end">
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
                    المستوى
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
      setGroups(groupList);
      setStudents(studentList);
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

  const filteredStudents = students.filter((s) => {
    if (groupFilter === "all") return true;
    if (groupFilter === "ungrouped") return !s.group_id;
    return s.group_id === groupFilter;
  });

  const getGroupName = (groupId) => {
    const group = groups.find((g) => g.id === groupId);
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
          <CardTitle className="flex items-center justify-between">
            <span className="arabic-text text-lg flex items-center gap-2">
              <Users className="w-5 h-5 text-slate-500" />
              المجموعات
            </span>
            {isLoading && (
              <Loader2 className="w-4 h-4 animate-spin text-slate-500" />
            )}
          </CardTitle>
        </CardHeader>

        <CardContent className="grid md:grid-cols-3 gap-6">
          <div className="space-y-3 text-right">
            <Label className="arabic-text text-sm text-slate-700">
              إنشاء مجموعة جديدة
            </Label>
            <Input
              placeholder="اسم المجموعة"
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
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-lg flex items-center gap-2">
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

          <div className="mt-3 rounded-xl bg-red-50 border border-red-100 p-3 text-right arabic-text text-xs text-red-700 flex items-start gap-2">
            <AlertTriangle className="w-4 h-4 mt-1 flex-shrink-0" />
            <p>
              ملاحظة: عند حذف مجموعة، لن يتم حذف الطلاب، لكن سيفقدون ارتباطهم بتلك
              المجموعة.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-lg flex items-center gap-2">
            <Trash2 className="w-5 h-5 text-slate-500" />
            حذف مجموعة
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-right">
          <div className="text-xs text-slate-500 arabic-text">
            اختر مجموعة ثم اضغط حذف.
          </div>
          <div className="flex gap-2">
            <Button
              variant="destructive"
              className="arabic-text"
              onClick={() => selectedGroupId && handleDeleteGroup(selectedGroupId)}
              disabled={!selectedGroupId}
            >
              حذف
            </Button>
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
        </CardContent>
      </Card>
    </div>
  );
}

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
      setExercises(list);
    } catch (e) {
      console.error("Failed to load exercises", e);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCreateExercise = async () => {
    if (!newTitle.trim() || !newText.trim() || !newGrade) return;

    setIsLoading(true);
    try {
      const ex = await Exercise.create({
        title: newTitle.trim(),
        text: newText.trim(),
        grade: newGrade,
        level: newLevel,
        stage: parseInt(newStage, 10) || 1,
        is_active: true,
      });
      setExercises((prev) => [ex, ...prev]);
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

  const filteredExercises = exercises.filter((ex) => {
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
                      <SelectItem key={lvl} value={lvl} className="arabic-text">
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
              disabled={
                !newTitle.trim() || !newText.trim() || !newGrade || isLoading
              }
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
              <Label className="arabic-text text-sm text-slate-700">
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
        </CardContent>
      </Card>
    </div>
  );
}

function RecordingsTab() {
  const ALL = "__all__";

  const [recordings, setRecordings] = useState([]);
  const [students, setStudents] = useState([]);
  const [selectedStudentId, setSelectedStudentId] = useState(ALL);
  const [selectedGrade, setSelectedGrade] = useState(ALL);
  const [filterScore, setFilterScore] = useState(0);
  const [onlyWithComments, setOnlyWithComments] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

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
      setStudents(studentList);
      setRecordings(recordingList);
    } catch (e) {
      console.error("Failed to load recordings", e);
    } finally {
      setIsLoading(false);
    }
  };

  const getStudentById = (id) => students.find((s) => s.id === id);

  const filteredRecordings = recordings.filter((r) => {
    let ok = true;

    if (selectedStudentId !== ALL) ok = ok && r.student_id === selectedStudentId;

    if (selectedGrade !== ALL) {
      const st = getStudentById(r.student_id);
      ok = ok && st?.grade === selectedGrade;
    }

    if (filterScore > 0) ok = ok && (r.score || 0) >= filterScore;
    if (onlyWithComments) ok = ok && (r.teacher_comment || r.teacher_audio_comment);

    return ok;
  });

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
      await Recording.update(recordingId, { score: newScore });
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
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Filter className="w-5 h-5 text-slate-500" />
            تصفية التسجيلات
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
                <SelectItem value={ALL} className="arabic-text">كل الطلاب</SelectItem>
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
                <SelectItem value={ALL} className="arabic-text">الكل</SelectItem>
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
                {filterScore}%
              </span>
            </div>
          </div>
          <div className="space-y-1">
            <Label className="arabic-text text-sm text-slate-700">تعليقات المعلم</Label>
            <div className="flex items-center gap-2 justify-end">
              <Switch checked={onlyWithComments} onCheckedChange={setOnlyWithComments} />
              <span className="text-xs text-slate-700 arabic-text">
                إظهار التسجيلات التي تحتوي على تعليق فقط
              </span>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Recordings list */}
      <Card className="border-0 shadow-lg bg-white/90">
        <CardHeader>
          <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
            <Mic className="w-5 h-5 text-slate-500" />
            تسجيلات الطلاب ({filteredRecordings.length})
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
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">الطالب</th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">التاريخ</th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">الدرجة</th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">النص المقروء</th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">تعليق المعلم</th>
                  <th className="py-2 px-3 text-xs font-semibold text-slate-600">الصوت</th>
                </tr>
              </thead>

              <tbody>
                {filteredRecordings.map((r) => {
                  const st = getStudentById(r.student_id);
                  const readText =
                    r.analysis_details?.original_text ||
                    r.analysis_details?.text ||
                    "";

                  const dateStr = new Date(r.created_date).toLocaleDateString("ar-AE", {
                    year: "numeric",
                    month: "short",
                    day: "numeric",
                  });

                  const scoreColor =
                    r.score >= 90
                      ? "bg-emerald-100 text-emerald-800"
                      : r.score >= 70
                      ? "bg-amber-100 text-amber-800"
                      : "bg-red-100 text-red-800";

                  return (
                    <tr key={r.id} className="border-b border-slate-100 hover:bg-slate-50/60 align-top">
                      <td className="py-2 px-3 text-sm font-semibold text-slate-900 arabic-text whitespace-nowrap">
                        {st?.name}
                        <div className="text-[11px] text-slate-500">{st?.grade}</div>
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
                            title="اضغط لتعديل الدرجة يدويًا"
                          >
                            {r.score != null ? `${r.score}%` : "لا يوجد"}
                          </span>
                        )}
                      </td>

                      <td className="py-2 px-3 text-xs text-slate-800 arabic-text max-w-sm">
                        <div className="bg-slate-50 rounded-lg p-2">
                          <p className="line-clamp-3">{readText}</p>
                          {r.feedback && (
                            <p className="mt-1 text-[11px] text-blue-700">
                              🤖 {r.feedback}
                            </p>
                          )}
                        </div>
                      </td>

                      <td className="py-2 px-3 text-xs text-slate-800 arabic-text max-w-xs">
                        <div className="space-y-2">
                          {r.teacher_comment && (
                            <div className="bg-emerald-50 rounded p-2 text-[11px] text-emerald-800">
                              👩‍🏫 {r.teacher_comment}
                            </div>
                          )}

                          {r.teacher_audio_comment && (
                            <audio controls src={r.teacher_audio_comment} className="w-full" />
                          )}

                          <AudioCommentModal recording={r} />
                        </div>
                      </td>

                      <td className="py-2 px-3 text-xs text-slate-700">
                        <audio controls src={r.audio_url} className="w-full" />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

       
