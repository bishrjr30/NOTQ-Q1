// src/pages/AboutUs.jsx

import React from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Target, Heart, Star } from "lucide-react";

export default function AboutUs() {
  return (
    <div className="min-h-screen bg-white font-sans" dir="rtl" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      
      {/* Hero */}
      <div className="bg-indigo-900 text-white py-20 px-4 text-center">
        <h1 className="text-4xl md:text-5xl font-bold mb-4">من نحن؟</h1>
        <p className="text-xl text-indigo-200 max-w-2xl mx-auto">
          نحن فريق شغوف يسعى لتمكين الجيل القادم من إتقان لغتهم الأم باستخدام أحدث التقنيات.
        </p>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-16 space-y-16">
        
        {/* Story Section */}
        <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
                <h2 className="text-3xl font-bold text-indigo-900 mb-4">قصتنا</h2>
                <p className="text-slate-600 leading-loose text-lg text-justify">
                    انطلقت فكرة منصة "نُطق" من داخل فصول المدرسة الأمريكية للإبداع العلمي. لاحظنا التحدي الذي يواجهه الطلاب في إتقان مخارج الحروف العربية الصحيحة، والحاجة الماسة لتدريب فردي مكثف يصعب توفيره في الوقت المحدود للحصة الدراسية. من هنا، ولدت فكرة دمج "الذكاء الاصطناعي" مع "الخبرة التربوية" لخلق معلم افتراضي يرافق الطالب في منزله.
                </p>
            </div>
            <div className="bg-indigo-50 rounded-2xl p-8 flex items-center justify-center">
                <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/48d985d52_-Screenshot_20251114-193446_Brave1_20251114_193545_0000.png" alt="Logo" className="w-48 opacity-80" />
            </div>
        </div>

        {/* Vision & Mission */}
        <div className="grid md:grid-cols-3 gap-6">
            <Card className="border-t-4 border-t-indigo-600 shadow-lg">
                <CardContent className="p-6 text-center">
                    <Target className="w-12 h-12 text-indigo-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">رؤيتنا</h3>
                    <p className="text-slate-600">جيل عربي فصيح، يعتز بلغته، ويتقن فنون القراءة والتحدث بثقة وطلاقة.</p>
                </CardContent>
            </Card>
            <Card className="border-t-4 border-t-pink-600 shadow-lg">
                <CardContent className="p-6 text-center">
                    <Star className="w-12 h-12 text-pink-600 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">رسالتنا</h3>
                    <p className="text-slate-600">توفير بيئة تعليمية ذكية، ممتعة، وآمنة تشجع الطلاب على الممارسة المستمرة دون خوف من الخطأ.</p>
                </CardContent>
            </Card>
            <Card className="border-t-4 border-t-yellow-500 shadow-lg">
                <CardContent className="p-6 text-center">
                    <Heart className="w-12 h-12 text-yellow-500 mx-auto mb-4" />
                    <h3 className="text-xl font-bold mb-2">قيمنا</h3>
                    <p className="text-slate-600">الإتقان، التشجيع المستمر، الابتكار في التعليم، والاعتزاز بالهوية العربية.</p>
                </CardContent>
            </Card>
        </div>

        {/* Team / Supervision */}
        <div className="text-center bg-slate-50 rounded-3xl p-12">
            <h2 className="text-3xl font-bold text-slate-900 mb-6">فريق العمل والإشراف</h2>
            <div className="inline-block bg-white p-6 rounded-2xl shadow-sm border border-slate-200">
                <p className="text-lg font-bold text-indigo-900">إشراف وتنفيذ المعلمة</p>
                <p className="text-2xl text-indigo-600 font-black mt-2">ديمة الرشدان</p>
                <p className="text-slate-500 mt-2">معلمة اللغة العربية - المدرسة الأمريكية للإبداع العلمي</p>
            </div>
        </div>

        <div className="text-center">
            <Link to={createPageUrl("Home")}>
                <Button size="lg" className="bg-indigo-900 hover:bg-indigo-800 text-white px-8">
                    العودة للرئيسية
                </Button>
            </Link>
        </div>

      </div>
    </div>
  );
}
