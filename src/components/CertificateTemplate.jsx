import React, { forwardRef } from "react";
import { CheckCircle, Star, Award } from "lucide-react";

const CertificateTemplate = forwardRef(({ studentName, type, details, date }, ref) => {
  const isStage = type === "stage";

  return (
    // نستخدم style لإخفائه عن النظر ولكن إبقائه متاحاً للطباعة
    <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
      <div
        ref={ref}
        id="certificate-print-node"
        className="w-[1123px] h-[794px] bg-white text-slate-900 flex flex-col items-center justify-center p-16 text-center relative border-8 border-double border-indigo-900"
        style={{ fontFamily: "sans-serif", direction: "rtl", backgroundColor: "#fff" }}
      >
        {/* خلفية زخرفية */}
        <div className="absolute inset-4 border-2 border-amber-400 rounded-lg pointer-events-none"></div>
        <div className="absolute top-10 left-10 text-6xl opacity-20">⚜️</div>
        <div className="absolute top-10 right-10 text-6xl opacity-20">⚜️</div>
        <div className="absolute bottom-10 left-10 text-6xl opacity-20">⚜️</div>
        <div className="absolute bottom-10 right-10 text-6xl opacity-20">⚜️</div>

        {/* الهيدر */}
        <div className="mb-8 flex flex-col items-center">
           <div className="w-24 h-24 bg-indigo-900 rounded-full flex items-center justify-center mb-4 shadow-lg text-white">
             {isStage ? <Star size={48} /> : <Award size={48} />}
           </div>
           <h1 className="text-5xl font-bold text-indigo-900 mb-2">المدرسة الأمريكية للإبداع العلمي</h1>
           <p className="text-2xl text-indigo-600">منصة نُطق للتميز اللغوي</p>
        </div>

        {/* العنوان */}
        <div className="mb-10 w-full">
          <h2 className="text-6xl font-black text-amber-500 mb-6 drop-shadow-sm">
            {isStage ? "شهادة إتمام مرحلة" : "شهادة تميز"}
          </h2>
          <div className="h-1 w-1/3 bg-gradient-to-r from-transparent via-indigo-900 to-transparent mx-auto"></div>
        </div>

        {/* المحتوى */}
        <div className="mb-12 space-y-6">
          <p className="text-3xl text-slate-600">تُمنح هذه الشهادة للطالب/ة المتميز/ة:</p>
          <div className="text-6xl font-bold text-indigo-800 py-4 px-12 border-b-4 border-amber-400 inline-block min-w-[400px]">
            {studentName || "اسم الطالب"}
          </div>
          <p className="text-3xl text-slate-600 mt-6 max-w-4xl mx-auto leading-relaxed">
            {isStage 
              ? `لإتمامه بنجاح كافة متطلبات ${details} بتفوق.` 
              : `لأدائه الرائع وحصوله على درجة ممتازة في تمرين: "${details}".`}
          </p>
        </div>

        {/* التوقيع والتاريخ */}
        <div className="flex justify-between items-end w-full px-20 mt-8">
          <div className="text-center">
            <p className="text-xl text-slate-500 mb-2">التاريخ</p>
            <p className="text-2xl font-bold text-indigo-900 border-b-2 border-slate-200 pb-1 min-w-[150px]">{date}</p>
          </div>

          <div className="text-center transform rotate-[-5deg]">
            <div className="w-36 h-36 border-4 border-amber-500 rounded-full flex flex-col items-center justify-center shadow-inner opacity-90">
                <span className="text-amber-600 font-bold text-sm">منصة نُطق</span>
                <CheckCircle className="w-10 h-10 text-amber-500 my-1" />
                <span className="text-amber-600 font-bold text-lg">معتمد</span>
            </div>
          </div>

          <div className="text-center">
            <p className="text-xl text-slate-500 mb-2">المعلمة</p>
            <div className="text-4xl text-indigo-800 font-bold mb-1" style={{fontFamily: 'cursive'}}>ديمة الرشدان</div>
            <div className="h-0.5 w-40 bg-indigo-900 mx-auto"></div>
          </div>
        </div>
      </div>
    </div>
  );
});

export default CertificateTemplate;
