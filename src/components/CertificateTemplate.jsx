// src/components/CertificateTemplate.jsx

import React, { forwardRef } from "react";

const CertificateTemplate = forwardRef(({ studentName, date }, ref) => {
  return (
    // حاوية مخفية للطباعة
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        id="certificate-print-node"
        // أبعاد A4 العرضي
        className="relative w-[1123px] h-[794px] text-slate-900 font-bold overflow-hidden"
        style={{ direction: "rtl", fontFamily: "'Amiri', serif" }}
      >
        {/* ✅ التعديل هنا: تم تغيير الاسم ليطابق ملفك تماماً */}
        <img 
            src="/certificate-bg.jpg.png" 
            alt="Certificate Template" 
            className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* النصوص المتغيرة */}
        <div className="absolute inset-0 z-10 w-full h-full">
            
            {/* اسم الطالب */}
            <div 
                className="absolute w-full text-center" 
                style={{ 
                    top: '41%', 
                    left: '0', 
                    right: '0' 
                }} 
            >
                <h1 
                    className="text-6xl text-black font-extrabold tracking-wide"
                    style={{ textShadow: "1px 1px 2px rgba(255,255,255,0.8)" }}
                >
                    {studentName || "اسم الطالب"}
                </h1>
            </div>

            {/* التاريخ */}
            <div 
                className="absolute text-center" 
                style={{ 
                    bottom: '22%', 
                    right: '18%', 
                    width: '200px' 
                }} 
            >
                <p className="text-xl text-slate-800 font-bold">
                    {date || "2024/--/--"}
                </p>
            </div>

        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
