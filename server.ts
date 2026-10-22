import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type, ThinkingLevel } from '@google/genai';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const port = 3000;

app.use(express.json({ limit: '10mb' }));

// Safe CORS Middleware
app.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  next();
});

// Rate limiting map: 20 requests per minute per IP
const ipRequestWindow = new Map<string, { count: number; resetAt: number }>();
const rateLimitMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const ip = (req.headers['x-forwarded-for'] as string) || req.socket.remoteAddress || 'localhost';
  const now = Date.now();
  const entry = ipRequestWindow.get(ip);

  if (!entry || now > entry.resetAt) {
    ipRequestWindow.set(ip, { count: 1, resetAt: now + 60000 });
    return next();
  }

  if (entry.count >= 20) {
    return res.status(429).json({
      error: 'Terlalu banyak permintaan dalam waktu singkat (Rate Limit). Silakan tunggu 1 menit sebelum mencoba kembali.',
      code: 'RATE_LIMIT_EXCEEDED',
    });
  }

  entry.count += 1;
  next();
};

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

// Map error to human-friendly Indonesian message
function formatGeminiError(error: any) {
  const message = error?.message || '';
  const status = error?.status || error?.statusCode;

  if (status === 429 || message.includes('RESOURCE_EXHAUSTED') || message.toLowerCase().includes('quota')) {
    return {
      status: 429,
      error: 'Batas kuota harian atau frekuensi permintaan Gemini API telah tercapai (Rate Limit / Quota Exceeded). Silakan coba lagi beberapa saat kemudian.',
      code: 'QUOTA_EXHAUSTED',
    };
  }

  if (status === 400 || status === 403 || message.includes('API_KEY_INVALID')) {
    return {
      status: status || 403,
      error: 'Kunci GEMINI_API_KEY tidak valid atau izin ditolak. Pastikan Secret GEMINI_API_KEY sudah benar.',
      code: 'AUTH_ERROR',
    };
  }

  if (message.includes('fetch failed') || message.includes('ECONNREFUSED') || message.includes('ETIMEDOUT')) {
    return {
      status: 504,
      error: 'Gagal menghubungi server Gemini API karena kendala koneksi jaringan. Silakan periksa koneksi dan coba kembali.',
      code: 'NETWORK_ERROR',
    };
  }

  return {
    status: 502,
    error: `Gagal memproses permintaan dengan AI: ${message || 'Terjadi kesalahan pada layanan AI'}`,
    code: 'UPSTREAM_ERROR',
  };
}

