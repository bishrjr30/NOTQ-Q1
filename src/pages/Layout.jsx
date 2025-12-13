
import React from "react";
import { Link, useLocation } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { GraduationCap, Users, BookOpen, Volume2, Zap } from "lucide-react";
// MascotDisplay removed
import { Button } from "@/components/ui/button";
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
  // Dark mode removed as per requirements - Light mode only

  const bgClass = "bg-gradient-to-br from-blue-50 via-white to-indigo-50 text-slate-900";

  return (
    <SidebarProvider>
      <div dir="rtl" className={`min-h-screen flex flex-col ${bgClass} relative`}>
        {/* Mascot removed as requested */}
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
        }
        
        * {
          font-family: 'Cairo', 'Segoe UI', system-ui, -apple-system, sans-serif;
        }
        
        .arabic-text {
          font-feature-settings: "kern" 1, "liga" 1, "calt" 1;
          text-rendering: optimizeLegibility;
          line-height: 1.8;
        }
        
        .glow-effect {
          box-shadow: 0 0 20px rgba(139, 92, 246, 0.3);
          transition: all 0.3s ease;
        }
        
        .glow-effect:hover {
          box-shadow: 0 0 30px rgba(139, 92, 246, 0.5);
        }
      `}</style>
        
        {/* Header with Centered Logo */}
        <header className="bg-gradient-to-r from-blue-400 via-indigo-500 to-purple-600 text-white px-3 py-4 md:px-6 md:py-6 shadow-2xl sticky top-0 z-10">
          <div className="max-w-7xl mx-auto">
            {/* Mobile Sidebar Trigger */}
            <div className="md:hidden flex justify-between items-center mb-2">
              <p className="text-xs text-blue-100 font-bold arabic-text">المدرسة الأمريكية للإبداع العلمي</p>
              <SidebarTrigger className="hover:bg-white/20 p-2 rounded-lg transition-colors duration-200" />
            </div>

            {/* Centered Logo with Better Background */}
            <div className="flex flex-col items-center justify-center gap-3 md:gap-4 mb-2 md:mb-4">
              <div className="relative bg-gradient-to-br from-white via-blue-50 to-indigo-50 backdrop-blur-lg rounded-2xl md:rounded-3xl p-4 md:p-8 shadow-2xl border-2 md:border-4 border-white/40">
                <img 
                  src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/48d985d52_-Screenshot_20251114-193446_Brave1_20251114_193545_0000.png" 
                  alt="المدرسة الأمريكية للإبداع العلمي" 
                  className="h-16 md:h-32 w-auto object-contain drop-shadow-xl"
                />
              </div>
              <div className="text-center w-full">
                <h1 className="text-lg md:text-4xl font-bold arabic-text bg-white/30 rounded-xl md:rounded-2xl px-4 py-2 md:px-8 md:py-3 backdrop-blur-md shadow-2xl border-2 border-white/40">
                  منصّة تعلّم القراءة في اللّغة العربيّة
                </h1>
                <p className="text-xs md:text-lg text-blue-50 arabic-text mt-2 font-semibold">
                  المدرسة الأمريكية للإبداع العلمي - ند الشبا 🏫
                </p>
              </div>
            </div>
            
            {/* Teacher Attribution */}
            <div className="text-center">
              <p className="text-sm text-blue-100 arabic-text bg-white/20 rounded-lg px-4 py-2 inline-block backdrop-blur-sm">
                إعداد المعلّمة: ديمة الرشدان 👩‍🏫
              </p>
            </div>
          </div>
        </header>
        
        <div className="flex w-full flex-1">
          <Sidebar className="border-l border-indigo-200 hidden md:flex bg-white/70 backdrop-blur-md shadow-xl" side="right">
            <SidebarHeader className="border-b border-indigo-200 p-6">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
                  <GraduationCap className="w-6 h-6 text-white" />
                </div>
                <div className="text-right">
                  <h2 className="font-bold text-indigo-900 arabic-text">نُطق</h2>
                  <p className="text-xs text-indigo-600 arabic-text">تعلّم النطق الصحيح</p>
                </div>
              </div>
            </SidebarHeader>
            
            <SidebarContent className="p-3">
              <SidebarGroup>
                <SidebarGroupLabel className="text-xs font-medium text-indigo-600 px-3 py-2 arabic-text">
                  القائمة الرئيسية
                </SidebarGroupLabel>
                <SidebarGroupContent>
                  <SidebarMenu>
                    {navigationItems.map((item) => (
                      <SidebarMenuItem key={item.title}>
                        <SidebarMenuButton 
                          asChild 
                          className={`hover:bg-indigo-100 hover:text-indigo-700 transition-all duration-300 rounded-xl mb-1 arabic-text glow-effect ${
                            location.pathname === item.url ? 'bg-gradient-to-r from-indigo-500 to-purple-600 text-white shadow-lg' : ''
                          }`}
                        >
                          <Link to={item.url} className="flex items-center gap-3 px-4 py-3">
                            <item.icon className="w-5 h-5" />
                            <span className="font-medium">{item.title}</span>
                          </Link>
                        </SidebarMenuButton>
                      </SidebarMenuItem>
                    ))}
                  </SidebarMenu>
                </SidebarGroupContent>
              </SidebarGroup>
            </SidebarContent>

            <SidebarFooter className="border-t border-indigo-200 p-4">
              <div className="text-center text-xs text-indigo-600 arabic-text bg-indigo-50 rounded-lg p-3">
                <p>تطبيق تعلّم النطق العربي</p>
                <p className="mt-1">تحليل ذكي + تقييم المعلم</p>
              </div>
            </SidebarFooter>
          </Sidebar>

          <main className="flex-1 flex flex-col overflow-hidden">
            <div className="flex-1 overflow-auto">
              {children}
            </div>
            
            {/* Footer with Better Logo Background */}
            <footer className="bg-gradient-to-r from-indigo-800 via-purple-800 to-pink-800 text-white py-10 shadow-2xl">
              <div className="max-w-7xl mx-auto px-6 text-center">
                <div className="mb-6">
                  <div className="inline-block bg-gradient-to-br from-white via-blue-50 to-indigo-50 backdrop-blur-lg rounded-3xl p-6 shadow-2xl border-4 border-white/30">
                    <img 
                      src="https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/48d985d52_-Screenshot_20251114-193446_Brave1_20251114_193545_0000.png" 
                      alt="المدرسة الأمريكية للإبداع العلمي" 
                      className="h-24 w-auto object-contain drop-shadow-xl"
                    />
                  </div>
                </div>
                <div className="space-y-3 arabic-text">
                  <p className="text-2xl font-bold text-white">
                    المدرسة الأمريكية للإبداع العلمي 🏫
                  </p>
                  <p className="text-indigo-100 text-lg">
                    ند الشبا - الإمارات العربية المتحدة 🇦🇪
                  </p>
                  <p className="text-indigo-200">
                    جميع الحقوق محفوظة © 2025/2026
                  </p>
                  <p className="text-indigo-200">
                    إعداد المعلمة: ديمة الرشدان 👩‍🏫
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
