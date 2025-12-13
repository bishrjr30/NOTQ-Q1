import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { createPageUrl } from '@/utils';
import { base44 } from '@/api/base44Client';
import { Exercise } from '@/api/entities';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { ArrowLeft, Sparkles, Wand2, FileText, AlertCircle, BookOpen } from 'lucide-react';
import { motion } from 'framer-motion';

const TEXT_TYPES = [
  { value: "علمي", label: "نص علمي 🔬", description: "معلومات علمية مبسطة" },
  { value: "أدبي", label: "نص أدبي 📚", description: "قصة أو نص أدبي جميل" },
  { value: "وصفي", label: "نص وصفي 🎨", description: "وصف لمكان أو شيء" },
  { value: "حواري", label: "نص حواري 💬", description: "حوار بين شخصيات" },
  { value: "تاريخي", label: "نص تاريخي 🏛️", description: "حدث أو شخصية تاريخية" },
  { value: "ديني", label: "نص ديني 📿", description: "حديث أو قصة دينية" },
  { value: "نص خاص", label: "نص من اختيارك ✍️", description: "اكتب أو الصق نصك الخاص" },
];

export default function CreateCustomExercisePage() {
  const navigate = useNavigate();
  const [textType, setTextType] = useState('');
  const [customText, setCustomText] = useState('');
  const [wordCount, setWordCount] = useState([80]);
  const [isLoading, setIsLoading] = useState(false);
  const [isReviewing, setIsReviewing] = useState(false);
  const [error, setError] = useState(null);

  // وظيفة لمراجعة وتصحيح النص المُنشأ - تشكيل آخر الكلمات فقط
  const reviewAndCorrectText = async (originalText) => {
      try {
        setIsReviewing(true);
        const reviewPrompt = `
  أنت خبير لغوي في اللغة العربية الفصحى. قم بمراجعة وتشكيل النص التالي تشكيلاً كاملاً وتاماً (100% Fully Vowelized).

  النص: "${originalText}"

  **الشروط الصارمة جداً:**
  1. **التشكيل الكامل لكل حرف:** يجب وضع الحركات (فتحة، ضمة، كسرة، سكون) على **جميع** الحروف بلا استثناء، وليس فقط أواخر الكلمات.
  2. **الدقة النحوية والصرفية:** تأكد من صحة الإعراب وبنية الكلمات.
  3. **الشدة:** ضع الشدة مع حركتها المناسبة في موضعها الصحيح.
  4. **تنوين:** تأكد من صحة التنوين.

  **مثال مطلوب:**
  بدلاً من: "العلمُ نورٌ يُضيءُ الطريقَ"
  يجب أن يكون: "الْعِلْمُ نُورٌ يُضِيءُ الطَّرِيقَ لِلْمُتَعَلِّمِينَ."

  المطلوب: أعد كتابة النص مشكولاً بالكامل (Full Tashkeel) فقط، بدون أي مقدمات أو شرح.
        `;

        const correctedText = await base44.integrations.Core.InvokeLLM({ prompt: reviewPrompt });
      
      if (typeof correctedText === 'string' && correctedText.trim()) {
        return correctedText.trim();
      } else {
        return originalText;
      }
    } catch (error) {
      console.error('Text review failed:', error);
      // Fallback to original text on error (including limits)
      return originalText;
    } finally {
      setIsReviewing(false);
    }
  };

  const handleGenerate = async () => {
    if (!textType) {
      setError('يرجى اختيار نوع النص.');
      return;
    }
    
    if (textType === 'نص خاص' && !customText.trim()) {
      setError('يرجى كتابة النص الخاص بك.');
      return;
    }
    
    setError(null);
    setIsLoading(true);

    try {
      let finalText = '';
      
      if (textType === 'نص خاص') {
        finalText = await reviewAndCorrectText(customText.trim());
      } else {
        const selectedType = TEXT_TYPES.find(t => t.value === textType);
        
        // Calculate complexity
        let complexityInstruction = "استخدم جملاً بسيطة ومفردات سهلة (مستوى مبتدئ).";
        if (wordCount[0] > 150) complexityInstruction = "استخدم جملاً مركبة، وتراكيب بلاغية قوية، ومفردات غنية (مستوى متقدم).";
        else if (wordCount[0] > 80) complexityInstruction = "استخدم جملاً متوسطة الطول، واربط بينها بأدوات ربط مناسبة (مستوى متوسط).";

        const prompt = `
        بصفتك خبيراً لغوياً، أنشئ نصاً ${textType}اً باللغة العربية الفُصحى.
        
        الطول التقريبي: ${wordCount[0]} كلمة.
        مستوى الصعوبة: ${complexityInstruction}

        **المعيار الذهبي للتشكيل (The Golden Standard):**
        1. **تشكيل كامل 100%:** كل حرف يجب أن يحمل حركة (أو سكون). لا تترك أي حرف عارياً.
        2. **دقة الإعراب:** انتبه لعلامات الإعراب في أواخر الكلمات (الرفع، النصب، الجر، الجزم) حسب القواعد النحوية الصحيحة.
        3. **التركيب السليم:** الجمل يجب أن تكون سليمة التركيب والمعنى.
        
        **مثال:**
        بدلاً من "السماء صافية والشمس مشرقة" (بدون تشكيل كامل)،
        اكتب: "السَّمَاءُ صَافِيَةٌ، وَالشَّمْسُ مُشْرِقَةٌ تُرْسِلُ أَشِعَّتَهَا الذَّهَبِيَّةَ عَلَى الْأَرْضِ."

        المطلوب: النص فقط، مشكولاً بالكامل وبدقة متناهية، بدون أي زيادات.
        `;

        try {
          const generatedText = await base44.integrations.Core.InvokeLLM({ prompt });

          if (typeof generatedText !== 'string' || generatedText.trim() === '') {
            throw new Error('فشل الذكاء الاصطناعي في إنشاء النص.');
          }
          
          finalText = await reviewAndCorrectText(generatedText.trim());
        } catch (llmError) {
          if (llmError.message && llmError.message.includes('limit')) {
             throw new Error('عذراً، وصلنا للحد الأقصى من استخدام الذكاء الاصطناعي. يرجى اختيار "نص خاص" وكتابة النص بنفسك.');
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
        category: textType === 'نص خاص' ? 'نص مخصص' : textType,
        difficulty_points: Math.round(actualWordCount / 10),
        word_count: actualWordCount
      });

      const urlParams = new URLSearchParams(window.location.search);
      const studentId = urlParams.get('studentId');
      navigate(createPageUrl(`Exercise?id=${newExercise.id}&studentId=${studentId}`));

    } catch (err) {
      console.error(err);
      setError('حدث خطأ أثناء إنشاء التمرين. يرجى المحاولة مرة أخرى.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-pink-50 to-purple-50 p-6" dir="rtl">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Button
            variant="outline"
            size="icon"
            className="rounded-full shadow-lg bg-white/80 backdrop-blur-sm hover:scale-110 transition-transform"
            onClick={() => navigate(-1)}
          >
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div>
            <h1 className="text-4xl font-bold bg-gradient-to-r from-orange-600 to-pink-600 bg-clip-text text-transparent arabic-text flex items-center gap-2">
              <Wand2 className="text-orange-600" />
              🎯 تحدي إضافي
            </h1>
            <p className="text-gray-600 arabic-text text-lg">
              اختر تفضيلاتك واختبر نفسك!
            </p>
          </div>
        </motion.div>
        
        <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="border-0 shadow-2xl bg-white/95 backdrop-blur-sm">
            <CardHeader className="bg-gradient-to-r from-orange-600 to-pink-600 text-white rounded-t-xl">
              <CardTitle className="arabic-text text-2xl">حدد مواصفات النص</CardTitle>
            </CardHeader>
            <CardContent className="p-8 space-y-8">
              <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 flex items-start gap-3">
                <AlertCircle className="w-6 h-6 text-blue-600 mt-0.5 flex-shrink-0" />
                <div>
                  <h3 className="font-bold text-blue-900 arabic-text mb-1">✨ ضمان الجودة</h3>
                  <p className="text-sm text-blue-700 arabic-text leading-relaxed">
                    جميع النصوص تخضع لمراجعة تلقائية للتأكد من صحة القواعد النحوية والتشكيل (آخر الكلمات فقط) قبل عرضها.
                  </p>
                </div>
              </div>

              <div className="space-y-3">
                <Label htmlFor="text-type" className="arabic-text text-lg font-bold text-gray-800 flex items-center gap-2">
                  <BookOpen className="w-5 h-5" />
                  نوع النص
                </Label>
                <div className="grid md:grid-cols-2 gap-3">
                  {TEXT_TYPES.map(type => (
                    <motion.div
                      key={type.value}
                      whileHover={{ scale: 1.02 }}
                      whileTap={{ scale: 0.98 }}
                    >
                      <Card 
                        className={`cursor-pointer transition-all duration-300 ${
                          textType === type.value 
                            ? 'border-4 border-orange-500 bg-orange-50 shadow-xl ring-4 ring-orange-200' 
                            : 'border-2 border-gray-200 hover:border-orange-300 hover:shadow-lg'
                        }`}
                        onClick={() => setTextType(type.value)}
                      >
                        <CardContent className="p-4">
                          <h3 className="font-bold text-lg arabic-text mb-1">{type.label}</h3>
                          <p className="text-sm text-gray-600 arabic-text">{type.description}</p>
                        </CardContent>
                      </Card>
                    </motion.div>
                  ))}
                </div>
              </div>

              {textType === 'نص خاص' && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3"
                >
                  <Label htmlFor="custom-text" className="arabic-text text-lg font-bold text-gray-800 flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    ✍️ اكتب أو الصق النص الخاص بك
                  </Label>
                  <Textarea 
                    id="custom-text"
                    placeholder="اكتب أو الصق هنا النص الذي تريد التدرب عليه..."
                    value={customText}
                    onChange={e => setCustomText(e.target.value)}
                    className="arabic-text min-h-[180px] text-lg border-2 border-orange-300 rounded-xl focus:ring-4 focus:ring-orange-200"
                  />
                  <p className="text-sm text-orange-600 arabic-text bg-orange-50 p-3 rounded-lg">
                    💡 سيتم مراجعة النص وتصحيح التشكيل والقواعد تلقائياً قبل إنشاء التمرين.
                  </p>
                </motion.div>
              )}

              {textType && textType !== 'نص خاص' && (
                <div className="space-y-4">
                  <Label className="arabic-text text-lg font-bold text-gray-800">
                    📏 عدد الكلمات (حوالي {Math.round(wordCount[0]/150)} دقيقة قراءة)
                  </Label>
                  <div className="flex items-center gap-6">
                    <Slider 
                      value={wordCount}
                      onValueChange={setWordCount}
                      min={30}
                      max={200}
                      step={10}
                      className="flex-1"
                    />
                    <span className="font-bold text-3xl text-orange-600 bg-orange-100 px-6 py-3 rounded-xl min-w-[80px] text-center shadow-lg">
                      {wordCount[0]}
                    </span>
                  </div>
                  <div className="bg-purple-50 rounded-xl p-4 border-2 border-purple-200">
                    <p className="text-sm text-purple-800 arabic-text font-semibold">
                      <strong>📊 المستوى المتوقع:</strong> {wordCount[0] >= 150 ? 'متقدم 🏆' : wordCount[0] >= 100 ? 'متوسط ⭐' : 'مبتدئ 🎯'}
                    </p>
                  </div>
                </div>
              )}

              {error && (
                <motion.div
                  initial={{ opacity: 0, y: -10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="bg-red-50 border-2 border-red-200 rounded-xl p-4 flex items-center gap-3"
                >
                  <AlertCircle className="w-6 h-6 text-red-600 flex-shrink-0" />
                  <p className="text-red-700 arabic-text font-semibold">{error}</p>
                </motion.div>
              )}

              <Button
                onClick={handleGenerate}
                disabled={isLoading || isReviewing}
                size="lg"
                className="w-full bg-gradient-to-r from-orange-600 to-pink-600 hover:from-orange-700 hover:to-pink-700 text-white text-xl py-8 rounded-2xl arabic-text shadow-2xl hover:shadow-3xl transition-all duration-300 hover:scale-105"
              >
                {isLoading || isReviewing ? (
                  <>
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white mr-3"></div>
                    {isReviewing ? '🔍 جارٍ المراجعة والتصحيح...' : '✨ جارٍ الإنشاء...'}
                  </>
                ) : (
                  <>
                    <Sparkles className="w-6 h-6 mr-3" />
                    {textType === 'نص خاص' ? '🚀 مراجعة وإنشاء التمرين' : '🎯 إنشاء نص محسّن'}
                  </>
                )}
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}