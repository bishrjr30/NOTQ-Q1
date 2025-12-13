import React, { useState, useRef } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Mic, Square, Play, Send, Trash2 } from 'lucide-react';
import { UploadFile } from '@/api/integrations';
import { Recording } from '@/api/entities';

export default function AudioCommentModal({ isOpen, onClose, recording, onCommentSent }) {
  const [isRecording, setIsRecording] = useState(false);
  const [audioBlob, setAudioBlob] = useState(null);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isSending, setIsSending] = useState(false);
  
  const mediaRecorderRef = useRef(null);
  const audioChunksRef = useRef([]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      
      const supportedMimeTypes = ['audio/mp4', 'audio/wav', 'audio/webm;codecs=opus'];
      const supportedType = supportedMimeTypes.find(type => MediaRecorder.isTypeSupported(type));
      
      const options = supportedType ? { mimeType: supportedType } : {};
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
        setAudioBlob(blob);
        stream.getTracks().forEach(track => track.stop());
      };

      mediaRecorderRef.current.start();
      setIsRecording(true);
    } catch (error) {
      console.error('Error accessing microphone:', error);
      alert('لم يتمكن من الوصول للميكروفون.');
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  const playRecording = () => {
    if (audioBlob) {
      const url = URL.createObjectURL(audioBlob);
      const audio = new Audio(url);
      setIsPlaying(true);
      audio.play();
      audio.onended = () => setIsPlaying(false);
    }
  };

  const deleteRecording = () => {
    setAudioBlob(null);
  };

  const sendAudioComment = async () => {
    if (!audioBlob || !recording) return;

    setIsSending(true);
    try {
      const mimeType = audioBlob.type;
      const extension = mimeType.split('/')[1]?.split(';')[0] || 'webm';
      const file = new File([audioBlob], `teacher_comment.${extension}`, { type: mimeType });
      
      const { file_url } = await UploadFile({ file });
      
      await Recording.update(recording.id, { 
        teacher_audio_comment: file_url 
      });
      
      onCommentSent(recording.id, file_url, 'audio');
      onClose();
      setAudioBlob(null);
    } catch (error) {
      console.error("Failed to send audio comment:", error);
      if (error.message && error.message.includes('limit')) {
        alert("عذراً، لقد وصلت للحد الأقصى من الملفات المسموح بها هذا الشهر.");
      } else {
        alert("فشل إرسال التعليق الصوتي. يرجى المحاولة مرة أخرى.");
      }
    } finally {
      setIsSending(false);
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="arabic-text">إرسال تعليق صوتي</DialogTitle>
        </DialogHeader>
        
        <div className="py-6 space-y-6">
          {!audioBlob ? (
            <div className="text-center space-y-4">
              <div className="w-24 h-24 mx-auto">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  size="lg"
                  className={`w-full h-full rounded-full text-white shadow-lg transition-all duration-300 ${
                    isRecording
                      ? "bg-red-500 hover:bg-red-600 animate-pulse"
                      : "bg-blue-500 hover:bg-blue-600 hover:scale-105"
                  }`}
                >
                  {isRecording ? (
                    <Square className="w-8 h-8" />
                  ) : (
                    <Mic className="w-8 h-8" />
                  )}
                </Button>
              </div>
              <p className="text-lg font-medium text-slate-900 arabic-text">
                {isRecording ? "جارٍ التسجيل..." : "اضغط للبدء في تسجيل تعليقك"}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="bg-blue-50 rounded-lg p-4 text-center">
                <p className="text-blue-900 arabic-text mb-3">تم التسجيل بنجاح</p>
                <div className="flex justify-center gap-3">
                  <Button
                    onClick={playRecording}
                    disabled={isPlaying}
                    variant="outline"
                    size="sm"
                  >
                    <Play className="w-4 h-4 ml-1" />
                    {isPlaying ? "يتم التشغيل..." : "استمع"}
                  </Button>
                  <Button
                    onClick={deleteRecording}
                    variant="outline"
                    size="sm"
                  >
                    <Trash2 className="w-4 h-4 ml-1" />
                    حذف
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose} className="arabic-text">
            إلغاء
          </Button>
          {audioBlob && (
            <Button onClick={sendAudioComment} disabled={isSending} className="arabic-text">
              {isSending ? 'جارٍ الإرسال...' : <><Send className="w-4 h-4 ml-2" /> إرسال</>}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}