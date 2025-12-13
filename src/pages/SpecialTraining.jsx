import React, { useState, useRef, useEffect } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mic, Play, Activity, Wind, Drama, Volume2, Square, ArrowLeft, Send, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { createPageUrl } from "@/utils";
import { motion, AnimatePresence } from "framer-motion";
import { Progress } from "@/components/ui/progress";

export default function SpecialTrainingPage() {
  const [activeTab, setActiveTab] = useState("mirroring");
  const [isRecording, setIsRecording] = useState(false);
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [feedback, setFeedback] = useState(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  
  // Mirroring State
  const [mirrorText] = useState("اَلْعِلْمُ نُورٌ يَقْذِفُهُ اللهُ فِي قَلْبِ مَنْ يَشَاءُ");
  
  // Breathing State
  const [breathingText] = useState("تَنَفَّسْ بِعُمْقٍ ... ثُمَّ اقْرَأْ بِهُدُوءٍ ... اَلْقِرَاءَةُ لَيْسَتْ سِبَاقًا ... بَلْ هِيَ رِحْلَةٌ مُمْتِعَةٌ لِلْعَقْلِ وَالرُّوحِ.");

  // Acting State
  const [currentPlayIndex, setCurrentPlayIndex] = useState(0);
  const plays = [
    [
        { name: "الْمُعَلِّمُ", text: "يَا أَحْمَدُ، هَلْ حَفِظْتَ دَرْسَ الْيَوْمِ جَيِّدًا؟" },
        { name: "أَحْمَدُ", text: "نَعَمْ يَا أُسْتَاذِي، لَقَدْ قَرَأْتُهُ ثَلَاثَ مَرَّاتٍ بِتَمَعُّنٍ." },
        { name: "الْمُعَلِّمُ", text: "أَحْسَنْتَ! إِذًا أَخْبِرْنِي، مَا هِيَ أَهَمُّ فِكْرَةٍ فِي النَّصِّ؟" }
    ],
    [
        { name: "اَلْأُمُّ", text: "هَلْ رَتَّبْتَ غُرْفَتَكَ يَا خَالِدُ؟" },
        { name: "خَالِدُ", text: "لَيْسَ بَعْدُ يَا أُمِّي، كُنْتُ مَشْغُولًا بِحَلِّ الْوَاجِبِ." },
        { name: "اَلْأُمُّ", text: "بَارَكَ اللهُ فِيكَ، وَلَكِنْ لَا تُؤَجِّلْ عَمَلَ الْيَوْمِ إِلَى الْغَدِ." }
    ],
    [
        { name: "الْمُسَافِرُ", text: "مَتَى سَيَنْطَلِقُ الْقِطَارُ أَيُّهَا الْمُوَظَّفُ؟" },
        { name: "الْمُوَظَّفُ", text: "بَعْدَ خَمْسِ دَقَائِقٍ، عَلَيْكَ الْإِسْرَاعُ!" },
        { name: "الْمُسَافِرُ", text: "شُكْرًا لَكَ، سَأَجْرِي فَوْرًا." }
    ]
  ];
  
  const [roles, setRoles] = useState(plays[0]);
  const [userRole, setUserRole] = useState("أَحْمَدُ");

  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const renewPlay = () => {
      const nextIndex = (currentPlayIndex + 1) % plays.length;
      setCurrentPlayIndex(nextIndex);
      setRoles(plays[nextIndex]);
      // Set user role to the second character by default or first available that isn't the first if multiple
      setUserRole(plays[nextIndex][1]?.name || plays[nextIndex][0].name);
      setFeedback(null);
  };

  const speakText = (text) => {
    setIsPlaying(true);
    const utterance = new SpeechSynthesisUtterance(text);
    utterance.lang = 'ar-SA';
    utterance.rate = 0.9;
    utterance.onend = () => setIsPlaying(false);
    window.speechSynthesis.speak(utterance);
  };

  const startRecording = async () => {
    try {
        setFeedback(null);
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        const options = { mimeType: 'audio/webm' };
        
        mediaRecorderRef.current = new MediaRecorder(stream, options);
        audioChunksRef.current = [];

        mediaRecorderRef.current.ondataavailable = (event) => {
            if (event.data.size > 0) audioChunksRef.current.push(event.data);
        };

        mediaRecorderRef.current.onstop = async () => {
            const blob = new Blob(audioChunksRef.current, { type: 'audio/webm' });
            await processRecording(blob);
            stream.getTracks().forEach(track => track.stop());
        };

        mediaRecorderRef.current.start();
        setIsRecording(true);
    } catch (err) {
        console.error("Mic Error:", err);
        alert("لا يمكن الوصول للميكروفون");
    }
  };

  const stopRecording = () => {
      if (mediaRecorderRef.current && isRecording) {
          mediaRecorderRef.current.stop();
          setIsRecording(false);
      }
  };

  const processRecording = async (audioBlob) => {
      setIsAnalyzing(true);
      setProgress(10);
      try {
          // 1. Upload File
          const file = new File([audioBlob], "special_training.webm", { type: "audio/webm" });
          const { file_url } = await base44.integrations.Core.UploadFile({ file });
          setProgress(40);

          // 2. Transcribe
          let OPENAI_API_KEY = import.meta.env.VITE_OPENAI_API_KEY || '';
          try {
            const settings = await base44.entities.SystemSetting.list();
            const keySetting = settings.find(s => s.key === "openai_api_key");
            if (keySetting && keySetting.value && keySetting.value.startsWith("sk-")) {
               OPENAI_API_KEY = keySetting.value;
            }
          } catch(e) { console.warn("Could not load system key"); }

          const formData = new FormData();
          formData.append("file", file);
          formData.append("model", "whisper-1");
          formData.append("language", "ar");

          const transRes = await fetch("https://api.openai.com/v1/audio/transcriptions", {
              method: "POST",
              headers: { "Authorization": `Bearer ${OPENAI_API_KEY}` },
              body: formData
          });

          if (!transRes.ok) {
             const errText = await transRes.text();
             if (transRes.status === 429 || errText.includes("insufficient_quota")) {
                 throw new Error("⚠️ تم تجاوز حد الاستخدام المجاني. يرجى من المعلم إضافة مفتاح API في الإعدادات.");
             }
             throw new Error(`Transcription failed: ${transRes.status} - ${errText}`);
          }
          const transData = await transRes.json();
          const text = transData.text;
          
          setProgress(60);

          // 3. Analyze
          let targetText = "";
          if (activeTab === "mirroring") targetText = mirrorText;
          else if (activeTab === "breathing") targetText = breathingText;
          else if (activeTab === "acting") targetText = roles.filter(r => r.name === userRole).map(r => r.text).join(" ");

          const analysisRes = await fetch("https://api.openai.com/v1/chat/completions", {
              method: "POST",
              headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${OPENAI_API_KEY}`
              },
              body: JSON.stringify({
                  model: "gpt-4o",
                  messages: [
                      { role: "system", content: "أنت خبير تحليل صوتي لغوي. يجب أن تكون جميع مخرجاتك باللغة العربية الفصحى ومشكولة بالكامل تشكيلاً تاماً (100% Full Tashkeel) للحروف والكلمات." },
                      { role: "user", content: `
                          النص الأصلي: "${targetText}"
                          النص المقروء: "${text}"
                          
                          قيم الأداء بدقة متناهية وحقيقية (Real Scoring, No Faking) من حيث:
                          1. التطابق (Score out of 100) - كن صارماً جداً.
                          2. الإيقاع (Rhythm) - وصف دقيق.
                          3. النبرة (Tone) - هل تناسب السياق؟
                          4. التنفس (Breathing) - هل التوقفات صحيحة؟
                          
                          JSON Output:
                          {
                              "score": number,
                              "rhythm": "string arabic (full tashkeel)",
                              "tone": "string arabic (full tashkeel)",
                              "breathing": "string arabic (full tashkeel)",
                              "feedback": "string arabic short (full tashkeel)"
                          }
                      `}
                  ],
                  response_format: { type: "json_object" }
              })
          });

          if (!analysisRes.ok) {
             const errText = await analysisRes.text();
             if (analysisRes.status === 429 || errText.includes("insufficient_quota")) {
                 throw new Error("⚠️ تم تجاوز حد الاستخدام المجاني. يرجى إضافة مفتاح API.");
             }
             throw new Error(`Analysis failed: ${analysisRes.status} - ${errText}`);
          }

          const analysisData = await analysisRes.json();
          
          if (!analysisData.choices || !analysisData.choices.length || !analysisData.choices[0].message) {
             throw new Error("No analysis result returned from AI");
          }

          const result = JSON.parse(analysisData.choices[0].message.content);
          
          setProgress(90);
          setFeedback(result);

          // 4. Save Recording (To be visible to teacher)
          // Check if student is logged in
          const studentName = localStorage.getItem("studentName");
          if (studentName) {
              const students = await base44.entities.Student.list();
              const student = students.find(s => s.name === studentName);
              if (student) {
                  await base44.entities.Recording.create({
                      student_id: student.id,
                      exercise_id: "special-training", // generic id or create specific exercises
                      audio_url: file_url,
                      score: result.score,
                      feedback: result.feedback,
                      analysis_details: {
                          rhythm: result.rhythm,
                          tone: result.tone,
                          breathing: result.breathing,
                          type: activeTab
                      }
                  });
              }
          }
          setProgress(100);
      } catch (e) {
          console.error(e);
          let errorMessage = e.message;
          if (errorMessage.includes("limit of integrations") || errorMessage.includes("upgrade your plan")) {
             errorMessage = "عذراً، وصل النظام إلى الحد الأقصى للاستخدام الشهري. يرجى إبلاغ المعلم.";
          } else if (errorMessage.includes("quota")) {
             errorMessage = "عذراً، تم تجاوز حد استخدام الذكاء الاصطناعي. يرجى إبلاغ المعلم.";
          }
          alert(`خطأ: ${errorMessage}`);
      } finally {
          setIsAnalyzing(false);
      }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-cyan-50 p-6">
      <div className="max-w-4xl mx-auto">
        <div className="flex items-center gap-4 mb-8">
          <Link to={createPageUrl("StudentDashboard")}>
            <Button variant="outline" size="icon" className="rounded-full">
              <ArrowLeft className="w-4 h-4" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold arabic-text text-slate-800">
              ⚡ تدريب خاص ومبتكر
            </h1>
            <p className="text-slate-600 arabic-text">
              جرب أساليب جديدة لتحسين نطقك وأدائك الصوتي
            </p>
          </div>
        </div>

        <Tabs defaultValue="mirroring" onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-3 h-14 bg-white shadow-sm border">
            <TabsTrigger value="mirroring" className="text-lg arabic-text data-[state=active]:bg-blue-100 data-[state=active]:text-blue-700">
              <Activity className="w-5 h-5 ml-2" />
              مماثلة الصوت
            </TabsTrigger>
            <TabsTrigger value="breathing" className="text-lg arabic-text data-[state=active]:bg-green-100 data-[state=active]:text-green-700">
              <Wind className="w-5 h-5 ml-2" />
              تدريب التنفس
            </TabsTrigger>
            <TabsTrigger value="acting" className="text-lg arabic-text data-[state=active]:bg-purple-100 data-[state=active]:text-purple-700">
              <Drama className="w-5 h-5 ml-2" />
              مسرح القراءة
            </TabsTrigger>
          </TabsList>

          {/* Mirroring Mode */}
          <TabsContent value="mirroring">
            <Card className="border-0 shadow-lg bg-white/80">
              <CardHeader className="bg-gradient-to-r from-blue-500 to-cyan-500 text-white rounded-t-xl">
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Activity className="w-6 h-6" />
                  قلّد نغمة وإيقاع المعلم
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center space-y-8">
                <div className="bg-blue-50 p-6 rounded-2xl border-2 border-blue-200">
                  <p className="text-3xl font-bold text-blue-900 arabic-text leading-loose">
                    {mirrorText}
                  </p>
                </div>

                <div className="flex justify-center gap-4">
                  <Button 
                    onClick={() => speakText(mirrorText)}
                    disabled={isPlaying}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-8 py-6 rounded-xl text-lg arabic-text"
                  >
                    <Volume2 className="w-6 h-6 ml-2" />
                    {isPlaying ? "جاري الاستماع..." : "استمع للنمط"}
                  </Button>
                </div>

                {/* Mock Waveform */}
                <div className="h-24 bg-slate-100 rounded-xl flex items-center justify-center gap-1 overflow-hidden">
                   {[...Array(40)].map((_, i) => (
                      <motion.div 
                        key={i}
                        animate={{ height: isPlaying ? [10, Math.random() * 80, 10] : 10 }}
                        transition={{ duration: 0.2, repeat: Infinity, delay: i * 0.05 }}
                        className="w-2 bg-blue-400 rounded-full"
                        style={{ height: '10px' }}
                      />
                   ))}
                </div>

                <Button
                   onClick={isRecording ? stopRecording : startRecording}
                   disabled={isAnalyzing}
                   variant={isRecording ? "destructive" : "default"}
                   className="w-full py-8 text-xl rounded-2xl arabic-text"
                >
                   {isAnalyzing ? (
                       <>جاري التحليل... {progress}%</>
                   ) : (
                       <>
                           {isRecording ? <Square className="w-6 h-6 ml-2" /> : <Mic className="w-6 h-6 ml-2" />}
                           {isRecording ? "إيقاف وتحليل" : "سجّل محاولتك"}
                       </>
                   )}
                </Button>

                {feedback && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 p-6 rounded-xl border border-green-200 text-right">
                    <h3 className="font-bold text-green-800 text-xl mb-4 arabic-text">تحليل الأداء الصوتي:</h3>
                    <ul className="space-y-2 arabic-text text-green-700">
                       <li>🎵 <strong>الإيقاع:</strong> {feedback.rhythm}</li>
                       <li>🗣️ <strong>النبرة:</strong> {feedback.tone}</li>
                       <li>💯 <strong>التطابق:</strong> {feedback.score}%</li>
                    </ul>

                  </motion.div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Breathing Mode */}
          <TabsContent value="breathing">
             <Card className="border-0 shadow-lg bg-white/80">
              <CardHeader className="bg-gradient-to-r from-green-500 to-emerald-500 text-white rounded-t-xl">
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Wind className="w-6 h-6" />
                  مدرّب التوقف والتنفس
                </CardTitle>
              </CardHeader>
              <CardContent className="p-8 text-center space-y-8">
                 <p className="text-slate-600 arabic-text text-lg">
                    تتبع الإشارات البصرية للتنفس. خذ نفساً عند (...) واقرأ بهدوء.
                 </p>
                 
                 <div className="bg-green-50 p-8 rounded-2xl border-2 border-green-200 leading-loose text-2xl font-bold text-green-900 arabic-text">
                    {breathingText.split("...").map((part, idx) => (
                       <span key={idx}>
                          {part}
                          {idx < breathingText.split("...").length - 1 && (
                             <span className="mx-2 inline-flex items-center justify-center w-8 h-8 bg-green-200 text-green-700 rounded-full text-sm">
                                💨
                             </span>
                          )}
                       </span>
                    ))}
                 </div>

                 <motion.div 
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
                    className="w-32 h-32 bg-green-100 rounded-full mx-auto flex items-center justify-center border-4 border-green-300"
                 >
                    <span className="text-green-700 font-bold arabic-text">تنفس...</span>
                 </motion.div>

                 <Button
                   onClick={isRecording ? stopRecording : startRecording}
                   disabled={isAnalyzing}
                   variant={isRecording ? "destructive" : "default"}
                   className="w-full py-8 text-xl rounded-2xl arabic-text bg-green-600 hover:bg-green-700"
                >
                   {isAnalyzing ? (
                       <>جاري التحليل... {progress}%</>
                   ) : (
                       <>
                           {isRecording ? <Square className="w-6 h-6 ml-2" /> : <Mic className="w-6 h-6 ml-2" />}
                           {isRecording ? "إيقاف وإنهاء" : "ابدأ تمرين التنفس والقراءة"}
                       </>
                   )}
                </Button>
                
                {feedback && activeTab === 'breathing' && (
                  <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-green-50 p-6 rounded-xl border border-green-200 text-right mt-6">
                    <h3 className="font-bold text-green-800 text-xl mb-4 arabic-text">تحليل التنفس والقراءة:</h3>
                    <ul className="space-y-2 arabic-text text-green-700">
                       <li>💨 <strong>التنفس والوقفات:</strong> {feedback.breathing}</li>
                       <li>🗣️ <strong>النبرة:</strong> {feedback.tone}</li>
                       <li>💯 <strong>التقييم العام:</strong> {feedback.score}%</li>
                    </ul>

                  </motion.div>
                )}

              </CardContent>
             </Card>
          </TabsContent>

          {/* Acting Mode */}
          <TabsContent value="acting">
             <Card className="border-0 shadow-lg bg-white/80">
              <CardHeader className="bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-t-xl">
                <CardTitle className="arabic-text flex items-center gap-2">
                  <Drama className="w-6 h-6" />
                  مسرح القراءة (تفاعلي)
                </CardTitle>
              </CardHeader>
              <CardContent className="p-6 space-y-6">
                 <div className="flex justify-center gap-4 mb-6">
                    <p className="arabic-text text-lg font-bold">أنت تؤدي دور: <span className="text-purple-600">{userRole}</span></p>
                 </div>

                 <div className="space-y-4">
                    {roles.map((role, idx) => (
                       <div key={idx} className={`flex gap-4 ${role.name === userRole ? 'flex-row-reverse' : ''}`}>
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-white text-xs shadow-md ${role.name === userRole ? 'bg-purple-600' : 'bg-slate-400'}`}>
                             {role.name}
                          </div>
                          <div className={`flex-1 p-4 rounded-2xl arabic-text text-lg ${role.name === userRole ? 'bg-purple-50 border-2 border-purple-200 text-purple-900' : 'bg-slate-50 border border-slate-200 text-slate-700'}`}>
                             {role.text}
                             {role.name !== userRole && (
                                <Button 
                                  size="sm" 
                                  variant="ghost" 
                                  onClick={() => speakText(role.text)}
                                  className="mt-2 h-6 text-slate-400"
                                >
                                   <Volume2 className="w-4 h-4" />
                                </Button>
                             )}
                          </div>
                       </div>
                    ))}
                 </div>
                 
                 <div className="flex flex-col gap-4 pt-6 border-t">
                    <div className="flex justify-center gap-4">
                        <Button 
                            onClick={renewPlay}
                            variant="outline"
                            className="px-6 py-4 text-lg arabic-text"
                        >
                            <RefreshCw className="w-5 h-5 ml-2" />
                            مسرحية أخرى
                        </Button>
                    </div>

                    <Button
                        onClick={isRecording ? stopRecording : startRecording}
                        disabled={isAnalyzing}
                        className={`w-full py-8 text-xl rounded-2xl arabic-text ${isRecording ? 'bg-red-500 hover:bg-red-600' : 'bg-purple-600 hover:bg-purple-700'} text-white`}
                    >
                        {isAnalyzing ? (
                            <>جاري تحليل الأداء المسرحي... {progress}%</>
                        ) : (
                            <>
                                {isRecording ? <Square className="w-6 h-6 ml-2" /> : <Mic className="w-6 h-6 ml-2" />}
                                {isRecording ? "إنهاء المشهد" : "ابدأ تمثيل دورك وتسجيله"}
                            </>
                        )}
                    </Button>

                    {feedback && activeTab === 'acting' && (
                        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="bg-purple-50 p-6 rounded-xl border border-purple-200 text-right mt-6">
                            <h3 className="font-bold text-purple-800 text-xl mb-4 arabic-text">تقييم الأداء المسرحي:</h3>
                            <ul className="space-y-2 arabic-text text-purple-700">
                                <li>🎭 <strong>التعبير والنبرة:</strong> {feedback.tone}</li>
                                <li>🎵 <strong>الإيقاع:</strong> {feedback.rhythm}</li>
                                <li>🌟 <strong>تقمص الدور:</strong> {feedback.score}%</li>
                            </ul>
                            <p className="mt-4 text-purple-900 font-medium arabic-text">{feedback.feedback}</p>

                        </motion.div>
                    )}
                 </div>
              </CardContent>
             </Card>
          </TabsContent>

        </Tabs>
      </div>
    </div>
  );
}