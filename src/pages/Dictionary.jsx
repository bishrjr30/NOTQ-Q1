// src/pages/Dictionary.jsx

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Volume2, 
  BookOpen, 
  ArrowLeft, 
  Loader2, 
  Star, 
  Lightbulb, 
  Library, 
  Quote 
} from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";
import { InvokeLLM } from "@/api/integrations";

// بيانات ثابتة لإثراء المحتوى (لأدسنس)
const COMMON_WORDS = [
  { word: "التفاؤل", type: "اسم", def: "النظر إلى الجانب الأفضل للأحداث." },
  { word: "الإيثار", type: "اسم", def: "تفضيل الغير على النفس." },
  { word: "المثابرة", type: "اسم", def: "المواظبة والملازمة على الأمر." },
  { word: "البلاغة", type: "اسم", def: "فصاحة اللسان وحسن البيان." },
  { word: "الحكمة", type: "اسم", def: "وضع الشيء في موضعه." },
  { word: "الصدق", type: "اسم", def: "قول الحقيقة ومطابقة الواقع." }
];

export default function DictionaryPage() {
  const [searchTerm, setSearchTerm] = useState("");
  const [result, setResult] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!searchTerm.trim()) return;

    setIsLoading(true);
    setError(null);
    setResult(null);

    try {
      const response = await InvokeLLM({
        prompt: `
          قم بتحليل الكلمة العربية التالية: "${searchTerm}"
          
          المطلوب إخراج النتيجة بتنسيق JSON يحتوي على:
          1. word_vowelled: الكلمة مشكولة بالكامل.
          2. definition: تعريف مبسط للكلمة (مناسب للأطفال).
          3. example_sentence: جملة مفيدة ومشكولة تحتوي على الكلمة.
          4. type: نوع الكلمة (اسم، فعل، حرف).
          5. breakdown: تحليل صوتي بسيط (تقطيع الكلمة إلى مقاطع).

          مثال للإخراج:
          {
            "word_vowelled": "المَدْرَسَةُ",
            "definition": "مكان نذهب إليه لنتعلم الدروس والعلوم المفيدة.",
            "example_sentence": "ذَهَبَ أَحْمَدُ إِلَى المَدْرَسَةِ مُبَكِّرًا.",
            "type": "اسم",
            "breakdown": "الـ - ـمَدْ - ـرَ - ـسَـ - ـةُ"
          }
        `,
        response_json_schema: {
          type: "object",
          additionalProperties: false,
          properties: {
            word_vowelled: { type: "string" },
            definition: { type: "string" },
            example_sentence: { type: "string" },
            type: { type: "string" },
            breakdown: { type: "string" },
          },
          required: [
            "word_vowelled",
            "definition",
            "example_sentence",
            "type",
            "breakdown",
          ],
        },
      });

      let parsed = response;
      if (typeof response === "string") {
        try {
          parsed = JSON.parse(response);
        } catch {
          throw new Error("حدث خطأ في معالجة البيانات.");
        }
      }
      setResult(parsed);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text) => {
    if ("speechSynthesis" in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = "ar-SA";
      window.speechSynthesis.speak(utterance);
    } else {
      alert("متصفحك لا يدعم القراءة الصوتية");
    }
  };

  const handleQuickSearch = (word) => {
    setSearchTerm(word);
    // تفعيل البحث تلقائياً للكلمة المختارة
    // (يمكن تفعيلها مباشرة أو ترك المستخدم يضغط بحث)
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-4 md:p-8 font-sans" dir="rtl" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      {/* 🟢 توسيع الحاوية لتملأ الشاشة */}
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Link to={createPageUrl("StudentDashboard")}>
                <Button variant="outline" size="icon" className="rounded-full shadow-md bg-white hover:scale-110 transition-transform">
                <ArrowLeft className="w-5 h-5 text-gray-600" />
                </Button>
            </Link>
            <div>
                <h1 className="text-3xl md:text-4xl font-black text-indigo-900 arabic-text flex items-center gap-3">
                <Library className="text-indigo-600 w-8 h-8 md:w-10 md:h-10" />
                القاموس الصوتي الذكي
                </h1>
                <p className="text-indigo-600 arabic-text text-lg mt-1 opacity-80">
                ابحث، استمع، وتعلم النطق الصحيح للكلمات العربية.
                </p>
            </div>
          </div>
        </motion.div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            
            {/* === Main Search Area (8 Cols) === */}
            <div className="lg:col-span-8 space-y-8">
                
                {/* Search Bar */}
                <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-visible relative z-10">
                    <CardContent className="p-6 md:p-8">
                        <form onSubmit={handleSearch} className="flex flex-col sm:flex-row gap-4 relative">
                            <div className="relative flex-1">
                                <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-indigo-300 w-6 h-6" />
                                <Input
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    placeholder="اكتب الكلمة هنا (مثال: السعادة)..."
                                    className="text-right arabic-text text-xl h-14 pr-12 rounded-xl border-2 border-indigo-100 focus:border-indigo-500 focus:ring-4 focus:ring-indigo-50 transition-all bg-slate-50"
                                />
                            </div>
                            <Button
                                type="submit"
                                size="lg"
                                className="bg-indigo-600 hover:bg-indigo-700 text-white arabic-text h-14 px-8 text-lg rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
                                disabled={isLoading}
                            >
                                {isLoading ? <Loader2 className="w-6 h-6 animate-spin" /> : "بحث وتشكيل"}
                            </Button>
                        </form>
                    </CardContent>
                </Card>

                {/* Result Display */}
                <AnimatePresence mode="wait">
                    {result ? (
                        <motion.div
                            key="result"
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            exit={{ opacity: 0, y: -20 }}
                        >
                            <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-indigo-50 overflow-hidden">
                                <CardHeader className="bg-indigo-600 text-white p-8 text-center relative overflow-hidden">
                                    <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-20" />
                                    <h2 className="text-5xl font-bold arabic-text relative z-10 mb-2 leading-relaxed drop-shadow-md">
                                        {result.word_vowelled}
                                    </h2>
                                    <div className="flex justify-center gap-2 relative z-10">
                                        <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 text-lg px-4 py-1 backdrop-blur-md">
                                            {result.type}
                                        </Badge>
                                    </div>
                                    <Button
                                        size="icon"
                                        variant="ghost"
                                        onClick={() => speakText(result.word_vowelled)}
                                        className="absolute top-6 left-6 text-white hover:bg-white/20 rounded-full h-12 w-12"
                                    >
                                        <Volume2 className="w-8 h-8" />
                                    </Button>
                                </CardHeader>

                                <CardContent className="p-8 space-y-8">
                                    {/* Definition */}
                                    <div className="bg-white rounded-2xl p-6 shadow-sm border border-indigo-100 flex items-start gap-4">
                                        <div className="bg-indigo-100 p-3 rounded-full text-indigo-600 mt-1">
                                            <BookOpen className="w-6 h-6" />
                                        </div>
                                        <div>
                                            <h3 className="text-indigo-900 font-bold mb-2 arabic-text text-xl">التعريف:</h3>
                                            <p className="text-xl text-gray-700 arabic-text leading-loose">{result.definition}</p>
                                        </div>
                                    </div>

                                    {/* Analysis */}
                                    <div className="grid md:grid-cols-2 gap-6">
                                        <div className="bg-blue-50 rounded-2xl p-6 shadow-sm border border-blue-100">
                                            <h3 className="text-blue-900 font-bold mb-4 arabic-text flex items-center gap-2">
                                                <Star className="w-5 h-5" /> التحليل الصوتي:
                                            </h3>
                                            <div className="flex flex-wrap gap-2 justify-center">
                                                {result.breakdown?.split("-").map((part, idx) => (
                                                    <span key={idx} className="bg-white text-blue-700 px-4 py-2 rounded-xl font-bold text-xl shadow-sm border border-blue-100 min-w-[50px] text-center">
                                                        {part.trim()}
                                                    </span>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="bg-green-50 rounded-2xl p-6 shadow-sm border border-green-100">
                                            <h3 className="text-green-900 font-bold mb-4 arabic-text flex items-center gap-2">
                                                <Quote className="w-5 h-5" /> مثال في جملة:
                                            </h3>
                                            <p className="text-xl text-green-800 arabic-text text-center font-medium leading-relaxed">
                                                "{result.example_sentence}"
                                            </p>
                                            <div className="text-center mt-4">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => speakText(result.example_sentence)}
                                                    className="text-green-700 hover:bg-green-100 rounded-full px-4"
                                                >
                                                    <Volume2 className="w-4 h-4 ml-2" /> استمع للجملة
                                                </Button>
                                            </div>
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>
                        </motion.div>
                    ) : (
                        /* Default Content (Before Search) - Important for AdSense */
                        <motion.div
                            key="default"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            className="space-y-8"
                        >
                             <div className="grid md:grid-cols-2 gap-6">
                                {/* Word of the Day */}
                                <Card className="border-0 shadow-lg bg-gradient-to-br from-amber-50 to-orange-50 overflow-hidden relative group hover:shadow-xl transition-all">
                                    <div className="absolute top-0 right-0 p-4 opacity-10">
                                        <Star className="w-32 h-32 text-amber-500" />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-xl text-amber-800 flex items-center gap-2 arabic-text">
                                            <Star className="w-6 h-6 text-amber-500 fill-amber-500" /> كلمة اليوم
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <h2 className="text-4xl font-black text-amber-900 mb-2 arabic-text">الإيثار</h2>
                                        <p className="text-amber-800 text-lg mb-4 arabic-text">هو تفضيل الغير على النفس، وهو قمة الجود والسخاء.</p>
                                        <div className="bg-white/60 p-4 rounded-xl text-amber-900 font-medium italic border border-amber-100">
                                            "وَيُؤْثِرُونَ عَلَىٰ أَنفُسِهِمْ وَلَوْ كَانَ بِهِمْ خَصَاصَةٌ"
                                        </div>
                                    </CardContent>
                                </Card>

                                {/* Did You Know? */}
                                <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 to-indigo-50 overflow-hidden relative group hover:shadow-xl transition-all">
                                    <div className="absolute -bottom-4 -left-4 p-4 opacity-10">
                                        <Lightbulb className="w-32 h-32 text-blue-500" />
                                    </div>
                                    <CardHeader>
                                        <CardTitle className="text-xl text-blue-800 flex items-center gap-2 arabic-text">
                                            <Lightbulb className="w-6 h-6 text-blue-500" /> هل تعلم؟
                                        </CardTitle>
                                    </CardHeader>
                                    <CardContent className="relative z-10">
                                        <p className="text-blue-900 text-lg leading-loose arabic-text text-justify">
                                            أن عدد كلمات اللغة العربية يتجاوز <strong>12 مليون كلمة</strong>، بينما اللغة الإنجليزية تحتوي على حوالي 600 ألف كلمة فقط؟ هذا الثراء اللغوي يجعل العربية من أدق اللغات في العالم للتعبير عن المعاني والمشاعر.
                                        </p>
                                    </CardContent>
                                </Card>
                             </div>
                        </motion.div>
                    )}
                </AnimatePresence>

                {error && (
                    <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl mt-4 arabic-text border border-red-100 shadow-sm animate-pulse">
                        {error}
                    </div>
                )}
            </div>

            {/* === Sidebar / Quick Links (4 Cols) === */}
            <div className="lg:col-span-4 space-y-6">
                
                {/* Common Words */}
                <Card className="border-0 shadow-lg bg-white">
                    <CardHeader className="border-b border-slate-100 pb-4">
                        <CardTitle className="text-lg font-bold text-slate-800 flex items-center gap-2 arabic-text">
                            <BookOpen className="w-5 h-5 text-indigo-600" /> كلمات شائعة
                        </CardTitle>
                    </CardHeader>
                    <CardContent className="p-0">
                        <div className="divide-y divide-slate-100">
                            {COMMON_WORDS.map((item, idx) => (
                                <div 
                                    key={idx} 
                                    className="p-4 hover:bg-slate-50 transition-colors cursor-pointer group"
                                    onClick={() => handleQuickSearch(item.word)}
                                >
                                    <div className="flex justify-between items-center mb-1">
                                        <h4 className="font-bold text-indigo-900 text-lg group-hover:text-indigo-600 transition-colors">{item.word}</h4>
                                        <Badge variant="outline" className="bg-slate-100 text-slate-600 text-xs">{item.type}</Badge>
                                    </div>
                                    <p className="text-sm text-slate-500 line-clamp-1">{item.def}</p>
                                </div>
                            ))}
                        </div>
                    </CardContent>
                </Card>

                {/* Ad Placeholder */}
                <div className="bg-slate-100 border-2 border-dashed border-slate-300 rounded-2xl h-64 flex flex-col items-center justify-center text-slate-400 text-sm arabic-text gap-2">
                    <span>مساحة إعلانية</span>
                    <span className="text-xs opacity-70">(Google AdSense)</span>
                </div>

            </div>
        </div>

      </div>
    </div>
  );
}
