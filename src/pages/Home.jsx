import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Mic, Brain, Award, TrendingUp } from "lucide-react";
import Leaderboard from "@/components/Leaderboard";

export default function Home() {
  const features = [
    {
      icon: Mic,
      title: "التسجيل الصوتي الذكي",
      description: "سجّل صوتك واحصل على تحليل فوري لنطقك",
      color: "from-blue-500 to-blue-600"
    },
    {
      icon: Brain, 
      title: "تحليل ذكي بالذكاء الاصطناعي",
      description: "تقييم دقيق لنطقك مع نصائح للتحسين",
      color: "from-emerald-500 to-emerald-600"
    },
    {
      icon: Award,
      title: "نظام المكافآت والشارات",
      description: "احصل على شارات وتحفيز لاستكمال رحلة التعلّم",
      color: "from-orange-500 to-orange-600"
    },
    {
      icon: TrendingUp,
      title: "متابعة التقدم",
      description: "راقب تطوّر أدائك عبر الوقت بتفصيل",
      color: "from-purple-500 to-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-emerald-50">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12 lg:py-16">
        {/* Hero Section */}
        <div className="text-center mb-12 sm:mb-16 lg:mb-20">
          {/* Static Purple Banner - لم يعد متحركاً */}
          <div className="inline-flex items-center gap-2 sm:gap-3 bg-gradient-to-r from-purple-500 to-purple-600 rounded-full px-4 sm:px-6 py-2.5 sm:py-3 mb-6 sm:mb-8 shadow-lg">
            <div className="w-7 h-7 sm:w-8 sm:h-8 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center flex-shrink-0">
              <GraduationCap className="w-4 h-4 sm:w-5 sm:h-5 text-white" />
            </div>
            <span className="text-white font-semibold text-sm sm:text-base arabic-text">
              منصة تعلّم النطق العربي الذكية
            </span>
          </div>
          
          <h1 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold text-slate-900 mb-4 sm:mb-6 arabic-text leading-tight px-4">
            تعلّم النطق الصحيح
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              للغة العربية الفُصحى
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-xl text-slate-600 mb-8 sm:mb-12 max-w-3xl mx-auto arabic-text leading-relaxed px-4">
            منصة تفاعلية تستخدم الذكاء الاصطناعي لتحسين نطقك وتقييم أدائك بدقة عالية،
            مع متابعة شاملة من المعلمين لضمان التقدم المستمر
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-stretch sm:items-center px-4 max-w-4xl mx-auto">
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
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 arabic-text font-semibold"
            >
                <GraduationCap className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                ابدأ كطالب
            </Button>
            
            <Link to={createPageUrl("ParentDashboard")} className="w-full sm:w-auto">
               <Button 
                 variant="outline" 
                 size="lg"
                 className="w-full border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 hover:border-emerald-400 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 arabic-text font-semibold"
               >
                 <Users className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                 أنا ولي أمر
               </Button>
            </Link>

            <Link to={createPageUrl("TeacherDashboard")} className="w-full sm:w-auto">
              <Button 
                variant="outline" 
                size="lg"
                className="w-full border-2 border-slate-300 text-slate-700 hover:bg-slate-100 hover:border-slate-400 px-6 sm:px-8 py-5 sm:py-6 text-base sm:text-lg rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 arabic-text font-semibold"
              >
                <Users className="w-5 h-5 sm:w-6 sm:h-6 ml-2" />
                تسجيل الدخول كمعلم
              </Button>
            </Link>
          </div>
        </div>

        {/* Features Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 lg:gap-8 mb-12 sm:mb-16 lg:mb-20">
          {features.map((feature) => (
            <Card 
              key={feature.title} 
              className="border-0 shadow-xl bg-white/80 backdrop-blur-sm hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 group"
            >
              <CardHeader className="pb-3 sm:pb-4">
                <div className={`w-14 h-14 sm:w-16 sm:h-16 bg-gradient-to-r ${feature.color} rounded-xl sm:rounded-2xl flex items-center justify-center mb-3 sm:mb-4 group-hover:scale-110 transition-transform duration-300 shadow-lg`}>
                  <feature.icon className="w-7 h-7 sm:w-8 sm:h-8 text-white" />
                </div>
                <CardTitle className="text-lg sm:text-xl font-bold text-slate-900 arabic-text">
                  {feature.title}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-sm sm:text-base text-slate-600 arabic-text leading-relaxed">
                  {feature.description}
                </p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Leaderboard Section */}
        <div className="max-w-5xl mx-auto mb-12 sm:mb-16 lg:mb-20 px-4">
           <div className="text-center mb-8 sm:mb-10">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-slate-900 arabic-text mb-3 sm:mb-4">
                 أبطال القراءة المتميزون 🌟
              </h2>
              <p className="text-slate-600 text-base sm:text-lg md:text-xl arabic-text">
                 تنافس مع أصدقائك واصعد إلى القمة!
              </p>
           </div>
           <Leaderboard />
        </div>

        {/* CTA Section */}
        <div className="text-center px-4">
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-slate-900 via-slate-800 to-slate-900 max-w-4xl mx-auto overflow-hidden">
            <CardContent className="p-8 sm:p-10 lg:p-12">
              <h2 className="text-2xl sm:text-3xl md:text-4xl font-bold text-white mb-4 sm:mb-6 arabic-text">
                ابدأ رحلتك في تعلّم النطق الصحيح اليوم
              </h2>
              <p className="text-base sm:text-lg md:text-xl text-slate-300 mb-6 sm:mb-8 arabic-text leading-relaxed">
                انضم إلى آلاف الطلاب الذين حسّنوا نطقهم باستخدام تقنياتنا المتطورة
              </p>
              <Link to={createPageUrl("StudentDashboard")}>
                <Button 
                  size="lg"
                  className="w-full sm:w-auto bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-8 sm:px-12 py-5 sm:py-6 text-lg sm:text-xl rounded-xl sm:rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 arabic-text font-semibold"
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
