// src/components/MascotDisplay.jsx

import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { useLocation } from "react-router-dom";

const MOTIVATIONAL_QUOTES = [
  "أنت مبدع يا بطل! 🌟",
  "استمر، نطقك يتحسن! 💪",
  "اللغة العربية لغة جميلة 📚",
  "ممتاز! خطوة بخطوة 🚀",
  "أنا فخور بك جداً ❤️",
  "ذكاؤك يدهشني! 🧠",
  "رائع! أحسنت الأداء 👏",
  "هل شربت الماء اليوم؟ 💧",
  "لنحاول مرة أخرى بحماس! 🔥",
];

export default function MascotDisplay({ className = "", showBubble = true }) {
  const location = useLocation();
  const [quote, setQuote] = useState("");

  useEffect(() => {
    // فقط لتغيير الجملة عند تغيير الصفحة (اختياري)
    const randomIndex = Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length);
    setQuote(MOTIVATIONAL_QUOTES[randomIndex]);
  }, [location.pathname]);

  // لو حابب تلغيه تماماً في أي مكان، استعمل <MascotDisplay showBubble={false} />

  if (!showBubble) {
    // نرجع div فارغ صغير حتى لا يكسر الـ layout
    return <div className={className} />;
  }

  return (
    <div className={`relative z-30 flex flex-col items-center ${className}`}>
      <motion.div
        initial={{ opacity: 0, scale: 0.5 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: 0.5, type: "spring" }}
        className="mb-2 relative"
      >
        <div className="bg-white px-4 py-2 rounded-2xl shadow-lg border-2 border-indigo-100 relative z-10 max-w-[180px] text-center">
          <p className="text-xs font-bold text-indigo-600 arabic-text leading-snug">
            {quote}
          </p>
        </div>
        {/* ذيل الفقاعة */}
        <div className="w-3 h-3 bg-white border-r-2 border-b-2 border-indigo-100 absolute -bottom-1 left-1/2 -translate-x-1/2 rotate-45 z-0" />
      </motion.div>
    </div>
  );
}
