import React, { useState, useRef } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Square, Send, ArrowLeft, CheckCircle, Upload, Link as LinkIcon, Image, Video } from "lucide-react";
import { Link, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Progress } from "@/components/ui/progress";

const GRADES = [
  "الصف الأول", "الصف الثاني", "الصف الثالث", "الصف الرابع",
  "الصف الخامس", "الصف السادس", "الصف السابع", "الصف الثامن",
  "الصف التاسع", "الصف العاشر", "الصف الحادي عشر", "الصف الثاني عشر"
];

export default function CreateLessonPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [lessonData, setLessonData] = useState({
    title: "",
    grade: "",
    subject: "",
    content_text: "",
    teacher_name: "",
    external_link: ""
  });
  const [mediaType, setMediaType] = useState("audio");
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlobs, setAudioBlobs] = useState([]);
  const [currentRecordingTime, setCurrentRecordingTime] = useState(0);
  const [uploadedFiles, setUploadedFiles] = useState({ video: null, image: null });
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(false);

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);
  const timerRef = useRef(null);
  const streamRef = useRef(null);
  const videoInputRef = useRef(null);
  const imageInputRef = useRef(null);

  const startRecording = async () => {
    try {
      setError(null);
      const stream = await navigator.mediaDevices.getUserMedia({ 
        audio: {
          echoCancellation: true,
          noiseSuppression: true,
          sampleRate: 44100
        } 
      });

      streamRef.current = stream;

      const options = {
        mimeType: 'audio/webm;codecs=opus',
        audioBitsPerSecond: 128000
      };

      if (!MediaRecorder.isTypeSupported(options.mimeType)) {
        options.mimeType = 'audio/webm';
      }

      mediaRecorderRef.current = new MediaRecorder(stream, options);
      audioChunksRef.current = [];

      mediaRecorderRef.current.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data);
        }
      };

      mediaRecorderRef.current.onstop = () => {
        const mimeType = mediaRecorderRef.current.mimeType || 'audio/webm';
        const blob = new Blob(audioChunksRef.current, { type: mimeType });
        setAudioBlobs(prev => [...prev, blob]);
        
        if (streamRef.current) {
          streamRef.current.getTracks().forEach(track => track.stop());
        }
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
      setCurrentRecordingTime(0);

      timerRef.current = setInterval(() => {
        setCurrentRecordingTime(prev => {
          const newTime = prev + 1;
          
          if (newTime >= 900) {
            stopRecording();
            setTimeout(() => startRecording(), 1000);
            return 0;
          }
          
          return newTime;
        });
      }, 1000);

    } catch (error) {
      console.error('Error accessing microphone:', error);
      setError('لم يتمكن من الوصول للميكروفون. يرجى التأكد من منح الإذن.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      
      if (timerRef.current) {
        clearInterval(timerRef.current);
        timerRef.current = null;
      }
    }
  };

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleFileUpload = async (type) => {
    const inputRef = type === 'video' ? videoInputRef : imageInputRef;
    const file = inputRef.current?.files[0];
    
    if (!file) return;

    try {
      setIsUploading(true);
      setUploadProgress(30);
      
      const { file_url } = await base44.integrations.Core.UploadFile({ file });
      
      setUploadedFiles(prev => ({ ...prev, [type]: file_url }));
      setUploadProgress(100);
      
      setTimeout(() => {
        setIsUploading(false);
        setUploadProgress(0);
      }, 500);
      
    } catch (error) {
      console.error(`Failed to upload ${type}:`, error);
      if (error.message && error.message.includes('limit')) {
        setError(`عذراً، لقد وصلت للحد الأقصى من الملفات المسموح بها هذا الشهر.`);
      } else {
        setError(`فشل في رفع ${type === 'video' ? 'الفيديو' : 'الصورة'}`);
      }
      setIsUploading(false);
    }
  };

  const handleSubmit = async () => {
    if (!lessonData.title || !lessonData.grade) {
      setError('يرجى إكمال جميع الحقول المطلوبة.');
      return;
    }

    if (mediaType === 'audio' && audioBlobs.length === 0) {
      setError('يرجى تسجيل الشرح الصوتي.');
      return;
    }

    if (mediaType === 'link' && !lessonData.external_link) {
      setError('يرجى إدخال رابط الدرس.');
      return;
    }

    setIsUploading(true);
    setUploadProgress(0);
    setError(null);

    try {
      let audio_url = null;
      
      if (audioBlobs.length > 0) {
        const combinedBlob = new Blob(audioBlobs, { type: 'audio/webm' });
        
        setUploadProgress(20);

        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const fileName = `lesson_${lessonData.grade}_${timestamp}.webm`;
        const file = new File([combinedBlob], fileName, { type: 'audio/webm' });

        setUploadProgress(40);

        try {
          const result = await base44.integrations.Core.UploadFile({ file });
          audio_url = result.file_url;
        } catch (uploadError) {
          if (uploadError.message && uploadError.message.includes('limit')) {
            throw new Error('عذراً، لقد وصلت للحد الأقصى من الملفات المسموح بها هذا الشهر. يرجى استخدام رابط خارجي أو المحاولة لاحقاً.');
          }
          throw uploadError;
        }
      }

      setUploadProgress(70);

      const totalDuration = Math.ceil(currentRecordingTime / 60);

      const lessonPayload = {
        title: lessonData.title,
        grade: lessonData.grade,
        subject: lessonData.subject || "عام",
        content_text: lessonData.content_text || "",
        teacher_name: lessonData.teacher_name || "المعلم",
        audio_duration: totalDuration
      };

      if (audio_url) lessonPayload.audio_url = audio_url;
      if (uploadedFiles.video) lessonPayload.video_url = uploadedFiles.video;
      if (uploadedFiles.image) lessonPayload.image_url = uploadedFiles.image;
      if (lessonData.external_link) lessonPayload.external_link = lessonData.external_link;

      await base44.entities.Lesson.create(lessonPayload);

      setUploadProgress(100);
      setSuccess(true);

      setTimeout(() => {
        navigate("/TeacherDashboard");
      }, 2000);

    } catch (error) {
      console.error('Failed to create lesson:', error);
      setError(`فشل في إنشاء الدرس: ${error.message || 'خطأ غير معروف'}`);
      setIsUploading(false);
    }
  };

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center p-6 bg-gradient-to-br from-green-50 to-emerald-50">
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
        >
          <Card className="max-w-md shadow-2xl border-0">
            <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-600 text-white rounded-t-xl text-center">
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", duration: 0.6 }}
                className="w-20 h-20 bg-white/20 rounded-full flex items-center justify-center mx-auto mb-4"
              >
                <CheckCircle className="w-12 h-12 text-white" />
              </motion.div>
              <CardTitle className="text-2xl font-bold arabic-text">
                تم إنشاء الدرس بنجاح! 🎉
              </CardTitle>
            </CardHeader>
            <CardContent className="p-8 text-center">
              <p className="text-gray-600 arabic-text mb-4">
                الدرس متاح الآن لجميع الطلاب
              </p>
              <Link to="/TeacherDashboard">
                <Button className="bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white arabic-text">
                  العودة للوحة التحكم
                </Button>
              </Link>
            </CardContent>
          </Card>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 p-6">
      <div className="max-w-4xl mx-auto">
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-4 mb-8"
        >
          <Link to="/TeacherDashboard">
            <Button variant="outline" size="icon" className="rounded-full shadow-lg">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent arabic-text">
              إنشاء شرح درس جديد
            </h1>
            <p className="text-gray-600 arabic-text">
              اختر طريقة الشرح المناسبة للطلاب
            </p>
          </div>
        </motion.div>

        {error && (
          <Card className="border-red-200 bg-red-50 mb-6">
            <CardContent className="p-4 flex items-center gap-3">
              <p className="text-red-700 arabic-text">{error}</p>
            </CardContent>
          </Card>
        )}

        <Card className="shadow-2xl border-0">
          <CardHeader className="bg-gradient-to-r from-blue-500 to-purple-600 text-white rounded-t-xl">
            <CardTitle className="text-xl arabic-text">
              {step === 1 ? "معلومات الدرس" : "محتوى الدرس"}
            </CardTitle>
          </CardHeader>
          <CardContent className="p-8">
            {step === 1 ? (
              <motion.div
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <div>
                  <Label htmlFor="teacher_name" className="arabic-text text-lg font-semibold">
                    اسم المعلم
                  </Label>
                  <Input
                    id="teacher_name"
                    value={lessonData.teacher_name}
                    onChange={(e) => setLessonData({...lessonData, teacher_name: e.target.value})}
                    placeholder="أدخل اسمك..."
                    className="text-right arabic-text mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="grade" className="arabic-text text-lg font-semibold">
                    اختر الصف الدراسي *
                  </Label>
                  <Select onValueChange={(value) => setLessonData({...lessonData, grade: value})}>
                    <SelectTrigger id="grade" className="text-right arabic-text mt-2">
                      <SelectValue placeholder="اختر الصف..." />
                    </SelectTrigger>
                    <SelectContent>
                      {GRADES.map(grade => (
                        <SelectItem key={grade} value={grade} className="arabic-text">
                          {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="title" className="arabic-text text-lg font-semibold">
                    عنوان الدرس *
                  </Label>
                  <Input
                    id="title"
                    value={lessonData.title}
                    onChange={(e) => setLessonData({...lessonData, title: e.target.value})}
                    placeholder="مثال: قواعد النحو - الفاعل والمفعول به"
                    className="text-right arabic-text mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="subject" className="arabic-text text-lg font-semibold">
                    المادة الدراسية
                  </Label>
                  <Input
                    id="subject"
                    value={lessonData.subject}
                    onChange={(e) => setLessonData({...lessonData, subject: e.target.value})}
                    placeholder="مثال: اللغة العربية، الرياضيات، العلوم..."
                    className="text-right arabic-text mt-2"
                  />
                </div>

                <div>
                  <Label htmlFor="content_text" className="arabic-text text-lg font-semibold">
                    نص الدرس (اختياري)
                  </Label>
                  <Textarea
                    id="content_text"
                    value={lessonData.content_text}
                    onChange={(e) => setLessonData({...lessonData, content_text: e.target.value})}
                    placeholder="يمكنك كتابة نص الدرس هنا ليظهر للطلاب..."
                    className="text-right arabic-text mt-2 min-h-[150px]"
                  />
                </div>

                <Button
                  onClick={() => setStep(2)}
                  className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white py-6 text-lg arabic-text"
                  disabled={!lessonData.title || !lessonData.grade}
                >
                  التالي: إضافة المحتوى
                </Button>
              </motion.div>
            ) : (
              <motion.div
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                className="space-y-6"
              >
                <Tabs defaultValue="audio" onValueChange={setMediaType}>
                  <TabsList className="grid w-full grid-cols-4 mb-6">
                    <TabsTrigger value="audio" className="arabic-text">
                      <Mic className="w-4 h-4 ml-2" />
                      تسجيل صوتي
                    </TabsTrigger>
                    <TabsTrigger value="video" className="arabic-text">
                      <Video className="w-4 h-4 ml-2" />
                      فيديو
                    </TabsTrigger>
                    <TabsTrigger value="image" className="arabic-text">
                      <Image className="w-4 h-4 ml-2" />
                      صورة
                    </TabsTrigger>
                    <TabsTrigger value="link" className="arabic-text">
                      <LinkIcon className="w-4 h-4 ml-2" />
                      رابط
                    </TabsTrigger>
                  </TabsList>

                  <TabsContent value="audio" className="space-y-6">
                    <div className="text-center space-y-6">
                      <div className="w-32 h-32 mx-auto">
                        <Button
                          onClick={isRecording ? stopRecording : startRecording}
                          disabled={isUploading}
                          size="lg"
                          className={`w-full h-full rounded-full text-white shadow-2xl transition-all duration-300 ${
                            isRecording
                              ? "bg-gradient-to-r from-red-500 to-red-600 hover:from-red-600 hover:to-red-700 animate-pulse"
                              : "bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 hover:scale-110"
                          }`}
                        >
                          {isRecording ? <Square className="w-12 h-12" /> : <Mic className="w-12 h-12" />}
                        </Button>
                      </div>

                      <div>
                        <p className="text-2xl font-bold text-blue-900 mb-2">
                          {formatTime(currentRecordingTime)}
                        </p>
                        <p className="text-lg text-blue-700 arabic-text">
                          {isRecording ? "جارٍ التسجيل... اضغط لإيقاف" : "اضغط لبدء تسجيل الشرح"}
                        </p>
                      </div>

                      {audioBlobs.length > 0 && (
                        <div className="bg-green-50 rounded-xl p-4 border-2 border-green-200">
                          <p className="text-green-800 arabic-text">
                            ✅ تم تسجيل {audioBlobs.length} مقطع صوتي
                          </p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="video" className="space-y-4">
                    <div className="text-center">
                      <input
                        type="file"
                        ref={videoInputRef}
                        accept="video/*"
                        className="hidden"
                        onChange={() => handleFileUpload('video')}
                      />
                      <Button
                        onClick={() => videoInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-gradient-to-r from-purple-500 to-pink-600 hover:from-purple-600 hover:to-pink-700 text-white px-8 py-6 text-lg arabic-text"
                      >
                        <Upload className="w-5 h-5 ml-2" />
                        اختر فيديو
                      </Button>
                      
                      {uploadedFiles.video && (
                        <div className="mt-4 bg-green-50 rounded-xl p-4 border-2 border-green-200">
                          <p className="text-green-800 arabic-text">✅ تم رفع الفيديو بنجاح</p>
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="image" className="space-y-4">
                    <div className="text-center">
                      <input
                        type="file"
                        ref={imageInputRef}
                        accept="image/*"
                        className="hidden"
                        onChange={() => handleFileUpload('image')}
                      />
                      <Button
                        onClick={() => imageInputRef.current?.click()}
                        disabled={isUploading}
                        className="bg-gradient-to-r from-orange-500 to-red-600 hover:from-orange-600 hover:to-red-700 text-white px-8 py-6 text-lg arabic-text"
                      >
                        <Upload className="w-5 h-5 ml-2" />
                        اختر صورة
                      </Button>
                      
                      {uploadedFiles.image && (
                        <div className="mt-4 bg-green-50 rounded-xl p-4 border-2 border-green-200">
                          <p className="text-green-800 arabic-text">✅ تم رفع الصورة بنجاح</p>
                          <img src={uploadedFiles.image} alt="Preview" className="mt-4 mx-auto max-h-64 rounded-lg" />
                        </div>
                      )}
                    </div>
                  </TabsContent>

                  <TabsContent value="link" className="space-y-4">
                    <div>
                      <Label htmlFor="external_link" className="arabic-text text-lg font-semibold">
                        رابط الدرس (YouTube, Google Drive, إلخ...)
                      </Label>
                      <Input
                        id="external_link"
                        value={lessonData.external_link}
                        onChange={(e) => setLessonData({...lessonData, external_link: e.target.value})}
                        placeholder="https://..."
                        className="text-right arabic-text mt-2"
                      />
                    </div>
                  </TabsContent>
                </Tabs>

                {isUploading && (
                  <div className="space-y-3">
                    <p className="text-blue-700 arabic-text font-semibold text-center">
                      جارٍ رفع المحتوى...
                    </p>
                    <Progress value={uploadProgress} className="h-3" />
                  </div>
                )}

                <div className="flex gap-4">
                  <Button
                    onClick={() => setStep(1)}
                    variant="outline"
                    className="flex-1 py-6 text-lg arabic-text"
                    disabled={isRecording || isUploading}
                  >
                    رجوع
                  </Button>
                  <Button
                    onClick={handleSubmit}
                    disabled={isRecording || isUploading}
                    className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 text-white py-6 text-lg arabic-text"
                  >
                    <Send className="w-5 h-5 ml-2" />
                    نشر الدرس
                  </Button>
                </div>
              </motion.div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}