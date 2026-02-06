// src/components/CertificateTemplate.jsx

import React, { forwardRef } from "react";

const CertificateTemplate = forwardRef(({ studentName, date }, ref) => {
  return (
    // حاوية مخفية للطباعة
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        id="certificate-print-node"
        // أبعاد A4 Landscape بالبكسل (تقريباً 1123x794 عند 96 DPI)
        className="relative w-[1123px] h-[794px] text-slate-900 font-bold overflow-hidden"
        // استخدام خط عربي أنيق
        style={{ direction: "rtl", fontFamily: "'Traditional Arabic', 'Arial', sans-serif" }}
      >
        {/* صورة الخلفية */}
        <img 
            src="/certificate-bg.jpg.png" 
            alt="Certificate Template" 
            className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* النصوص المتغيرة */}
        <div className="absolute inset-0 z-10 w-full h-full">
            
            {/* 🟢 اسم الطالب */}
            <div 
                className="absolute w-full text-center" 
                style={{ 
                    // ✅ التعديل الحاسم: تم رفع الاسم للأعلى ليكون في الفراغ المخصص
                    // كانت 56% وهي منخفضة جداً، الآن 44.5% هي المكان الصحيح فوق السطر
                    top: '44.5%', 
                    left: '0', 
                    right: '0' 
                }} 
            >
                <h1 
                    className="text-6xl text-black font-extrabold tracking-wide"
                    style={{ 
                        textShadow: "1px 1px 0px rgba(255,255,255,0.5)",
                        lineHeight: "1" // منع تباعد الأسطر الزائد
                    }}
                >
                    {studentName || "اسم الطالب"}
                </h1>
            </div>

            {/* 🟢 التاريخ */}
            <div 
                className="absolute" 
                style={{ 
                    // ✅ التعديل: ضبط المكان بدقة بجانب كلمة "التاريخ"
                    bottom: '22%', 
                    right: '24%', // تم التحريك لليمين أكثر ليقترب من كلمة "التاريخ"
                    textAlign: "right",
                    width: '150px',
                    fontSize: '1.2rem',
                    color: '#333'
                }} 
            >
                <p className="font-bold">
                    {date || "2026/02/07"}
                </p>
            </div>

        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
