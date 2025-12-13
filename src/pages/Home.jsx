import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GraduationCap, Users, Mic, Brain, Award, TrendingUp } from "lucide-react";
import { motion } from "framer-motion";
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
      <div className="container mx-auto px-6 py-12">
        {/* Hero Section */}
        <motion.div 
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8 }}
          className="text-center mb-16"
        >
          <div className="inline-flex items-center gap-3 bg-white/60 backdrop-blur-sm rounded-full px-6 py-3 mb-8 shadow-lg border border-white/20">
            <div className="w-8 h-8 bg-gradient-to-r from-emerald-500 to-blue-600 rounded-full flex items-center justify-center">
              <GraduationCap className="w-4 h-4 text-white" />
            </div>
            <span className="text-slate-700 font-medium arabic-text">منصة تعلّم النطق العربي الذكية</span>
          </div>
          
          <h1 className="text-5xl md:text-6xl font-bold text-slate-900 mb-6 arabic-text leading-tight">
            تعلّم النطق الصحيح
            <br />
            <span className="bg-gradient-to-r from-emerald-600 to-blue-600 bg-clip-text text-transparent">
              للغة العربية الفُصحى
            </span>
          </h1>
          
          <p className="text-xl text-slate-600 mb-12 max-w-3xl mx-auto arabic-text leading-relaxed">
            منصة تفاعلية تستخدم الذكاء الاصطناعي لتحسين نطقك وتقييم أدائك بدقة عالية،
            مع متابعة شاملة من المعلمين لضمان التقدم المستمر
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
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
                className="bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 arabic-text"
            >
                <GraduationCap className="w-6 h-6 ml-2" />
                ابدأ كطالب
            </Button>
            
            <Link to={createPageUrl("ParentDashboard")}>
               <Button 
                 variant="outline" 
                 size="lg"
                 className="border-2 border-emerald-300 text-emerald-700 hover:bg-emerald-50 px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 arabic-text"
               >
                 <Users className="w-6 h-6 ml-2" />
                 أنا ولي أمر
               </Button>
            </Link>

            <Link to={createPageUrl("TeacherDashboard")}>
              <Button 
                variant="outline" 
                size="lg"
                className="border-2 border-slate-300 text-slate-700 hover:bg-slate-50 px-8 py-6 text-lg rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 arabic-text"
              >
                <Users className="w-6 h-6 ml-2" />
                تسجيل الدخول كمعلم
              </Button>
            </Link>
          </div>
        </motion.div>

        {/* Features Section */}
        <motion.div 
          initial={{ opacity: 0, y: 50 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="grid md:grid-cols-2 lg:grid-cols-4 gap-8 mb-16"
        >
          {features.map((feature, index) => (
            <motion.div
              key={feature.title}
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.6, delay: 0.4 + index * 0.1 }}
            >
              <Card className="border-0 shadow-xl bg-white/60 backdrop-blur-sm hover:shadow-2xl transition-all duration-500 hover:-translate-y-2 group">
                <CardHeader className="pb-4">
                  <div className={`w-16 h-16 bg-gradient-to-r ${feature.color} rounded-2xl flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                    <feature.icon className="w-8 h-8 text-white" />
                  </div>
                  <CardTitle className="text-xl font-bold text-slate-900 arabic-text">
                    {feature.title}
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <p className="text-slate-600 arabic-text leading-relaxed">
                    {feature.description}
                  </p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </motion.div>

        {/* Leaderboard Section */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
          className="max-w-4xl mx-auto mb-16"
        >
           <div className="text-center mb-10">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 arabic-text mb-4">
                 أبطال القراءة المتميزون 🌟
              </h2>
              <p className="text-slate-600 text-lg arabic-text">
                 تنافس مع أصدقائك واصعد إلى القمة!
              </p>
           </div>
           <Leaderboard />
        </motion.div>

        {/* CTA Section */}
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.8, delay: 0.6 }}
          className="text-center"
        >
          <Card className="border-0 shadow-2xl bg-gradient-to-r from-slate-900 to-slate-800 max-w-4xl mx-auto">
            <CardContent className="p-12">
              <h2 className="text-3xl md:text-4xl font-bold text-white mb-6 arabic-text">
                ابدأ رحلتك في تعلّم النطق الصحيح اليوم
              </h2>
              <p className="text-xl text-slate-300 mb-8 arabic-text">
                انضم إلى آلاف الطلاب الذين حسّنوا نطقهم باستخدام تقنياتنا المتطورة
              </p>
              <Link to={createPageUrl("StudentDashboard")}>
                <Button 
                  size="lg"
                  className="bg-gradient-to-r from-emerald-500 to-blue-500 hover:from-emerald-600 hover:to-blue-600 text-white px-12 py-6 text-xl rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 arabic-text"
                >
                  ابدأ التعلّم مجاناً
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    </div>
  );
}