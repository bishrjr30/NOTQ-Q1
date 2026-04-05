// api/tts.js
import * as sdk from "microsoft-cognitiveservices-speech-sdk";

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { text } = req.body;

  if (!text) {
    return res.status(400).json({ error: 'Text is required' });
  }

  // إعدادات الاتصال بـ Azure
  // تأكد من وضع المفاتيح في ملف .env.local
  const speechConfig = sdk.SpeechConfig.fromSubscription(
    process.env.AZURE_SPEECH_KEY,
    process.env.AZURE_SPEECH_REGION
  );

  // اختيار صوت عربي ممتاز (سلمى: صوت إخباري واضح)
  speechConfig.speechSynthesisVoiceName = "ar-SA-ZariyahNeural"; 
  // خيارات أخرى ممتازة: "ar-EG-SalmaNeural", "ar-SA-HamedNeural"

  // إنشاء مُركب الكلام
  const synthesizer = new sdk.SpeechSynthesizer(speechConfig, null);

  try {
    // تحويل النص إلى صوت
    synthesizer.speakTextAsync(
      text,
      (result) => {
        if (result.reason === sdk.ResultReason.SynthesizingAudioCompleted) {
          // نجاح التحويل
          const audioData = result.audioData;
          
          // إرسال الملف الصوتي للمتصفح
          res.setHeader('Content-Type', 'audio/mpeg');
          res.status(200).send(Buffer.from(audioData));
        } else {
          console.error("Speech synthesis canceled, " + result.errorDetails);
          res.status(500).json({ error: 'TTS failed' });
        }
        synthesizer.close();
      },
      (err) => {
        console.error(err);
        synthesizer.close();
        res.status(500).json({ error: 'TTS error' });
      }
    );
  } catch (error) {
    console.error('Server Error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
}
