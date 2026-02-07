// src/pages/Layout.jsx

import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { GraduationCap, Users, BookOpen, Volume2, Zap } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarHeader,
  SidebarFooter,
  SidebarProvider,
  SidebarTrigger,
} from "@/components/ui/sidebar";

const navigationItems = [
  {
    title: "الرئيسية",
    url: createPageUrl("Home"),
    icon: BookOpen,
  },
  {
    title: "واجهة الطالب",
    url: createPageUrl("StudentDashboard"),
    icon: GraduationCap,
  },
  {
    title: "تدريب خاص ومبتكر",
    url: createPageUrl("SpecialTraining"),
    icon: Zap,
  },
  {
    title: "القاموس الصوتي",
    url: createPageUrl("Dictionary"),
    icon: Volume2,
  },
  {
    title: "لوحة المعلم",
    url: createPageUrl("TeacherDashboard"),
    icon: Users,
  },
];

export default function Layout({ children, currentPageName }) {
  const location = useLocation();
  const bgClass = "bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-900";

  return (
    // defaultOpen={true} يجعل القائمة ظاهرة في اللابتوب، ويمكن إغلاقها
    <SidebarProvider defaultOpen={true}>
      <div dir="rtl" className={`min-h-screen flex flex-col ${bgClass} relative`}>
        <style>{`
          :root {
            --primary: 99 102 241;
            --primary-foreground: 255 255 255;
            --secondary: 139 92 246;
            --secondary-foreground: 255 255 255;
            --accent: 236 72 153;
            --accent-foreground: 255 255 255;
            --success: 34 197 94;
            --warning: 251 146 60;
            /* تثبيت خلفية السايد بار باللون الأبيض */
            --sidebar-background: 255 255 255;
            --sidebar-foreground: 15 23 42;
          }
          * {
            font-family: 'Cairo', 'Segoe UI', system-ui, -apple-system, sans-serif;
          }
          .arabic-text {
            font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
            text-rendering: optimizeLegibility;
            line-height: 1.6; /* تقليل ارتفاع السطر قليلاً للهيدر المصغر */
          }
          .glow-effect {
            box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
            transition: all 0.3s ease;
          }
          .glow-effect:hover {
            box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
          }
        `}</style>
        
        {/* Header (المستطيل البنفسجي المصغر) */}
        {/* تم تقليل الـ padding (py-2) لجعله أصغر */}
        <header className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-700 text-white px-4 py-2 shadow-xl relative z-40">
          <div className="max-w-7xl mx-auto">
            {/* الشريط العلوي: زر القائمة + اسم المدرسة */}
            <div className="flex justify-between items-center mb-2">
              
              {/* ✅ زر القائمة ظاهر دائماً (بدون md:hidden) ولونه أبيض واضح */}
              <SidebarTrigger className="bg-white text-indigo-700 hover:bg-indigo-50 p-1.5 h-8 w-8 rounded-lg shadow-md transition-transform hover:scale-105" />

              <p className="text-xs md:text-sm text-blue-100 font-bold arabic-text hidden md:block">
                المدرسة الأمريكية للإبداع العلمي
              </p>
            </div>

            {/* اللوجو والعنوان (مصغر) */}
            <div className="flex flex-col items-center justify-center gap-2 mb-2">
              <div className="relative bg-white rounded-xl p-1.5 md:p-2 shadow-lg border-2 border-indigo-200/50">
                {/* تم تصغير ارتفاع الصورة h-10 / h-16 */}
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/48d985d52_-Screenshot_20251114-193446_Brave1_20251114_193545_0000.png" 
                  alt="المدرسة الأمريكية للإبداع العلمي" 
                  className="h-10 md:h-16 w-auto object-contain"
                />
              </div>
              <div className="text-center w-full">
                {/* تم تصغير الخطوط */}
                <h1 className="text-base md:text-2xl font-bold arabic-text text-white drop-shadow-md">
                  منصّة "نُطق" التعليمية
                </h1>
                <p className="text-[10px] md:text-sm text-indigo-100 arabic-text opacity-90">
                  لتعزيز مهارات القراءة واللغة العربية
                </p>
              </div>
            </div>
            
            {/* اسم المعلمة (مصغر) */}
            <div className="text-center">
              <p className="text-[10px] md:text-xs text-indigo-900 font-bold arabic-text bg-white/90 rounded-full px-3 py-0.5 inline-block shadow-sm">
                إشراف المعلّمة: ديمة الرشدان 👩‍🏫
              </p>
            </div>
          </div>
        </header>
        
        <div className="flex w-full flex-1 relative">
          
          {/* ✅ تعديل السايد بار: 
              1. bg-white: لون أبيض صلب (ليس شفاف) لحل مشكلة الجوال
              2. z-50: يظهر فوق كل شيء
          */}
          <Sidebar 
            className="border-l border-gray-200 bg-white shadow-2xl z-50" 
            side="right" 
            collapsible="offcanvas"
            variant="sidebar"
          >
            <SidebarHeader className="border-b border-gray-100 p-4 bg-indigo-50">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center shadow-md">
                  <GraduationCap className="w-5 h-5 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="font-bold text-lg text-indigo-900 arabic-text">نُطق</h2>
                  <p className="text-[10px] text-indigo-600 arabic-text">بوابتك للتميز اللغوي</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-2 bg-white">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-bold text-gray-400 px-3 py-2 arabic-text uppercase tracking-wider">
                  القائمة الرئيسية
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-indigo-50 hover:text-indigo-700 text-gray-700 transition-all duration-200 rounded-lg mb-1 py-5 arabic-text font-semibold ${
                            location.pathname === item.url 
                              ? 'bg-indigo-600 text-white hover:bg-indigo-700 hover:text-white shadow-md' 
                              : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4">
                            <item.icon className={`w-4 h-4 ${location.pathname === item.url ? 'text-white' : 'text-indigo-500'}`} />
                            <span className="text-sm">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-gray-100 p-4 bg-gray-50">
              <div className="text-center text-[10px] text-gray-500 arabic-text">
                <p>الإصدار 1.0</p>
                <p className="mt-1">جميع الحقوق محفوظة © 2026</p>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden w-full">
            <div className="flex-1 overflow-auto w-full">
              {children}
            </div>
            
            {/* الفوتر المصغر (Footer) */}
            <footer className="bg-slate-900 text-white py-4 mt-auto shadow-inner">
              <div className="max-w-7xl mx-auto px-6 text-center flex flex-col md:flex-row justify-between items-center gap-4 md:gap-0">
                
                {/* شعار صغير في الفوتر */}
                <div className="flex items-center gap-3">
                   <div className="bg-white p-1 rounded-lg">
                      <img 
                        src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/48d985d52_-Screenshot_20251114-193446_Brave1_20251114_193545_0000.png" 
                        alt="Logo" 
                        className="h-8 w-auto object-contain"
                      />
                   </div>
                   <div className="text-right hidden md:block">
                      <p className="text-xs font-bold text-white arabic-text">المدرسة الأمريكية</p>
                      <p className="text-[10px] text-slate-400 arabic-text">للإبداع العلمي</p>
                   </div>
                </div>

                <div className="text-center">
                  <p className="text-xs text-slate-300 arabic-text">
                    جميع الحقوق محفوظة © 2025/2026
                  </p>
                </div>

                <div className="text-center md:text-left">
                  <p className="text-[10px] text-slate-500 arabic-text">
                    ند الشبا - الإمارات العربية المتحدة 🇦🇪
                  </p>
                </div>
              </div>
            </footer>
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
