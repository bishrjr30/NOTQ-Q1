import React from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Volume2, AlertTriangle, RefreshCw, Play, Pause } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function AudioPlayerModal({ isOpen, onClose, audioUrl, studentName }) {
  const [error, setError] = React.useState(false);
  const [errorMessage, setErrorMessage] = React.useState('');
  const [isLoading, setIsLoading] = React.useState(true);
  const [isPlaying, setIsPlaying] = React.useState(false);
  const audioRef = React.useRef(null);

  React.useEffect(() => {
    if (isOpen) {
      setError(false);
      setErrorMessage('');
      setIsLoading(true);
      setIsPlaying(false);
    }
  }, [isOpen, audioUrl]);

  const handleAudioLoad = () => {
    setIsLoading(false);
    setError(false);
    setErrorMessage('');
  };

  const handleAudioError = (e) => {
    setIsLoading(false);
    setError(true);
    
    // تحسين معالجة الأخطاء
    let message = 'فشل في تحميل التسجيل الصوتي.';
    
    if (e && e.target && e.target.error) {
      const errorCode = e.target.error.code;
      switch(errorCode) {
        case 1:
          message = 'تم إيقاف تحميل الصوت من قبل المستخدم.';
          break;
        case 2:
          message = 'حدث خطأ في الشبكة أثناء تحميل الصوت.';
          break;
        case 3:
          message = 'فشل في فك تشفير الملف الصوتي.';
          break;
        case 4:
          message = 'تنسيق الملف الصوتي غير مدعوم.';
          break;
        default:
          message = 'حدث خطأ غير معروف أثناء تحميل الصوت.';
      }
    } else if (!audioUrl || audioUrl.trim() === '') {
      message = 'رابط الملف الصوتي غير صحيح أو فارغ.';
    } else if (!audioUrl.includes('http')) {
      message = 'رابط الملف الصوتي غير صحيح.';
    }
    
    setErrorMessage(message);
    console.error('Audio loading error details:', {
      error: e,
      audioUrl: audioUrl,
      errorCode: e?.target?.error?.code,
      errorMessage: e?.target?.error?.message
    });
  };

  const handlePlayPause = () => {
    if (audioRef.current) {
      if (isPlaying) {
        audioRef.current.pause();
      } else {
        audioRef.current.play().catch(handleAudioError);
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleAudioEnded = () => {
    setIsPlaying(false);
  };

  const retryLoad = () => {
    setError(false);
    setErrorMessage('');
    setIsLoading(true);
    if (audioRef.current) {
      audioRef.current.load();
    }
  };

  if (!isOpen) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[500px]" dir="rtl">
        <DialogHeader>
          <DialogTitle className="arabic-text flex items-center gap-2">
            <Volume2 className="text-blue-600" />
            الاستماع لتسجيل الطالب
          </DialogTitle>
          <DialogDescription className="arabic-text">
            التسجيل الصوتي للطالب: <strong>{studentName}</strong>
          </DialogDescription>
        </DialogHeader>
        
        <div className="py-4 space-y-4">
          {/* عرض معلومات الملف */}
          <div className="bg-gray-50 rounded-lg p-3">
            <p className="text-sm text-gray-600 arabic-text">
              <strong>رابط الملف:</strong> {audioUrl ? `${audioUrl.substring(0, 50)}...` : 'غير متوفر'}
            </p>
          </div>

          {isLoading && (
            <div className="text-center text-gray-500 arabic-text">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto mb-2"></div>
              جارٍ تحميل التسجيل...
            </div>
          )}
          
          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4">
              <div className="flex items-center justify-center mb-3">
                <AlertTriangle className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-red-600 arabic-text text-center mb-3">
                {errorMessage}
              </p>
              <div className="flex justify-center">
                <Button onClick={retryLoad} variant="outline" size="sm" className="arabic-text">
                  <RefreshCw className="w-4 h-4 ml-1" />
                  إعادة المحاولة
                </Button>
              </div>
            </div>
          )}
          
          {!error && (
            <div className="space-y-3">
              <audio 
                ref={audioRef}
                controls 
                className="w-full"
                onLoadedData={handleAudioLoad}
                onError={handleAudioError}
                onEnded={handleAudioEnded}
                preload="metadata"
                style={{ display: isLoading ? 'none' : 'block' }}
              >
                <source src={audioUrl} type="audio/webm" />
                <source src={audioUrl} type="audio/mp4" />
                <source src={audioUrl} type="audio/wav" />
                <source src={audioUrl} type="audio/ogg" />
                <source src={audioUrl} type="audio/mpeg" />
                متصفحك لا يدعم تشغيل الصوت.
              </audio>

              {/* أزرار تحكم إضافية */}
              {!isLoading && (
                <div className="flex justify-center gap-3">
                  <Button onClick={handlePlayPause} variant="outline" size="sm" className="arabic-text">
                    {isPlaying ? <Pause className="w-4 h-4 ml-1" /> : <Play className="w-4 h-4 ml-1" />}
                    {isPlaying ? 'إيقاف' : 'تشغيل'}
                  </Button>
                  <Button onClick={retryLoad} variant="outline" size="sm" className="arabic-text">
                    <RefreshCw className="w-4 h-4 ml-1" />
                    إعادة تحميل
                  </Button>
                </div>
              )}
            </div>
          )}

          {/* معلومات تقنية للتشخيص */}
          <details className="mt-4">
            <summary className="text-xs text-gray-500 cursor-pointer arabic-text">معلومات تقنية (للتشخيص)</summary>
            <div className="mt-2 p-2 bg-gray-50 rounded text-xs text-gray-600 space-y-1">
              <p><strong>رابط الملف:</strong> {audioUrl || 'غير متوفر'}</p>
              <p><strong>حالة التحميل:</strong> {isLoading ? 'جاري التحميل' : 'مكتمل'}</p>
              <p><strong>حالة الخطأ:</strong> {error ? 'يوجد خطأ' : 'طبيعي'}</p>
              <p><strong>رسالة الخطأ:</strong> {errorMessage || 'لا توجد أخطاء'}</p>
            </div>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}