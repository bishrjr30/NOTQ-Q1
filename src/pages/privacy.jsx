// src/pages/privacy.jsx

import React from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Shield, Lock, Eye, FileText } from "lucide-react";
import { createPageUrl } from "@/utils";

export default function PrivacyPolicy() {
  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      <div className="max-w-4xl mx-auto">
        
        <div className="mb-8">
            <Link to={createPageUrl("Home")}>
                <Button variant="ghost" className="hover:bg-white"><ArrowLeft className="ml-2 h-4 w-4" /> العودة للرئيسية</Button>
            </Link>
        </div>

        <Card className="shadow-lg border-0 overflow-hidden">
            <div className="bg-indigo-900 p-8 text-white text-center">
                <Shield className="w-16 h-16 mx-auto mb-4 text-indigo-300" />
                <h1 className="text-3xl font-bold mb-2">سياسة الخصوصية</h1>
                <p className="text-indigo-200">آخر تحديث: فبراير 2026</p>
            </div>
            
            <CardContent className="p-8 space-y-8 text-slate-700 leading-loose">
                
                <section>
                    <h2 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <Eye className="w-5 h-5" /> 1. مقدمة
                    </h2>
                    <p>
                        نحن في منصة "نُطق" التعليمية (التابعة للمدرسة الأمريكية للإبداع العلمي) نولي خصوصية طلابنا وأولياء الأمور أهمية قصوى. تشرح هذه الوثيقة كيفية جمعنا واستخدامنا وحمايتنا لمعلوماتك الشخصية عند استخدام المنصة.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <FileText className="w-5 h-5" /> 2. البيانات التي نجمعها
                    </h2>
                    <ul className="list-disc list-inside space-y-2 bg-slate-50 p-4 rounded-xl border border-slate-200">
                        <li><strong>المعلومات الأساسية:</strong> الاسم، الصف الدراسي، والمرحلة التعليمية.</li>
                        <li><strong>البيانات الصوتية:</strong> التسجيلات الصوتية للطلاب أثناء أداء تمارين القراءة (تستخدم حصراً لغرض التحليل والتقييم).</li>
                        <li><strong>بيانات الأداء:</strong> نتائج التمارين، النقاط، والشارات التي حصل عليها الطالب.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-indigo-900 mb-3 flex items-center gap-2">
                        <Lock className="w-5 h-5" /> 3. كيف نستخدم بياناتك؟
                    </h2>
                    <p>نستخدم البيانات المجمعة للأغراض التالية فقط:</p>
                    <ul className="list-disc list-inside space-y-1 mt-2">
                        <li>تحليل مستوى القراءة والنطق باستخدام الذكاء الاصطناعي.</li>
                        <li>متابعة تقدم الطالب من قبل المعلم المختص.</li>
                        <li>تحسين تجربة المستخدم وتطوير التمارين.</li>
                        <li><strong>تنويه هام:</strong> لا نقوم ببيع أو مشاركة بيانات الطلاب مع أي أطراف ثالثة لأغراض تجارية.</li>
                    </ul>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-indigo-900 mb-3">4. أمن البيانات</h2>
                    <p>
                        نطبق إجراءات أمان تقنية وإدارية صارمة لحماية بياناتك من الوصول غير المصرح به. يتم تخزين التسجيلات الصوتية في خوادم آمنة ومشفرة، ويقتصر الوصول إليها على المعلم المشرف والنظام الآلي للتحليل.
                    </p>
                </section>

                <section>
                    <h2 className="text-xl font-bold text-indigo-900 mb-3">5. حقوقك</h2>
                    <p>
                        يحق لولي الأمر في أي وقت طلب الاطلاع على البيانات المسجلة لابنه/ابنته، أو طلب حذف التسجيلات الصوتية، أو تعديل البيانات الشخصية، وذلك عبر التواصل مع إدارة المدرسة.
                    </p>
                </section>

                <div className="border-t pt-6 mt-8">
                    <p className="font-bold text-indigo-900">للتواصل معنا:</p>
                    <p>معلّمة اللغة العربية : ديمة الرشدان</p>
                    <p>البريد الإلكتروني: bishrjr07@gmail.com</p>
                </div>

            </CardContent>
        </Card>
      </div>
    </div>
  );
}
