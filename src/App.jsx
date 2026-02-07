// src/App.jsx

import React from 'react';
import './App.css';
import Pages from "@/pages/index.jsx"; // هذا المكون يحتوي على التوجيه (Router) الذي عدلناه سابقاً
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";

// إنشاء عميل لخدمة React Query (مهم للتعامل مع البيانات)
const queryClient = new QueryClient();

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        {/* المكون الرئيسي الذي يحتوي على الصفحات والتنقل */}
        <Pages />
        
        {/* إشعارات النظام */}
        <Toaster />
        <Sonner />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
