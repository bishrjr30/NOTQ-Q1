// src/pages/SmartDictation.jsx

import React, { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  Mic,
  Play,
  CheckCircle,
  AlertTriangle,
  RotateCcw,
  ArrowLeft,
  Keyboard,
  Volume2,
  Loader2
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import { InvokeLLM } from "@/api/integrations";
import { Student } from "@/api/entities";

export default function SmartDictation() {
  const navigate = useNavigate();
  
  // States
  const [exercises, setExercises] = useState([]);
  const [currentExercise, setCurrentExercise] = useState(null);
  const [studentInput, setStudentInput] = useState("");
  const [isPlaying, setIsPlaying] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [student, setStudent] = useState(null);
  
  // تخزين الأصوات المتاحة
  const [availableVoices, setAvailableVoices] = useState([]);

  // تحميل البيانات والأصوات
  useEffect(() => {
    const init = async () => {
      // 1. التحقق من الطالب
      const storedId = localStorage.getItem("studentId");
      if (!storedId) { navigate(createPageUrl("StudentOnboarding")); return; }
      const s = await Student.get(storedId);
      setStudent(s);

      // 2. جلب التمارين
      const { data } = await supabase.from('dictation_exercises').select('*');
      if (data) setExercises(data);

      // 3. تحميل الأصوات الذكية من المتصفح
      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        // تصفية الأصوات العربية فقط
        const arabicVoices = voices.filter(v => v.lang.includes('ar'));
        setAvailableVoices(arabicVoices);
      };

      loadVoices();
      // بعض المتصفحات تحتاج وقت لتحميل الأصوات
      window.speechSynthesis.onvoiceschanged = loadVoices;
    };
    init();
  }, [navigate]);

  // ✅ دالة تشغيل الصوت الذكية (بدون سيرفر)
  const playDictation = () => {
    if (!currentExercise) return;
    
    // إيقاف أي صوت سابق
    window.speechSynthesis.cancel();

    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(currentExercise.text_content);
    utterance.lang = 'ar-SA'; // لغة عربية
    utterance.rate = 0.85; // سرعة طبيعية للإملاء

    // 💡 السحر هنا: محاولة اختيار أفضل صوت متاح (Google أو Microsoft)
    if (availableVoices.length > 0) {
        // نفضل صوت "Google" أو "Microsoft" لأنهما الأفضل جودة
        const bestVoice = availableVoices.find(v => v.name.includes("Google") || v.name.includes("Microsoft")) 
                          || availableVoices[0];
        if (bestVoice) {
            utterance.voice = bestVoice;
        }
    }

    utterance.onend = () => {
      setIsPlaying(false);
    };

    utterance.onerror = (e) => {
      console.error("Speech Error:", e);
      setIsPlaying(false);
      alert("تعذر تشغيل الصوت. تأكد من رفع صوت الجهاز.");
    };

    window.speechSynthesis.speak(utterance);
  };

  // إرسال الإجابة للتحليل
  const submitDictation = async () => {
    if (!studentInput.trim()) return;
    setIsAnalyzing(true);

    try {
      const correctText = currentExercise.text_content;
      
      const prompt = `
        أنت مصحح إملائي خبير. قارن بين النص الأصلي والنص الذي كتبه الطالب.
        النص الأصلي: "${correctText}"
        نص الطالب: "${studentInput}"

        المهمة:
        1. حدد الأخطاء الإملائية بدقة (خاصة الهمزات، التاء المربوطة، الهاء).
        2. اشرح سبب الخطأ باختصار (قاعدة إملائية).
        3. أعط درجة من 100.

        Output JSON format:
        {
          "score": number,
          "mistakes": [
            { "word_written": "الكلمة الخطأ", "correct_word": "الصواب", "rule": "شرح القاعدة" }
          ],
          "feedback": "تعليق عام"
        }
      `;

      const response = await InvokeLLM({
        prompt: prompt,
        response_json_schema: {
            type: "object",
            properties: {
                score: {type: "number"},
                mistakes: {
                    type: "array",
                    items: {
                        type: "object",
                        properties: {
                            word_written: {type: "string"},
                            correct_word: {type: "string"},
                            rule: {type: "string"}
                        },
                        required: ["word_written", "correct_word", "rule"]
                    }
                },
                feedback: {type: "string"}
            },
            required: ["score", "mistakes", "feedback"]
        }
      });

      const analysis = typeof response === "string" ? JSON.parse(response) : response;
      setResult(analysis);

      await supabase.from('dictation_submissions').insert({
        student_id: student.id,
        exercise_id: currentExercise.id,
        student_input: studentInput,
        score: analysis.score,
        mistakes_analysis: analysis
      });

    } catch (err) {
      console.error(err);
      alert("حدث خطأ أثناء التصحيح.");
    } finally {
      setIsAnalyzing(false);
    }
  };

  const resetExercise = () => {
    setResult(null);
    setStudentInput("");
    window.speechSynthesis.cancel();
    setIsPlaying(false);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 font-sans" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-6">
          <Link to={createPageUrl("StudentDashboard")}>
             <Button variant="outline" size="sm"><ArrowLeft className="ml-2 h-4 w-4" /> العودة</Button>
          </Link>
          <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-2">
            <Keyboard className="h-8 w-8 text-indigo-600" /> الإملاء الذكي
          </h1>
        </div>

        {!currentExercise ? (
          /* قائمة التمارين */
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exercises.map((ex) => (
              <Card key={ex.id} className="hover:shadow-md transition-shadow cursor-pointer border-l-4 border-l-indigo-500" onClick={() => setCurrentExercise(ex)}>
                <CardContent className="p-6">
                  <h3 className="font-bold text-xl text-indigo-900 mb-2">{ex.title}</h3>
                  <div className="flex gap-2">
                    <Badge variant="secondary">{ex.grade_level}</Badge>
                    <Badge variant="outline">{ex.difficulty}</Badge>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          /* واجهة التمرين */
          <div className="space-y-6 animate-in slide-in-from-bottom-4">
            <Card className="border-2 border-indigo-100">
              <CardHeader className="bg-indigo-50 border-b border-indigo-100">
                <div className="flex justify-between items-center">
                    <CardTitle className="text-indigo-900">{currentExercise.title}</CardTitle>
                    <Button variant="ghost" onClick={() => {setCurrentExercise(null); resetExercise();}}>تغيير التمرين</Button>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                
                {/* زر التشغيل */}
                <div className="text-center py-8 bg-slate-50 rounded-xl border-2 border-dashed border-slate-200">
                  <Button 
                    onClick={playDictation} 
                    disabled={isPlaying}
                    className={`h-24 w-24 rounded-full shadow-xl text-xl transition-all ${isPlaying ? "bg-green-500 hover:bg-green-600 animate-pulse" : "bg-indigo-600 hover:bg-indigo-700 hover:scale-105"}`}
                  >
                    {isPlaying ? <Volume2 className="h-10 w-10 animate-bounce" /> : <Play className="h-10 w-10" />}
                  </Button>
                  <p className="mt-4 text-slate-600 font-bold">
                    {isPlaying ? "استمع جيداً..." : "اضغط للاستماع للجملة 🎧"}
                  </p>
                  <p className="text-xs text-slate-400">
                    {availableVoices.length > 0 ? "صوت ذكي عالي الجودة" : "جاري تحميل الأصوات..."}
                  </p>
                </div>

                {/* منطقة الكتابة */}
                <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">اكتب ما سمعته هنا:</label>
                    <Textarea 
                        value={studentInput}
                        onChange={(e) => setStudentInput(e.target.value)}
                        placeholder="ابدأ الكتابة..."
                        className="text-lg p-4 min-h-[120px] border-2 focus:border-indigo-500"
                        dir="rtl"
                        disabled={!!result}
                    />
                </div>

                {/* الأزرار */}
                {!result ? (
                    <Button 
                        onClick={submitDictation} 
                        disabled={isAnalyzing || !studentInput}
                        className="w-full py-6 text-lg bg-green-600 hover:bg-green-700"
                    >
                        {isAnalyzing ? "جارٍ التصحيح..." : "تصحيح الإملاء ✅"}
                    </Button>
                ) : (
                    /* عرض النتيجة */
                    <div className="space-y-6 animate-in zoom-in">
                        <div className={`p-4 rounded-lg border text-center ${result.score === 100 ? "bg-green-50 border-green-200" : "bg-orange-50 border-orange-200"}`}>
                            <div className="text-4xl font-bold mb-2">{result.score}%</div>
                            <p className="font-bold">{result.feedback}</p>
                        </div>

                        {/* النص الصحيح */}
                        <div className="bg-slate-100 p-4 rounded-lg border border-slate-300">
                            <p className="text-sm text-slate-500 mb-1">النص الصحيح:</p>
                            <p className="text-xl font-bold text-slate-800">{currentExercise.text_content}</p>
                        </div>

                        {/* جدول الأخطاء */}
                        {result.mistakes && result.mistakes.length > 0 ? (
                            <div className="space-y-3">
                                <h4 className="font-bold text-red-600 flex items-center gap-2"><AlertTriangle className="h-5 w-5"/> أخطاء تحتاج للانتباه:</h4>
                                {result.mistakes.map((m, idx) => (
                                    <div key={idx} className="flex flex-col sm:flex-row gap-4 p-3 bg-red-50 border border-red-100 rounded-lg items-start sm:items-center">
                                        <div className="flex items-center gap-2 text-lg">
                                            <span className="line-through text-red-500 decoration-2">{m.word_written}</span>
                                            <span className="text-slate-400">←</span>
                                            <span className="text-green-600 font-bold">{m.correct_word}</span>
                                        </div>
                                        <div className="text-sm text-slate-600 bg-white px-3 py-1 rounded-full border border-slate-200">
                                            💡 {m.rule}
                                        </div>
                                    </div>
                                ))}
                            </div>
                        ) : (
                            <div className="text-green-600 font-bold flex items-center gap-2 justify-center py-4">
                                <CheckCircle className="h-6 w-6" /> إملاء ممتاز! لا توجد أخطاء.
                            </div>
                        )}

                        <Button onClick={resetExercise} variant="outline" className="w-full">
                            <RotateCcw className="ml-2 h-4 w-4" /> محاولة مرة أخرى
                        </Button>
                    </div>
                )}

              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </div>
  );
}
