// server.js
import express from 'express';
import cors from 'cors';
import gTTS from 'gtts';

const app = express();
const PORT = 3001; // سنستخدم المنفذ 3001 للسيرفر

// السماح للموقع بالاتصال بالسيرفر
app.use(cors());
app.use(express.json());

// نقطة الاتصال لتحويل النص إلى صوت
app.post('/api/tts', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send('Text required');

  console.log(`🎤 Generating audio for: ${text}`);

  try {
    // استخدام gTTS مع اللغة العربية
    const gtts = new gTTS(text, 'ar');
    
    // إرسال الملف مباشرة
    res.set('Content-Type', 'audio/mpeg');
    gtts.stream().pipe(res);
    
  } catch (err) {
    console.error(err);
    res.status(500).send('Error generating audio');
  }
});

app.listen(PORT, () => {
  console.log(`✅ TTS Server running at http://localhost:${PORT}`);
});
