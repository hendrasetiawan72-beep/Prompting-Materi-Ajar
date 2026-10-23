/**
 * ==============================================================================
 * Cloudflare Worker Entrypoint (_worker.ts)
 * ==============================================================================
 * Digunakan saat deploy via Cloudflare Workers (dengan Static Assets)
 * maupun Cloudflare Pages Advanced Mode.
 *
 * Menangani routing API:
 *   - POST    /api/kurikulum-ai
 *   - POST    /api/autofill-topic (alias)
 *   - POST    /api/generate-slides
 *   - GET     /api/ai-status
 *   - OPTIONS (CORS preflight) untuk seluruh rute /api/*
 *
 * Mencegah kebocoran request POST ke static asset handler yang menyebabkan HTTP 405.
 * Membaca GEMINI_API_KEY langsung dari env.GEMINI_API_KEY (Cloudflare Worker Secret).
 * ==============================================================================
 */

export interface Env {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

// Header CORS aman dan lengkap
const CORS_HEADERS: Record<string, string> = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

// Response helper untuk OPTIONS preflight
function handleCorsPreflight(): Response {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

// Response helper untuk JSON
function jsonResponse(data: any, status: number = 200, extraHeaders: Record<string, string> = {}): Response {
  return new Response(JSON.stringify(data), {
    status,
    headers: {
      'Content-Type': 'application/json',
      ...CORS_HEADERS,
      ...extraHeaders,
    },
  });
}

// In-memory rate limiting per instance Worker (20 req / menit per IP)
const ipRequestWindow = new Map<string, { count: number; resetAt: number }>();
function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const entry = ipRequestWindow.get(ip);
  if (!entry || now > entry.resetAt) {
    ipRequestWindow.set(ip, { count: 1, resetAt: now + 60000 });
    return true;
  }
  if (entry.count >= 20) {
    return false;
  }
  entry.count += 1;
  return true;
}

// Helper pemanggil REST Gemini API dengan timeout & fallback cepat
async function callGeminiApi(
  model: string,
  apiKey: string,
  systemInstruction: string,
  userPrompt: string,
  responseSchema?: any,
  timeoutMs: number = 6000
): Promise<Response> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const payload: any = {
    systemInstruction: {
      parts: [{ text: systemInstruction }],
    },
    contents: [
      {
        role: 'user',
        parts: [{ text: userPrompt }],
      },
    ],
    generationConfig: {
      temperature: 0.7,
      topP: 0.95,
      thinkingConfig: {
        thinkingLevel: 'LOW',
      },
    },
  };

