import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { InvokeLLM } from '@/api/integrations';
import { Exercise } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Sparkles, Wand2, FileText, AlertCircle, BookOpen, CheckCircle2 } from 'lucide-react';

const TOPICS = [
  { value: "آية قرآنية", label: "آية قرآنية", icon: "📖" },
  { value: "الطبيعة", label: "نص عن الطبيعة", icon: "🌿" },
  { value: "التاريخ الإسلامي", label: "نص عن التاريخ الإسلامي", icon: "🕌" },
  { value: "العلوم", label: "نص علمي مبسط", icon: "🔬" },
  { value: "الأخلاق", label: "نص عن الأخلاق الحميدة", icon: "💎" },
  { value: "القصص", label: "قصة قصيرة", icon: "📚" },
  { value: "نص من اختيارك", label: "نص من اختيارك", icon: "✍️" },
  { value: "مخصص", label: "موضوع من اختياري", icon: "⭐" },
];

export default function CreateExercisePage() {
  const navigate = useNavigate();
  const [topic, setTopic] = useState('');
  const [customTopic, setCustomTopic] = useState('');
  const [customText, setCustomText] = useState('');
  const [wordCount, setWordCount] = useState([80]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [isReviewing, setIsReviewing] = useState(false);

  // ✅ مراجعة وتصحيح النص بطريقة أكثر دقة ولطفاً
  const reviewAndCorrectText = async (originalText) => {
    try {
      setIsReviewing(true);
      const reviewPrompt = `أنت معلم لغة عربية محترف، متخصص في مراجعة وتحسين النصوص التعليمية.

**النص المطلوب مراجعته:**
"${originalText}"

**مهمتك:**
1. التأكد من التشكيل الكامل لجميع الكلمات
2. تصحيح أي أخطاء إملائية أو نحوية إن وجدت
3. التأكد من وضوح النص ومناسبته للطلاب
4. الحفاظ على المعنى والأسلوب الأصلي

**الرد المطلوب:**
النص المحسّن فقط، مشكولاً بالكامل، بدون أي إضافات أو شروحات.

إذا كان النص جيداً ولا يحتاج تعديل، أرجعه كما هو مع التأكد من التشكيل الكامل.`;

      const correctedText = await InvokeLLM({ prompt: reviewPrompt });
      
      if (typeof correctedText === 'string' && correctedText.trim()) {
        return correctedText.trim();
      } else {
        return originalText;
      }
    } catch (error) {
      console.error('Text review failed:', error);
      return originalText;
    } finally {
      setIsReviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!topic) {
      setError('يرجى اختيار نوع النص.');
      return;
    }
    
    if (topic === 'نص من اختيارك' && !customText.trim()) {
      setError('يرجى كتابة النص الخاص بك.');
      return;
    }
    
    if (topic === 'مخصص' && !customTopic.trim()) {
      setError('يرجى كتابة موضوعك.');
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      let finalText = '';
      
      if (topic === 'نص من اختيارك') {
        finalText = await reviewAndCorrectText(customText.trim());
      } else {
        const finalTopic = topic === 'مخصص' ? customTopic : topic;
        let prompt = '';
        
        if (topic === 'آية قرآنية') {
          prompt = `أنت خبير في القرآن الكريم والتجويد.

**المطلوب:**
اختر آية قرآنية كريمة مناسبة للتعلم، بطول ${wordCount[0]} كلمة تقريباً.

**الشروط:**
1. التشكيل الكامل والدقيق حسب رواية حفص عن عاصم
2. وضع السكون والشدة بدقة
3. اختيار آية واضحة ومفهومة للطلاب
4. عدم كتابة البسملة أو رقم الآية

**المخرج:**
الآية الكريمة فقط، مشكولة تشكيلاً كاملاً.`;
        } else {
          let complexity = "بسيط ومناسب للمبتدئين";
          if (wordCount[0] > 150) complexity = "متقدم مع جمل معقدة";
          else if (wordCount[0] > 100) complexity = "متوسط مع جمل متنوعة";

          prompt = `أنت معلم لغة عربية محترف، تكتب نصوصاً تعليمية عالية الجودة.

**المطلوب:**
كتابة نص تعليمي مشوق حول "${finalTopic}"

**المواصفات:**
- المستوى: ${complexity}
- عدد الكلمات: ${wordCount[0]} كلمة تقريباً
- التشكيل: كامل 100% لكل حرف
- الأسلوب: واضح وجذاب ومناسب للطلاب

**الشروط الصارمة:**
1. ✅ التشكيل الكامل والتام لكل حرف (الفتحة، الضمة، الكسرة، السكون، الشدة، التنوين)
2. ✅ ضبط الإعراب: حركات أواخر الكلمات صحيحة (الفاعل مرفوع، المفعول منصوب، المجرور مكسور)
3. ✅ الشدة والتنوين: لا تنسى وضعهما حيث يلزم
4. ✅ الهمزات والتاء: مكتوبة بشكل صحيح (ة، ت، ء، أ، ؤ، ئ)
5. ✅ المحتوى: مفيد وتربوي ومشجع للطلاب

**مثال على الجودة المطلوبة:**
"اِسْتَيْقَظَ الطِّفْلُ النَّشِيطُ بَاكِرًا، فَذَهَبَ إِلَى الْمَدْرَسَةِ فَرِحًا. حَمَلَ حَقِيبَتَهُ الْجَمِيلَةَ وَانْطَلَقَ مُبْتَسِمًا."

**المخرج:**
النص فقط، مشكولاً تشكيلاً كاملاً، بدون عناوين أو مقدمات.`;
        }

        try {
          const generatedText = await InvokeLLM({ prompt });

          if (typeof generatedText !== 'string' || generatedText.trim() === '') {
            throw new Error('فشل الذكاء الاصطناعي في إنشاء النص.');
          }
          
          finalText = await reviewAndCorrectText(generatedText.trim());
        } catch (llmError) {
          if (llmError.message && llmError.message.includes('limit')) {
            throw new Error('عذراً، وصلنا للحد الأقصى من استخدام الذكاء الاصطناعي. يرجى اختيار "نص من اختيارك" وكتابة النص بنفسك.');
          }
          throw llmError;
        }
      }
      
      if (!finalText || finalText.length < 20) {
        throw new Error('النص المُنشأ قصير جداً أو غير صالح.');
      }
      
      let level = 'مبتدئ';
      let stage = 1;
      const actualWordCount = finalText.split(/\s+/).length;
      
      if (actualWordCount >= 150) {
        level = 'متقدم';
        stage = Math.min(10, Math.floor(actualWordCount / 50));
      } else if (actualWordCount >= 100) {
        level = 'متوسط';
        stage = Math.min(7, Math.floor(actualWordCount / 30));
      } else {
        stage = Math.min(5, Math.floor(actualWordCount / 20));
      }
      
      const newExercise = await Exercise.create({
        sentence: finalText,
        level: level,
        stage: stage,
        category: topic === 'نص من اختيارك' ? 'نص مخصص' : topic,
        difficulty_points: Math.round(actualWordCount / 10),
        word_count: actualWordCount
      });

      const urlParams = new URLSearchParams(window.location.search);
      const studentId = urlParams.get('studentId');
      navigate(createPageUrl(`Exercise?id=${newExercise.id}&studentId=${studentId}`));

    } catch (err) {
      console.error(err);
      setError(err.message || 'حدث خطأ أثناء إنشاء التمرين. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-3 sm:p-4 md:p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4 mb-6 sm:mb-8">
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg bg-white/80 backdrop-blur-sm hover:shadow-xl transition-all flex-shrink-0"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex-1">
            <h1 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent arabic-text flex items-center gap-2 mb-1">
              <Wand2 className="text-purple-600 w-6 h-6 sm:w-7 sm:h-7 flex-shrink-0" />
              <span>تحدي إضافي - إنشاء تمرين مخصص</span>
            </h1>
            <p className="text-indigo-600 arabic-text text-sm sm:text-base">
              اختر تفضيلاتك ليقوم الذكاء الاصطناعي بإنشاء نص للقراءة بجودة عالية.
            </p>
          </div>
        </div>
        
        <div>
          <Card className="border-0 shadow-xl sm:shadow-2xl bg-white/90 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl p-4 sm:p-6">
              <CardTitle className="arabic-text text-lg sm:text-xl flex items-center gap-2">
                <BookOpen className="w-5 h-5 sm:w-6 sm:h-6" />
                حدد مواصفات النص
              </CardTitle>
            </CardHeader>
            <CardContent className="p-4 sm:p-6 md:p-8 space-y-6 sm:space-y-8">
              {/* Quality Assurance Banner */}
              <div className="bg-gradient-to-r from-green-50 to-emerald-50 border-2 border-green-200 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-semibold text-green-800 arabic-text mb-1 text-sm sm:text-base">
                    ضمان الجودة بالذكاء الاصطناعي
                  </h3>
                  <p className="text-xs sm:text-sm text-green-700 arabic-text leading-relaxed">
                    جميع النصوص تخضع لمراجعة تلقائية ذكية للتأكد من صحة القواعد النحوية والتشكيل الكامل قبل عرضها.
                  </p>
                </div>
              </div>

              {/* Topic Selection */}
              <div className="space-y-2 sm:space-y-3">
                <Label htmlFor="topic" className="arabic-text text-base sm:text-lg font-semibold text-indigo-900 flex items-center gap-2">
                  <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                  نوع النص
                </Label>
                <Select onValueChange={setTopic} value={topic}>
                  <SelectTrigger id="topic" className="arabic-text h-11 sm:h-12 border-2 border-indigo-200 rounded-xl text-sm sm:text-base hover:border-indigo-300 transition-colors">
                    <SelectValue placeholder="اختر نوع النص..." />
                  </SelectTrigger>
                  <SelectContent className="max-h-80">
                    {TOPICS.map(t => (
                      <SelectItem key={t.value} value={t.value} className="arabic-text text-sm sm:text-base">
                        <span className="flex items-center gap-2">
                          <span>{t.icon}</span>
                          <span>{t.label}</span>
                        </span>
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Custom Text Input */}
              {topic === 'نص من اختيارك' && (
                <div className="space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <Label htmlFor="custom-text" className="arabic-text text-base sm:text-lg font-semibold text-indigo-900 flex items-center gap-2">
                    <FileText className="w-4 h-4 sm:w-5 sm:h-5 text-indigo-600" />
                    اكتب أو الصق النص الخاص بك
                  </Label>
                  <Textarea 
                    id="custom-text"
                    placeholder="اكتب أو الصق هنا النص الذي تريد التدرب عليه... سيتم مراجعته وتحسينه تلقائياً"
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    className="arabic-text min-h-[120px] sm:min-h-[150px] border-2 border-indigo-200 rounded-xl text-sm sm:text-base resize-y focus:border-indigo-400 transition-colors"
                    dir="rtl"
                  />
                  <div className="bg-blue-50 border border-blue-200 rounded-lg p-2 sm:p-3">
                    <p className="text-xs sm:text-sm text-blue-700 arabic-text flex items-start gap-2">
                      <AlertCircle className="w-4 h-4 flex-shrink-0 mt-0.5" />
                      <span>سيتم مراجعة النص وتصحيح التشكيل والقواعد تلقائياً بواسطة GPT-4 قبل إنشاء التمرين.</span>
                    </p>
                  </div>
                </div>
              )}

              {/* Custom Topic Input */}
              {topic === 'مخصص' && (
                <div className="space-y-2 sm:space-y-3 animate-in fade-in slide-in-from-top-4 duration-300">
                  <Label htmlFor="custom-topic" className="arabic-text text-base sm:text-lg font-semibold text-indigo-900 flex items-center gap-2">
                    <Sparkles className="w-4 h-4 sm:w-5 sm:h-5 text-purple-600" />
                    اكتب موضوعك هنا
                  </Label>
                  <Input 
                    id="custom-topic"
                    placeholder="مثال: قصة عن الأمانة، فوائد القراءة، أهمية العلم، رحلة إلى الفضاء..."
                    value={customTopic}
                    onChange={e => setCustomTopic(e.target.value)}
                    className="arabic-text h-11 sm:h-12 border-2 border-indigo-200 rounded-xl text-sm sm:text-base focus:border-indigo-400 transition-colors"
                    dir="rtl"
                  />
                  <p className="text-xs sm:text-sm text-indigo-600 arabic-text">
                    💡 كن محدداً في اختيار الموضوع للحصول على نص أفضل
                  </p>
                </div>
              )}

              {/* Word Count Slider */}
              {topic && topic !== 'نص من اختيارك' && (
                <div className="space-y-3 sm:space-y-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <div className="flex items-center justify-between flex-wrap gap-2">
                    <Label className="arabic-text text-base sm:text-lg font-semibold text-indigo-900">
                      عدد الكلمات
                    </Label>
                    <span className="text-xs sm:text-sm text-indigo-600 arabic-text bg-indigo-50 px-2 sm:px-3 py-1 rounded-full">
                      ⏱️ حوالي {Math.round(wordCount[0]/150)} دقيقة قراءة
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-3 sm:gap-4">
                    <Slider 
                      value={wordCount}
                      onValueChange={setWordCount}
                      min={50}
                      max={300}
                      step={25}
                      className="flex-1"
                    />
                    <div className="font-bold text-xl sm:text-2xl text-white bg-gradient-to-r from-indigo-600 to-purple-600 px-4 sm:px-5 py-2 sm:py-3 rounded-xl min-w-[60px] sm:min-w-[70px] text-center shadow-lg">
                      {wordCount[0]}
                    </div>
                  </div>
                  
                  {/* Level Indicator */}
                  <div className="grid grid-cols-3 gap-2 sm:gap-3">
                    <div className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      wordCount[0] < 100 
                        ? 'bg-green-100 border-green-400 shadow-md' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <p className="text-xs sm:text-sm font-bold text-center arabic-text">
                        {wordCount[0] < 100 ? '✅' : '⚪'} مبتدئ
                      </p>
                      <p className="text-xs text-center text-gray-600">50-100</p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      wordCount[0] >= 100 && wordCount[0] < 150 
                        ? 'bg-yellow-100 border-yellow-400 shadow-md' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <p className="text-xs sm:text-sm font-bold text-center arabic-text">
                        {wordCount[0] >= 100 && wordCount[0] < 150 ? '✅' : '⚪'} متوسط
                      </p>
                      <p className="text-xs text-center text-gray-600">100-150</p>
                    </div>
                    <div className={`p-2 sm:p-3 rounded-lg border-2 transition-all ${
                      wordCount[0] >= 150 
                        ? 'bg-red-100 border-red-400 shadow-md' 
                        : 'bg-gray-50 border-gray-200'
                    }`}>
                      <p className="text-xs sm:text-sm font-bold text-center arabic-text">
                        {wordCount[0] >= 150 ? '✅' : '⚪'} متقدم
                      </p>
                      <p className="text-xs text-center text-gray-600">150+</p>
                    </div>
                  </div>
                </div>
              )}

              {/* Error Message */}
              {error && (
                <div className="bg-red-50 border-2 border-red-200 rounded-xl p-3 sm:p-4 flex items-start gap-2 sm:gap-3 animate-in fade-in slide-in-from-top-2 duration-200">
                  <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                  <p className="text-red-700 arabic-text font-medium text-sm sm:text-base">{error}</p>
                </div>
              )}

              {/* Generate Button */}
              <Button
                onClick={handleGenerate}
                disabled={isLoading || isReviewing}
                size="lg"
                className="w-full bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white text-base sm:text-lg py-5 sm:py-6 rounded-xl arabic-text shadow-2xl hover:shadow-xl transition-all duration-300 disabled:opacity-60"
              >
                {isLoading || isReviewing ? (
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
                    <span>{isReviewing ? 'جارٍ المراجعة والتصحيح...' : 'جارٍ الإنشاء بواسطة GPT-4...'}</span>
                  </div>
                ) : (
                  <div className="flex items-center justify-center gap-2 sm:gap-3">
                    <Sparkles className="w-5 h-5 sm:w-6 sm:h-6" />
                    <span>{topic === 'نص من اختيارك' ? 'مراجعة وإنشاء التمرين' : 'إنشاء نص محسّن بالذكاء الاصطناعي'}</span>
                  </div>
                )}
              </Button>

              {/* Info Box */}
              {topic && (
                <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-3 sm:p-4 animate-in fade-in slide-in-from-top-4 duration-300">
                  <p className="text-xs sm:text-sm text-purple-800 arabic-text text-center leading-relaxed">
                    <strong>🎯 ملاحظة:</strong> النص المُنشأ سيكون مشكولاً بالكامل ومراجعاً لغوياً لضمان أعلى جودة تعليمية
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
