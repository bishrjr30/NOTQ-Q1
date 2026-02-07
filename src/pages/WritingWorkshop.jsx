// src/pages/WritingWorkshop.jsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea"; // تأكد أن لديك هذا المكون أو استخدم input عادي
import {
  BookOpen,
  PenTool,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  GraduationCap
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient"; // تأكد من المسار
import { InvokeLLM } from "@/api/integrations";
import { Student } from "@/api/entities";

export default function WritingWorkshop() {
  const navigate = useNavigate();
  
  // State
  const [exercises, setExercises] = useState([]);
  const [selectedExercise, setSelectedExercise] = useState(null);
  const [studentText, setStudentText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState(null);
  const [student, setStudent] = useState(null);

  // Load Initial Data
  useEffect(() => {
    const loadData = async () => {
      // 1. Load Student
      const storedId = localStorage.getItem("studentId");
      if (!storedId) { navigate(createPageUrl("StudentOnboarding")); return; }
      const s = await Student.get(storedId);
      setStudent(s);

      // 2. Load Exercises
      const { data, error } = await supabase.from('writing_exercises').select('*').order('id');
      if (data) setExercises(data);
    };
    loadData();
  }, []);

  // دالة تحليل النص باستخدام الذكاء الاصطناعي
  const analyzeWriting = async () => {
    if (!studentText.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      // Prompt هندسة الأوامر للمعلم الذكي
      const prompt = `
        أنت معلم لغة عربية محترف ومصحح لغوي دقيق.
        قام طالب في ${selectedExercise.grade_level} بكتابة النص التالي لموضوع بعنوان "${selectedExercise.title}".
        
        النص: "${studentText}"

        المطلوب: قم بتحليل النص وإرجاع JSON يحتوي على:
        1. score: درجة من 100 بناء على الجودة والإملاء والنحو.
        2. corrections: مصفوفة للأخطاء { original: "الخطأ", correction: "الصواب", type: "إملاء/نحو", explanation: "شرح السبب" }.
        3. feedback: تعليق عام مشجع للطالب (نقطة قوة ونقطة للتحسين).
        4. improved_version: نسخة محسنة من النص بأسلوب أجمل (اختياري).

        JSON Schema:
        {
          "score": number,
          "corrections": [{ "original": string, "correction": string, "type": string, "explanation": string }],
          "feedback": string,
          "improved_version": string
        }
      `;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
            type: "object",
            properties: {
                score: {type: "number"},
                corrections: {type: "array"},
                feedback: {type: "string"},
                improved_version: {type: "string"}
            }
        }
      });

      const result = typeof response === "string" ? JSON.parse(response) : response;
      setAnalysisResult(result);

      // حفظ النتيجة في قاعدة البيانات
      await supabase.from('writing_submissions').insert({
        student_id: student.id,
        exercise_id: selectedExercise.id,
        content: studentText,
        ai_analysis: result,
        score: result.score
      });

    } catch (error) {
      console.error("Analysis Error", error);
      alert("حدث خطأ أثناء التحليل. حاول مرة أخرى.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  // UI Components
  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to={createPageUrl("StudentDashboard")}>
             <Button variant="outline" size="sm"><ArrowLeft className="mr-2 h-4 w-4" /> العودة</Button>
          </Link>
          <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-2">
            <PenTool className="h-8 w-8 text-indigo-600" /> ورشة الكتابة الذكية
          </h1>
        </div>

        {!selectedExercise ? (
          /* ================= قائمة التمارين ================= */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {exercises.map((ex) => (
              <Card key={ex.id} className="hover:shadow-lg transition-all cursor-pointer border-indigo-100" onClick={() => setSelectedExercise(ex)}>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-xl text-indigo-800">{ex.title}</CardTitle>
                  <Badge variant="secondary">{ex.grade_level}</Badge>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 mb-4 line-clamp-2">{ex.prompt}</p>
                  <div className="flex items-center gap-2 text-sm text-slate-500">
                    <BookOpen className="h-4 w-4" />
                    <span>مطلوب: {ex.min_length} كلمة على الأقل</span>
                  </div>
                  <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700">ابدأ الكتابة</Button>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* ================= واجهة الكتابة والتحليل ================= */
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-4">
            
            {/* العمود الأيمن: التعليمات */}
            <div className="lg:col-span-1 space-y-4">
              <Card className="bg-indigo-50 border-indigo-200">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-indigo-900">
                    <Sparkles className="h-5 w-5" /> المطلوب منك
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4 text-right">
                  <p className="font-bold text-lg">{selectedExercise.title}</p>
                  <p className="text-slate-700">{selectedExercise.prompt}</p>
                  
                  <div className="bg-white p-4 rounded-lg">
                    <p className="font-bold text-sm text-indigo-600 mb-2">💡 نصائح مساعدة:</p>
                    <ul className="list-disc list-inside text-sm text-slate-600 space-y-1">
                      {selectedExercise.hints?.map((hint, i) => (
                        <li key={i}>{hint}</li>
                      ))}
                    </ul>
                  </div>

                  <Button variant="outline" className="w-full text-red-500 hover:text-red-600 hover:bg-red-50" onClick={() => {setSelectedExercise(null); setAnalysisResult(null); setStudentText("");}}>
                    تغيير الموضوع
                  </Button>
                </CardContent>
              </Card>
            </div>

            {/* العمود الأوسط: المحرر */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border-2 border-indigo-100 shadow-sm">
                <CardHeader>
                  <CardTitle className="flex justify-between items-center">
                    <span>مساحة الإبداع ✍️</span>
                    <Badge variant={studentText.split(" ").filter(w=>w).length >= selectedExercise.min_length ? "success" : "outline"}>
                       {studentText.split(" ").filter(w=>w).length} / {selectedExercise.min_length} كلمة
                    </Badge>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <textarea
                    className="w-full min-h-[300px] p-4 text-lg leading-relaxed border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-slate-50"
                    placeholder="ابدأ بالكتابة هنا..."
                    value={studentText}
                    onChange={(e) => setStudentText(e.target.value)}
                    dir="rtl"
                    disabled={isAnalyzing || analysisResult}
                  />
                  
                  {!analysisResult ? (
                      <Button 
                        onClick={analyzeWriting} 
                        disabled={isAnalyzing || studentText.length < 10}
                        className="w-full mt-4 py-6 text-lg bg-green-600 hover:bg-green-700"
                      >
                        {isAnalyzing ? (
                          <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> جارٍ التحليل...</>
                        ) : (
                          <><Send className="mr-2 h-5 w-5" /> تسليم للمراجعة</>
                        )}
                      </Button>
                  ) : (
                      <Button onClick={() => {setAnalysisResult(null);}} variant="outline" className="w-full mt-4">
                        تعديل النص والمحاولة مجدداً
                      </Button>
                  )}
                </CardContent>
              </Card>

              {/* ================= عرض النتائج ================= */}
              {analysisResult && (
                <div className="space-y-6 animate-in zoom-in duration-300">
                  
                  {/* ملخص الدرجة */}
                  <Card className={`border-2 ${analysisResult.score >= 80 ? "border-green-500 bg-green-50" : analysisResult.score >= 50 ? "border-yellow-500 bg-yellow-50" : "border-red-500 bg-red-50"}`}>
                    <CardContent className="p-6 flex items-center justify-between">
                      <div>
                        <h3 className="text-2xl font-bold mb-1">النتيجة النهائية</h3>
                        <p className="text-slate-700">{analysisResult.feedback}</p>
                      </div>
                      <div className="text-center bg-white p-4 rounded-full shadow-sm w-24 h-24 flex items-center justify-center border-4 border-current">
                        <span className="text-3xl font-bold">{analysisResult.score}</span>
                      </div>
                    </CardContent>
                  </Card>

                  {/* تفاصيل التصحيح */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* الأخطاء */}
                    <Card>
                      <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><AlertCircle /> ملاحظات وتصحيحات</CardTitle></CardHeader>
                      <CardContent>
                        {analysisResult.corrections?.length > 0 ? (
                          <ul className="space-y-3">
                            {analysisResult.corrections.map((corr, idx) => (
                              <li key={idx} className="bg-red-50 p-3 rounded-lg border border-red-100 text-right">
                                <div className="flex gap-2 font-bold text-red-700">
                                  <span className="line-through opacity-70">{corr.original}</span>
                                  <span>←</span>
                                  <span className="text-green-700">{corr.correction}</span>
                                </div>
                                <p className="text-xs text-slate-600 mt-1">{corr.explanation} ({corr.type})</p>
                              </li>
                            ))}
                          </ul>
                        ) : (
                          <div className="text-center py-8 text-green-600">
                            <CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" />
                            <p>ما شاء الله! لا توجد أخطاء واضحة.</p>
                          </div>
                        )}
                      </CardContent>
                    </Card>

                    {/* النسخة المحسنة */}
                    <Card>
                      <CardHeader><CardTitle className="text-indigo-600 flex items-center gap-2"><Sparkles /> نسخة مقترحة (للفائدة)</CardTitle></CardHeader>
                      <CardContent>
                        <p className="text-slate-700 leading-loose bg-indigo-50 p-4 rounded-lg border border-indigo-100 text-justify">
                          {analysisResult.improved_version}
                        </p>
                      </CardContent>
                    </Card>
                  </div>

                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
