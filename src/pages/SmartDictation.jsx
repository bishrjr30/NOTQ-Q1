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
  Loader2,
  BookOpen,
  Lightbulb
} from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { supabase } from "@/api/supabaseClient";
import { InvokeLLM } from "@/api/integrations";
import { Student } from "@/api/entities";
import { motion, AnimatePresence } from "framer-motion";

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
  
  const [availableVoices, setAvailableVoices] = useState([]);
  const audioRef = useRef(null);

  useEffect(() => {
    const init = async () => {
      const storedId = localStorage.getItem("studentId");
      if (!storedId) { navigate(createPageUrl("StudentOnboarding")); return; }
      const s = await Student.get(storedId);
      setStudent(s);

      const { data } = await supabase.from('dictation_exercises').select('*');
      if (data) setExercises(data);

      const loadVoices = () => {
        const voices = window.speechSynthesis.getVoices();
        const arabicVoices = voices.filter(v => v.lang.includes('ar'));
        setAvailableVoices(arabicVoices);
      };
      loadVoices();
      window.speechSynthesis.onvoiceschanged = loadVoices;
    };
    init();
  }, [navigate]);

  const playDictation = () => {
    if (!currentExercise) return;
    window.speechSynthesis.cancel();
    setIsPlaying(true);

    const utterance = new SpeechSynthesisUtterance(currentExercise.text_content);
    utterance.lang = 'ar-SA'; 
    utterance.rate = 0.85; 

    if (availableVoices.length > 0) {
        const bestVoice = availableVoices.find(v => v.name.includes("Google") || v.name.includes("Microsoft")) 
                          || availableVoices[0];
        if (bestVoice) utterance.voice = bestVoice;
    }

    utterance.onend = () => setIsPlaying(false);
    utterance.onerror = () => { setIsPlaying(false); alert("تأكد من رفع صوت الجهاز."); };
    window.speechSynthesis.speak(utterance);
  };

  const submitDictation = async () => {
    if (!studentInput.trim()) return;
    setIsAnalyzing(true);

    try {
      const correctText = currentExercise.text_content;
      const prompt = `
        أنت مصحح إملائي خبير. قارن بين النص الأصلي والنص الذي كتبه الطالب.
        النص الأصلي: "${correctText}"
        نص الطالب: "${studentInput}"
        المهمة: استخرج الأخطاء الإملائية (الهمزات، التاء، الهاء) واشرح القاعدة. أعط درجة من 100.
        Output JSON: { "score": number, "mistakes": [{ "word_written": "", "correct_word": "", "rule": "" }], "feedback": "" }
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
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50 to-white p-4 md:p-8 font-sans" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      <div className="max-w-7xl mx-auto flex flex-col gap-8">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <Link to={createPageUrl("StudentDashboard")}>
             <Button variant="outline" size="sm" className="bg-white hover:bg-slate-100 border-slate-200 shadow-sm">
                <ArrowLeft className="ml-2 h-4 w-4" /> العودة للوحة التحكم
             </Button>
          </Link>
          <div className="flex items-center gap-3">
            <h1 className="text-3xl font-bold text-indigo-900">الإملاء الذكي</h1>
            <div className="bg-indigo-100 p-2 rounded-lg">
                <Keyboard className="h-6 w-6 text-indigo-600" />
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* === Main Content Area (8 Cols) === */}
            <div className="lg:col-span-8">
                <AnimatePresence mode="wait">
                {!currentExercise ? (
                    /* Exercise Selection Grid */
                    <motion.div 
                        key="list"
                        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="grid grid-cols-1 sm:grid-cols-2 gap-6"
                    >
                        {exercises.length > 0 ? (
                            exercises.map((ex, i) => (
                                <motion.div key={ex.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.1 }}>
                                <Card 
                                    className="hover:shadow-xl transition-all cursor-pointer border-0 shadow-md group hover:-translate-y-1 duration-300 h-full bg-white"
                                    onClick={() => setCurrentExercise(ex)}
                                >
                                    <CardHeader className="bg-gradient-to-r from-indigo-500 to-blue-600 text-white rounded-t-xl p-5">
                                    <CardTitle className="text-lg font-bold arabic-text">{ex.title}</CardTitle>
                                    </CardHeader>
                                    <CardContent className="p-6">
                                    <div className="flex flex-wrap gap-2 mt-2">
                                        <Badge variant="secondary" className="bg-indigo-50 text-indigo-700 hover:bg-indigo-100">{ex.grade_level}</Badge>
                                        <Badge variant="outline" className="border-indigo-200 text-slate-600">{ex.difficulty}</Badge>
                                    </div>
                                    <Button className="w-full mt-6 bg-white text-indigo-600 border-2 border-indigo-100 hover:bg-indigo-50 hover:border-indigo-200 font-bold shadow-sm transition-all">
                                        ابدأ التمرين
                                    </Button>
                                    </CardContent>
                                </Card>
                                </motion.div>
                            ))
                        ) : (
                            <div className="col-span-2 text-center py-12 bg-white rounded-2xl shadow-sm border border-dashed border-slate-300">
                                <p className="text-slate-500 arabic-text">جاري تحميل التمارين...</p>
                            </div>
                        )}
                    </motion.div>
                ) : (
                    /* Active Exercise View */
                    <motion.div 
                        key="exercise"
                        initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} exit={{ x: -50, opacity: 0 }}
                    >
                    <Card className="border-0 shadow-2xl overflow-hidden bg-white/90 backdrop-blur-sm">
                        <div className="h-2 bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500"></div>
                        <CardHeader className="flex flex-row items-center justify-between pb-2 bg-slate-50/50">
                        <CardTitle className="text-2xl text-indigo-900 arabic-text">{currentExercise.title}</CardTitle>
                        <Button variant="ghost" size="sm" onClick={() => {setCurrentExercise(null); resetExercise();}} className="text-slate-500 hover:text-red-500 hover:bg-red-50">
                            تغيير التمرين
                        </Button>
                        </CardHeader>
                        
                        <CardContent className="p-6 md:p-8 space-y-8">
                        
                        {/* Audio Player */}
                        <div className="flex flex-col items-center justify-center py-8 bg-slate-50 rounded-3xl border-2 border-dashed border-indigo-100 relative group transition-colors hover:border-indigo-300">
                            <motion.button 
                            whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                            onClick={playDictation} 
                            disabled={isPlaying}
                            className={`relative z-10 w-24 h-24 rounded-full shadow-xl flex items-center justify-center text-white text-3xl transition-all ${isPlaying ? "bg-slate-400 cursor-not-allowed" : "bg-gradient-to-br from-indigo-500 to-purple-600 hover:shadow-2xl hover:shadow-indigo-200"}`}
                            >
                            {isPlaying ? <Loader2 className="animate-spin w-10 h-10" /> : <Volume2 className="w-10 h-10" />}
                            </motion.button>
                            <p className="mt-4 font-bold text-slate-700 relative z-10 arabic-text text-lg">
                            {isPlaying ? "جاري الاستماع..." : "اضغط للاستماع للجملة 🎧"}
                            </p>
                        </div>

                        {/* Input Area */}
                        <div className="space-y-3">
                            <label className="text-sm font-bold text-slate-600 flex items-center gap-2 arabic-text">
                            <Keyboard className="w-4 h-4 text-indigo-500" /> مساحة الكتابة
                            </label>
                            <Textarea 
                            value={studentInput}
                            onChange={(e) => setStudentInput(e.target.value)}
                            placeholder="اكتب الجملة التي سمعتها هنا بدقة..."
                            className="text-xl p-5 min-h-[160px] border-2 border-slate-200 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 rounded-2xl resize-none shadow-inner bg-white leading-loose arabic-text"
                            dir="rtl"
                            disabled={!!result}
                            />
                        </div>

                        {/* Action Button */}
                        {!result ? (
                            <Button 
                            onClick={submitDictation} 
                            disabled={isAnalyzing || !studentInput}
                            className="w-full py-7 text-xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white shadow-lg shadow-emerald-100 rounded-2xl transition-all arabic-text font-bold"
                            >
                            {isAnalyzing ? <><Loader2 className="mr-2 animate-spin" /> جاري التصحيح الذكي...</> : "تحقق من إجابتي ✅"}
                            </Button>
                        ) : (
                            /* Results View */
                            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-6 bg-slate-50 p-6 rounded-2xl border border-slate-200">
                            
                            <div className="flex items-center gap-4 bg-white p-4 rounded-xl shadow-sm border border-slate-100">
                                <div className={`w-16 h-16 rounded-full flex items-center justify-center text-2xl font-bold border-4 ${result.score >= 90 ? "bg-green-50 border-green-500 text-green-700" : "bg-orange-50 border-orange-500 text-orange-700"}`}>
                                {result.score}%
                                </div>
                                <div>
                                <h4 className="font-bold text-lg arabic-text text-slate-800">النتيجة النهائية</h4>
                                <p className="text-sm text-slate-500 arabic-text">{result.feedback}</p>
                                </div>
                            </div>

                            <div className="bg-indigo-50 p-5 rounded-xl border border-indigo-100">
                                <p className="text-xs text-indigo-500 font-bold uppercase mb-2 arabic-text">النص الصحيح</p>
                                <p className="text-xl font-bold text-indigo-900 arabic-text leading-relaxed">{currentExercise.text_content}</p>
                            </div>

                            {result.mistakes && result.mistakes.length > 0 ? (
                                <div className="space-y-3">
                                <h4 className="font-bold text-red-500 text-sm flex items-center gap-2 arabic-text"><AlertTriangle className="w-4 h-4"/> تصحيح الأخطاء</h4>
                                {result.mistakes.map((m, idx) => (
                                    <div key={idx} className="bg-white p-3 rounded-xl border border-red-100 flex flex-col sm:flex-row gap-4 items-start sm:items-center shadow-sm">
                                    <div className="flex items-center gap-3 text-lg font-medium arabic-text">
                                        <span className="text-red-500 line-through decoration-2 decoration-red-300 opacity-80">{m.word_written}</span>
                                        <span className="text-slate-300">➜</span>
                                        <span className="text-green-600 font-bold">{m.correct_word}</span>
                                    </div>
                                    <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200 text-xs py-1 arabic-text">
                                        {m.rule}
                                    </Badge>
                                    </div>
                                ))}
                                </div>
                            ) : (
                                <div className="text-center py-6 text-green-600 bg-green-50 rounded-xl border border-green-100 arabic-text">
                                <CheckCircle className="w-12 h-12 mx-auto mb-2 opacity-50" />
                                <p className="font-bold">مذهل! إملاء صحيح 100% ✨</p>
                                </div>
                            )}

                            <Button onClick={resetExercise} variant="outline" className="w-full border-2 border-indigo-100 text-indigo-600 hover:bg-indigo-50 h-12 rounded-xl arabic-text font-bold">
                                <RotateCcw className="ml-2 h-4 w-4" /> محاولة تمرين آخر
                            </Button>
                            </motion.div>
                        )}

                        </CardContent>
                    </Card>
                    </motion.div>
                )}
                </AnimatePresence>
            </div>

            {/* === Sidebar / Educational Content (4 Cols) - New for AdSense === */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Info Card 1 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-blue-100 p-2 rounded-lg text-blue-600">
                            <BookOpen className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 arabic-text">لماذا الإملاء مهم؟</h3>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed arabic-text text-justify">
                        الإملاء ليس مجرد كتابة كلمات، بل هو عملية عقلية معقدة تربط بين **الاستماع** (التمييز السمعي) و **الذاكرة** (استرجاع شكل الكلمة) و **الحركة** (الكتابة).
                        التدريب المستمر على الإملاء يحسن من مهاراتك في القراءة والفهم، ويجعل كتابتك الأكاديمية والمهنية أكثر احترافية.
                    </p>
                </div>

                {/* Info Card 2 */}
                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                    <div className="flex items-center gap-3 mb-4">
                        <div className="bg-yellow-100 p-2 rounded-lg text-yellow-600">
                            <Lightbulb className="w-5 h-5" />
                        </div>
                        <h3 className="font-bold text-slate-800 arabic-text">نصائح ذهبية</h3>
                    </div>
                    <ul className="space-y-3">
                        <li className="text-sm text-slate-600 flex gap-2 arabic-text">
                            <span className="text-yellow-500">•</span>
                            <span>استمع للجملة كاملة قبل البدء بالكتابة لفهم السياق.</span>
                        </li>
                        <li className="text-sm text-slate-600 flex gap-2 arabic-text">
                            <span className="text-yellow-500">•</span>
                            <span>انتبه للفرق بين التاء المربوطة (ـة) والهاء (ـه).</span>
                        </li>
                        <li className="text-sm text-slate-600 flex gap-2 arabic-text">
                            <span className="text-yellow-500">•</span>
                            <span>راجع الهمزات (أ، إ، ؤ، ئ) فهي أكثر الأخطاء شيوعاً.</span>
                        </li>
                    </ul>
                </div>

                {/* Ad Placeholder (مكان لإعلان أدسنس مستقبلاً) */}
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-2xl h-40 flex items-center justify-center text-slate-400 text-sm arabic-text">
                    مساحة إعلانية
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}
