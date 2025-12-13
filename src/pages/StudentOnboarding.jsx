import React, { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { GraduationCap, ArrowLeft, Star } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion } from "framer-motion";

const GRADES = [
  "الروضة", "الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع", "الصف الخامس",
  "الصف السادس", "الصف السابع", "الصف الثامن", "الصف التاسع", "الصف العاشر", 
  "الصف الحادي عشر", "الصف الثاني عشر"
];

export default function StudentOnboarding() {
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [grade, setGrade] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const generateAccessCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
    let result = "";
    for (let i = 0; i < 8; i++) {
      result += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return result;
  };

  const handleRegister = async () => {
    if (!name.trim() || !grade) return;
    
    setIsLoading(true);
    try {
      const accessCode = generateAccessCode();
      
      // Create student profile
      const student = await base44.entities.Student.create({
        name: name.trim(),
        grade: grade,
        access_code: accessCode,
        level: "مبتدئ",
        current_stage: 1,
        last_activity: new Date().toISOString(),
        last_login: new Date().toISOString()
      });
      
      // Save locally
      localStorage.setItem("studentId", student.id);
      localStorage.setItem("studentName", student.name);
      localStorage.setItem("studentGrade", student.grade);
      
      // Go to dashboard
      navigate(createPageUrl("StudentDashboard"));
      
    } catch (error) {
      console.error("Registration failed", error);
      alert("حدث خطأ أثناء التسجيل. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-100 flex items-center justify-center p-6">
      <Card className="w-full max-w-md shadow-2xl border-0 bg-white/90 backdrop-blur-sm">
        <CardHeader className="text-center">
          <motion.div 
            initial={{ scale: 0 }}
            animate={{ scale: 1 }}
            className="w-24 h-24 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-full flex items-center justify-center mx-auto mb-4 shadow-lg"
          >
            <GraduationCap className="w-12 h-12 text-white" />
          </motion.div>
          <CardTitle className="text-3xl font-bold arabic-text text-indigo-900">أهلاً بك يا بطل! 🌟</CardTitle>
          <p className="text-gray-500 arabic-text mt-2">دعنا نتعرف عليك لنبدأ رحلة التعلم</p>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="space-y-2">
            <label className="text-right block font-medium text-gray-700 arabic-text">ما اسمك الأول؟ (بدون اسم العائلة)</label>
            <Input 
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="مثلاً: أحمد"
              className="text-right arabic-text h-12 text-lg"
            />
          </div>
          
          <div className="space-y-2">
            <label className="text-right block font-medium text-gray-700 arabic-text">في أي صف أنت؟</label>
            <Select value={grade} onValueChange={setGrade}>
              <SelectTrigger className="h-12 text-right arabic-text" dir="rtl">
                <SelectValue placeholder="اختر صفك الدراسي" />
              </SelectTrigger>
              <SelectContent dir="rtl">
                {GRADES.map(g => (
                  <SelectItem key={g} value={g} className="arabic-text">{g}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <Button 
            onClick={handleRegister}
            disabled={!name || !grade || isLoading}
            className="w-full h-14 text-xl arabic-text bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-1 rounded-xl"
          >
            {isLoading ? "جاري البدء..." : "ابدأ رحلتي! 🚀"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}