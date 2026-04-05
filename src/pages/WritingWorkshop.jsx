// src/pages/WritingWorkshop.jsx

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BookOpen,
  PenTool,
  Send,
  Loader2,
  CheckCircle,
  AlertCircle,
  Sparkles,
  ArrowLeft,
  Lightbulb,
  FileText
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
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

  // AI Analysis Function
  const analyzeWriting = async () => {
    if (!studentText.trim()) return;
    setIsAnalyzing(true);
    setAnalysisResult(null);

    try {
      const prompt = `
        Act as an expert Arabic language teacher. Analyze the following student text for exercise "${selectedExercise.title}".
        Student Text: "${studentText}"
        Provide: 1. Score/100. 2. Corrections (original, corrected, explanation). 3. Feedback. 4. Improved Version.
        Return JSON: { "score": number, "corrections": [{ "original": "", "correction": "", "type": "", "explanation": "" }], "feedback": "", "improved_version": "" }
      `;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
            type: "object",
            properties: {
                score: {type: "number"},
                corrections: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            original: {type: "string"},
                            correction: {type: "string"},
                            type: {type: "string"},
                            explanation: {type: "string"}
                        },
                        required: ["original", "correction", "type", "explanation"]
                    }
                },
                feedback: {type: "string"},
                improved_version: {type: "string"}
            },
            required: ["score", "corrections", "feedback", "improved_version"]
        }
      });

      const result = typeof response === "string" ? JSON.parse(response) : response;
      setAnalysisResult(result);

      await supabase.from('writing_submissions').insert({
        student_id: student.id,
        exercise_id: selectedExercise.id,
        content: studentText,
        ai_analysis: result,
        score: result.score
      });

    } catch (error) {
      console.error("Analysis Error", error);
      alert("حدث خطأ أثناء التحليل.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      <div className="max-w-7xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <Link to={createPageUrl("StudentDashboard")}>
             <Button variant="outline" size="sm" className="bg-white hover:bg-slate-100"><ArrowLeft className="mr-2 h-4 w-4" /> العودة</Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-indigo-900">ورشة الكتابة</h1>
            <div className="bg-indigo-100 p-2 rounded-lg">
                <PenTool className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* === Main Content Area (8 Cols) === */}
            <div className="lg:col-span-8">
                {!selectedExercise ? (
                /* Exercise List */
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    {exercises.length > 0 ? (
                        exercises.map((ex) => (
                        <Card key={ex.id} className="hover:shadow-lg transition-all cursor-pointer border-indigo-100 bg-white" onClick={() => setSelectedExercise(ex)}>
                            <CardHeader className="flex flex-row items-center justify-between pb-2">
                            <CardTitle className="text-xl text-indigo-800">{ex.title}</CardTitle>
                            <Badge variant="secondary" className="bg-indigo-50 text-indigo-700">{ex.grade_level}</Badge>
                            </CardHeader>
                            <CardContent>
                            <p className="text-slate-600 mb-4 line-clamp-2">{ex.prompt}</p>
                            <div className="flex items-center gap-2 text-sm text-slate-500">
                                <BookOpen className="h-4 w-4" />
                                <span>مطلوب: {ex.min_length} كلمة</span>
                            </div>
                            <Button className="w-full mt-4 bg-indigo-600 hover:bg-indigo-700 text-white font-bold">ابدأ الكتابة</Button>
                            </CardContent>
                        </Card>
                        ))
                    ) : (
                        <div className="col-span-2 text-center py-12 bg-white rounded-xl shadow-sm border border-dashed border-slate-300">
                            <p className="text-slate-500">جاري تحميل المواضيع...</p>
                        </div>
                    )}
                </div>
                ) : (
                /* Writing Interface */
                <div className="space-y-6 animate-in slide-in-from-bottom-4">
                    
                    {/* Prompt Card */}
                    <Card className="bg-indigo-50 border-indigo-200">
                        <CardHeader>
                        <CardTitle className="flex items-center gap-2 text-indigo-900">
                            <Sparkles className="h-5 w-5" /> موضوع الكتابة: {selectedExercise.title}
                        </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                        <p className="text-slate-800 font-medium leading-relaxed">{selectedExercise.prompt}</p>
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" onClick={() => {setSelectedExercise(null); setAnalysisResult(null); setStudentText("");}} className="text-red-500 hover:text-red-600 hover:bg-red-50 border-red-200">
                                اختيار موضوع آخر
                            </Button>
                        </div>
                        </CardContent>
                    </Card>

                    {/* Editor */}
                    <Card className="border-2 border-indigo-100 shadow-sm">
                        <CardHeader>
                        <CardTitle className="flex justify-between items-center text-base">
                            <span>اكتب موضوعك هنا ✍️</span>
                            <Badge variant={studentText.split(" ").filter(w=>w).length >= selectedExercise.min_length ? "success" : "outline"}>
                            {studentText.split(" ").filter(w=>w).length} / {selectedExercise.min_length} كلمة
                            </Badge>
                        </CardTitle>
                        </CardHeader>
                        <CardContent>
                        <textarea
                            className="w-full min-h-[300px] p-4 text-lg leading-loose border rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent outline-none resize-none bg-slate-50"
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
                                className="w-full mt-4 py-6 text-lg bg-green-600 hover:bg-green-700 text-white shadow-md font-bold"
                            >
                                {isAnalyzing ? <><Loader2 className="mr-2 h-5 w-5 animate-spin" /> جاري التحليل...</> : <><Send className="mr-2 h-5 w-5" /> تسليم للمراجعة</>}
                            </Button>
                        ) : (
                            <Button onClick={() => {setAnalysisResult(null);}} variant="outline" className="w-full mt-4 border-indigo-200 text-indigo-600 hover:bg-indigo-50">
                                تعديل النص والمحاولة مجدداً
                            </Button>
                        )}
                        </CardContent>
                    </Card>

                    {/* Results */}
                    {analysisResult && (
                        <div className="space-y-6 animate-in zoom-in duration-300">
                        <Card className={`border-2 ${analysisResult.score >= 80 ? "border-green-500 bg-green-50" : "border-orange-500 bg-orange-50"}`}>
                            <CardContent className="p-6 flex items-center justify-between">
                            <div>
                                <h3 className="text-2xl font-bold mb-1 text-slate-800">النتيجة النهائية</h3>
                                <p className="text-slate-600">{analysisResult.feedback}</p>
                            </div>
                            <div className="text-center bg-white p-4 rounded-full shadow-sm w-24 h-24 flex items-center justify-center border-4 border-current">
                                <span className="text-3xl font-bold">{analysisResult.score}</span>
                            </div>
                            </CardContent>
                        </Card>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <Card>
                            <CardHeader><CardTitle className="text-red-600 flex items-center gap-2"><AlertCircle /> التصحيحات</CardTitle></CardHeader>
                            <CardContent>
                                {analysisResult.corrections?.length > 0 ? (
                                <ul className="space-y-3">
                                    {analysisResult.corrections.map((corr, idx) => (
                                    <li key={idx} className="bg-red-50 p-3 rounded-lg border border-red-100 text-right">
                                        <div className="flex gap-2 font-bold text-red-700 flex-wrap">
                                        <span className="line-through opacity-70">{corr.original}</span>
                                        <span>←</span>
                                        <span className="text-green-700">{corr.correction}</span>
                                        </div>
                                        <p className="text-xs text-slate-600 mt-1">{corr.explanation}</p>
                                    </li>
                                    ))}
                                </ul>
                                ) : <div className="text-center py-8 text-green-600"><CheckCircle className="h-12 w-12 mx-auto mb-2 opacity-50" /><p>نص سليم 100%!</p></div>}
                            </CardContent>
                            </Card>

                            <Card>
                            <CardHeader><CardTitle className="text-indigo-600 flex items-center gap-2"><Sparkles /> النسخة المحسنة</CardTitle></CardHeader>
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
                )}
            </div>

            {/* === Sidebar / Educational Content (4 Cols) - AdSense Rich Content === */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Writing Tips Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                            <Lightbulb className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 arabic-text">أساسيات الكتابة</h3>
                    </div>
                    <ul className="space-y-4">
                        <li className="text-sm text-slate-600 arabic-text">
                            <strong className="text-indigo-700 block mb-1">1. المقدمة الجذابة:</strong>
                            ابدأ موضوعك بجملة قوية تشد انتباه القارئ وتمهد للموضوع.
                        </li>
                        <li className="text-sm text-slate-600 arabic-text">
                            <strong className="text-indigo-700 block mb-1">2. تسلسل الأفكار:</strong>
                            رتب أفكارك في فقرات مترابطة، بحيث تناقش كل فقرة فكرة واحدة رئيسية.
                        </li>
                        <li className="text-sm text-slate-600 arabic-text">
                            <strong className="text-indigo-700 block mb-1">3. الخاتمة المؤثرة:</strong>
                            لخص أهم ما ذكرته في الموضوع واختم بحكمة أو سؤال مفتوح.
                        </li>
                    </ul>
                </div>

                {/* Style Tips Card */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-green-100 p-2 rounded-lg text-green-600">
                            <FileText className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 arabic-text">تحسين الأسلوب</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed arabic-text text-justify mb-4">
                        الكتابة الجيدة تعتمد على التنوع. حاول استخدام مترادفات مختلفة بدلاً من تكرار نفس الكلمة. استخدم أدوات الربط (مثل: بالإضافة إلى ذلك، ومن ناحية أخرى) لجعل نصك متماسكاً.
                    </p>
                </div>

                {/* Ad Placeholder */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-60 flex items-center justify-center text-slate-400 text-sm arabic-text">
                    مساحة إعلانية
                </div>

            </div>

        </div>
      </div>
    </div>
  );
}
