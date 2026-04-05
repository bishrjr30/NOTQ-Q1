import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Label } from "@/components/ui/label";
import {
  ArrowLeft,
  Trophy,
  Users,
  Clock,
  Loader2,
  Mic,
  Square,
  Play,
  CheckCircle2,
} from "lucide-react";
import {
  LiveAssessment,
  AssessmentQuestion,
  AssessmentAttempt,
  AssessmentSubmission,
  Student,
} from "@/api/entities";
import { UploadFile, InvokeLLM } from "@/api/integrations";
import { useToast } from "@/components/ui/use-toast";

function normalizeArabicText(input = "") {
  return String(input)
    .replace(/[\u064B-\u0652\u0670]/g, "")
    .replace(/\u0640/g, "")
    .replace(/[إأآا]/g, "ا")
    .replace(/ى/g, "ي")
    .replace(/ؤ/g, "و")
    .replace(/ئ/g, "ي")
    .replace(/[^\u0600-\u06FF\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

function wordMatchRatio(expectedRaw = "", heardRaw = "") {
  const expected = normalizeArabicText(expectedRaw);
  const heard = normalizeArabicText(heardRaw);
  const expWords = expected.split(" ").filter(Boolean);
  const heardWords = heard.split(" ").filter(Boolean);
  if (!expWords.length) return 0;
  const heardSet = new Set(heardWords);
  let matched = 0;
  for (const w of expWords) {
    if (heardSet.has(w)) matched += 1;
  }
  return matched / expWords.length;
}

function isAssessmentOpen(assessment) {
  if (!assessment) return false;
  if (assessment.status === "live") return true;
  if (assessment.status === "scheduled" && assessment.scheduled_start) {
    const now = Date.now();
    return now >= new Date(assessment.scheduled_start).getTime();
  }
  return false;
}

export default function LiveAssessmentPage() {
  const navigate = useNavigate();
  const { toast } = useToast();

  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  const [assessments, setAssessments] = useState([]);
  const [selectedAssessment, setSelectedAssessment] = useState(null);
  const [questions, setQuestions] = useState([]);
  const [attempts, setAttempts] = useState([]);
  const [myAttempt, setMyAttempt] = useState(null);
  const [mySubmissions, setMySubmissions] = useState([]);

  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [isSubmittingAnswer, setIsSubmittingAnswer] = useState(false);

  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const mediaRecorderRef = useRef(null);
  const chunksRef = useRef([]);

  const [showFinalResult, setShowFinalResult] = useState(false);

  const loadAll = async (studentData) => {
    try {
      const [assessmentList, attemptList] = await Promise.all([
        LiveAssessment.list("-created_date"),
        AssessmentAttempt.list("-joined_at"),
      ]);

      const available = (assessmentList || []).filter(
        (a) => (a.grade === studentData.grade || a.grade === "all") && (a.status === "live" || a.status === "scheduled")
      );
      setAssessments(available);
      setAttempts(attemptList || []);
    } catch (error) {
      console.error("Load assessments failed", error);
      toast({
        title: "خطأ",
        description: "تعذر تحميل التقييمات المباشرة.",
        variant: "destructive",
      });
    }
  };

  const loadAssessmentDetails = async (assessmentId, studentId) => {
    try {
      const [questionList, attemptList, submissionList] = await Promise.all([
        AssessmentQuestion.list({ assessment_id: assessmentId }, "question_order"),
        AssessmentAttempt.list({ assessment_id: assessmentId }, "-joined_at"),
        AssessmentSubmission.list({ assessment_id: assessmentId }, "question_order"),
      ]);

      setQuestions(questionList || []);
      setAttempts(attemptList || []);

      const my = (attemptList || []).find((a) => a.student_id === studentId);
      setMyAttempt(my || null);
      if (my) {
        const mine = (submissionList || []).filter((s) => s.attempt_id === my.id);
        setMySubmissions(mine);
        setCurrentQuestionIndex(Math.min(mine.length, Math.max((questionList || []).length - 1, 0)));
        setShowFinalResult(my.status === "completed");
      } else {
        setMySubmissions([]);
        setCurrentQuestionIndex(0);
        setShowFinalResult(false);
      }
    } catch (error) {
      console.error("Load assessment details failed", error);
    }
  };

  useEffect(() => {
    const init = async () => {
      try {
        const studentId = localStorage.getItem("studentId");
        if (!studentId) {
          navigate(createPageUrl("StudentOnboarding"));
          return;
        }

        const studentData = await Student.get(studentId);
        setStudent(studentData);
        await loadAll(studentData);
      } catch (error) {
        console.error("Init live assessment failed", error);
        toast({
          title: "خطأ",
          description: "لا يمكن فتح صفحة التقييم حالياً.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    init();
  }, [navigate, toast]);

  useEffect(() => {
    if (!selectedAssessment || !student) return;
    loadAssessmentDetails(selectedAssessment.id, student.id);

    const interval = setInterval(() => {
      loadAssessmentDetails(selectedAssessment.id, student.id);
    }, 10000);

    return () => clearInterval(interval);
  }, [selectedAssessment, student]);

  const leaderboard = useMemo(() => {
    return attempts
      .slice()
      .sort((a, b) => {
        const avgA = (Number(a.total_score) || 0) / Math.max(Number(a.answered_count) || 1, 1);
        const avgB = (Number(b.total_score) || 0) / Math.max(Number(b.answered_count) || 1, 1);
        return avgB - avgA;
      })
      .slice(0, 10)
      .map((item, i) => ({
        ...item,
        rank: i + 1,
        average: Math.round((Number(item.total_score) || 0) / Math.max(Number(item.answered_count) || 1, 1)),
      }));
  }, [attempts]);

  const myRank = useMemo(() => {
    if (!myAttempt) return null;
    const idx = leaderboard.findIndex((l) => l.id === myAttempt.id);
    return idx >= 0 ? idx + 1 : null;
  }, [leaderboard, myAttempt]);

  const ensureAttempt = async () => {
    if (!student || !selectedAssessment) return null;

    if (myAttempt) return myAttempt;

    const created = await AssessmentAttempt.create({
      assessment_id: selectedAssessment.id,
      student_id: student.id,
      student_name: student.name,
      joined_at: new Date().toISOString(),
      started_at: null,
      completed_at: null,
      status: "joined",
      total_score: 0,
      answered_count: 0,
      total_questions: questions.length,
    });

    setMyAttempt(created);
    await loadAssessmentDetails(selectedAssessment.id, student.id);
    return created;
  };

  const startAttempt = async () => {
    try {
      const attempt = await ensureAttempt();
      if (!attempt) return;

      if (attempt.status === "joined") {
        await AssessmentAttempt.update(attempt.id, {
          status: "in_progress",
          started_at: new Date().toISOString(),
        });
      }

      toast({ title: "✅ بدأ التقييم", description: "بالتوفيق! ابدئي قراءة العبارات الآن." });
      await loadAssessmentDetails(selectedAssessment.id, student.id);
    } catch (error) {
      console.error("Start attempt failed", error);
      toast({
        title: "خطأ",
        description: "تعذر بدء التقييم.",
        variant: "destructive",
      });
    }
  };

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      mediaRecorderRef.current = new MediaRecorder(stream, { mimeType: "audio/webm;codecs=opus" });
      chunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };

      mediaRecorderRef.current.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        setAudioBlob(blob);
        stream.getTracks().forEach((track) => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error("Start recording failed", error);
      toast({ title: "خطأ", description: "يرجى السماح باستخدام الميكروفون.", variant: "destructive" });
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const finishAttemptIfNeeded = async (attemptId, answeredCountAfter, totalQuestions) => {
    if (answeredCountAfter < totalQuestions) return;

    await AssessmentAttempt.update(attemptId, {
      status: "completed",
      completed_at: new Date().toISOString(),
    });
    setShowFinalResult(true);
  };

  const submitCurrentAnswer = async () => {
    if (!audioBlob || !student || !selectedAssessment || !questions[currentQuestionIndex]) {
      toast({ title: "تنبيه", description: "سجلي إجابة أولاً.", variant: "destructive" });
      return;
    }

    setIsSubmittingAnswer(true);
    try {
      const attempt = await ensureAttempt();
      const question = questions[currentQuestionIndex];

      const file = new File([audioBlob], `assessment_${student.id}_${Date.now()}.webm`, {
        type: "audio/webm",
      });

      const uploaded = await UploadFile({
        file,
        bucket: "recordings",
        folder: `live_assessments/${selectedAssessment.id}/${student.id}`,
      });

      const fd = new FormData();
      fd.append("file", file);
      fd.append("language", "ar");
      fd.append("model", "whisper-1");

      const tResponse = await fetch("/api/transcribe", { method: "POST", body: fd });
      const tJson = await tResponse.json().catch(() => ({}));
      const transcribedText = tJson?.text || "";

      const matchRatio = wordMatchRatio(question.phrase_text, transcribedText);

      const analysisPrompt = `
قيّم قراءة الطالب للعبارة التالية:
- العبارة الأصلية: "${question.phrase_text}"
- نص الطالب المسموع: "${transcribedText}"
- نسبة تطابق الكلمات: ${(matchRatio * 100).toFixed(0)}%

أرجع JSON فقط بالشكل:
{
  "score": number,
  "feedback": "string",
  "details": {
    "pronunciation": number,
    "fluency": number,
    "tashkeel_accuracy": number,
    "word_match_ratio": number
  }
}
`;

      const ai = await InvokeLLM({
        prompt: analysisPrompt,
        response_json_schema: {
          type: "object",
          properties: {
            score: { type: "number" },
            feedback: { type: "string" },
            details: {
              type: "object",
              properties: {
                pronunciation: { type: "number" },
                fluency: { type: "number" },
                tashkeel_accuracy: { type: "number" },
                word_match_ratio: { type: "number" },
              },
              required: ["word_match_ratio"],
            },
          },
          required: ["score", "feedback"],
        },
      });

      const parsed = typeof ai === "string" ? JSON.parse(ai) : ai;
      const score = Math.max(0, Math.min(100, Number(parsed?.score) || Math.round(matchRatio * 100)));
      const feedback = parsed?.feedback || "أحسنت، واصلي التدريب.";

      await AssessmentSubmission.create({
        assessment_id: selectedAssessment.id,
        question_id: question.id,
        attempt_id: attempt.id,
        student_id: student.id,
        student_name: student.name,
        question_order: question.question_order,
        phrase_text: question.phrase_text,
        audio_url: uploaded?.file_url || null,
        transcribed_text: transcribedText,
        ai_feedback: feedback,
        score,
        analysis_details: parsed?.details || {},
        submitted_at: new Date().toISOString(),
      });

      const answeredCountAfter = (Number(attempt.answered_count) || 0) + 1;
      const totalScoreAfter = (Number(attempt.total_score) || 0) + score;

      await AssessmentAttempt.update(attempt.id, {
        status: "in_progress",
        answered_count: answeredCountAfter,
        total_score: totalScoreAfter,
      });

      await finishAttemptIfNeeded(attempt.id, answeredCountAfter, questions.length);

      setAudioBlob(null);
      if (answeredCountAfter < questions.length) {
        setCurrentQuestionIndex(answeredCountAfter);
      }

      await loadAssessmentDetails(selectedAssessment.id, student.id);

      toast({ title: "✅ تم تقييم الإجابة", description: `نتيجتك في هذا السؤال: ${score}%` });
    } catch (error) {
      console.error("Submit answer failed", error);
      toast({ title: "خطأ", description: "تعذر إرسال الإجابة. حاولي مرة أخرى.", variant: "destructive" });
    } finally {
      setIsSubmittingAnswer(false);
    }
  };

  const activeAvailableAssessments = useMemo(
    () => assessments.filter((a) => isAssessmentOpen(a)),
    [assessments]
  );

  const currentQuestion = questions[currentQuestionIndex] || null;
  const myAverageScore = myAttempt
    ? Math.round((Number(myAttempt.total_score) || 0) / Math.max(Number(myAttempt.answered_count) || 1, 1))
    : 0;

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <Loader2 className="w-6 h-6 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!student) return null;

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold arabic-text text-right">🏁 التقييم المباشر</h1>
            <p className="text-sm text-slate-600 arabic-text text-right mt-1">حلّ الأسئلة مباشرة وشاهد ترتيبك مع زملائك.</p>
          </div>
          <Link to={createPageUrl("StudentDashboard")}>
            <Button variant="outline" className="arabic-text">
              <ArrowLeft className="w-4 h-4 ml-2" />
              العودة
            </Button>
          </Link>
        </div>

        {!selectedAssessment && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="border-b border-slate-100">
              <CardTitle className="arabic-text text-right">التقييمات المتاحة</CardTitle>
              <CardDescription className="arabic-text text-right">
                الصف: {student.grade || "غير محدد"}
              </CardDescription>
            </CardHeader>
            <CardContent className="p-6 space-y-3">
              {activeAvailableAssessments.length === 0 ? (
                <Alert>
                  <AlertDescription className="arabic-text text-right">
                    لا يوجد تقييم مباشر فعال الآن. راجعي الصفحة بعد قليل.
                  </AlertDescription>
                </Alert>
              ) : (
                activeAvailableAssessments.map((assessment) => (
                  <Card key={assessment.id} className="border border-indigo-200">
                    <CardContent className="p-4 flex items-center justify-between gap-3">
                      <Button
                        onClick={() => setSelectedAssessment(assessment)}
                        className="arabic-text bg-indigo-600 hover:bg-indigo-700"
                      >
                        <Play className="w-4 h-4 ml-2" />
                        دخول التقييم
                      </Button>
                      <div className="text-right">
                        <p className="font-bold arabic-text">{assessment.title}</p>
                        <p className="text-xs text-slate-600 arabic-text mt-1">
                          {assessment.grade} • {assessment.duration_minutes || 20} دقيقة
                        </p>
                      </div>
                    </CardContent>
                  </Card>
                ))
              )}
            </CardContent>
          </Card>
        )}

        {selectedAssessment && (
          <>
            <Card className="border-0 shadow-lg bg-gradient-to-br from-indigo-50 to-blue-50">
              <CardContent className="p-4 md:p-6">
                <div className="grid md:grid-cols-4 gap-3">
                  <div className="bg-white rounded-lg p-3 text-right">
                    <p className="text-xs text-slate-500 arabic-text">التقييم</p>
                    <p className="font-bold arabic-text text-slate-900">{selectedAssessment.title}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-right">
                    <p className="text-xs text-slate-500 arabic-text">النقاط الحالية</p>
                    <p className="font-bold text-indigo-700">{myAverageScore}%</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-right">
                    <p className="text-xs text-slate-500 arabic-text">ترتيبك الآن</p>
                    <p className="font-bold text-emerald-700">{myRank || "—"}</p>
                  </div>
                  <div className="bg-white rounded-lg p-3 text-right">
                    <p className="text-xs text-slate-500 arabic-text">الوقت</p>
                    <p className="font-bold text-slate-900">{selectedAssessment.duration_minutes || 20} دقيقة</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <div className="grid lg:grid-cols-3 gap-6">
              <div className="lg:col-span-2 space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="arabic-text text-right">سير التقييم</CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-4">
                    {!myAttempt ? (
                      <div className="space-y-3">
                        <Alert>
                          <AlertDescription className="arabic-text text-right">
                            اضغطي بدء التقييم للانضمام والتنافس المباشر.
                          </AlertDescription>
                        </Alert>
                        <div className="flex justify-end">
                          <Button onClick={startAttempt} className="arabic-text bg-emerald-600 hover:bg-emerald-700">
                            <Play className="w-4 h-4 ml-2" />
                            بدء التقييم
                          </Button>
                        </div>
                      </div>
                    ) : showFinalResult || myAttempt.status === "completed" ? (
                      <div className="space-y-4">
                        <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-4 text-right">
                          <p className="text-lg font-bold text-emerald-800 arabic-text">🎉 انتهى التقييم</p>
                          <p className="text-sm text-emerald-700 arabic-text mt-1">
                            نتيجتك النهائية: {Math.round((Number(myAttempt.total_score) || 0) / Math.max(Number(myAttempt.answered_count) || 1, 1))}%
                          </p>
                        </div>

                        <div className="space-y-2">
                          {mySubmissions.sort((a, b) => (a.question_order || 0) - (b.question_order || 0)).map((sub) => (
                            <Card key={sub.id} className="border border-slate-200">
                              <CardContent className="p-3 text-right space-y-1">
                                <p className="text-sm font-bold arabic-text">السؤال {sub.question_order}: {sub.phrase_text}</p>
                                <p className="text-xs text-slate-600 arabic-text">النتيجة: {sub.score}%</p>
                                <p className="text-xs text-slate-700 arabic-text">{sub.ai_feedback}</p>
                              </CardContent>
                            </Card>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="space-y-2">
                          <div className="flex justify-between items-center">
                            <Badge variant="outline">{currentQuestionIndex + 1} / {questions.length}</Badge>
                            <p className="text-sm font-bold arabic-text">السؤال الحالي</p>
                          </div>
                          <Progress value={((currentQuestionIndex + 1) / Math.max(questions.length, 1)) * 100} className="h-2" />
                        </div>

                        {currentQuestion ? (
                          <Card className="border border-indigo-200 bg-indigo-50/40">
                            <CardContent className="p-4 text-right space-y-4">
                              <Label className="arabic-text text-base font-bold">اقرأ العبارة التالية:</Label>
                              <p className="text-lg font-semibold text-slate-900 arabic-text leading-9">{currentQuestion.phrase_text}</p>

                              <div className="flex items-center justify-end gap-2">
                                <Button
                                  variant="outline"
                                  onClick={isRecording ? stopRecording : startRecording}
                                  className="arabic-text"
                                  disabled={isSubmittingAnswer}
                                >
                                  {isRecording ? <Square className="w-4 h-4 ml-2" /> : <Mic className="w-4 h-4 ml-2" />}
                                  {isRecording ? "إيقاف التسجيل" : "بدء التسجيل"}
                                </Button>

                                <Button
                                  onClick={submitCurrentAnswer}
                                  disabled={!audioBlob || isSubmittingAnswer}
                                  className="arabic-text bg-indigo-600 hover:bg-indigo-700"
                                >
                                  {isSubmittingAnswer ? <Loader2 className="w-4 h-4 ml-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 ml-2" />}
                                  إرسال الإجابة
                                </Button>
                              </div>
                            </CardContent>
                          </Card>
                        ) : (
                          <Alert>
                            <AlertDescription className="arabic-text text-right">لا توجد أسئلة في هذا التقييم.</AlertDescription>
                          </Alert>
                        )}
                      </>
                    )}
                  </CardContent>
                </Card>
              </div>

              <div className="space-y-4">
                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="arabic-text text-right flex items-center gap-2">
                      <Users className="w-4 h-4" />
                      الطلاب المشاركون
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    {attempts.length === 0 ? (
                      <p className="text-xs text-slate-500 arabic-text text-right">لم ينضم أي طالب بعد.</p>
                    ) : (
                      attempts.map((a) => (
                        <div key={a.id} className="flex items-center justify-between text-xs bg-slate-50 rounded p-2">
                          <Badge className="text-[10px]">{a.status}</Badge>
                          <span className="arabic-text">{a.student_name || "طالب"}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardHeader className="border-b border-slate-100">
                    <CardTitle className="arabic-text text-right flex items-center gap-2">
                      <Trophy className="w-4 h-4" />
                      الترتيب المباشر
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-4 space-y-2">
                    {leaderboard.length === 0 ? (
                      <p className="text-xs text-slate-500 arabic-text text-right">لا يوجد ترتيب بعد.</p>
                    ) : (
                      leaderboard.map((row) => (
                        <div key={row.id} className="flex items-center justify-between bg-amber-50 rounded p-2 text-xs">
                          <span className="font-bold text-amber-700">{row.average}%</span>
                          <span className="arabic-text">{row.rank}. {row.student_name || "طالب"}</span>
                        </div>
                      ))
                    )}
                  </CardContent>
                </Card>

                <Card className="border-0 shadow-lg">
                  <CardContent className="p-4 text-right arabic-text text-xs text-slate-600 space-y-1">
                    <p className="flex items-center justify-end gap-1"><Clock className="w-3 h-3" /> مدة التقييم: {selectedAssessment.duration_minutes || 20} دقيقة</p>
                    <p className="flex items-center justify-end gap-1"><Users className="w-3 h-3" /> الصف المستهدف: {selectedAssessment.grade}</p>
                  </CardContent>
                </Card>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
