import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Trophy, Medal, Star, Crown } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { motion } from "framer-motion";

export default function Leaderboard() {
  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLeaderboard();
  }, []);

  const loadLeaderboard = async () => {
    try {
      const allStudents = await base44.entities.Student.list();
      // Filter out students who shouldn't be on leaderboard and sort by total exercises (points)
      const rankedStudents = allStudents
        .filter(s => s.show_on_leaderboard !== false) // Default to true if undefined
        .sort((a, b) => ((b.total_exercises || 0) * 10) - ((a.total_exercises || 0) * 10))
        .slice(0, 10); // Top 10

      setStudents(rankedStudents);
    } catch (e) {
      console.error("Leaderboard load failed", e);
    } finally {
      setLoading(false);
    }
  };

  if (loading) return <div className="text-center p-4">جاري تحميل لوحة الصدارة...</div>;

  return (
    <Card className="border-0 shadow-2xl bg-gradient-to-br from-yellow-50 to-orange-50 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-32 h-32 bg-yellow-200/50 rounded-bl-full -mr-16 -mt-16 z-0" />
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-orange-200/50 rounded-tr-full -ml-12 -mb-12 z-0" />
        
        <CardHeader className="text-center relative z-10">
            <motion.div 
                initial={{ scale: 0 }} 
                animate={{ scale: 1 }} 
                className="w-16 h-16 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full flex items-center justify-center mx-auto mb-2 shadow-lg"
            >
                <Trophy className="w-8 h-8 text-white" />
            </motion.div>
            <CardTitle className="text-2xl font-bold text-orange-900 arabic-text">لوحة الصدارة 🏆</CardTitle>
            <p className="text-orange-700 text-sm arabic-text">أبطال القراءة لهذا الأسبوع</p>
        </CardHeader>
        
        <CardContent className="relative z-10 px-4 pb-6">
            <div className="space-y-3">
                {students.map((student, index) => (
                    <motion.div 
                        key={student.id}
                        initial={{ opacity: 0, x: -20 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: index * 0.1 }}
                        className={`flex items-center justify-between p-3 rounded-xl border-2 transition-all ${
                            index === 0 ? 'bg-yellow-100 border-yellow-300 shadow-md scale-105 my-4' : 
                            index === 1 ? 'bg-gray-100 border-gray-300' :
                            index === 2 ? 'bg-orange-100 border-orange-300' :
                            'bg-white border-slate-100 hover:border-orange-200'
                        }`}
                    >
                        <div className="flex items-center gap-3">
                            <div className={`w-8 h-8 flex items-center justify-center rounded-full font-bold text-sm ${
                                index === 0 ? 'bg-yellow-500 text-white' :
                                index === 1 ? 'bg-gray-500 text-white' :
                                index === 2 ? 'bg-orange-500 text-white' :
                                'bg-slate-100 text-slate-600'
                            }`}>
                                {index + 1}
                            </div>
                            <div>
                                <p className="font-bold text-slate-800 arabic-text text-sm md:text-base">
                                    {student.name}
                                    {index === 0 && <Crown className="w-4 h-4 text-yellow-600 inline mr-1" />}
                                </p>
                                <div className="flex items-center gap-1">
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1 bg-white/50">{student.level}</Badge>
                                </div>
                            </div>
                        </div>
                        <div className="text-right">
                            <p className="font-bold text-orange-600">{(student.total_exercises || 0) * 10}</p>
                            <p className="text-[10px] text-gray-500 arabic-text">نقطة</p>
                        </div>
                    </motion.div>
                ))}
                {students.length === 0 && (
                    <p className="text-center text-gray-500 arabic-text py-4">لا يوجد متصدرين بعد.. كن الأول!</p>
                )}
            </div>
        </CardContent>
    </Card>
  );
}