  if (responseSchema) {
    payload.generationConfig.responseMimeType = 'application/json';
    payload.generationConfig.responseSchema = responseSchema;
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'aistudio-build',
      },
      body: JSON.stringify(payload),
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Handler utama /api/kurikulum-ai & /api/autofill-topic
async function handleCurriculumAi(request: Request, env: Env): Promise<Response> {
  // Rate limiting per IP
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'edge-client';
  if (!checkRateLimit(clientIp)) {
    return jsonResponse(
      {
        error: 'Terlalu banyak permintaan dalam waktu singkat (Rate Limit). Silakan tunggu 1 menit.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      429
    );
  }

  // Prioritaskan env.GEMINI_API_KEY dari Cloudflare Secrets
  const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          'Secret GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker Secret. Silakan jalankan `wrangler secret put GEMINI_API_KEY` atau atur di Cloudflare Dashboard.',
        code: 'MISSING_API_KEY',
      },
      503
    );
  }

  // Parse Body
  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Body permintaan harus berupa JSON yang valid.', code: 'INVALID_JSON' }, 400);
  }

  const inputTopic = (body.topik || body.topic || '').toString().trim().slice(0, 300);
  const inputSubject = (body.mataPelajaran || body.subject || 'Umum').toString().trim().slice(0, 100);
  const inputGrade = (body.jenjangKelas || body.grade || 'SMP/SMA').toString().trim().slice(0, 100);

  if (!inputTopic || inputTopic.length < 2) {
    return jsonResponse(
      { error: 'Topik atau materi pembelajaran wajib diisi (minimal 2 karakter).', code: 'INVALID_INPUT' },
      400
    );
  }

  const systemInstruction = `Kamu adalah pakar kurikulum dan pengembang materi ajar Indonesia (Kurikulum Merdeka) serta perancang pembelajaran berdiferensiasi dan Deep Learning (Mindful, Meaningful, Joyful).
Rumuskan perencanaan kurikulum yang spesifik, kaya pedagogi, dan operasional untuk materi yang diminta.
Hasil harus berupa objek JSON murni yang sesuai dengan schema yang ditentukan.`;

  const userPrompt = `Rumuskan perencanaan materi ajar berikut:
- Topik / Materi Pembelajaran: ${inputTopic}
- Mata Pelajaran: ${inputSubject}
- Jenjang / Kelas / Fase: ${inputGrade}

Pastikan data terstruktur mencakup:
1. "tujuanPembelajaran": Rumusan CP & TP operasional selaras Kurikulum Merdeka
2. "indikatorBelajar": 3-4 indikator ketercapaian tujuan pembelajaran (IKTP) terukur
3. "kemampuanAwal": Prasyarat atau kompetensi awal siswa
4. "pendekatan": Pendekatan pembelajaran yang cocok (misalnya Deep Learning (mindful, meaningful, joyful) / PBL / PjBL / Inkuiri Terbimbing)
5. "karakterSiswa": Karakter umum siswa di jenjang ini beserta tantangan belajar yang khas
6. "konteksDekat": Konteks dunia nyata, lingkungan lokal siswa, atau analogi konkret yang sangat relevan
7. "alurMateri": Array berisi 8 langkah alur pembelajaran yang runtut:
   - Pembuka + pertanyaan pemantik
   - Tujuan & alur belajar
   - Apersepsi
   - Input materi (konsep, contoh, istilah)
   - Latihan bertahap (scaffolding)
   - Aktivitas inti
   - Asesmen
   - Refleksi & tindak lanjut
8. "rekomendasiAktivitas": Array berisi 3-5 aktivitas yang cocok dari daftar:
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

  try {
    // Multi-model loop: coba gemini-3.8-flash, lalu gemini-3.5-flash, lalu gemini-flash-latest
    const candidateModels = ['gemini-3.8-flash', 'gemini-3.5-flash', 'gemini-flash-latest'];
    let res: Response | null = null;
    let lastErr: any;

    for (const m of candidateModels) {
      try {
        const attempt = await callGeminiApi(m, apiKey, systemInstruction, userPrompt, schema, 6000);
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
      return jsonResponse(
        {
          error: `Layanan AI sedang sibuk. Silakan coba kembali sesaat lagi (${lastErr?.message || 'Upstream timeout'}).`,
          code: 'UPSTREAM_BUSY',
        },
        503
      );
    }

    if (!res.ok) {
      const errTxt = await res.text();
      let parsedErr: any = {};
      try {
        parsedErr = JSON.parse(errTxt);
      } catch {
        // ignore
      }
      const msg = parsedErr?.error?.message || errTxt;
      if (res.status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.includes('quota')) {
        return jsonResponse(
          {
            error: 'Batas kuota harian atau frekuensi permintaan Gemini API telah tercapai (Quota / Rate Limit). Silakan coba lagi beberapa saat kemudian.',
            code: 'QUOTA_EXHAUSTED',
          },
          429
        );
      }
      return jsonResponse({ error: `Gagal memanggil model Gemini (${res.status}): ${msg}`, code: 'UPSTREAM_ERROR' }, 502);
    }

    const data: any = await res.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';
    const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
    const parsed = JSON.parse(cleanJson);

    // Normalisasi struktur output untuk kompatibilitas frontend penuh
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

    return jsonResponse(result, 200);
  } catch (err: any) {
    return jsonResponse(
      {
        error: `Kesalahan jaringan saat memproses kurikulum dengan AI: ${err.message || 'Koneksi gagal'}`,
        code: 'NETWORK_ERROR',
      },
      500
    );
  }
}

// Handler /api/generate-slides
async function handleGenerateSlides(request: Request, env: Env): Promise<Response> {
  const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
  if (!apiKey) {
    return jsonResponse(
      {
        error: 'Secret GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker Secret. Silakan set secret terlebih dahulu.',
        code: 'MISSING_API_KEY',
      },
      503
    );
  }

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Body permintaan harus berupa JSON yang valid.' }, 400);
  }

  const prompt = (body.prompt || '').toString().trim();
  if (!prompt) {
    return jsonResponse({ error: 'Prompt induk tidak boleh kosong.' }, 400);
  }

  const systemInstruction =
    'Kamu adalah desainer pembelajaran dan pengembang materi ajar berpengalaman sekaligus developer front-end. Ikuti aturan Bagian B-D dengan sangat disiplin, akurat, dan tanpa basa-basi.';

  try {
    let res: Response;
    try {
      res = await callGeminiApi('gemini-3.8-flash', apiKey, systemInstruction, prompt, undefined, 6000);
      if (!res.ok && (res.status === 503 || res.status === 429)) {
        throw new Error(`Upstream ${res.status}`);
      }
    } catch {
      res = await callGeminiApi('gemini-3.5-flash', apiKey, systemInstruction, prompt, undefined, 20000);
    }

    if (!res.ok) {
      const errTxt = await res.text();
      return jsonResponse({ error: `Gagal memproses prompt dengan Gemini (${res.status}): ${errTxt}` }, 502);
    }

    const data: any = await res.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return jsonResponse({ result }, 200);
  } catch (err: any) {
    return jsonResponse({ error: `Kesalahan koneksi saat memproses slide: ${err.message}` }, 500);
  }
}

// Router Utama Worker
export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);
    const method = request.method.toUpperCase();

    // Normalisasi pathname: hapus trailing slash (mis. /api/kurikulum-ai/ -> /api/kurikulum-ai)
    const pathname = url.pathname.replace(/\/+$/, '') || '/';

    // 1. CORS Preflight OPTIONS untuk semua endpoint
    if (method === 'OPTIONS') {
      return handleCorsPreflight();
    }

    // 2. Routing: /api/kurikulum-ai atau /api/autofill-topic
    if (pathname === '/api/kurikulum-ai' || pathname === '/api/autofill-topic') {
      if (method !== 'POST') {
        return jsonResponse(
          { error: `Metode ${request.method} tidak diizinkan. Gunakan POST.`, code: 'METHOD_NOT_ALLOWED' },
          405,
          { Allow: 'POST, OPTIONS' }
        );
      }
      return handleCurriculumAi(request, env);
    }

    // 3. Routing: /api/generate-slides
    if (pathname === '/api/generate-slides') {
      if (method !== 'POST') {
        return jsonResponse(
          { error: `Metode ${request.method} tidak diizinkan. Gunakan POST.`, code: 'METHOD_NOT_ALLOWED' },
          405,
          { Allow: 'POST, OPTIONS' }
        );
      }
      return handleGenerateSlides(request, env);
    }

    // 4. Routing: /api/ai-status
    if (pathname === '/api/ai-status') {
      if (method !== 'GET') {
        return jsonResponse(
          { error: `Metode ${request.method} tidak diizinkan. Gunakan GET.`, code: 'METHOD_NOT_ALLOWED' },
          405,
          { Allow: 'GET, OPTIONS' }
        );
      }
      const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' ? process.env?.GEMINI_API_KEY : undefined);
      return jsonResponse({ available: Boolean(apiKey) }, 200);
    }

    // 5. Tangani seluruh rute /api/* yang tidak dikenal agar tidak bocor ke static assets
    if (pathname.startsWith('/api/')) {
      return jsonResponse(
        { error: `Endpoint API '${pathname}' tidak ditemukan.`, code: 'NOT_FOUND' },
        404
      );
    }

    // 6. Non-API: Layani file statis frontend via Cloudflare Workers Static Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
