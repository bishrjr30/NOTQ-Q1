// src/pages/Certificates.jsx

import React, { useState, useEffect, useRef } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowLeft, Award, Download, Loader2, Star } from "lucide-react";
import { createPageUrl } from "@/utils";
import { Certificate, Student } from "@/api/entities";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import CertificateTemplate from "@/components/CertificateTemplate";

export default function Certificates() {
  const [certificates, setCertificates] = useState([]);
  const [student, setStudent] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Ref للقالب المخفي الذي سنلتقط صورته
  const certRef = useRef(null);
  
  // State لتخزين بيانات الشهادة التي يتم طباعتها حالياً
  const [printData, setPrintData] = useState(null);

  useEffect(() => {
    const load = async () => {
      const studentId = localStorage.getItem("studentId");
      if (!studentId) return;

      try {
        const [studentData, certs] = await Promise.all([
          Student.get(studentId),
          Certificate.list({ student_id: studentId }) // نستخدم الفلتر حسب الطالب
        ]);
        
        // تصفية الشهادات الخاصة بالطالب الحالي فقط (للتأكد)
        const myCerts = (certs || []).filter(c => c.student_id === studentId);
        // ترتيبها من الأحدث للأقدم
        myCerts.sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
        
        setStudent(studentData);
        setCertificates(myCerts);
      } catch (e) {
        console.error("Failed to load certificates", e);
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  const handleDownload = async (cert) => {
    if (isDownloading) return;
    setIsDownloading(true);
    
    // 1. وضع بيانات هذه الشهادة في القالب المخفي
    setPrintData(cert);

    // ننتظر قليلاً (500ms) حتى يقوم React بتحديث الـ DOM بالبيانات الجديدة
    setTimeout(async () => {
      if (certRef.current) {
        try {
          // 2. التقاط صورة عالية الجودة للعنصر المخفي
          const canvas = await html2canvas(certRef.current, {
            scale: 2, // دقة عالية
            useCORS: true,
            backgroundColor: "#ffffff",
            logging: false,
          });

          // 3. إنشاء ملف PDF
          const imgData = canvas.toDataURL("image/png");
          // A4 Landscape: 297mm عرض × 210mm ارتفاع
          const pdf = new jsPDF("l", "mm", "a4");
          const pdfWidth = pdf.internal.pageSize.getWidth();
          const pdfHeight = pdf.internal.pageSize.getHeight();
          
          pdf.addImage(imgData, "PNG", 0, 0, pdfWidth, pdfHeight);
          
          // 4. حفظ الملف
          pdf.save(`شهادة_${cert.type === 'stage' ? 'مرحلة' : 'تميز'}_${student?.name || 'الطالب'}.pdf`);
        } catch (err) {
          console.error("Download failed", err);
          alert("حدث خطأ أثناء إنشاء ملف الـ PDF.");
        } finally {
          setIsDownloading(false);
          setPrintData(null); // إخفاء القالب مرة أخرى
        }
      } else {
        setIsDownloading(false);
        console.error("Certificate template ref not found");
      }
    }, 500);
  };

  return (
    <div className="min-h-screen bg-slate-50 p-4 md:p-8">
      {/* ✅ القالب المخفي:
         موجود دائماً في الصفحة لكنه مخفي بصرياً.
         عند الضغط على تنزيل، نملؤه بالبيانات (printData) ثم نلتقط صورته.
      */}
      <div style={{ position: "absolute", left: "-9999px", top: 0 }}>
         {printData && (
            <CertificateTemplate 
              ref={certRef}
              studentName={printData.student_name}
              type={printData.type}
              details={printData.details}
              date={printData.date}
            />
         )}
      </div>

      <div className="max-w-6xl mx-auto space-y-8">
        {/* Header */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <Link to={createPageUrl("StudentDashboard")}>
            <Button variant="outline" size="icon" className="rounded-full shadow-sm bg-white">
              <ArrowLeft className="w-5 h-5 text-slate-700" />
            </Button>
          </Link>
          <div className="text-center md:text-right">
            <h1 className="text-3xl font-bold text-indigo-900 arabic-text">جدار الإنجازات 🏆</h1>
            <p className="text-slate-500 arabic-text mt-1">وثّق نجاحك واحتفظ بشهاداتك للأبد</p>
          </div>
          {/* عنصر فارغ للموازنة في الشاشات الكبيرة */}
          <div className="hidden md:block w-10"></div>
        </div>

        {/* Loading State */}
        {isLoading && (
          <div className="text-center py-20">
            <Loader2 className="w-10 h-10 animate-spin mx-auto text-indigo-500 mb-4"/>
            <p className="text-slate-500 arabic-text">جاري جلب شهاداتك...</p>
          </div>
        )}

        {/* Empty State */}
        {!isLoading && certificates.length === 0 && (
          <div className="text-center py-16 bg-white rounded-3xl shadow-sm border-2 border-dashed border-slate-200">
            <div className="bg-slate-50 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-6">
                <Award className="w-12 h-12 text-slate-300" />
            </div>
            <h3 className="text-xl font-bold text-slate-700 arabic-text mb-2">لم تحصل على شهادات بعد</h3>
            <p className="text-slate-500 arabic-text max-w-md mx-auto">
              أكمل التمارين بامتياز (90% فأكثر) أو أتمم مراحل كاملة لتبدأ بملء هذا الجدار بالشهادات!
            </p>
            <Link to={createPageUrl("StudentDashboard")}>
                <Button className="mt-6 bg-indigo-600 hover:bg-indigo-700 text-white arabic-text">
                    ابدأ التمارين الآن
                </Button>
            </Link>
          </div>
        )}

        {/* Certificates Grid */}
        {!isLoading && certificates.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {certificates.map((cert) => (
              <Card 
                key={cert.id} 
                className="group overflow-hidden hover:shadow-2xl transition-all duration-300 border-2 border-transparent hover:border-indigo-100 bg-white"
              >
                {/* الجزء العلوي الملون */}
                <div className={`h-40 relative flex items-center justify-center overflow-hidden ${
                    cert.type === 'stage' 
                    ? 'bg-gradient-to-br from-amber-400 to-orange-600' 
                    : 'bg-gradient-to-br from-indigo-500 to-purple-700'
                }`}>
                  {/* زخرفة الخلفية */}
                  <div className="absolute inset-0 opacity-20 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')]"></div>
                  <div className="absolute -bottom-10 -right-10 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
                  
                  {/* الأيقونة */}
                  <div className="relative z-10 transform group-hover:scale-110 transition-transform duration-500">
                      {cert.type === 'stage' ? (
                          <Star className="w-20 h-20 text-white drop-shadow-lg" />
                      ) : (
                          <Award className="w-20 h-20 text-white drop-shadow-lg" />
                      )}
                  </div>
                </div>

                <CardContent className="p-6 text-center space-y-4">
                  <div>
                    <h3 className="font-bold text-xl text-slate-800 arabic-text mb-1 line-clamp-1" title={cert.title}>
                        {cert.title}
                    </h3>
                    <p className="text-xs font-medium text-slate-400 arabic-text uppercase tracking-wider">
                        {cert.date}
                    </p>
                  </div>
                  
                  <div className="bg-slate-50 rounded-xl p-3 text-sm text-slate-600 arabic-text min-h-[60px] flex items-center justify-center border border-slate-100">
                    {cert.details}
                  </div>

                  <Button 
                    onClick={() => handleDownload(cert)} 
                    disabled={isDownloading}
                    className={`w-full arabic-text font-bold shadow-md transition-all ${
                        cert.type === 'stage'
                        ? 'bg-amber-500 hover:bg-amber-600 text-white'
                        : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                    }`}
                  >
                    {isDownloading && printData?.id === cert.id ? (
                      <>
                        <Loader2 className="w-4 h-4 ml-2 animate-spin" />
                        جاري التحضير...
                      </>
                    ) : (
                      <>
                        <Download className="w-4 h-4 ml-2" />
                        تنزيل الشهادة (PDF)
                      </>
                    )}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
