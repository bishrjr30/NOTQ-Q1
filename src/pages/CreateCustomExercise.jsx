// src/pages/CreateCustomExercise.jsx

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";

// ✅ Supabase Entities
import { Exercise } from "@/api/entities";

// ✅ ذكاء اصطناعي عبر integrations
import { InvokeLLM } from "@/api/integrations";

import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Slider } from "@/components/ui/slider";
import {
  ArrowLeft,
  Sparkles,
  Wand2,
  FileText,
  AlertCircle,
  BookOpen,
  Settings
} from "lucide-react";
import { motion } from "framer-motion";

const TEXT_TYPES = [
  { value: "علمي", label: "نص علمي 🔬", description: "معلومات علمية مبسطة" },
  { value: "أدبي", label: "نص أدبي 📚", description: "قصة أو نص أدبي جميل" },
  { value: "وصفي", label: "نص وصفي 🎨", description: "وصف لمكان أو شيء" },
  { value: "حواري", label: "نص حواري 💬", description: "حوار بين شخصيات" },
  { value: "تاريخي", label: "نص تاريخي 🏛️", description: "حدث أو شخصية تاريخية" },
  { value: "ديني", label: "نص ديني 📿", description: "حديث أو قصة دينية" },
  {
    value: "نص خاص",
    label: "نص من اختيارك ✍️",
    description: "اكتب أو الصق نصك الخاص",
  },
];

