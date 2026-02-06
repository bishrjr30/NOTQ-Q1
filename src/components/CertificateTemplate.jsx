import React, { forwardRef } from "react";

const CertificateTemplate = forwardRef(({ studentName, date }, ref) => {
  return (
    // حاوية مخفية للطباعة
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        id="certificate-print-node"
        // أبعاد A4 العرضي (Landscape)
        className="relative w-[1123px] h-[794px] text-slate-900 font-bold overflow-hidden"
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
                    // ⚠️ هذا الرقم (39%) هو المسؤول عن ارتفاع الاسم
                    // كان 56% (منخفض جداً)، والآن جعلته 39% ليرتفع للأعلى فوق السطر
                    // إذا أردت رفعه أكثر: قلل الرقم (مثلاً 35%)
                    // إذا أردت إنزاله: زد الرقم (مثلاً 42%)
                    top: '39%', 
                    left: '0', 
                    right: '0' 
                }} 
            >
                <h1 
                    className="text-6xl text-black font-extrabold tracking-wide"
                    style={{ 
                        textShadow: "1px 1px 0px rgba(255,255,255,0.5)",
                        lineHeight: "1" 
                    }}
                >
                    {studentName || "اسم الطالب"}
                </h1>
            </div>

            {/* 🟢 التاريخ */}
            <div 
                className="absolute" 
                style={{ 
                    // ⚠️ التحكم في موقع التاريخ
                    // bottom: الارتفاع من الأسفل (زد الرقم لرفعه عن السطر)
                    bottom: '24%', 
                    // right: المسافة من اليمين (زد الرقم لتحريكه نحو اليسار بعيداً عن كلمة التاريخ)
                    right: '25%', 
                    textAlign: "right",
                    width: '200px',
                    fontSize: '1.3rem',
                    color: '#000',
                    fontWeight: 'bold'
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
