import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

// New Images provided by user
const MASCOT_IMAGES = {
  "StudentDashboard": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/1f0acd57c_6.png", // Boy running
  "Exercise": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/8c24ad0c9_5.png", // Boy reading book
  "SpecialTraining": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/e68885dfe_4.png", // Boy smiling
  "Dictionary": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/47d932c8d_3.png", // Boy standing
  "StudentLessons": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/50e7fa168_2.png", // Boy pointing
  "CreateCustomExercise": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/7352e1232_1.png", // Boy waving
  "Default": "https://qtrypzzcjebvfcihiynt.supabase.co/storage/v1/object/public/base44-prod/public/68b01fdf7ff5f03db59e7e33/287f4ac0a_.png" // Boy with backpack
};

const MOTIVATIONAL_QUOTES = [
  "أنت مبدع يا بطل! 🌟",
  "استمر، نطقك يتحسن! 💪",
  "اللغة العربية لغة جميلة 📚",
  "ممتاز! خطوة بخطوة 🚀",
  "أنا فخور بك جداً ❤️",
  "ذكاؤك يدهشني! 🧠",
  "رائع! أحسنت الأداء 👏",
  "هل شربت الماء اليوم؟ 💧",
  "لنحاول مرة أخرى بحماس! 🔥"
];

export default function MascotDisplay({ className = "", showBubble = true }) {
  const location = useLocation();
  const [quote, setQuote] = useState("");
  const [mascotUrl, setMascotUrl] = useState(MASCOT_IMAGES["Default"]);

  useEffect(() => {
    // Determine mascot based on current page path
    const path = location.pathname.substring(1).split('/')[0] || "StudentDashboard";
    
    // Exact match or fallback to Default
    // Check if any key is part of the path
    const matchedKey = Object.keys(MASCOT_IMAGES).find(key => path.includes(key));
    setMascotUrl(matchedKey ? MASCOT_IMAGES[matchedKey] : MASCOT_IMAGES["Default"]);

    // Random quote
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)]);
  }, [location.pathname]);

  if (!mascotUrl) return null;

  return (
    <div className={`relative z-30 flex flex-col items-center ${className}`}>
      {showBubble && (
        <motion.div 
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 1, type: "spring" }}
          className="mb-2 relative"
        >
          <div className="bg-white px-4 py-2 rounded-2xl shadow-lg border-2 border-indigo-100 relative z-10 max-w-[150px] text-center">
            <p className="text-xs font-bold text-indigo-600 arabic-text leading-snug">{quote}</p>
          </div>
          {/* Cloud/Bubble tail */}
          <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-indigo-100 absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 z-0"></div>
        </motion.div>
      )}
      
      {/* Fixed image, no hover effects, no movement */}
      <img 
        src={mascotUrl} 
        alt="رفيق التعلم" 
        className="object-contain drop-shadow-2xl"
        style={{ maxHeight: "250px", pointerEvents: "none" }}
      />
    </div>
  );
}