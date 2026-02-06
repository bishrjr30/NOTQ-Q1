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
        // ✅ تعديل الخط: استخدام Traditional Arabic أو Arial لضمان ظهور الاسم بشكل رسمي
        style={{ direction: "rtl", fontFamily: "'Traditional Arabic', 'Arial', sans-serif" }}
      >
        {/* صورة الخلفية كما سميتها أنت */}
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
                    // ✅ التعديل: تم إنزال الاسم لـ 56% ليجلس فوق السطر الذهبي
                    top: '56%', 
                    left: '0', 
                    right: '0' 
                }} 
            >
                <h1 
                    className="text-6xl text-black font-extrabold tracking-wide"
                    // إضافة ظل خفيف جداً لتمييز الاسم عن الخلفية
                    style={{ textShadow: "1px 1px 0px rgba(255,255,255,0.5)" }}
                >
                    {studentName || "اسم الطالب"}
                </h1>
            </div>

            {/* التاريخ */}
            <div 
                className="absolute text-right" 
                style={{ 
                    // ✅ التعديل: ضبط مكان التاريخ بدقة فوق النقاط
                    bottom: '21.5%', 
                    right: '16%', 
                    width: '200px',
                    fontSize: '1.3rem' // تكبير خط التاريخ قليلاً
                }} 
            >
                <p className="text-xl text-slate-800 font-bold">
                    {date || "2026/02/07"}
                </p>
            </div>

        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
