// src/components/CertificateTemplate.jsx

import React, { forwardRef } from "react";

const CertificateTemplate = forwardRef(({ studentName, date }, ref) => {
  return (
    // حاوية مخفية للطباعة
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        id="certificate-print-node"
        // أبعاد A4 العرضي (Landscape) بالبكسل
        className="relative w-[1123px] h-[794px] text-slate-900 font-bold overflow-hidden"
        // استخدام خطوط عربية واضحة وجميلة
        style={{ direction: "rtl", fontFamily: "'Traditional Arabic', 'Arial', sans-serif" }} 
      >
        {/* ✅ 1. صورة الخلفية */}
        {/* تأكد أن اسم الصورة في مجلد public هو certificate-bg.jpg */}
        <img 
            src="/certificate-bg.jpg" 
            alt="Certificate Template" 
            className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* ✅ 2. النصوص المتغيرة */}
        <div className="absolute inset-0 z-10 w-full h-full">
            
            {/* 🟢 اسم الطالب */}
            <div 
                className="absolute w-full text-center" 
                style={{ 
                    // 🚩 تم تعديل هذه القيمة لإنزال الاسم للأسفل ليجلس على السطر
                    top: '56%', 
                    left: '0', 
                    right: '0' 
                }} 
            >
                <h1 
                    className="text-6xl text-black font-extrabold tracking-wide"
                    style={{ 
                        // جعل الخط عريضاً ومناسباً للعربية
                        fontWeight: 'bold',
                        // تحسين مظهر الخط
                        textShadow: "1px 1px 0px rgba(255,255,255,0.5)"
                    }}
                >
                    {studentName || "اسم الطالب"}
                </h1>
            </div>

            {/* 🟢 التاريخ */}
            <div 
                className="absolute text-right" 
                style={{ 
                    // 🚩 تم ضبط مكان التاريخ ليكون فوق النقاط
                    bottom: '21.5%', // الارتفاع من الأسفل
                    right: '16%',    // المسافة من اليمين (حركناه لليسار قليلاً ليبتعد عن كلمة التاريخ)
                    width: '200px',
                    fontSize: '1.2rem'
                }} 
            >
                <p className="text-xl text-slate-800 font-bold tracking-widest">
                    {date || "2026/02/07"}
                </p>
            </div>

        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
