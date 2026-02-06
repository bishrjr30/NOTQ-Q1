import React, { forwardRef } from "react";
import { Badge, CheckCircle, Star } from "lucide-react";

// استخدام forwardRef لنتمكن من التقاط صورة للمكون
const CertificateTemplate = forwardRef(({ studentName, type, details, date }, ref) => {
  const isStage = type === "stage"; // هل هي شهادة مرحلة أم تمرين؟

  return (
    <div className="hidden"> {/* إخفاء العنصر عن الصفحة العادية */}
      <div
        ref={ref}
        id="certificate-download"
        className="relative w-[1123px] h-[794px] bg-white text-slate-900 flex flex-col items-center justify-center p-12 text-center"
        style={{ fontFamily: "'Cairo', sans-serif", direction: "rtl" }}
      >
        {/* إطار مزخرف */}
        <div className="absolute inset-4 border-8 border-double border-indigo-900 rounded-xl"></div>
        <div className="absolute inset-6 border-2 border-amber-400 rounded-lg"></div>
        
        {/* الزوايا الزخرفية */}
        <div className="absolute top-8 right-8 text-6xl text-amber-500">⚜️</div>
        <div className="absolute top-8 left-8 text-6xl text-amber-500">⚜️</div>
        <div className="absolute bottom-8 right-8 text-6xl text-amber-500">⚜️</div>
        <div className="absolute bottom-8 left-8 text-6xl text-amber-500">⚜️</div>

        {/* الشعار */}
        <div className="mb-8">
           <div className="w-24 h-24 bg-gradient-to-br from-indigo-600 to-purple-700 rounded-full flex items-center justify-center mx-auto shadow-xl text-white mb-4">
             <Star className="w-12 h-12" />
           </div>
           <h1 className="text-4xl font-bold text-indigo-900 tracking-wide">
             المدرسة الأمريكية للإبداع العلمي
           </h1>
           <p className="text-xl text-indigo-600 mt-2">منصة "نُطق" لتعليم القراءة العربية</p>
        </div>

        {/* عنوان الشهادة */}
        <div className="mb-10">
          <h2 className="text-6xl font-black text-amber-500 mb-4 drop-shadow-sm" style={{ fontFamily: 'Amiri, serif' }}>
            {isStage ? "شهادة إتمام مرحلة" : "شهادة تميز في الأداء"}
          </h2>
          <div className="h-1 w-64 bg-indigo-900 mx-auto rounded-full"></div>
        </div>

        {/* نص الشهادة */}
        <div className="space-y-6 mb-12 max-w-4xl mx-auto">
          <p className="text-2xl text-slate-600">نتشرف بأن نمنح الطالب/الطالبة المتميز/ة:</p>
          <p className="text-5xl font-bold text-indigo-800 py-4 border-b-2 border-dashed border-indigo-200 inline-block px-12">
            {studentName}
          </p>
          <p className="text-2xl text-slate-600 leading-relaxed">
            {isStage 
              ? `لإتمامه بنجاح كافة تمارين وتحديات ${details} بتفوق وجدارة.`
              : `لأدائه المتميز وحصوله على درجة كاملة في تمرين: "${details}".`
            }
          </p>
        </div>

        {/* التوقيع والتاريخ */}
        <div className="flex justify-between items-end w-full max-w-3xl mt-8 px-12">
          <div className="text-center">
            <p className="text-lg text-slate-500 mb-2">التاريخ</p>
            <p className="text-xl font-bold text-indigo-900 border-b border-slate-300 pb-1">{date}</p>
          </div>

          <div className="text-center">
            {/* ختم المدرسة */}
            <div className="w-32 h-32 border-4 border-amber-500 rounded-full flex items-center justify-center rotate-[-15deg] opacity-80 shadow-inner">
              <div className="text-center">
                <p className="text-xs font-bold text-amber-600">منصة نُطق</p>
                <p className="text-xs font-bold text-amber-600">معتمد</p>
                <CheckCircle className="w-8 h-8 text-amber-500 mx-auto mt-1" />
              </div>
            </div>
          </div>

          <div className="text-center">
            <p className="text-lg text-slate-500 mb-2">توقيع المعلمة</p>
            <div className="font-script text-3xl text-indigo-800 font-bold mb-1" style={{ fontFamily: 'Reem Kufi, sans-serif' }}>
              ديمة الرشدان
            </div>
            <div className="h-0.5 w-32 bg-indigo-900 mx-auto"></div>
          </div>
        </div>
        
        <div className="absolute bottom-4 text-xs text-slate-400">
          رقم الوثيقة: {Math.floor(Math.random() * 1000000)} | تم الإصدار إلكترونياً عبر منصة نُطق
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
