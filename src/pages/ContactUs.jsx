// src/pages/ContactUs.jsx

import React, { useState } from "react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { ArrowLeft, Mail, Phone, MapPin, Send } from "lucide-react";

export default function ContactUs() {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    // Here you would typically send the data to a backend
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8 font-sans" dir="rtl" style={{ fontFamily: "'Traditional Arabic', sans-serif" }}>
      <div className="max-w-5xl mx-auto">
        
        <div className="mb-8">
            <Link to={createPageUrl("Home")}>
                <Button variant="ghost" className="hover:bg-white"><ArrowLeft className="ml-2 h-4 w-4" /> العودة للرئيسية</Button>
            </Link>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
            
            {/* Contact Info */}
            <div className="bg-indigo-900 text-white p-8 rounded-3xl flex flex-col justify-between">
                <div>
                    <h1 className="text-4xl font-bold mb-6">تواصل معنا</h1>
                    <p className="text-indigo-200 text-lg mb-8 leading-relaxed">
                        نحن هنا للإجابة على استفساراتكم. سواء كان لديكم سؤال حول المنصة، أو اقتراح للتطوير، أو واجهتم مشكلة تقنية، لا تترددوا في مراسلتنا.
                    </p>
                    
                    <div className="space-y-6">
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                <Mail className="w-5 h-5" />
                            </div>
                            <p>bishrjr07@gmail.com</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                <Phone className="w-5 h-5" />
                            </div>
                            <p>+971502406519</p>
                        </div>
                        <div className="flex items-center gap-4">
                            <div className="w-10 h-10 bg-white/10 rounded-full flex items-center justify-center">
                                <MapPin className="w-5 h-5" />
                            </div>
                            <p>المدرسة الأمريكية للإبداع العلمي، ند الشبا، دبي</p>
                        </div>
                    </div>
                </div>
                
                <div className="mt-12 opacity-50">
                    <img src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/48d985d52_-Screenshot_20251114-193446_Brave1_20251114_193545_0000.png" alt="Logo" className="w-32 grayscale brightness-200" />
                </div>
            </div>

            {/* Contact Form */}
            <Card className="border-0 shadow-lg">
                <CardContent className="p-8">
                    {submitted ? (
                        <div className="text-center py-20">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <Send className="w-8 h-8" />
                            </div>
                            <h3 className="text-2xl font-bold text-slate-800 mb-2">تم الإرسال بنجاح!</h3>
                            <p className="text-slate-500">شكراً لتواصلك معنا. سنقوم بالرد عليك في أقرب وقت ممكن.</p>
                            <Button className="mt-6 bg-indigo-600 text-white" onClick={() => setSubmitted(false)}>إرسال رسالة أخرى</Button>
                        </div>
                    ) : (
                        <form onSubmit={handleSubmit} className="space-y-6">
                            <div>
                                <Label htmlFor="name">الاسم الكامل</Label>
                                <Input id="name" placeholder="أدخل اسمك" className="mt-2" required />
                            </div>
                            <div>
                                <Label htmlFor="email">البريد الإلكتروني</Label>
                                <Input id="email" type="email" placeholder="email@example.com" className="mt-2" required />
                            </div>
                            <div>
                                <Label htmlFor="subject">الموضوع</Label>
                                <Input id="subject" placeholder="بخصوص..." className="mt-2" required />
                            </div>
                            <div>
                                <Label htmlFor="message">الرسالة</Label>
                                <Textarea id="message" placeholder="اكتب رسالتك هنا..." className="mt-2 min-h-[150px]" required />
                            </div>
                            <Button type="submit" className="w-full bg-indigo-600 hover:bg-indigo-700 text-white text-lg h-12">
                                إرسال الرسالة
                            </Button>
                        </form>
                    )}
                </CardContent>
            </Card>

        </div>
      </div>
    </div>
  );
}
