import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Initialize Google GenAI client (server-side only)
const getAiClient = () => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
};

// API: Check AI availability
app.get('/api/ai-status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({ available: hasKey });
});

// API: Autofill suggestions for a topic
app.post('/api/autofill-topic', async (req, res) => {
  try {
    const { topic, subject, grade } = req.body;
    if (!topic) {
      return res.status(400).json({ error: 'Topik harus diisi' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di secrets' });
    }

    const prompt = `Kamu adalah pakar kurikulum dan pengembang materi ajar Indonesia (Kurikulum Merdeka).
Berikan saran isian yang tepat, ringkas, dan berkualitas tinggi untuk perencanaan slide materi ajar berikut:
- Mata Pelajaran: ${subject || 'Umum'}
- Topik/Materi: ${topic}
- Jenjang/Kelas: ${grade || 'SMP/SMA'}

Berikan respons dalam format JSON valid dengan struktur:
{
  "cptpatp": "Rumusan Capaian Pembelajaran & Tujuan Pembelajaran yang spesifik dan operasional selaras Kurikulum Merdeka",
  "indikator": "3-4 indikator ketercapaian tujuan pembelajaran (IKTP) yang terukur",
  "pengetahuanAwal": "Prasyarat atau pemahaman dasar yang biasanya sudah dimiliki siswa",
  "pendekatan": "Pilihan pendekatan (mis. Deep Learning (mindful, meaningful, joyful) / PBL / PjBL / Inkuiri)",
  "karakterSiswa": "Karakter umum siswa di jenjang ini beserta tantangan belajar yang khas",
  "konteksDekat": "Konteks dunia nyata, lingkungan lokal siswa, atau profesi yang sangat relevan dengan topik ini",
  "aktivitasRekomendasi": ["studi kasus singkat", "think-pair-share", "latihan soal bertahap", "kuis interaktif"],
  "alurRekomendasi": [
    "Pembuka + pertanyaan pemantik",
    "Tujuan & alur belajar",
    "Apersepsi",
    "Input materi (konsep, contoh, istilah)",
    "Latihan bertahap (scaffolding)",
    "Aktivitas inti",
    "Asesmen",
    "Refleksi & tindak lanjut"
  ]
}
Hanya kembalikan JSON murni tanpa markdown wrapping bila memungkinkan.`;

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
      },
    });

    const text = response.text || '{}';
    const parsed = JSON.parse(text);
    return res.json(parsed);
  } catch (error: any) {
    console.error('Error autofilling topic:', error);
    return res.status(500).json({ error: error.message || 'Gagal menghasilkan saran otomatis' });
  }
});

// API: Generate slide draft / HTML using the complete prompt
app.post('/api/generate-slides', async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt) {
      return res.status(400).json({ error: 'Prompt induk tidak boleh kosong' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({ error: 'GEMINI_API_KEY belum dikonfigurasi di secrets' });
    }

    const response = await ai.models.generateContent({
      model: 'gemini-3.8-flash',
      contents: prompt,
      config: {
        systemInstruction: 'Kamu adalah desainer pembelajaran dan pengembang materi ajar berpengalaman sekaligus developer front-end. Ikuti aturan Bagian B-D dengan sangat disiplin, akurat, dan tanpa basa-basi.',
      },
    });

    const result = response.text || '';
    return res.json({ result });
  } catch (error: any) {
    console.error('Error executing prompt with Gemini:', error);
    return res.status(500).json({ error: error.message || 'Gagal memproses prompt dengan Gemini' });
  }
});

// Vite middleware in dev or static files in production
async function startServer() {
  const isProd = process.env.NODE_ENV === 'production';

  if (isProd) {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const { createServer } = await import('vite');
    const vite = await createServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(port, '0.0.0.0', () => {
    console.log(`🚀 Aplikasi Generator Prompt Slide berjalan di http://0.0.0.0:${port}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
