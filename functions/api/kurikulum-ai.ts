/**
 * Cloudflare Pages Function for /api/kurikulum-ai
 * Supports POST, OPTIONS (CORS preflight), and safely handles all HTTP methods.
 * Reads GEMINI_API_KEY from context.env.GEMINI_API_KEY (Cloudflare Worker/Pages Secret).
 */

interface Env {
  GEMINI_API_KEY?: string;
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

function getGeminiApiKey(env?: Env): string | undefined {
  if (!env && typeof process === 'undefined') return undefined;
  const candidate =
    env?.GEMINI_API_KEY ||
    (env as any)?.gemini_api_key ||
    (env as any)?.VITE_GEMINI_API_KEY ||
    (typeof globalThis !== 'undefined' && (globalThis as any)?.GEMINI_API_KEY) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);

  if (typeof candidate === 'string') {
    const trimmed = candidate.trim();
    return trimmed.length > 0 ? trimmed : undefined;
  }
  return undefined;
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  const apiKey = getGeminiApiKey(env);
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error:
          'Secret GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker Secret / Environment. Silakan jalankan `wrangler secret put GEMINI_API_KEY` atau tambahkan di dashboard Cloudflare.',
        code: 'MISSING_API_KEY',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body request harus berupa JSON yang valid.', code: 'INVALID_JSON' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const topic = (body.topik || body.topic || '').toString().trim().slice(0, 300);
  const subject = (body.mataPelajaran || body.subject || 'Umum').toString().trim().slice(0, 100);
  const grade = (body.jenjangKelas || body.grade || 'SMP/SMA').toString().trim().slice(0, 100);

  if (!topic || topic.length < 2) {
    return new Response(
      JSON.stringify({ error: 'Topik atau materi pembelajaran wajib diisi (minimal 2 karakter).', code: 'INVALID_INPUT' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const systemInstruction = `Kamu adalah pakar kurikulum dan pengembang materi ajar Indonesia (Kurikulum Merdeka) serta perancang pembelajaran berdiferensiasi dan Deep Learning (Mindful, Meaningful, Joyful).
Rumuskan perencanaan kurikulum yang spesifik, kaya pedagogi, dan operasional untuk materi yang diminta.
Hasil harus berupa objek JSON murni yang sesuai dengan responseSchema yang ditentukan.`;

  const userPrompt = `Rumuskan perencanaan materi ajar berikut:
- Topik / Materi Pembelajaran: ${topic}
- Mata Pelajaran: ${subject}
- Jenjang / Kelas / Fase: ${grade}

Pastikan:
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

  const schema = {
    type: 'OBJECT',
    properties: {
      tujuanPembelajaran: { type: 'STRING' },
      indikatorBelajar: { type: 'STRING' },
      kemampuanAwal: { type: 'STRING' },
      pendekatan: { type: 'STRING' },
      karakterSiswa: { type: 'STRING' },
      konteksDekat: { type: 'STRING' },
      alurMateri: {
        type: 'ARRAY',
        items: { type: 'STRING' },
      },
      rekomendasiAktivitas: {
        type: 'ARRAY',
        items: { type: 'STRING' },
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
  };

  const callModel = async (model: string, timeoutMs: number) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), timeoutMs);

    try {
      const res = await fetch(endpoint, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'aistudio-build',
        },
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: systemInstruction }] },
          contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
          generationConfig: {
            temperature: 0.7,
            topP: 0.95,
            thinkingConfig: { thinkingLevel: 'LOW' },
            responseMimeType: 'application/json',
            responseSchema: schema,
          },
        }),
        signal: controller.signal,
      });
      return res;
    } finally {
      clearTimeout(timer);
    }
  };

  try {
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
    let res: Response | null = null;
    let lastErr: any;

    for (const m of candidateModels) {
      try {
        const attempt = await callModel(m, 6000);
        if (attempt.ok) {
          res = attempt;
          break;
        }
        if (attempt.status !== 503 && attempt.status !== 429) {
          res = attempt;
          break;
        }
      } catch (e) {
        lastErr = e;
      }
    }

    if (!res) {
      return new Response(
        JSON.stringify({
          error: `Layanan AI sedang mengalami lonjakan permintaan (${lastErr?.message || 'Upstream timeout'}). Silakan coba beberapa saat lagi.`,
          code: 'UPSTREAM_BUSY',
        }),
        { status: 503, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    if (!res.ok) {
      const errTxt = await res.text();
      return new Response(
        JSON.stringify({ error: `Gagal memanggil model Gemini (${res.status}): ${errTxt}`, code: 'UPSTREAM_ERROR' }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const data: any = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    const result = {
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

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Kesalahan jaringan saat menghubungi AI: ${err.message}`, code: 'NETWORK_ERROR' }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
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
