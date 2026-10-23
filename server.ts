import express, { Request, Response, NextFunction } from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import {
  AiError,
  CURRICULUM_JSON_SCHEMA,
  CURRICULUM_SCHEMA_NAME,
  generateText,
  getAiStatus,
  getGeminiApiKey,
  getGroqApiKey,
  normalizeCurriculumResult,
} from './lib/ai-provider';

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

// Kirim AiError (atau error lain) sebagai response JSON yang konsisten
function sendAiError(res: Response, error: unknown, fallbackMessage: string) {
  if (error instanceof AiError) {
    if (error.status === 429) res.setHeader('Retry-After', '30');
    return res.status(error.status).json({ error: error.message, code: error.code, provider: error.provider });
  }
  return res.status(500).json({
    error: (error as any)?.message || fallbackMessage,
    code: 'NETWORK_ERROR',
  });
}

// Handler for curriculum AI generation (Groq utama, Gemini cadangan)
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

    const systemInstruction = `Kamu adalah pakar kurikulum dan pengembang materi ajar Indonesia (Kurikulum Merdeka) serta perancang pembelajaran berdiferensiasi dan Deep Learning (Mindful, Meaningful, Joyful).
Rumuskan perencanaan kurikulum yang spesifik, kaya pedagogi, dan operasional untuk materi yang diminta.
Hasil harus berupa objek JSON murni yang sesuai dengan skema yang ditentukan.`;

    const userPrompt = `Rumuskan perencanaan materi ajar berikut:
- Topik / Materi Pembelajaran: ${inputTopic}
- Mata Pelajaran: ${inputSubject}
- Jenjang / Kelas / Fase: ${inputGrade}

Balas hanya dengan satu objek JSON. Pastikan:
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

    const ai = await generateText(process.env, {
      systemInstruction,
      userPrompt,
      jsonSchema: { name: CURRICULUM_SCHEMA_NAME, schema: CURRICULUM_JSON_SCHEMA },
      temperature: 0.7,
      topP: 0.95,
      groqTimeoutMs: 20000,
      groqMaxTokens: 4096,
      geminiAttempts: [
        { model: 'gemini-3.8-flash', timeoutMs: 6000 },
        { model: 'gemini-3.5-flash', timeoutMs: 6000 },
        { model: 'gemini-flash-latest', timeoutMs: 6000 },
      ],
    });

    res.setHeader('X-AI-Provider', ai.provider);
    res.setHeader('X-AI-Model', ai.model);
    return res.json(normalizeCurriculumResult(ai.json));
  } catch (error: any) {
    console.error('Error in handleCurriculumAi:', error);
    return sendAiError(res, error, 'Terjadi kesalahan pada layanan AI');
  }
}

// API: Check AI availability (penyedia utama & cadangan)
app.get(['/api/ai-status', '/api/ai-status/'], (req, res) => {
  res.json(getAiStatus(process.env));
});

// API: Debug Key endpoint (safe, no secret leak)
app.get(['/api/debug-key', '/api/debug-key/'], (req, res) => {
  const geminiKey = getGeminiApiKey(process.env);
  const groqKey = getGroqApiKey(process.env);

  const envKeys = Object.keys(process.env).filter(
    (k) =>
      k.startsWith('GEMINI') ||
      k.startsWith('GROQ') ||
      k === 'AI_PROVIDER' ||
      k.startsWith('VITE_') ||
      k === 'NODE_ENV' ||
      k === 'PORT'
  );

  return res.json({
    // Kompatibilitas lama: hasKey/keyLength merujuk ke GEMINI_API_KEY
    hasKey: Boolean(geminiKey),
    keyLength: geminiKey ? geminiKey.length : 0,
    hasGroqKey: Boolean(groqKey),
    groqKeyLength: groqKey ? groqKey.length : 0,
    hasGeminiKey: Boolean(geminiKey),
    geminiKeyLength: geminiKey ? geminiKey.length : 0,
    status: getAiStatus(process.env),
    envKeys,
  });
});

// API: Dedicated endpoint for /api/kurikulum-ai with rate limit & validation
app.post(['/api/kurikulum-ai', '/api/kurikulum-ai/'], rateLimitMiddleware, handleCurriculumAi);
app.all(['/api/kurikulum-ai', '/api/kurikulum-ai/'], (req, res) => {
  res.status(405).setHeader('Allow', 'POST, OPTIONS').json({
    error: `Metode ${req.method} tidak diizinkan. Gunakan POST.`,
    code: 'METHOD_NOT_ALLOWED',
  });
});

// API: Alias /api/autofill-topic for backward compatibility
app.post(['/api/autofill-topic', '/api/autofill-topic/'], rateLimitMiddleware, handleCurriculumAi);
app.all(['/api/autofill-topic', '/api/autofill-topic/'], (req, res) => {
  res.status(405).setHeader('Allow', 'POST, OPTIONS').json({
    error: `Metode ${req.method} tidak diizinkan. Gunakan POST.`,
    code: 'METHOD_NOT_ALLOWED',
  });
});

// API: Generate slide draft / HTML using the complete prompt (Groq utama, Gemini cadangan)
app.post(['/api/generate-slides', '/api/generate-slides/'], rateLimitMiddleware, async (req, res) => {
  try {
    const { prompt } = req.body || {};
    if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
      return res.status(400).json({ error: 'Prompt induk tidak boleh kosong' });
    }

    const systemInstruction =
      'Kamu adalah desainer pembelajaran dan pengembang materi ajar berpengalaman sekaligus developer front-end. Ikuti aturan Bagian B-D dengan sangat disiplin, akurat, dan tanpa basa-basi.';

    const ai = await generateText(process.env, {
      systemInstruction,
      userPrompt: prompt,
      temperature: 0.6,
      groqTimeoutMs: 90000,
      groqMaxTokens: 16384,
      geminiAttempts: [
        { model: 'gemini-3.8-flash', timeoutMs: 6000 },
        { model: 'gemini-3.5-flash', timeoutMs: 20000 },
      ],
    });

    return res.json({
      result: ai.text,
      provider: ai.provider,
      model: ai.model,
      truncated: Boolean(ai.truncated),
    });
  } catch (error: any) {
    console.error('Error executing prompt with AI:', error);
    return sendAiError(res, error, 'Terjadi kesalahan pada layanan AI');
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
