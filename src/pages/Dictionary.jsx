import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Volume2, BookOpen, ArrowLeft, Loader2 } from "lucide-react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { createPageUrl } from "@/utils";

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
      const response = await base44.integrations.Core.InvokeLLM({
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
            "example_sentence": "ذَهَبَ أَحْمَدُ إِلَى المَدْرَسَةِ مُبَكِّرًا.",
            "type": "اسم",
            "breakdown": "الـ - ـمَدْ - ـرَ - ـسَـ - ـةُ"
          }
        `,
        response_json_schema: {
          type: "object",
          properties: {
            word_vowelled: { type: "string" },
            definition: { type: "string" },
            example_sentence: { type: "string" },
            type: { type: "string" },
            breakdown: { type: "string" }
          }
        }
      });

      setResult(response);
    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء البحث. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  const speakText = (text) => {
    if ('speechSynthesis' in window) {
      const utterance = new SpeechSynthesisUtterance(text);
      utterance.lang = 'ar-SA';
      window.speechSynthesis.speak(utterance);
    } else {
      alert("متصفحك لا يدعم القراءة الصوتية");
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-blue-50 to-cyan-50 p-6">
      <div className="max-w-2xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl("StudentDashboard")}>
            <Button variant="outline" size="icon" className="rounded-full shadow-lg bg-white/80">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold text-indigo-900 arabic-text">
              القاموس الصوتي 🔊
            </h1>
            <p className="text-indigo-600 arabic-text">
              ابحث عن أي كلمة واسمع نطقها الصحيح
            </p>
          </div>
        </motion.div>

        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur mb-8">
          <CardContent className="p-6">
            <form onSubmit={handleSearch} className="flex gap-3">
              <Button 
                type="submit" 
                className="bg-indigo-600 hover:bg-indigo-700 text-white arabic-text"
                disabled={isLoading}
              >
                {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </Button>
              <Input
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="اكتب الكلمة هنا..."
                className="text-right arabic-text text-lg"
              />
            </form>
          </CardContent>
        </Card>

        <AnimatePresence>
          {result && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
            >
              <Card className="shadow-2xl border-0 bg-gradient-to-br from-white to-indigo-50 overflow-hidden">
                <CardHeader className="bg-indigo-600 text-white p-6 text-center relative overflow-hidden">
                   <div className="absolute top-0 left-0 w-full h-full bg-white/10 opacity-20 transform -skew-y-12"></div>
                   <h2 className="text-4xl font-bold arabic-text relative z-10 mb-2">
                     {result.word_vowelled}
                   </h2>
                   <Badge className="bg-white/20 text-white border-0 relative z-10">
                     {result.type}
                   </Badge>
                   <Button
                     size="icon"
                     variant="ghost"
                     onClick={() => speakText(result.word_vowelled)}
                     className="absolute top-4 left-4 text-white hover:bg-white/20 rounded-full"
                   >
                     <Volume2 className="w-6 h-6" />
                   </Button>
                </CardHeader>
                <CardContent className="p-6 space-y-6">
                  <div className="bg-white rounded-xl p-4 shadow-sm border border-indigo-100">
                    <h3 className="text-indigo-900 font-bold mb-2 arabic-text flex items-center gap-2">
                      <BookOpen className="w-4 h-4" />
                      التعريف:
                    </h3>
                    <p className="text-lg text-gray-700 arabic-text leading-relaxed">
                      {result.definition}
                    </p>
                  </div>

                  <div className="bg-blue-50 rounded-xl p-4 shadow-sm border border-blue-100">
                    <h3 className="text-blue-900 font-bold mb-2 arabic-text">
                       التحليل الصوتي:
                    </h3>
                    <div className="flex flex-wrap gap-2 justify-end">
                      {result.breakdown.split("-").map((part, idx) => (
                         <span key={idx} className="bg-white text-blue-700 px-3 py-1 rounded-lg font-mono text-lg shadow-sm">
                           {part.trim()}
                         </span>
                      ))}
                    </div>
                  </div>

                  <div className="bg-green-50 rounded-xl p-4 shadow-sm border border-green-100">
                     <h3 className="text-green-900 font-bold mb-2 arabic-text">
                        مثال في جملة:
                     </h3>
                     <p className="text-xl text-green-800 arabic-text text-center font-medium">
                        "{result.example_sentence}"
                     </p>
                     <div className="text-center mt-2">
                       <Button
                         variant="ghost"
                         size="sm"
                         onClick={() => speakText(result.example_sentence)}
                         className="text-green-700 hover:bg-green-100"
                       >
                         <Volume2 className="w-4 h-4 ml-1" />
                         استمع للجملة
                       </Button>
                     </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
        
        {error && (
          <div className="text-center text-red-500 bg-red-50 p-4 rounded-xl mt-4 arabic-text">
            {error}
          </div>
        )}
      </div>
    </div>
  );
}

import { Badge } from "@/components/ui/badge";