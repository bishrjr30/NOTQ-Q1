import React, { forwardRef } from "react";
import { Star, Award, BadgeCheck } from "lucide-react";

// هذا المكون هو القالب الذي سيتم تحويله إلى صورة PDF
const CertificateTemplate = forwardRef(({ studentName, type, details, date }, ref) => {
  const isStage = type === "stage";

  return (
    // حاوية مخفية لضمان عدم ظهورها في الصفحة العادية ولكنها متاحة للطباعة
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        id="certificate-print-node"
        // أبعاد A4 Landscape بالبكسل (تقريباً 1123x794 عند 96 DPI)
        className="w-[1123px] h-[794px] bg-[#fffbf0] text-slate-900 flex flex-col items-center justify-between p-16 text-center relative"
        style={{ 
            fontFamily: "'Amiri', 'Traditional Arabic', serif", 
            direction: "rtl",
            backgroundImage: "radial-gradient(circle, #fffbf0 0%, #fff8e1 100%)"
        }}
      >
        {/* ================= إطار الشهادة المزخرف ================= */}
        {/* الإطار الخارجي */}
        <div className="absolute inset-4 border-4 border-double border-[#1e3a8a]"></div>
        {/* الإطار الداخلي الذهبي */}
        <div className="absolute inset-6 border-[3px] border-[#d4af37] rounded-sm"></div>
        {/* زوايا زخرفية (SVG) */}
        <div className="absolute top-5 left-5 w-16 h-16 text-[#1e3a8a]">
            <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 L40 0 L0 40 Z" /></svg>
        </div>
        <div className="absolute top-5 right-5 w-16 h-16 text-[#1e3a8a] transform rotate-90">
            <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 L40 0 L0 40 Z" /></svg>
        </div>
        <div className="absolute bottom-5 left-5 w-16 h-16 text-[#1e3a8a] transform -rotate-90">
            <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 L40 0 L0 40 Z" /></svg>
        </div>
        <div className="absolute bottom-5 right-5 w-16 h-16 text-[#1e3a8a] transform rotate-180">
            <svg viewBox="0 0 100 100" fill="currentColor"><path d="M0 0 L40 0 L0 40 Z" /></svg>
        </div>

        {/* ================= رأس الشهادة ================= */}
        <div className="flex flex-col items-center w-full z-10 mt-4">
           {/* اللوغو - تأكد من وجود الملف في مجلد public */}
           {/* إذا لم يكن لديك صورة، سيظهر هذا الرمز البديل */}
           <div className="mb-4">
               {/* ⚠️ ضع مسار صورتك هنا بدلاً من الرمز إذا توفرت، مثلاً: src="/logo.png" */}
               <div className="w-24 h-24 bg-white rounded-full border-4 border-[#d4af37] flex items-center justify-center shadow-lg">
                   {/* استبدل هذا الجزء بـ <img src="/logo.png" className="w-20 h-20 object-contain" /> */}
                   <Award className="w-12 h-12 text-[#1e3a8a]" />
               </div>
           </div>
           
           <h1 className="text-4xl font-bold text-[#1e3a8a] tracking-wide mb-2">
             المدرسة الأمريكية للإبداع العلمي
           </h1>
           <p className="text-xl text-[#d4af37] font-semibold">منصة نُطق للتميز اللغوي</p>
        </div>

        {/* ================= عنوان الشهادة ================= */}
        <div className="w-full z-10 my-4">
          <h2 className="text-6xl font-black text-[#d4af37] drop-shadow-md mb-2" style={{ fontFamily: "'Reem Kufi', sans-serif" }}>
            {isStage ? "شهادة إتمام مرحلة" : "شهادة شكر وتقدير"}
          </h2>
          {/* خط فاصل مزخرف */}
          <div className="flex items-center justify-center gap-2 opacity-60">
             <div className="h-0.5 w-24 bg-[#1e3a8a]"></div>
             <Star className="w-4 h-4 text-[#d4af37] fill-current" />
             <div className="h-0.5 w-24 bg-[#1e3a8a]"></div>
          </div>
        </div>

        {/* ================= متن الشهادة ================= */}
        <div className="flex-1 flex flex-col justify-center items-center w-full z-10 space-y-6">
          <p className="text-3xl text-slate-700">
            تتشرف إدارة المنصة بمنح هذه الشهادة للطالب/ـة المتميز/ة:
          </p>
          
          <div className="relative py-2 px-12">
             <span className="text-6xl font-bold text-[#1e3a8a] z-10 relative px-4" style={{ fontFamily: "'Amiri', serif" }}>
               {studentName || "اسم الطالب"}
             </span>
             {/* خلفية زخرفية للاسم */}
             <div className="absolute bottom-0 left-0 w-full h-4 bg-[#d4af37] opacity-20 transform -skew-x-12"></div>
          </div>

          <p className="text-2xl text-slate-600 max-w-4xl leading-relaxed px-10">
            {isStage 
              ? `وذلك لإتمامه/ا بنجاح كافة متطلبات وتحديات ${details} بتفوق وجدارة.` 
              : `وذلك لأدائه/ا الرائع وحصوله/ا على درجة ممتازة في تمرين: "${details}".`}
          </p>
          
          <p className="text-xl text-slate-500 italic mt-2">
            نتمنى له/ا دوام التوفيق والنجاح في مسيرته/ا التعليمية.
          </p>
        </div>

        {/* ================= التذييل والتوقيع ================= */}
        <div className="flex justify-between items-end w-full px-24 mb-8 z-10">
          {/* التاريخ */}
          <div className="text-center">
            <p className="text-xl text-slate-500 mb-2">التاريخ</p>
            <p className="text-2xl font-bold text-[#1e3a8a] border-b-2 border-[#d4af37] pb-1 min-w-[150px]">
                {date}
            </p>
          </div>

          {/* الختم الذهبي */}
          <div className="relative top-4">
            <div className="w-40 h-40 border-4 border-[#d4af37] rounded-full flex flex-col items-center justify-center text-[#d4af37] font-bold shadow-inner bg-white/50">
               <div className="absolute inset-1 border border-dashed border-[#1e3a8a] rounded-full opacity-30"></div>
               <span className="text-sm text-[#1e3a8a] mb-1">منصة نُطق</span>
               <BadgeCheck className="w-12 h-12 mb-1" />
               <span className="text-lg tracking-widest uppercase">معتمد</span>
            </div>
          </div>

          {/* التوقيع */}
          <div className="text-center">
            <p className="text-xl text-slate-500 mb-4">المعلمة</p>
            <div className="relative">
                {/* محاكاة توقيع بخط اليد */}
                <span className="text-4xl text-[#1e3a8a] transform -rotate-6 inline-block" style={{ fontFamily: 'cursive' }}>
                  ديمة الرشدان
                </span>
                <div className="w-full h-0.5 bg-[#d4af37] mt-1"></div>
            </div>
          </div>
        </div>

        {/* تذييل صغير جداً */}
        <div className="absolute bottom-2 text-[10px] text-slate-400">
            تم إصدار هذه الوثيقة إلكترونياً عبر منصة نُطق للتعليم الذكي | {new Date().getFullYear()}
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