// Handler for curriculum AI generation
async function handleCurriculumAi(req: Request, res: Response) {
  try {
    const { topik, topic, mataPelajaran, subject, jenjangKelas, grade } = req.body || {};
    const inputTopic = (topik || topic || '').toString().trim().slice(0, 300);
    const inputSubject = (mataPelajaran || subject || 'Umum').toString().trim().slice(0, 100);
    const inputGrade = (jenjangKelas || grade || 'SMP/SMA').toString().trim().slice(0, 100);

    if (!inputTopic || inputTopic.length < 2) {
      return res.status(400).json({
        error: 'Topik atau materi pembelajaran wajib diisi (minimal 2 karakter).',
        code: 'INVALID_INPUT',
      });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Secret GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker Secret atau environment server.',
        code: 'MISSING_API_KEY',
      });
    }

    const systemInstruction = `Kamu adalah pakar kurikulum dan pengembang materi ajar Indonesia (Kurikulum Merdeka) serta perancang pembelajaran berdiferensiasi dan Deep Learning (Mindful, Meaningful, Joyful).
Rumuskan perencanaan kurikulum yang spesifik, kaya pedagogi, dan operasional untuk materi yang diminta.
Hasil harus berupa objek JSON murni yang sesuai dengan responseSchema yang ditentukan.`;

    const userPrompt = `Rumuskan perencanaan materi ajar berikut:
- Topik / Materi Pembelajaran: ${inputTopic}
- Mata Pelajaran: ${inputSubject}
- Jenjang / Kelas / Fase: ${inputGrade}

Pastikan:
1. tujuanPembelajaran: rumusan CP & TP operasional selaras Kurikulum Merdeka
2. indikatorBelajar: 3-4 indikator ketercapaian tujuan pembelajaran (IKTP) konkret
3. kemampuanAwal: prasyarat atau pemahaman dasar siswa
4. pendekatan: pendekatan yang cocok (misalnya Deep Learning (mindful, meaningful, joyful) / PBL / PjBL / Inkuiri Terbimbing)
5. karakterSiswa: karakter umum siswa di jenjang ini beserta tantangan belajar yang khas
6. konteksDekat: konteks dunia nyata, lingkungan lokal siswa, atau analogi konkret yang sangat relevan
7. alurMateri: array 8 langkah alur pembelajaran berurutan:
   - Pembuka + pertanyaan pemantik
   - Tujuan & alur belajar
   - Apersepsi
   - Input materi (konsep, contoh, istilah)
   - Latihan bertahap (scaffolding)
   - Aktivitas inti
   - Asesmen
   - Refleksi & tindak lanjut
8. rekomendasiAktivitas: array 3-5 aktivitas yang cocok dari daftar:
   ["studi kasus singkat", "think-pair-share", "demonstrasi + latihan terbimbing", "latihan soal bertahap", "kuis interaktif", "diskusi kelompok", "simulasi/role play", "investigasi data/sumber", "proyek/produk"]`;

    const requestConfig = {
      systemInstruction,
      responseMimeType: 'application/json',
      thinkingConfig: {
        thinkingLevel: ThinkingLevel.LOW,
      },
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          tujuanPembelajaran: {
            type: Type.STRING,
            description: 'Rumusan Capaian Pembelajaran & Tujuan Pembelajaran operasional',
          },
          indikatorBelajar: {
            type: Type.STRING,
            description: '3-4 indikator ketercapaian tujuan pembelajaran terukur',
          },
          kemampuanAwal: {
            type: Type.STRING,
            description: 'Prasyarat dasar yang sudah dimiliki siswa',
          },
          pendekatan: {
            type: Type.STRING,
            description: 'Pendekatan pedagogis yang cocok',
          },
          karakterSiswa: {
            type: Type.STRING,
            description: 'Karakteristik dan tantangan siswa di jenjang ini',
          },
          konteksDekat: {
            type: Type.STRING,
            description: 'Konteks kehidupan nyata atau analogi relevan',
          },
          alurMateri: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: '8 langkah alur pembelajaran runtut',
          },
          rekomendasiAktivitas: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: 'Rekomendasi 3-5 nama aktivitas',
          },
        },
        required: [
          'tujuanPembelajaran',
          'indikatorBelajar',
          'kemampuanAwal',
          'pendekatan',
          'karakterSiswa',
          'konteksDekat',
          'alurMateri',
          'rekomendasiAktivitas',
        ],
      },
    };

    // Helper with fast timeout for resilient fallback
    const callWithTimeout = (model: string, timeoutMs: number) => {
      let timeoutHandle: any;
      const timeoutPromise = new Promise((_, reject) => {
        timeoutHandle = setTimeout(() => reject(new Error(`Timeout ${timeoutMs}ms`)), timeoutMs);
      });

      return Promise.race([
        ai.models.generateContent({
          model,
          contents: userPrompt,
          config: requestConfig,
        }),
        timeoutPromise,
      ]).finally(() => clearTimeout(timeoutHandle));
    };

    // Primary: gemini-3.8-flash (5s limit). Fallback: gemini-3.5-flash
    let response: any;
    try {
      response = await callWithTimeout('gemini-3.8-flash', 5000);
    } catch (err: any) {
      console.warn('gemini-3.8-flash busy/timeout, switching to gemini-3.5-flash:', err?.message || err);
      response = await callWithTimeout('gemini-3.5-flash', 15000);
    }

    const rawText = response.text || '{}';
    let parsed: any;
    try {
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      return res.status(502).json({
        error: 'Format data dari AI tidak valid. Silakan coba klik Buatkan Isian Otomatis lagi.',
        code: 'PARSE_ERROR',
      });
    }

    // Normalized response with full backward and forward compatibility
    const normalized = {
      tujuanPembelajaran: parsed.tujuanPembelajaran || '',
      cptpatp: parsed.tujuanPembelajaran || parsed.cptpatp || '',
      indikatorBelajar: parsed.indikatorBelajar || '',
      indikator: parsed.indikatorBelajar || parsed.indikator || '',
      kemampuanAwal: parsed.kemampuanAwal || '',
      pengetahuanAwal: parsed.kemampuanAwal || parsed.pengetahuanAwal || '',
      pendekatan: parsed.pendekatan || '',
      karakterSiswa: parsed.karakterSiswa || '',
      konteksDekat: parsed.konteksDekat || '',
      alurMateri: Array.isArray(parsed.alurMateri) ? parsed.alurMateri : [],
      alurRekomendasi: Array.isArray(parsed.alurMateri) ? parsed.alurMateri : (Array.isArray(parsed.alurRekomendasi) ? parsed.alurRekomendasi : []),
      rekomendasiAktivitas: Array.isArray(parsed.rekomendasiAktivitas) ? parsed.rekomendasiAktivitas : [],
      aktivitasRekomendasi: Array.isArray(parsed.rekomendasiAktivitas) ? parsed.rekomendasiAktivitas : (Array.isArray(parsed.aktivitasRekomendasi) ? parsed.aktivitasRekomendasi : []),
    };

    return res.json(normalized);
  } catch (error: any) {
    console.error('Error in handleCurriculumAi:', error);
    const { status, error: errorMsg, code } = formatGeminiError(error);
    return res.status(status).json({ error: errorMsg, code });
  }
}

