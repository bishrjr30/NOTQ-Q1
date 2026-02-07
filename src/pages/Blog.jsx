// src/pages/Blog.jsx

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { ArrowLeft, BookOpen, PenTool, Mic, Brain, Lightbulb } from "lucide-react";
import { motion } from "framer-motion";

const articles = [
  {
    id: 1,
    title: "أهمية النطق الصحيح في اللغة العربية وتأثيره على الثقة بالنفس",
    excerpt: "النطق ليس مجرد إصدار أصوات، بل هو بوابة التواصل الأولى. اكتشف كيف يؤثر نطقك الصحيح لمخارج الحروف على ثقتك بنفسك وقدرتك على الإقناع.",
    icon: Mic,
    content: `
      <h3 class="text-xl font-bold mb-3 text-indigo-800">مقدمة: لماذا نهتم بالنطق؟</h3>
      <p class="mb-4 leading-loose">اللغة العربية لغة غنية بالمخارج الصوتية الدقيقة. الفرق بين "س" و"ص"، أو "ت" و"ط" قد يغير المعنى تماماً. النطق الصحيح ليس مجرد مهارة لغوية، بل هو أداة اجتماعية ونفسية قوية.</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">1. الوضوح هو أساس التواصل</h3>
      <p class="mb-4 leading-loose">عندما تنطق الكلمات بوضوح، يفهمك المستمع دون عناء. هذا يقلل من سوء الفهم ويجعل حواراتك أكثر فعالية. الشخص الذي يتمتم أو يخلط بين الحروف غالباً ما يضطر لإعادة كلامه، مما قد يسبب له الإحراج.</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">2. الثقة بالنفس والقيادة</h3>
      <p class="mb-4 leading-loose">أظهرت الدراسات أن الأشخاص الذين يتحدثون بطلاقة ونطق سليم يُنظر إليهم على أنهم أكثر كفاءة وذكاء. سواء كنت طالباً يقدم عرضاً مدرسياً أو موظفاً في اجتماع، نطقك السليم يعكس شخصية قوية وواثقة.</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">3. الحفاظ على هوية اللغة</h3>
      <p class="mb-4 leading-loose">اللغة العربية تفقد بريقها إذا أهملنا مخارج حروفها المميزة مثل الضاد والعين والقاف. التدريب على النطق هو حفاظ على تراث لغوي عظيم وهوية ثقافية.</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">كيف تحسن نطقك؟</h3>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>الاستماع المكثف:</strong> استمع إلى القراء المتقنين والخطباء الفصحاء.</li>
        <li><strong>التسجيل والمقارنة:</strong> سجل صوتك وأنت تقرأ نصاً، ثم قارنه بالتسجيل الأصلي (وهو ما توفره منصة نطق).</li>
        <li><strong>التدريب اليومي:</strong> خصص 10 دقائق يومياً للقراءة الجهرية.</li>
      </ul>
    `
  },
  {
    id: 2,
    title: "دليل الطالب الشامل لتحسين الإملاء وتجنب الأخطاء الشائعة",
    excerpt: "هل تعاني من التاء المربوطة والمفتوحة؟ هل تخلط بين همزة الوصل والقطع؟ هذا المقال هو دليلك العملي لإتقان الإملاء.",
    icon: PenTool,
    content: `
      <h3 class="text-xl font-bold mb-3 text-indigo-800">لماذا نخطئ في الإملاء؟</h3>
      <p class="mb-4 leading-loose">الأخطاء الإملائية قد تشوه أجمل النصوص. غالباً ما نخطئ بسبب الاعتماد على اللهجات العامية أو عدم معرفة القواعد الأساسية. إليك أهم القواعد التي ستنقل كتابتك لمستوى آخر.</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">1. لغز التاء المربوطة (ـة) والمفتوحة (ت)</h3>
      <p class="mb-4 leading-loose">القاعدة الذهبية: انطق الكلمة مع السكون. إذا تحولت التاء إلى "هاء" فهي مربوطة (مثل: مدرسة -> مدرسهـ). أما إذا بقيت "تاء" فهي مفتوحة (مثل: بيت -> بيت).</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">2. همزتا الوصل والقطع</h3>
      <p class="mb-4 leading-loose">للتفريق بينهما، ضع حرف "و" قبل الكلمة. إذا نطقت الهمزة فهي قطع (أخذ -> وأخذ)، وإذا سقطت في النطق فهي وصل (استمع -> واستمع).</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">3. الألف اللينة في الأفعال (ى / ا)</h3>
      <p class="mb-4 leading-loose">حول الفعل للماضي الثلاثي. إذا كان أصل الألف واواً تكتب ممدودة (دعا -> يدعو)، وإذا كان ياءً تكتب مقصورة (قضى -> يقضي).</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">نصائح ذهبية</h3>
      <p class="mb-4 leading-loose">القراءة هي مفتاح الإملاء الصحيح. كلما قرأت أكثر، طبعت صور الكلمات الصحيحة في ذاكرتك البصرية.</p>
    `
  },
  {
    id: 3,
    title: "الفرق الجوهري بين النصوص العلمية والأدبية: متى نستخدم كل منهما؟",
    excerpt: "لكل مقام مقال. تعرف على خصائص النص العلمي الدقيق والنص الأدبي الجمالي، وكيف تختار الأسلوب المناسب لهدفك.",
    icon: BookOpen,
    content: `
      <h3 class="text-xl font-bold mb-3 text-indigo-800">المقدمة</h3>
      <p class="mb-4 leading-loose">الكتابة فن وعلم. يختلف أسلوب الكاتب باختلاف الغرض من النص. هل تريد نقل معلومة (علمي) أم إثارة مشاعر (أدبي)؟</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">أولاً: النص العلمي (لغة العقل)</h3>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>الهدف:</strong> نقل الحقائق والمعلومات بدقة وموضوعية.</li>
        <li><strong>الخصائص:</strong> دقة الألفاظ، المباشرة، البعد عن الخيال والمحسنات البديعية، استخدام الأرقام والمصطلحات.</li>
        <li><strong>مثال:</strong> "يتكون الماء من ذرتي هيدروجين وذرة أكسجين."</li>
      </ul>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">ثانياً: النص الأدبي (لغة القلب)</h3>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>الهدف:</strong> التأثير في القارئ وإمتاعه وإثارة عواطفه.</li>
        <li><strong>الخصائص:</strong> التصوير الفني، التشبيهات، الاستعارات، الذاتية (رأي الكاتب)، جمال الأسلوب.</li>
        <li><strong>مثال:</strong> "انهمر الغيث ليروي عطش الأرض الظمأى ويعيد للحقول ابتسامتها."</li>
      </ul>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">الخلاصة</h3>
      <p class="mb-4 leading-loose">الكاتب الماهر هو من يتقن الانتقال بين الأسلوبين حسب الحاجة. في منصة نطق، نوفر لك تدريبات على كلا النوعين لتنمية ذائقتك اللغوية وحصيلتك المعرفية.</p>
    `
  },
  {
    id: 4,
    title: "قواعد الهمزات: الكابوس الذي يواجه الطلاب وكيفية التغلب عليه",
    excerpt: "الهمزة المتوسطة والمتطرفة.. قواعد تبدو معقدة لكنها تتبع منطقاً بسيطاً. شرح مبسط لقاعدة أقوى الحركات.",
    icon: Lightbulb,
    content: `
      <h3 class="text-xl font-bold mb-3 text-indigo-800">سلم الحركات (قاعدة أقوى الحركات)</h3>
      <p class="mb-4 leading-loose">لكتابة الهمزة المتوسطة، يجب أن ننظر إلى حركتها وحركة الحرف الذي قبلها، ثم نكتبها على الحرف الذي يناسب الحركة الأقوى. ترتيب القوة هو:</p>
      <ol class="list-decimal list-inside mb-4 space-y-2 font-bold text-indigo-600">
        <li>الكسرة (يناسبها الياء/النبرة ـئـ)</li>
        <li>الضمة (يناسبها الواو ؤ)</li>
        <li>الفتحة (يناسبها الألف أ)</li>
        <li>السكون (وهو الأضعف)</li>
      </ol>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">أمثلة تطبيقية</h3>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li><strong>سُئِل:</strong> الهمزة مكسورة، وما قبلها مضموم. الكسرة أقوى من الضمة -> تكتب على نبرة (سئل).</li>
        <li><strong>فُؤَاد:</strong> الهمزة مفتوحة، وما قبلها مضموم. الضمة أقوى من الفتحة -> تكتب على واو (فؤاد).</li>
        <li><strong>مَأْتم:</strong> الهمزة ساكنة، وما قبلها مفتوح. الفتحة أقوى من السكون -> تكتب على ألف (مأتم).</li>
      </ul>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">الهمزة المتطرفة (في آخر الكلمة)</h3>
      <p class="mb-4 leading-loose">أمرها أسهل! ننظر فقط لحركة الحرف الذي قبلها:</p>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li>قبلها مكسور -> (شاطِئ)</li>
        <li>قبلها مضموم -> (تباطُؤ)</li>
        <li>قبلها مفتوح -> (قرَأ)</li>
        <li>قبلها ساكن -> (دفْء، سماْء)</li>
      </ul>
    `
  },
  {
    id: 5,
    title: "دور الذكاء الاصطناعي في تعليم اللغات: ثورة منصة نطق",
    excerpt: "كيف تساهم التكنولوجيا الحديثة في تسريع عملية التعلم وتوفير تغذية راجعة فورية للطلاب؟",
    icon: Brain,
    content: `
      <h3 class="text-xl font-bold mb-3 text-indigo-800">التعليم التقليدي vs التعليم الذكي</h3>
      <p class="mb-4 leading-loose">في الفصل التقليدي، قد لا يجد المعلم وقتاً للاستماع لكل طالب وتصحيح أخطائه الفردية. هنا يأتي دور الذكاء الاصطناعي ليسد هذه الفجوة.</p>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">كيف تعمل منصة نطق؟</h3>
      <p class="mb-4 leading-loose">نستخدم خوارزميات (Speech-to-Text) متقدمة تم تدريبها خصيصاً على اللغة العربية الفصحى. تقوم المنصة بـ:</p>
      <ul class="list-disc list-inside mb-4 space-y-2">
        <li>تحويل صوتك إلى نص مكتوب.</li>
        <li>مقارنة النص المنطوق بالنص الأصلي.</li>
        <li>تحديد الكلمات التي لم تنطق بشكل صحيح (حذفت، أبدلت، أو شوهت).</li>
        <li>إعطاء درجة فورية وتوضيح مكان الخطأ.</li>
      </ul>
      
      <h3 class="text-xl font-bold mb-3 text-indigo-800">الفائدة العظمى: التعلم بلا حرج</h3>
      <p class="mb-4 leading-loose">الكثير من الطلاب يخجلون من القراءة بصوت عالٍ خوفاً من الخطأ أمام الزملاء. مع "نطق"، أنت تتدرب مع "بوت" صبور لا يمل ولا يسخر، مما يبني ثقتك بنفسك لتنطلق بعدها متحدثاً بطلاقة أمام الجميع.</p>
    `
  }
];

