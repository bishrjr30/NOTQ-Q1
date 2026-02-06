// src/components/CertificateTemplate.jsx

import React, { forwardRef } from "react";

const CertificateTemplate = forwardRef(({ studentName, date }, ref) => {
  return (
    // حاوية مخفية للطباعة: تضمن عدم ظهور الشهادة في واجهة المستخدم العادية
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        id="certificate-print-node"
        // تحديد أبعاد ثابتة تناسب حجم A4 العرضي (Landscape) بدقة عالية
        className="relative w-[1123px] h-[794px] text-slate-900 font-bold overflow-hidden"
        style={{ direction: "rtl", fontFamily: "'Amiri', serif" }} // استخدام خط عربي أنيق (Amiri)
      >
        {/* ✅ 1. صورة الخلفية (تصميمك الجاهز) */}
        {/* تأكد من أن الصورة موجودة في مجلد public باسم certificate-bg.jpg */}
        <img 
            src="/certificate-bg.jpg" 
            alt="Certificate Template" 
            className="absolute inset-0 w-full h-full object-cover z-0"
        />

        {/* ✅ 2. النصوص المتغيرة (طبقة فوق الصورة) */}
        <div className="absolute inset-0 z-10 w-full h-full">
            
            {/* 🟢 اسم الطالب */}
            <div 
                className="absolute w-full text-center" 
                style={{ 
                    top: '41%', // تحكم دقيق في الارتفاع الرأسي لاسم الطالب
                    left: '0', 
                    right: '0' 
                }} 
            >
                <h1 
                    className="text-6xl text-black font-extrabold tracking-wide"
                    // إضافة ظل خفيف للنص لزيادة وضوحه فوق الخلفية
                    style={{ textShadow: "1px 1px 2px rgba(255,255,255,0.8)" }}
                >
                    {studentName || "اسم الطالب هنا"}
                </h1>
            </div>

            {/* 🟢 التاريخ */}
            {/* تم ضبط المكان بناءً على تقدير موقع التاريخ في أسفل يمين الشهادة */}
            <div 
                className="absolute text-center" 
                style={{ 
                    bottom: '22%', // المسافة من الحافة السفلية
                    right: '18%',  // المسافة من الحافة اليمنى
                    width: '200px' // عرض المنطقة المخصصة للتاريخ لضمان التوسط
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
