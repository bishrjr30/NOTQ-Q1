import React from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Award, Star, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion } from "framer-motion";

export default function CertificateCard({ certificate }) {
  const handleShare = () => {
    if (navigator.share) {
      navigator.share({
        title: `شهادة إنجاز: ${certificate.title}`,
        text: `لقد حصلت على شهادة "${certificate.title}" في تطبيق القراءة العربي! ${certificate.description}`,
        url: window.location.href,
      }).catch(console.error);
    } else {
      alert("تم نسخ الرابط!");
    }
  };

  return (
    <motion.div whileHover={{ scale: 1.02 }} className="h-full">
      <Card className="h-full border-4 border-double border-yellow-400 bg-white shadow-xl relative overflow-hidden">
        {/* Decorative Background */}
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-yellow-50 via-white to-transparent opacity-50" />
        <div className="absolute -top-10 -right-10 w-32 h-32 bg-yellow-100 rounded-full blur-2xl" />
        <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-orange-100 rounded-full blur-2xl" />

        <CardContent className="p-6 flex flex-col items-center text-center h-full relative z-10 justify-between">
          <div>
            <div className="w-20 h-20 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mb-4 shadow-lg mx-auto border-4 border-white">
              <Award className="w-10 h-10 text-white" />
            </div>
            
            <h3 className="text-xl font-bold text-slate-900 arabic-text mb-2">{certificate.title}</h3>
            <p className="text-slate-600 text-sm arabic-text mb-4 leading-relaxed">{certificate.description}</p>
            
            <div className="flex justify-center gap-1 mb-4">
              {[...Array(3)].map((_, i) => (
                <Star key={i} className="w-4 h-4 text-yellow-400 fill-current" />
              ))}
            </div>
          </div>

          <div className="w-full space-y-3">
            <p className="text-xs text-gray-400 arabic-text">
              تاريخ المنح: {new Date(certificate.date_earned).toLocaleDateString('ar-AE')}
            </p>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full border-yellow-400 text-yellow-700 hover:bg-yellow-50 arabic-text"
              onClick={handleShare}
            >
              <Share2 className="w-4 h-4 ml-2" />
              مشاركة الإنجاز
            </Button>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}