export default function Blog() {
  const [selectedArticle, setSelectedArticle] = React.useState(null);

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <motion.div initial={{ y: -20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="flex items-center justify-between mb-8">
          <Link to={createPageUrl("Home")}>
             <Button variant="outline" size="sm" className="bg-white hover:bg-slate-100 shadow-sm">
                <ArrowLeft className="ml-2 h-4 w-4" /> العودة للرئيسية
             </Button>
          </Link>
          <div className="text-left">
            <h1 className="text-3xl font-bold text-indigo-900 flex items-center gap-2 justify-end">
              <BookOpen className="h-8 w-8 text-indigo-600" /> المدونة التعليمية
            </h1>
            <p className="text-slate-500 mt-1 text-sm">مقالات حصرية لتحسين مهاراتك اللغوية</p>
          </div>
        </motion.div>

        {selectedArticle ? (
          /* Single Article View */
          <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }}>
            <Button variant="ghost" onClick={() => setSelectedArticle(null)} className="mb-4 text-indigo-600 hover:bg-indigo-50">
                <ArrowLeft className="ml-2 h-4 w-4" /> العودة للمقالات
            </Button>
            <Card className="bg-white shadow-lg border-t-4 border-t-indigo-600">
                <CardHeader>
                    <div className="flex items-center gap-3 mb-2">
                        <div className="p-2 bg-indigo-100 rounded-lg text-indigo-600">
                            <selectedArticle.icon className="w-6 h-6" />
                        </div>
                        <span className="text-sm text-slate-400">مقال تعليمي</span>
                    </div>
                    <CardTitle className="text-3xl text-slate-900 leading-normal">{selectedArticle.title}</CardTitle>
                </CardHeader>
                <CardContent>
                    <div 
                        className="prose prose-lg prose-indigo max-w-none text-slate-700 arabic-text leading-loose"
                        dangerouslySetInnerHTML={{ __html: selectedArticle.content }} 
                    />
                </CardContent>
            </Card>
          </motion.div>
        ) : (
          /* Articles List */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {articles.map((article, idx) => (
              <motion.div 
                key={article.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                <Card className="h-full hover:shadow-xl transition-all duration-300 border-0 shadow-md flex flex-col group cursor-pointer" onClick={() => setSelectedArticle(article)}>
                  <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500 w-full"></div>
                  <CardHeader>
                    <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-4 group-hover:bg-indigo-100 transition-colors">
                        <article.icon className="w-6 h-6 text-slate-600 group-hover:text-indigo-600" />
                    </div>
                    <CardTitle className="text-xl text-slate-800 leading-snug group-hover:text-indigo-700 transition-colors">
                        {article.title}
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    <p className="text-slate-500 text-sm leading-relaxed line-clamp-3">
                        {article.excerpt}
                    </p>
                  </CardContent>
                  <div className="p-6 pt-0 mt-auto">
                    <Button variant="link" className="p-0 text-indigo-600 font-bold group-hover:translate-x-[-5px] transition-transform">
                        اقرأ المزيد <ArrowLeft className="w-4 h-4 mr-2" />
                    </Button>
                  </div>
                </Card>
              </motion.div>
            ))}
          </div>
        )}

      </div>
    </div>
  );
}
