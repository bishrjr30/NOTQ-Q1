// src/components/CertificateTemplate.jsx

import React, { forwardRef } from "react";

const CertificateTemplate = forwardRef(({ studentName, date }, ref) => {
  return (
    // حاوية مخفية للطباعة
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      {/* ✅ إضافة رابط الخط من Google Fonts لضمان ظهوره بشكل جميل */}
      <style>
        {`@import url('https://fonts.googleapis.com/css2?family=Amiri:ital,wght@0,400;0,700;1,400&display=swap');`}
      </style>

      <div
        ref={ref}
        id="certificate-print-node"
        // أبعاد A4 العرضي
        className="relative w-[1123px] h-[794px] text-slate-900 font-bold overflow-hidden"
        // ✅ استخدام خط 'Amiri' للشهادة بالكامل
        style={{ direction: "rtl", fontFamily: "'Amiri', serif" }}
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
                    // الإحداثيات (يمكنك تعديلها إذا لزم الأمر)
                    top: '29%', 
                    left: '8', 
                    right: '0' 
                }} 
            >
                <h1 
                    className="text-6xl text-black"
                    style={{ 
                        // ✅ جعل الخط عريضاً جداً ليبدو مثل الخطاط
                        fontWeight: '700', 
                        textShadow: "1px 1px 0px rgba(255,255,255,0.5)",
                        lineHeight: "1.2"
                    }}
                >
                    {studentName || "اسم الطالب"}
                </h1>
            </div>

            {/* 🟢 التاريخ */}
            <div 
                className="absolute" 
                style={{ 
                    bottom: '17%', 
                    right: '25%', 
                    textAlign: "right", 
                    width: '200px',
                    fontSize: '1.4rem', // حجم مناسب للتاريخ
                    color: '#000',
                    fontWeight: '700'
                }} 
            >
                <p>
                    {date || "2026/02/07"}
                </p>
            </div>

        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
