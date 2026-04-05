import React, { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LiveAssessment,
  AssessmentQuestion,
  AssessmentAttempt,
  AssessmentSubmission,
  Student,
} from "@/api/entities";
import { useToast } from "@/components/ui/use-toast";
import { Loader2, Play, Square, Users, BarChart3, Plus } from "lucide-react";

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

const STATUS_LABELS = {
  draft: "مسودة",
  scheduled: "مجدول",
  live: "مباشر",
  completed: "منتهي",
};

const STATUS_BADGE_CLASS = {
  draft: "bg-slate-100 text-slate-700",
  scheduled: "bg-blue-100 text-blue-700",
  live: "bg-emerald-100 text-emerald-700",
  completed: "bg-amber-100 text-amber-700",
};

function toLocalDateTimeValue(date) {
  if (!date) return "";
  const d = new Date(date);
  if (Number.isNaN(d.getTime())) return "";
  const pad = (n) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function AssessmentManagementTab() {
  const { toast } = useToast();

  const [isLoading, setIsLoading] = useState(false);
  const [isCreating, setIsCreating] = useState(false);
  const [assessments, setAssessments] = useState([]);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [submissions, setSubmissions] = useState([]);
  const [students, setStudents] = useState([]);

  const [title, setTitle] = useState("");
  const [grade, setGrade] = useState("");
  const [durationMinutes, setDurationMinutes] = useState(20);
  const [scheduledStart, setScheduledStart] = useState("");
  const [questionCount, setQuestionCount] = useState(5);
  const [questionItems, setQuestionItems] = useState(Array.from({ length: 5 }, () => ""));

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [assessmentList, questionList, attemptList, submissionList, studentList] = await Promise.all([
        LiveAssessment.list("-created_date"),
        AssessmentQuestion.list("question_order"),
        AssessmentAttempt.list("-joined_at"),
        AssessmentSubmission.list("-submitted_at"),
        Student.list("name"),
      ]);

      setAssessments(assessmentList || []);
      setQuestions(questionList || []);
      setAttempts(attemptList || []);
      setSubmissions(submissionList || []);
      setStudents(studentList || []);
    } catch (error) {
      console.error("Failed to load assessments", error);
      toast({
        title: "خطأ",
        description: "فشل تحميل بيانات التقييمات.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const selectedGradeStudents = useMemo(
    () => students.filter((s) => !grade || s.grade === grade),
    [students, grade]
  );

  const assessmentStats = useMemo(() => {
    const byAssessment = new Map();

    assessments.forEach((assessment) => {
      const assessmentAttempts = attempts.filter((a) => a.assessment_id === assessment.id);
      const completedAttempts = assessmentAttempts.filter((a) => a.status === "completed");
      const avgScore = completedAttempts.length
        ? Math.round(completedAttempts.reduce((acc, a) => acc + (Number(a.total_score) || 0), 0) / completedAttempts.length)
        : 0;

      const assessmentQuestions = questions.filter((q) => q.assessment_id === assessment.id);
      const submissionCount = submissions.filter((s) => s.assessment_id === assessment.id).length;

      byAssessment.set(assessment.id, {
        attempts: assessmentAttempts.length,
        completed: completedAttempts.length,
        avgScore,
        questionsCount: assessmentQuestions.length,
        submissionCount,
      });
    });

    return byAssessment;
  }, [assessments, attempts, questions, submissions]);

  const activeAssessments = assessments.filter((a) => a.status === "live");
  const endedAssessments = assessments.filter((a) => a.status === "completed");

  const updateQuestionCount = (val) => {
    const parsed = Math.max(1, Math.min(30, Number(val) || 1));
    setQuestionCount(parsed);
    setQuestionItems((prev) => {
      const next = prev.slice(0, parsed);
      while (next.length < parsed) next.push("");
      return next;
    });
  };

  const setQuestionAt = (index, value) => {
    setQuestionItems((prev) => prev.map((item, idx) => (idx === index ? value : item)));
  };

  const createAssessment = async ({ activateNow = false }) => {
    const normalizedQuestions = questionItems.map((q) => q.trim()).filter(Boolean);

    if (!title.trim() || !grade) {
      toast({
        title: "تنبيه",
        description: "يرجى تعبئة عنوان التقييم والصف.",
        variant: "destructive",
      });
      return;
    }

    if (normalizedQuestions.length === 0) {
      toast({
        title: "تنبيه",
        description: "أضيفي سؤالاً واحداً على الأقل.",
        variant: "destructive",
      });
      return;
    }

    setIsCreating(true);
    try {
      let status = "draft";
      let startedAt = null;
      const nowIso = new Date().toISOString();

      if (activateNow) {
        status = "live";
        startedAt = nowIso;
      } else if (scheduledStart) {
        status = "scheduled";
      }

      const createdAssessment = await LiveAssessment.create({
        title: title.trim(),
        grade,
        duration_minutes: Number(durationMinutes) || 20,
        scheduled_start: scheduledStart ? new Date(scheduledStart).toISOString() : null,
        started_at: startedAt,
        ended_at: null,
        status,
        total_questions: normalizedQuestions.length,
        created_date: nowIso,
      });

      await Promise.all(
        normalizedQuestions.map((text, index) =>
          AssessmentQuestion.create({
            assessment_id: createdAssessment.id,
            question_order: index + 1,
            phrase_text: text,
            points: 100,
            created_date: nowIso,
          })
        )
      );

      toast({
        title: "✅ تم إنشاء التقييم",
        description: activateNow ? "تم إنشاء التقييم وبدؤه مباشرة." : "تم حفظ التقييم بنجاح.",
      });

      setTitle("");
      setGrade("");
      setDurationMinutes(20);
      setScheduledStart("");
      setQuestionCount(5);
      setQuestionItems(Array.from({ length: 5 }, () => ""));
      await loadData();
    } catch (error) {
      console.error("Failed to create assessment", error);
      toast({
        title: "خطأ",
        description: "تعذر إنشاء التقييم. تأكدي من تطبيق SQL الخاص بالميزة.",
        variant: "destructive",
      });
    } finally {
      setIsCreating(false);
    }
  };

  const updateAssessmentStatus = async (assessment, status) => {
    try {
      const patch = { status };
      if (status === "live") {
        patch.started_at = new Date().toISOString();
      }
      if (status === "completed") {
        patch.ended_at = new Date().toISOString();
      }

      await LiveAssessment.update(assessment.id, patch);
      await loadData();
      toast({
        title: "✅ تم التحديث",
        description: status === "live" ? "تم تفعيل التقييم." : "تم إنهاء التقييم.",
      });
    } catch (error) {
      console.error("Failed to update assessment status", error);
      toast({
        title: "خطأ",
        description: "تعذر تحديث حالة التقييم.",
        variant: "destructive",
      });
    }
  };

  const getLeaderboard = (assessmentId) => {
    return attempts
      .filter((a) => a.assessment_id === assessmentId)
      .slice()
      .sort((a, b) => (Number(b.total_score) || 0) - (Number(a.total_score) || 0))
      .slice(0, 10);
  };

  return (
    <div className="space-y-6">
      <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
        <CardHeader className="border-b border-indigo-100">
          <CardTitle className="arabic-text text-right text-xl">🧪 إنشاء تقييم مباشر</CardTitle>
          <CardDescription className="arabic-text text-right">
            صمّمي التقييم مسبقاً، حددي الصف والمدة والأسئلة، ثم فعّليه في الوقت الذي تريدينه.
          </CardDescription>
        </CardHeader>
        <CardContent className="p-6 space-y-5">
          <div className="grid md:grid-cols-2 gap-4">
            <div className="space-y-2 text-right">
              <Label className="arabic-text">عنوان التقييم</Label>
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="arabic-text text-right"
                placeholder="مثال: تقييم التلاوة - الصف الخامس"
              />
            </div>

            <div className="space-y-2 text-right">
              <Label className="arabic-text">الصف المستهدف</Label>
              <Select value={grade} onValueChange={setGrade}>
                <SelectTrigger className="arabic-text text-right">
                  <SelectValue placeholder="اختاري الصف" />
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
              <Label className="arabic-text">مدة التقييم (بالدقائق)</Label>
              <Input
                type="number"
                min={5}
                max={180}
                value={durationMinutes}
                onChange={(e) => setDurationMinutes(e.target.value)}
                className="arabic-text text-right"
              />
            </div>

            <div className="space-y-2 text-right">
              <Label className="arabic-text">موعد البدء (اختياري)</Label>
              <Input
                type="datetime-local"
                value={scheduledStart}
                onChange={(e) => setScheduledStart(e.target.value)}
                className="arabic-text"
              />
            </div>
          </div>

          <Card className="border border-slate-200">
            <CardContent className="p-4 space-y-3">
              <div className="flex items-center justify-between">
                <Label className="arabic-text">عدد الأسئلة</Label>
                <Input
                  type="number"
                  min={1}
                  max={30}
                  value={questionCount}
                  onChange={(e) => updateQuestionCount(e.target.value)}
                  className="w-24 text-center"
                />
              </div>

              <div className="space-y-2">
                {questionItems.map((q, idx) => (
                  <Textarea
                    key={idx}
                    value={q}
                    onChange={(e) => setQuestionAt(idx, e.target.value)}
                    className="arabic-text text-right min-h-[70px]"
                    placeholder={`العبارة ${idx + 1} (تشكيل دقيق)`}
                  />
                ))}
              </div>
            </CardContent>
          </Card>

          <Alert className="bg-slate-50 border-slate-200">
            <Users className="h-4 w-4" />
            <AlertDescription className="arabic-text text-right">
              عدد الطلاب المتوقع دخولهم في الصف المحدد: <strong>{selectedGradeStudents.length}</strong>
            </AlertDescription>
          </Alert>

          <div className="flex gap-2 justify-end flex-wrap">
            <Button
              variant="outline"
              onClick={() => createAssessment({ activateNow: false })}
              disabled={isCreating}
              className="arabic-text"
            >
              {isCreating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Plus className="w-4 h-4 ml-2" />}
              حفظ كتقييم
            </Button>

            <Button
              onClick={() => createAssessment({ activateNow: true })}
              disabled={isCreating}
              className="arabic-text bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700"
            >
              {isCreating ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <Play className="w-4 h-4 ml-2" />}
              إنشاء وبدء مباشر
            </Button>
          </div>
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="arabic-text text-right">📡 التقييمات المباشرة الآن ({activeAssessments.length})</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-4">
          {activeAssessments.length === 0 ? (
            <p className="arabic-text text-right text-sm text-slate-500">لا يوجد تقييم مباشر فعال حالياً.</p>
          ) : (
            activeAssessments.map((assessment) => {
              const stat = assessmentStats.get(assessment.id) || {
                attempts: 0,
                completed: 0,
                avgScore: 0,
                questionsCount: 0,
              };
              const leaderboard = getLeaderboard(assessment.id);

              return (
                <Card key={assessment.id} className="border border-emerald-200 bg-emerald-50/40">
                  <CardContent className="p-4 space-y-3">
                    <div className="flex items-center justify-between">
                      <div className="text-right">
                        <p className="font-bold arabic-text text-slate-900">{assessment.title}</p>
                        <p className="text-xs text-slate-600 arabic-text">{assessment.grade} • {assessment.duration_minutes || 20} دقيقة</p>
                      </div>
                      <Badge className={STATUS_BADGE_CLASS.live}>مباشر</Badge>
                    </div>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center">
                      <div className="bg-white rounded p-2"><p className="text-xs text-slate-500">المشاركون</p><p className="font-bold">{stat.attempts}</p></div>
                      <div className="bg-white rounded p-2"><p className="text-xs text-slate-500">أنهى التقييم</p><p className="font-bold">{stat.completed}</p></div>
                      <div className="bg-white rounded p-2"><p className="text-xs text-slate-500">متوسط النتيجة</p><p className="font-bold">{stat.avgScore}%</p></div>
                      <div className="bg-white rounded p-2"><p className="text-xs text-slate-500">عدد الأسئلة</p><p className="font-bold">{stat.questionsCount}</p></div>
                    </div>

                    {leaderboard.length > 0 && (
                      <div className="bg-white rounded-lg p-3 border border-slate-100">
                        <p className="text-xs font-bold text-slate-600 arabic-text text-right mb-2">الترتيب الحالي</p>
                        <div className="space-y-1">
                          {leaderboard.map((row, i) => (
                            <div key={row.id} className="flex justify-between text-xs">
                              <span>{Number(row.total_score) || 0}</span>
                              <span className="arabic-text">{i + 1}. {row.student_name || "طالب"}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    <div className="flex justify-end">
                      <Button
                        variant="outline"
                        className="arabic-text text-red-600 border-red-300 hover:bg-red-50"
                        onClick={() => updateAssessmentStatus(assessment, "completed")}
                      >
                        <Square className="w-4 h-4 ml-2" />
                        إنهاء التقييم
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      <Card className="border-0 shadow-lg">
        <CardHeader className="border-b border-slate-100">
          <CardTitle className="arabic-text text-right">📚 جميع التقييمات</CardTitle>
        </CardHeader>
        <CardContent className="p-6 space-y-3">
          {isLoading ? (
            <div className="flex items-center justify-center py-6">
              <Loader2 className="w-5 h-5 animate-spin text-indigo-600" />
            </div>
          ) : assessments.length === 0 ? (
            <p className="arabic-text text-right text-sm text-slate-500">لا توجد تقييمات حالياً.</p>
          ) : (
            assessments.map((assessment) => {
              const stat = assessmentStats.get(assessment.id) || { attempts: 0, completed: 0, avgScore: 0, submissionCount: 0 };
              const canActivate = assessment.status === "draft" || assessment.status === "scheduled";

              return (
                <Card key={assessment.id} className="border border-slate-200">
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between gap-3">
                      <div className="text-right flex-1">
                        <p className="font-bold arabic-text text-slate-900">{assessment.title}</p>
                        <p className="text-xs text-slate-600 arabic-text mt-1">
                          {assessment.grade} • {assessment.duration_minutes || 20} دقيقة • موعد: {assessment.scheduled_start ? toLocalDateTimeValue(assessment.scheduled_start) : "غير محدد"}
                        </p>
                        <p className="text-xs text-slate-500 mt-2 arabic-text">
                          مشاركون: {stat.attempts} • مكتمل: {stat.completed} • متوسط: {stat.avgScore}% • تسجيلات إجابات: {stat.submissionCount}
                        </p>
                      </div>

                      <Badge className={STATUS_BADGE_CLASS[assessment.status] || STATUS_BADGE_CLASS.draft}>
                        {STATUS_LABELS[assessment.status] || "مسودة"}
                      </Badge>
                    </div>

                    <div className="flex justify-end gap-2 mt-3">
                      {canActivate && (
                        <Button
                          size="sm"
                          className="arabic-text bg-emerald-600 hover:bg-emerald-700"
                          onClick={() => updateAssessmentStatus(assessment, "live")}
                        >
                          <Play className="w-3 h-3 ml-1" />
                          تفعيل الآن
                        </Button>
                      )}

                      {assessment.status === "live" && (
                        <Button
                          size="sm"
                          variant="outline"
                          className="arabic-text text-red-600 border-red-300 hover:bg-red-50"
                          onClick={() => updateAssessmentStatus(assessment, "completed")}
                        >
                          <Square className="w-3 h-3 ml-1" />
                          إنهاء
                        </Button>
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })
          )}
        </CardContent>
      </Card>

      {endedAssessments.length > 0 && (
        <Card className="border-0 shadow-lg bg-amber-50/40 border-amber-200">
          <CardHeader className="border-b border-amber-100">
            <CardTitle className="arabic-text text-right text-lg flex items-center gap-2">
              <BarChart3 className="w-5 h-5 text-amber-600" />
              تقييمات منتهية وإحصاءاتها ({endedAssessments.length})
            </CardTitle>
          </CardHeader>
          <CardContent className="p-4 space-y-2">
            {endedAssessments.map((a) => {
              const stat = assessmentStats.get(a.id) || { attempts: 0, completed: 0, avgScore: 0 };
              return (
                <div key={a.id} className="bg-white border border-amber-100 rounded-lg p-3 text-right arabic-text text-sm">
                  <p className="font-bold">{a.title}</p>
                  <p className="text-xs text-slate-600 mt-1">مشاركون: {stat.attempts} • مكتمل: {stat.completed} • متوسط: {stat.avgScore}%</p>
                </div>
              );
            })}
          </CardContent>
        </Card>
      )}
    </div>
  );
}
