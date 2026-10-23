/**
 * Cloudflare Pages Function for /api/kurikulum-ai
 * Supports POST, OPTIONS (CORS preflight), and safely handles all HTTP methods.
 *
 * Pemanggilan AI: Groq (GROQ_API_KEY) sebagai penyedia utama dengan Gemini
 * (GEMINI_API_KEY) sebagai cadangan, lewat lib/ai-provider.ts.
 * Atur urutan penyedia dengan variabel AI_PROVIDER = auto | groq | gemini.
 */

import {
  AiError,
  CURRICULUM_JSON_SCHEMA,
  CURRICULUM_SCHEMA_NAME,
  generateText,
  normalizeCurriculumResult,
} from '../../lib/ai-provider';

interface Env {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AI_PROVIDER?: string;
  GROQ_MODEL?: string;
  GROQ_FALLBACK_MODEL?: string;
  GROQ_MAX_TOKENS?: string;
  GROQ_REASONING_EFFORT?: string;
  [key: string]: any;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

function json(data: any, status = 200, extraHeaders: Record<string, string> = {}) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS, ...extraHeaders },
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body request harus berupa JSON yang valid.', code: 'INVALID_JSON' }, 400);
  }

  const topic = (body.topik || body.topic || '').toString().trim().slice(0, 300);
  const subject = (body.mataPelajaran || body.subject || 'Umum').toString().trim().slice(0, 100);
  const grade = (body.jenjangKelas || body.grade || 'SMP/SMA').toString().trim().slice(0, 100);

  if (!topic || topic.length < 2) {
    return json({ error: 'Topik atau materi pembelajaran wajib diisi (minimal 2 karakter).', code: 'INVALID_INPUT' }, 400);
  }

  const systemInstruction = `Kamu adalah pakar kurikulum dan pengembang materi ajar Indonesia (Kurikulum Merdeka) serta perancang pembelajaran berdiferensiasi dan Deep Learning (Mindful, Meaningful, Joyful).
Rumuskan perencanaan kurikulum yang spesifik, kaya pedagogi, dan operasional untuk materi yang diminta.
Hasil harus berupa objek JSON murni yang sesuai dengan skema yang ditentukan.`;

  const userPrompt = `Rumuskan perencanaan materi ajar berikut:
- Topik / Materi Pembelajaran: ${topic}
- Mata Pelajaran: ${subject}
- Jenjang / Kelas / Fase: ${grade}

Balas hanya dengan satu objek JSON. Pastikan:
1. "tujuanPembelajaran": rumusan CP & TP operasional selaras Kurikulum Merdeka
2. "indikatorBelajar": 3-4 indikator ketercapaian tujuan pembelajaran (IKTP) terukur
3. "kemampuanAwal": prasyarat atau pemahaman dasar siswa
4. "pendekatan": pendekatan yang cocok (misalnya Deep Learning (mindful, meaningful, joyful) / PBL / PjBL / Inkuiri Terbimbing)
5. "karakterSiswa": karakter umum siswa di jenjang ini beserta tantangan belajar yang khas
6. "konteksDekat": konteks dunia nyata, lingkungan lokal siswa, atau analogi konkret yang sangat relevan
7. "alurMateri": array 8 langkah alur pembelajaran berurutan:
   - Pembuka + pertanyaan pemantik
   - Tujuan & alur belajar
   - Apersepsi
   - Input materi (konsep, contoh, istilah)
   - Latihan bertahap (scaffolding)
   - Aktivitas inti
   - Asesmen
   - Refleksi & tindak lanjut
8. "rekomendasiAktivitas": array 3-5 aktivitas yang cocok dari daftar:
   ["studi kasus singkat", "think-pair-share", "demonstrasi + latihan terbimbing", "latihan soal bertahap", "kuis interaktif", "diskusi kelompok", "simulasi/role play", "investigasi data/sumber", "proyek/produk"]`;

  try {
    const ai = await generateText(env, {
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

    return json(normalizeCurriculumResult(ai.json), 200, {
      'X-AI-Provider': ai.provider,
      'X-AI-Model': ai.model,
    });
  } catch (err: any) {
    if (err instanceof AiError) {
      return json({ error: err.message, code: err.code, provider: err.provider }, err.status);
    }
    return json({ error: `Kesalahan jaringan saat menghubungi AI: ${err?.message}`, code: 'NETWORK_ERROR' }, 500);
  }
}

// Universal handler for Cloudflare Pages Functions
export async function onRequest(context: { request: Request; env: Env }) {
  const method = context.request.method.toUpperCase();
  if (method === 'OPTIONS') {
    return onRequestOptions();
  }
  if (method === 'POST') {
    return onRequestPost(context);
  }
  return new Response(
    JSON.stringify({
      error: `Metode ${context.request.method} tidak diizinkan. Gunakan POST.`,
      code: 'METHOD_NOT_ALLOWED',
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        'Allow': 'POST, OPTIONS',
        ...CORS_HEADERS,
      },
    }
  );
}