export default function CreateCustomExercisePage() {
  const navigate = useNavigate();
  const [textType, setTextType] = useState("");
  const [customText, setCustomText] = useState("");
  const [wordCount, setWordCount] = useState([80]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState(null);

  // ✅ وظيفة لمراجعة وتصحيح النص
  const reviewAndCorrectText = async (originalText) => {
    try {
      setIsReviewing(true);
      const reviewPrompt = `
أنت خبير لغوي في اللغة العربية الفصحى. قم بمراجعة وتشكيل النص التالي تشكيلاً كاملاً وتاماً (100% Fully Vowelized).

النص: "${originalText}"

**الشروط الصارمة جداً:**
1. **التشكيل الكامل لكل حرف:** يجب وضع الحركات (فتحة، ضمة، كسرة، سكون) على **جميع** الحروف بلا استثناء.
2. **الدقة النحوية والصرفية:** تأكد من صحة الإعراب وبنية الكلمات.
3. **الشدة:** ضع الشدة مع حركتها المناسبة في موضعها الصحيح.

المطلوب: أعد كتابة النص مشكولاً بالكامل (Full Tashkeel) فقط.
      `;

      const correctedText = await InvokeLLM({ prompt: reviewPrompt });

      if (typeof correctedText === "string" && correctedText.trim()) {
        return correctedText.trim();
      } else {
        return originalText;
      }
    } catch (error) {
      console.error("Text review failed:", error);
      return originalText;
    } finally {
      setIsReviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!textType) {
      setError("يرجى اختيار نوع النص.");
      return;
    }

    if (textType === "نص خاص" && !customText.trim()) {
      setError("يرجى كتابة النص الخاص بك.");
      return;
    }

    setError(null);
    setIsLoading(true);

    try {
      let finalText = "";

      if (textType === "نص خاص") {
        finalText = await reviewAndCorrectText(customText.trim());
      } else {
        const selectedType = TEXT_TYPES.find((t) => t.value === textType);
        let complexityInstruction = "استخدم جملاً بسيطة ومفردات سهلة.";
        if (wordCount[0] > 150) complexityInstruction = "استخدم جملاً مركبة وتراكيب قوية.";
        else if (wordCount[0] > 80) complexityInstruction = "استخدم جملاً متوسطة الطول.";

        const prompt = `
بصفتك خبيراً لغوياً، أنشئ نصاً ${textType}اً باللغة العربية الفُصحى.
الطول التقريبي: ${wordCount[0]} كلمة.
مستوى الصعوبة: ${complexityInstruction}
**المعيار الذهبي للتشكيل:** تشكيل كامل 100% لكل حرف بدقة نحوية.
المطلوب: النص فقط، مشكولاً بالكامل.
        `;

        try {
          const generatedText = await InvokeLLM({ prompt });
          if (typeof generatedText !== "string" || generatedText.trim() === "") {
            throw new Error("فشل الذكاء الاصطناعي في إنشاء النص.");
          }
          finalText = await reviewAndCorrectText(generatedText.trim());
        } catch (llmError) {
          if (llmError.message && llmError.message.includes("limit")) {
            throw new Error('عذراً، وصلنا للحد الأقصى. يرجى اختيار "نص خاص".');
          }
          throw llmError;
        }
      }

      if (!finalText || finalText.length < 20) {
        throw new Error("النص المُنشأ قصير جداً أو غير صالح.");
      }

      // تقدير المستوى
      let level = "مبتدئ";
      let stage = 1;
      const actualWordCount = finalText.split(/\s+/).length;

      if (actualWordCount >= 150) { level = "متقدم"; stage = Math.min(10, Math.floor(actualWordCount / 50)); }
      else if (actualWordCount >= 100) { level = "متوسط"; stage = Math.min(7, Math.floor(actualWordCount / 30)); }
      else { stage = Math.min(5, Math.floor(actualWordCount / 20)); }

      const newExercise = await Exercise.create({
        sentence: finalText,
        level: level,
        stage: stage,
        category: textType === "نص خاص" ? "نص مخصص" : textType,
        difficulty_points: Math.round(actualWordCount / 10),
        word_count: actualWordCount,
      });

      const urlParams = new URLSearchParams(window.location.search);
      const studentId = urlParams.get("studentId");
      navigate(createPageUrl(`Exercise?id=${newExercise.id}&studentId=${studentId}`));

    } catch (err) {
      console.error(err);
      setError("حدث خطأ أثناء إنشاء التمرين. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div
      className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-4 md:p-8"
      dir="rtl"
    >
      {/* 🟢 توسيع الحاوية لتملأ الشاشة في اللابتوب (max-w-7xl) */}
      <div className="max-w-7xl mx-auto w-full">
        
        {/* Header */}
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col md:flex-row md:items-center gap-4 mb-8"
        >
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="icon"
              className="rounded-full shadow-md bg-white hover:scale-110 transition-transform"
              onClick={() => navigate(-1)}
            >
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </Button>
            <div>
              <h1 className="text-3xl md:text-4xl font-black bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent arabic-text flex items-center gap-3">
                <Wand2 className="text-orange-600 w-8 h-8 md:w-10 md:h-10" />
                تحدي إضافي
              </h1>
              <p className="text-gray-500 arabic-text text-base md:text-lg mt-1">
                صمم تمرينك الخاص واختبر قدراتك!
              </p>
            </div>
          </div>
        </motion.div>

        <motion.div
          initial={{ opacity: 0, scale: 0.98 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm overflow-hidden">
            <CardHeader className="bg-gradient-to-r from-orange-500 to-pink-600 text-white p-6">
              <CardTitle className="arabic-text text-xl md:text-2xl flex items-center gap-2">
                <Settings className="w-6 h-6" />
                إعدادات التمرين
              </CardTitle>
            </CardHeader>
            
            <CardContent className="p-6 md:p-8">
              {/* 🟢 تقسيم الشاشة إلى قسمين في اللابتوب (Grid) */}
              <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
                
                {/* العمود الأيمن: اختيار نوع النص (يأخذ 5 أجزاء من 12) */}
                <div className="lg:col-span-5 space-y-4">
                  <Label className="arabic-text text-lg font-bold text-gray-800 flex items-center gap-2 mb-4">
                    <BookOpen className="w-5 h-5 text-orange-600" />
                    1. اختر نوع النص
                  </Label>
                  
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-1 gap-3">
                    {TEXT_TYPES.map((type) => (
                      <motion.div
                        key={type.value}
                        whileHover={{ scale: 1.01, x: -5 }}
                        whileTap={{ scale: 0.98 }}
                      >
                        <div
                          className={`cursor-pointer p-4 rounded-xl border-2 transition-all duration-200 flex items-center gap-4 ${
                            textType === type.value
                              ? "border-orange-500 bg-orange-50 shadow-md ring-1 ring-orange-200"
                              : "border-slate-100 hover:border-orange-200 hover:bg-slate-50"
                          }`}
                          onClick={() => setTextType(type.value)}
                        >
                          <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xl ${
                             textType === type.value ? "bg-white shadow-sm" : "bg-slate-100"
                          }`}>
                            {type.label.split(" ").pop()} {/* استخراج الإيموجي */}
                          </div>
                          <div>
                            <h3 className={`font-bold arabic-text ${textType === type.value ? "text-orange-900" : "text-gray-700"}`}>
                              {type.label.replace(/ .*/,'')} {/* استخراج الكلمة الأولى */}
                            </h3>
                            <p className="text-xs text-gray-500 arabic-text">
                              {type.description}
                            </p>
                          </div>
                          {textType === type.value && (
                            <div className="mr-auto text-orange-600">
                              <span className="block w-3 h-3 bg-orange-600 rounded-full shadow-orange-300 shadow-[0_0_10px]"></span>
                            </div>
                          )}
                        </div>
                      </motion.div>
                    ))}
                  </div>
                </div>

                {/* فاصل عمودي في الشاشات الكبيرة */}
                <div className="hidden lg:block w-px bg-slate-200 mx-auto"></div>

                {/* العمود الأيسر: الإعدادات والتوليد (يأخذ 6 أجزاء من 12) */}
                <div className="lg:col-span-6 space-y-8">
                  
                  {/* قسم ضمان الجودة */}
                  <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 flex items-start gap-3 shadow-sm">
                    <AlertCircle className="w-5 h-5 text-blue-600 mt-1 flex-shrink-0" />
                    <div>
                      <h3 className="font-bold text-blue-900 arabic-text text-sm mb-1">
                        ✨ ضمان جودة المحتوى
                      </h3>
                      <p className="text-xs text-blue-700 arabic-text leading-relaxed opacity-90">
                        سواء اخترت نصاً جاهزاً أو كتبت نصك الخاص، سيقوم المعلم الذكي بمراجعته وتصحيح التشكيل والإعراب تلقائياً.
                      </p>
                    </div>
                  </div>

                  {/* منطقة الإدخال المشروط */}
                  <div className="space-y-6">
                    {textType === "نص خاص" ? (
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="space-y-3"
                      >
                        <Label className="arabic-text text-lg font-bold text-gray-800 flex items-center gap-2">
                          <FileText className="w-5 h-5 text-orange-600" />
                          2. اكتب نصك هنا
                        </Label>
                        <Textarea
                          placeholder="الصق النص هنا أو اكتبه..."
                          value={customText}
                          onChange={(e) => setCustomText(e.target.value)}
                          className="arabic-text min-h-[200px] text-lg p-4 border-2 border-orange-200 rounded-xl focus:border-orange-500 focus:ring-4 focus:ring-orange-100 transition-all bg-slate-50"
                        />
                      </motion.div>
                    ) : (
                      textType && (
                        <motion.div
                          initial={{ opacity: 0, y: 10 }}
                          animate={{ opacity: 1, y: 0 }}
                          className="space-y-6"
                        >
                          <Label className="arabic-text text-lg font-bold text-gray-800 flex items-center gap-2">
                            <Settings className="w-5 h-5 text-orange-600" />
                            2. خصائص النص
                          </Label>
                          
                          <div className="bg-orange-50/50 p-6 rounded-2xl border border-orange-100">
                            <div className="flex justify-between items-center mb-6">
                              <span className="text-sm font-bold text-gray-600 arabic-text">طول النص</span>
                              <span className="font-black text-2xl text-orange-600 bg-white px-4 py-1 rounded-lg border border-orange-200 shadow-sm">
                                {wordCount[0]} <span className="text-xs font-normal text-gray-400">كلمة</span>
                              </span>
                            </div>

                            {/* 🟢 إصلاح لون الشريط (Slider) */}
                            <Slider
                              value={wordCount}
                              onValueChange={setWordCount}
                              min={30}
                              max={200}
                              step={10}
                              className="w-full cursor-pointer py-4 [&>span:first-child]:h-2 [&>span:first-child]:bg-orange-200 [&>span:first-child_span]:bg-orange-600 [&>span:last-child]:bg-white [&>span:last-child]:border-4 [&>span:last-child]:border-orange-600 [&>span:last-child]:w-6 [&>span:last-child]:h-6 [&>span:last-child]:shadow-md"
                            />

                            <div className="mt-6 flex justify-between text-xs font-bold text-gray-400 arabic-text">
                              <span>قصير (سهل)</span>
                              <span>متوسط</span>
                              <span>طويل (متقدم)</span>
                            </div>
                          </div>
                        </motion.div>
                      )
                    )}

                    {/* عرض رسائل الخطأ */}
                    {error && (
                      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="bg-red-50 text-red-600 p-3 rounded-lg text-sm font-bold flex items-center gap-2">
                        <AlertCircle className="w-4 h-4" /> {error}
                      </motion.div>
                    )}

                    {/* زر الإنشاء */}
                    <div className="pt-4">
                      <Button
                        onClick={handleGenerate}
                        disabled={isLoading || isReviewing || !textType}
                        size="lg"
                        className={`w-full text-xl py-8 rounded-2xl arabic-text shadow-xl transition-all duration-300 ${
                          !textType 
                            ? "bg-gray-200 text-gray-400 cursor-not-allowed"
                            : "bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white hover:scale-[1.02] hover:shadow-2xl"
                        }`}
                      >
                        {isLoading || isReviewing ? (
                          <div className="flex items-center gap-3">
                            <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                            <span>{isReviewing ? "جاري المراجعة اللغوية..." : "جاري تأليف النص..."}</span>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <Sparkles className="w-6 h-6" />
                            <span>{textType === "نص خاص" ? "مراجعة واعتماد النص" : "إنشاء التحدي الآن"}</span>
                          </div>
                        )}
                      </Button>
                    </div>
                  </div>
                </div>

              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}
