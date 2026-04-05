import express from 'express';
import cors from 'cors';
import gTTS from 'gtts';

const app = express();
const PORT = 3001;

app.use(cors());
app.use(express.json());

app.post('/api/tts', (req, res) => {
  const { text } = req.body;
  if (!text) return res.status(400).send('Text required');
  try {
    const gtts = new gTTS(text, 'ar');
    res.set('Content-Type', 'audio/mpeg');
    gtts.stream().pipe(res);
  } catch (err) {
    res.status(500).send('Error');
  }
});

app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
