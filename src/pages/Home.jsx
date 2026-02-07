// src/pages/Home.jsx

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  GraduationCap, 
  Users, 
  Mic, 
  Brain, 
  Award, 
  TrendingUp, 
  CheckCircle2, 
  BookOpen 
} from "lucide-react";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  const features = [
    {
      icon: Mic,
      title: "التسجيل الصوتي الذكي",
      description: "سجّل صوتك واحصل على تحليل فوري لنطقك باستخدام خوارزميات متقدمة تميز مخارج الحروف العربية بدقة.",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Brain, 
      title: "تحليل ذكي بالذكاء الاصطناعي",
      description: "تقييم دقيق لنطقك مع نصائح للتحسين، يعتمد على أحدث نماذج الذكاء الاصطناعي لفهم السياق والتشكيل.",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: Award,
      title: "نظام المكافآت والشارات",
      description: "احصل على شارات وتحفيز لاستكمال رحلة التعلّم، مما يجعل العملية التعليمية ممتعة وتنافسية.",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: TrendingUp,
      title: "متابعة التقدم",
      description: "راقب تطوّر أدائك عبر الوقت بتفصيل، مع رسوم بيانية توضح نقاط القوة والضعف لديك.",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50 pb-20">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        
        {/* === Hero Section === */}
        <div className="text-center mb-16 lg:mb-24">
          <Badge className="mb-4 bg-blue-100 text-blue-700 hover:bg-blue-200 px-4 py-1 text-sm rounded-full border border-blue-200">
            ✨ المنصة الأولى لتعليم النطق العربي بالذكاء الاصطناعي
          </Badge>
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-bold text-slate-900 mb-6 arabic-text leading-tight">
            تعلّم النطق الصحيح <br />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              للغة العربية الفُصحى
            </span>
          </h1>
          
          <p className="text-lg sm:text-xl text-slate-600 mb-10 max-w-3xl mx-auto arabic-text leading-relaxed">
            منصة "نُطق" هي بوابتك لإتقان لغة الضاد. نستخدم أحدث تقنيات الذكاء الاصطناعي لتحليل صوتك، تصحيح مخارج الحروف، ومساعدتك على القراءة بطلاقة وثقة، تحت إشراف نخبة من المعلمين.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center max-w-lg mx-auto">
            <Button 
                onClick={() => {
                   const studentId = localStorage.getItem("studentId");
                   if (studentId) {
                     window.location.href = createPageUrl("StudentDashboard");
                   } else {
                     window.location.href = createPageUrl("StudentOnboarding");
                   }
                }}
                size="lg" 
                className="w-full bg-indigo-600 hover:bg-indigo-700 text-white h-14 text-lg rounded-xl shadow-xl hover:shadow-2xl transition-all duration-300 arabic-text"
            >
                <GraduationCap className="w-6 h-6 ml-2" />
                ابدأ رحلتك التعليمية مجاناً
            </Button>
            
            <div className="grid grid-cols-2 gap-3 w-full">
                <Link to={createPageUrl("ParentDashboard")}>
                   <Button variant="outline" className="w-full h-12 border-indigo-200 text-indigo-700 hover:bg-indigo-50 arabic-text">
                     <Users className="w-4 h-4 ml-2" /> ولي الأمر
                   </Button>
                </Link>
                <Link to={createPageUrl("TeacherDashboard")}>
                  <Button variant="outline" className="w-full h-12 border-indigo-200 text-indigo-700 hover:bg-indigo-50 arabic-text">
                    <Users className="w-4 h-4 ml-2" /> المعلم
                  </Button>
                </Link>
            </div>
          </div>
        </div>

        {/* === Features Section === */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-20">
          {features.map((feature) => (
            <Card key={feature.title} className="border-0 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 bg-white">
              <CardHeader>
                <div className={`w-14 h-14 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 shadow-md`}>
                  <feature.icon className="w-7 h-7 text-white" />
                </div>
                <CardTitle className="text-xl font-bold text-slate-900 arabic-text">{feature.title}</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-slate-600 arabic-text leading-relaxed">{feature.description}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* === Educational Content (SEO & AdSense Rich Content) === */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 mb-20 items-start">
            
            {/* Right Column: Why Notq? */}
            <div className="space-y-8">
                <div>
                    <h2 className="text-3xl font-bold text-indigo-900 mb-4 arabic-text flex items-center gap-2">
                        <BookOpen className="w-8 h-8 text-indigo-600" />
                        لماذا منصة "نُطق"؟
                    </h2>
                    <p className="text-slate-600 leading-loose arabic-text text-lg text-justify">
                        اللغة العربية هي لغة القرآن الكريم ولغة الضاد الغنية بمفرداتها وبلاغتها. 
                        في عصر التكنولوجيا، أصبح من الضروري دمج أدوات الذكاء الاصطناعي في التعليم 
                        لتوفير تجربة تعليمية مخصصة لكل طالب. منصة "نطق" ليست مجرد أداة تسجيل، بل هي 
                        معلمك الشخصي الذي يرافقك في كل كلمة تنطقها، يصحح أخطاءك فوراً، ويشجعك على الاستمرار.
                    </p>
                </div>

                <div className="bg-white p-6 rounded-2xl shadow-sm border border-indigo-100">
                    <h3 className="text-xl font-bold text-slate-800 mb-3 arabic-text">أهمية النطق الصحيح:</h3>
                    <ul className="space-y-3">
                        {[
                            "تعزيز الثقة بالنفس عند التحدث أمام الآخرين.",
                            "تحسين مهارات القراءة والكتابة والإملاء.",
                            "فهم النصوص الأدبية والدينية فهماً عميقاً.",
                            "تطوير المهارات اللغوية الأساسية للمستقبل المهني."
                        ].map((item, i) => (
                            <li key={i} className="flex items-start gap-3 text-slate-600 arabic-text">
                                <CheckCircle2 className="w-5 h-5 text-green-500 mt-1 flex-shrink-0" />
                                <span>{item}</span>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>

            {/* Left Column: How it works */}
            <div className="bg-gradient-to-br from-indigo-900 to-blue-900 text-white p-8 rounded-3xl shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -translate-y-1/2 translate-x-1/2 blur-3xl"></div>
                
                <h2 className="text-3xl font-bold mb-8 arabic-text relative z-10">كيف تبدأ رحلتك؟ 🚀</h2>
                
                <div className="space-y-8 relative z-10">
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur-sm">1</div>
                        <div>
                            <h3 className="text-xl font-bold mb-2 arabic-text">سجّل حسابك</h3>
                            <p className="text-indigo-200 arabic-text">أنشئ حساب طالب جديد وابدأ بتحديد مستواك الحالي.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur-sm">2</div>
                        <div>
                            <h3 className="text-xl font-bold mb-2 arabic-text">اختر تمريناً</h3>
                            <p className="text-indigo-200 arabic-text">اختر نصاً للقراءة من مكتبتنا المتنوعة أو أنشئ نصك الخاص.</p>
                        </div>
                    </div>
                    <div className="flex gap-4">
                        <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center font-bold text-xl backdrop-blur-sm">3</div>
                        <div>
                            <h3 className="text-xl font-bold mb-2 arabic-text">احصل على التقييم</h3>
                            <p className="text-indigo-200 arabic-text">اقرأ النص بصوت عالٍ، وسيقوم الذكاء الاصطناعي بتحليله وإعطائك النتيجة فوراً.</p>
                        </div>
                    </div>
                </div>
            </div>
        </div>

        {/* === Leaderboard Section === */}
        <div className="max-w-5xl mx-auto mb-20 px-4">
           <div className="text-center mb-10">
             <h2 className="text-3xl font-bold text-slate-900 arabic-text mb-4">
                 أبطال القراءة المتميزون 🌟
             </h2>
             <p className="text-slate-600 text-lg arabic-text">
                 تنافس مع أصدقائك واصعد إلى القمة من خلال التدريب اليومي!
             </p>
           </div>
           <Leaderboard />
        </div>

        {/* === FAQ Section (Great for AdSense) === */}
        <div className="max-w-4xl mx-auto mb-20">
            <h2 className="text-3xl font-bold text-center text-slate-900 mb-10 arabic-text">أسئلة شائعة</h2>
            <div className="grid gap-6">
                {[
                    { q: "هل المنصة مجانية؟", a: "نعم، منصة نطق متاحة مجاناً لجميع الطلاب الراغبين في تحسين لغتهم العربية." },
                    { q: "كيف يتم تقييم النطق؟", a: "نستخدم تقنيات Speech-to-Text متطورة مدعومة بالذكاء الاصطناعي لمقارنة نطقك بالنطق الصحيح للنص." },
                    { q: "هل يمكنني استخدامها على الجوال؟", a: "بالتأكيد! المنصة مصممة لتعمل بكفاءة عالية على جميع الأجهزة الذكية والأجهزة اللوحية." }
                ].map((item, i) => (
                    <Card key={i} className="border border-slate-200 hover:border-indigo-300 transition-colors">
                        <CardHeader>
                            <CardTitle className="text-lg font-bold text-indigo-900 arabic-text">{item.q}</CardTitle>
                        </CardHeader>
                        <CardContent>
                            <p className="text-slate-600 arabic-text">{item.a}</p>
                        </CardContent>
                    </Card>
                ))}
            </div>
        </div>

        {/* === CTA Section === */}
        <div className="text-center">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-12">
              <h2 className="text-3xl sm:text-4xl font-bold text-white mb-6 arabic-text">
                ابدأ رحلتك في تعلّم النطق الصحيح اليوم
              </h2>
              <p className="text-xl text-slate-300 mb-8 arabic-text leading-relaxed">
                انضم إلى آلاف الطلاب الذين حسّنوا نطقهم باستخدام تقنياتنا المتطورة
              </p>
              <Link to={createPageUrl("StudentDashboard")}>
                <Button 
                  size="lg" 
                  className="bg-white text-slate-900 hover:bg-slate-100 px-10 py-6 text-xl rounded-2xl shadow-xl transition-all duration-300 arabic-text font-bold"
                >
                  ابدأ التعلّم الآن
                </Button>
              </Link>
            </CardContent>
          </Card>
        </div>

      </div>
    </div>
  );
}

// Helper Badge Component
function Badge({ children, className }) {
  return <span className={`inline-block font-medium ${className}`}>{children}</span>;
}