// API: Check AI availability
app.get('/api/ai-status', (req, res) => {
  const hasKey = Boolean(process.env.GEMINI_API_KEY);
  res.json({ available: hasKey });
});

// API: Dedicated endpoint for /api/kurikulum-ai with rate limit & validation
app.post('/api/kurikulum-ai', rateLimitMiddleware, handleCurriculumAi);

// API: Alias /api/autofill-topic for backward compatibility
app.post('/api/autofill-topic', rateLimitMiddleware, handleCurriculumAi);

// API: Generate slide draft / HTML using the complete prompt
app.post('/api/generate-slides', rateLimitMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body;
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt induk tidak boleh kosong' });
    }

    const ai = getAiClient();
    if (!ai) {
      return res.status(503).json({
        error: 'Secret GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker Secret atau environment server.',
      });
    }

    const systemInstruction =
      'Kamu adalah desainer pembelajaran dan pengembang materi ajar berpengalaman sekaligus developer front-end. Ikuti aturan Bagian B-D dengan sangat disiplin, akurat, dan tanpa basa-basi.';

    let response: any;
    try {
      response = await Promise.race([
        ai.models.generateContent({
          model: 'gemini-3.8-flash',
          contents: prompt,
          config: {
            systemInstruction,
            thinkingConfig: { thinkingLevel: ThinkingLevel.LOW },
          },
        }),
        new Promise((_, reject) => setTimeout(() => reject(new Error('Timeout 6s')), 6000)),
      ]);
    } catch {
      response = await ai.models.generateContent({
        model: 'gemini-3.5-flash',
        contents: prompt,
        config: { systemInstruction },
      });
    }

    const result = response.text || '';
    return res.json({ result });
  } catch (error: any) {
    console.error('Error executing prompt with Gemini:', error);
    const { status, error: errorMsg } = formatGeminiError(error);
    return res.status(status).json({ error: errorMsg });
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
