import React, { useState, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Volume2, ArrowLeft, Send, BookOpen, Clock, User, MessageSquare, CheckCircle, Play, Pause, Image, Video, ExternalLink } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";

const GRADES = [
  "الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع",
  "الصف الخامس", "الصف السادس", "الصف السابع", "الصف الثامن",
  "الصف التاسع", "الصف العاشر", "الصف الحادي عشر", "الصف الثاني عشر"
];

export default function StudentLessonsPage() {
  const [selectedGrade, setSelectedGrade] = useState("");
  const [lessons, setLessons] = useState([]);
  const [selectedLesson, setSelectedLesson] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [questionText, setQuestionText] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [questionSent, setQuestionSent] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);

  useEffect(() => {
    const savedName = localStorage.getItem("studentName");
    if (savedName) {
      setStudentName(savedName);
    }
  }, []);

  useEffect(() => {
    if (selectedGrade) {
      loadLessons();
    }
  }, [selectedGrade]);

  const loadLessons = async () => {
    setIsLoading(true);
    try {
      const allLessons = await base44.entities.Lesson.list("-created_date");
      const filteredLessons = allLessons.filter(l => l.grade === selectedGrade);
      setLessons(filteredLessons);
    } catch (error) {
      console.error("Failed to load lessons:", error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleLessonClick = async (lesson) => {
    setSelectedLesson(lesson);
    setQuestionSent(false);
    setQuestionText("");

    try {
      await base44.entities.Lesson.update(lesson.id, {
        views_count: (lesson.views_count || 0) + 1
      });
    } catch (error) {
      console.error("Failed to update views:", error);
    }
  };

  const handleSendQuestion = async () => {
    if (!questionText.trim() || !selectedLesson) return;

    if (!studentName) {
      alert("يرجى إدخال اسمك أولاً");
      return;
    }

    setIsSending(true);
    try {
      await base44.entities.StudentQuestion.create({
        lesson_id: selectedLesson.id,
        student_name: studentName,
        question_text: questionText
      });

      setQuestionSent(true);
      setQuestionText("");
      
      setTimeout(() => {
        setQuestionSent(false);
      }, 3000);
    } catch (error) {
      console.error("Failed to send question:", error);
      alert("فشل في إرسال السؤال. يرجى المحاولة مرة أخرى.");
    } finally {
      setIsSending(false);
    }
  };

  if (selectedLesson) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: -20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center gap-4 mb-8"
          >
            <Button
              onClick={() => setSelectedLesson(null)}
              variant="outline"
              size="icon"
              className="rounded-full shadow-lg"
            >
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent arabic-text">
                {selectedLesson.title}
              </h1>
              <div className="flex items-center gap-3 mt-2 flex-wrap">
                <Badge className="bg-blue-100 text-blue-800 arabic-text">
                  {selectedLesson.grade}
                </Badge>
                {selectedLesson.subject && (
                  <Badge className="bg-green-100 text-green-800 arabic-text">
                    {selectedLesson.subject}
                  </Badge>
                )}
                {selectedLesson.audio_url && (
                  <span className="text-sm text-gray-500 flex items-center gap-1">
                    <Clock className="w-4 h-4" />
                    {selectedLesson.audio_duration || 0} دقيقة
                  </span>
                )}
              </div>
            </div>
          </motion.div>

          <div className="grid lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* الصوت */}
              {selectedLesson.audio_url && (
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl">
                    <CardTitle className="text-xl arabic-text flex items-center gap-2">
                      <Volume2 className="w-6 h-6" />
                      الشرح الصوتي 🎧
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="space-y-4">
                      <div className="flex items-center justify-center gap-2 mb-4">
                        <User className="w-5 h-5 text-indigo-600" />
                        <p className="text-lg font-semibold text-indigo-900 arabic-text">
                          المعلم: {selectedLesson.teacher_name || "المعلم"}
                        </p>
                      </div>

                      <audio
                        controls
                        className="w-full"
                        onPlay={() => setIsPlaying(true)}
                        onPause={() => setIsPlaying(false)}
                        onEnded={() => setIsPlaying(false)}
                      >
                        <source src={selectedLesson.audio_url} type="audio/webm" />
                        <source src={selectedLesson.audio_url} type="audio/mp4" />
                        متصفحك لا يدعم تشغيل الصوت.
                      </audio>

                      <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                        <p className="text-sm text-blue-800 arabic-text flex items-center gap-2">
                          <Volume2 className="w-4 h-4" />
                          {isPlaying ? "جارٍ التشغيل... استمع بتركيز 👂" : "اضغط على زر التشغيل للاستماع للشرح"}
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* الفيديو */}
              {selectedLesson.video_url && (
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-600 text-white rounded-t-xl">
                    <CardTitle className="text-xl arabic-text flex items-center gap-2">
                      <Video className="w-6 h-6" />
                      فيديو الشرح 📹
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <video controls className="w-full rounded-lg shadow-lg">
                      <source src={selectedLesson.video_url} type="video/mp4" />
                      <source src={selectedLesson.video_url} type="video/webm" />
                      متصفحك لا يدعم تشغيل الفيديو.
                    </video>
                  </CardContent>
                </Card>
              )}

              {/* الصورة */}
              {selectedLesson.image_url && (
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-pink-500 to-red-600 text-white rounded-t-xl">
                    <CardTitle className="text-xl arabic-text flex items-center gap-2">
                      <Image className="w-6 h-6" />
                      الصورة التوضيحية 🖼️
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <img src={selectedLesson.image_url} alt={selectedLesson.title} className="w-full rounded-lg shadow-lg" />
                  </CardContent>
                </Card>
              )}

              {/* رابط خارجي */}
              {selectedLesson.external_link && (
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-orange-500 to-amber-600 text-white rounded-t-xl">
                    <CardTitle className="text-xl arabic-text flex items-center gap-2">
                      <ExternalLink className="w-6 h-6" />
                      رابط الدرس 🔗
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8 text-center">
                    <Button
                      onClick={() => window.open(selectedLesson.external_link, '_blank')}
                      className="bg-gradient-to-r from-orange-500 to-amber-600 hover:from-orange-600 hover:to-amber-700 text-white px-8 py-6 text-lg arabic-text shadow-lg"
                    >
                      <ExternalLink className="w-5 h-5 ml-2" />
                      فتح الرابط
                    </Button>
                  </CardContent>
                </Card>
              )}

              {/* نص الدرس */}
              {selectedLesson.content_text && (
                <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm">
                  <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl">
                    <CardTitle className="text-xl arabic-text flex items-center gap-2">
                      <BookOpen className="w-6 h-6" />
                      نص الدرس 📝
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-8">
                    <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl p-6 border-2 border-green-200">
                      <p className="text-lg text-gray-800 arabic-text leading-relaxed whitespace-pre-wrap">
                        {selectedLesson.content_text}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>

            {/* قسم الأسئلة */}
            <div>
              <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm sticky top-6">
                <CardHeader className="bg-gradient-to-r from-orange-500 to-red-600 text-white rounded-t-xl">
                  <CardTitle className="text-xl arabic-text flex items-center gap-2">
                    <MessageSquare className="w-6 h-6" />
                    أسئلتك للمعلم 💬
                  </CardTitle>
                </CardHeader>
                <CardContent className="p-6 space-y-4">
                  {!studentName && (
                    <div className="bg-yellow-50 border-2 border-yellow-200 rounded-lg p-4">
                      <p className="text-sm text-yellow-800 arabic-text mb-2">
                        يرجى إدخال اسمك أولاً:
                      </p>
                      <input
                        type="text"
                        value={studentName}
                        onChange={(e) => setStudentName(e.target.value)}
                        placeholder="اسمك الثلاثي..."
                        className="w-full px-4 py-2 border-2 border-yellow-300 rounded-lg text-right arabic-text"
                      />
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-semibold text-gray-700 mb-2 arabic-text">
                      هل لديك سؤال أو ملاحظة؟ 🤔
                    </label>
                    <Textarea
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      placeholder="اكتب سؤالك أو ملاحظتك هنا..."
                      className="min-h-[120px] text-right arabic-text"
                    />
                  </div>

                  <AnimatePresence>
                    {questionSent && (
                      <motion.div
                        initial={{ opacity: 0, y: -10 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -10 }}
                        className="bg-green-50 border-2 border-green-200 rounded-lg p-4 flex items-center gap-2"
                      >
                        <CheckCircle className="w-5 h-5 text-green-600" />
                        <p className="text-green-800 arabic-text font-semibold">
                          تم إرسال سؤالك بنجاح! ✅
                        </p>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  <Button
                    onClick={handleSendQuestion}
                    disabled={!questionText.trim() || !studentName || isSending}
                    className="w-full bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white py-6 rounded-xl arabic-text"
                  >
                    {isSending ? (
                      <>
                        <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-2"></div>
                        جارٍ الإرسال...
                      </>
                    ) : (
                      <>
                        <Send className="w-5 h-5 mr-2" />
                        إرسال للمعلم 📨
                      </>
                    )}
                  </Button>

                  <div className="bg-blue-50 rounded-lg p-4 border-2 border-blue-200">
                    <p className="text-xs text-blue-700 arabic-text">
                      💡 ستصل أسئلتك للمعلم مباشرة وسيقوم بالرد عليها
                    </p>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="max-w-6xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to={createPageUrl("StudentDashboard")}>
            <Button variant="outline" size="icon" className="rounded-full shadow-lg">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-indigo-600 to-purple-600 bg-clip-text text-transparent arabic-text">
              شروحات المعلم 📚
            </h1>
            <p className="text-gray-600 arabic-text">
              استمع لشروحات المعلم للدروس المختلفة
            </p>
          </div>
        </motion.div>

        <Card className="shadow-2xl border-0 bg-white/80 backdrop-blur-sm mb-8">
          <CardHeader className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-t-xl">
            <CardTitle className="text-xl arabic-text">
              اختر الصف الدراسي
            </CardTitle>
          </CardHeader>
          <CardContent className="p-6">
            <Select onValueChange={setSelectedGrade} value={selectedGrade}>
              <SelectTrigger className="text-right arabic-text h-14 text-lg">
                <SelectValue placeholder="اختر الصف..." />
              </SelectTrigger>
              <SelectContent>
                {GRADES.map(grade => (
                  <SelectItem key={grade} value={grade} className="arabic-text text-lg">
                    {grade}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        {selectedGrade && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
          >
            {isLoading ? (
              <div className="text-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-500 mx-auto mb-4"></div>
                <p className="text-gray-600 arabic-text">جارٍ تحميل الدروس...</p>
              </div>
            ) : lessons.length > 0 ? (
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                {lessons.map(lesson => (
                  <motion.div
                    key={lesson.id}
                    whileHover={{ scale: 1.02 }}
                    whileTap={{ scale: 0.98 }}
                  >
                    <Card
                      onClick={() => handleLessonClick(lesson)}
                      className="cursor-pointer shadow-xl border-0 bg-white hover:shadow-2xl transition-all duration-300"
                    >
                      <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
                        <CardTitle className="text-lg arabic-text line-clamp-2">
                          {lesson.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="p-6 space-y-3">
                        <div className="flex items-center gap-2 flex-wrap">
                          {lesson.subject && (
                            <Badge className="bg-green-100 text-green-800 arabic-text">
                              {lesson.subject}
                            </Badge>
                          )}
                          {lesson.video_url && (
                            <Badge className="bg-purple-100 text-purple-800 arabic-text">
                              <Video className="w-3 h-3 ml-1" />
                              فيديو
                            </Badge>
                          )}
                          {lesson.image_url && (
                            <Badge className="bg-pink-100 text-pink-800 arabic-text">
                              <Image className="w-3 h-3 ml-1" />
                              صورة
                            </Badge>
                          )}
                          {lesson.external_link && (
                            <Badge className="bg-orange-100 text-orange-800 arabic-text">
                              <ExternalLink className="w-3 h-3 ml-1" />
                              رابط
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center justify-between text-sm text-gray-600">
                          {lesson.audio_url && (
                            <div className="flex items-center gap-1">
                              <Clock className="w-4 h-4" />
                              <span>{lesson.audio_duration || 0} دقيقة</span>
                            </div>
                          )}
                          <div className="flex items-center gap-1">
                            <Play className="w-4 h-4" />
                            <span>{lesson.views_count || 0} مشاهدة</span>
                          </div>
                        </div>

                        <div className="flex items-center gap-2 text-sm text-gray-500">
                          <User className="w-4 h-4" />
                          <span className="arabic-text">{lesson.teacher_name || "المعلم"}</span>
                        </div>

                        <Button className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 hover:from-indigo-600 hover:to-purple-700 text-white arabic-text">
                          <Play className="w-4 h-4 mr-2" />
                          عرض الدرس
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                ))}
              </div>
            ) : (
              <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <BookOpen className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-xl font-semibold text-gray-700 arabic-text mb-2">
                    لا توجد دروس متاحة حالياً
                  </h3>
                  <p className="text-gray-500 arabic-text">
                    لم يقم المعلم بإضافة دروس لهذا الصف بعد
                  </p>
                </CardContent>
              </Card>
            )}
          </motion.div>
        )}
      </div>
    </div>
  );
}