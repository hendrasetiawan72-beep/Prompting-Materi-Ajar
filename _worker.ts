/**
 * ==============================================================================
 * Cloudflare Worker Entrypoint (_worker.ts)
 * ==============================================================================
 * Dikonfigurasi sebagai Full Cloudflare Worker dengan Static Assets.
 *
 * Menangani routing API:
 *   - POST    /api/kurikulum-ai
 *   - POST    /api/autofill-topic (alias)
 *   - POST    /api/generate-slides
 *   - GET     /api/ai-status
 *   - GET     /api/debug-key (diagnostic status kunci Gemini)
 *   - OPTIONS (CORS preflight) untuk seluruh rute /api/*
 *
 * Fitur:
 *   1. Mencegah kebocoran method POST ke static asset handler (penyebab HTTP 405).
 *   2. Membaca GEMINI_API_KEY dari Cloudflare Worker Secret (env.GEMINI_API_KEY),
 *      dengan fallback ke variasi penamaan dan process.env.
 *   3. Menyediakan endpoint debug aman /api/debug-key tanpa membocorkan nilai rahasia.
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

/**
 * Helper untuk mengambil GEMINI_API_KEY dari berbagai kemungkinan binding Cloudflare
 */
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

  const bodyPayload: any = {
    contents: [{ parts: [{ text: userPrompt }] }],
    systemInstruction: { parts: [{ text: systemInstruction }] },
    generationConfig: {},
  };

  if (responseSchema) {
    bodyPayload.generationConfig.responseMimeType = 'application/json';
    bodyPayload.generationConfig.responseSchema = responseSchema;
  }

  // Gunakan AbortController dengan timeout agresif
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(bodyPayload),
      signal: controller.signal,
    });
    return res;
  } finally {
    clearTimeout(timer);
  }
}

// Handler /api/kurikulum-ai dan /api/autofill-topic
async function handleCurriculumAi(request: Request, env: Env): Promise<Response> {
  const clientIp =
    request.headers.get('cf-connecting-ip') ||
    request.headers.get('x-forwarded-for') ||
    'anonymous';

  if (!checkRateLimit(clientIp)) {
    return jsonResponse(
      {
        error: 'Terlalu banyak permintaan AI dalam 1 menit. Mohon tunggu beberapa detik sebelum mencoba lagi.',
        code: 'RATE_LIMIT_EXCEEDED',
      },
      429,
      { 'Retry-After': '60' }
    );
  }

  const apiKey = getGeminiApiKey(env);
  if (!apiKey) {
    return jsonResponse(
      {
        error:
          'Secret GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker Secret. Buka Cloudflare Dashboard > Workers & Pages > prompting-materi-ajar > Settings > Variables and Secrets, atau jalankan `npx wrangler secret put GEMINI_API_KEY`.',
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

  const { jenjang, mataPelajaran, topik, durasi, jumlahSiswa, kebutuhanKhusus, targetAudience, pendekatan } = body;

  if (!topik || typeof topik !== 'string' || !topik.trim()) {
    return jsonResponse({ error: 'Parameter topik wajib diisi dan tidak boleh kosong.' }, 400);
  }

  const audienceText = targetAudience || jenjang || 'Siswa Sekolah';
  const pendekatanText = pendekatan || 'Kontekstual dan Interaktif';

  const systemInstruction = `Kamu adalah pakar kurikulum dan instruksional desain pendidikan Indonesia (Kurikulum Merdeka dan standar pembelajaran aktif modern).
Tugasmu adalah menganalisis mata pelajaran, jenjang, dan topik yang diberikan oleh guru, lalu menghasilkan panduan rancangan pembelajaran yang aplikatif, runtut, dan kaya konteks lokal/kehidupan nyata siswa.
Semua output wajib berbahasa Indonesia yang baik, lugas, profesional, dan langsung dapat dieksekusi di kelas.`;

  const userPrompt = `Rancang kerangka pembelajaran untuk:
- Mata Pelajaran: ${mataPelajaran || 'Umum'}
- Jenjang / Target Sasaran: ${audienceText}
- Topik Pembelajaran: ${topik}
- Estimasi Durasi: ${durasi || '2 x 45 menit'}
- Karakteristik / Kebutuhan Siswa: ${kebutuhanKhusus || jumlahSiswa ? `${jumlahSiswa || ''} siswa. ${kebutuhanKhusus || ''}` : 'Reguler/heterogen'}
- Pendekatan Utama: ${pendekatanText}

Berikan respons terstruktur dalam format JSON dengan spesifikasi properti berikut:
1. tujuanPembelajaran: Kalimat SMART tujuan pembelajaran spesifik untuk topik ini.
2. indikatorBelajar: 2-3 bukti konkret atau kriteria ketercapaian tujuan belajar (KKTP).
3. kemampuanAwal: Pengetahuan atau keterampilan prasyarat yang relevan.
4. pendekatan: Penjelasan ringkas penerapan pendekatan belajar aktif (${pendekatanText}).
5. karakterSiswa: Penyesuaian metode belajar berdasarkan profil murid.
6. konteksDekat: Contoh konkret/fenomena lokal di sekitar murid yang relevan dengan topik ini.
7. alurMateri: Array berisi 4 sampai 6 tahapan materi logis dan bertahap (dari pengenalan hingga penerapan).
8. rekomendasiAktivitas: Array berisi 2 sampai 4 aktivitas yang cocok dari daftar:
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
  const apiKey = getGeminiApiKey(env);
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

// Handler /api/debug-key (diagnostic ketersediaan secret tanpa membocorkan nilai)
function handleDebugKey(request: Request, env: Env): Response {
  const apiKey = getGeminiApiKey(env);
  const envKeys: string[] = [];

  if (env && typeof env === 'object') {
    for (const key of Object.keys(env)) {
      envKeys.push(key);
    }
  }

  return jsonResponse(
    {
      hasKey: Boolean(apiKey && apiKey.length > 0),
      keyLength: apiKey ? apiKey.length : 0,
      envKeys: envKeys,
    },
    200
  );
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
      const apiKey = getGeminiApiKey(env);
      return jsonResponse({ available: Boolean(apiKey) }, 200);
    }

    // 5. Routing: /api/debug-key
    if (pathname === '/api/debug-key') {
      if (method !== 'GET') {
        return jsonResponse(
          { error: `Metode ${request.method} tidak diizinkan. Gunakan GET.`, code: 'METHOD_NOT_ALLOWED' },
          405,
          { Allow: 'GET, OPTIONS' }
        );
      }
      return handleDebugKey(request, env);
    }

    // 6. Tangani seluruh rute /api/* yang tidak dikenal agar tidak bocor ke static assets
    if (pathname.startsWith('/api/')) {
      return jsonResponse(
        { error: `Endpoint API '${pathname}' tidak ditemukan.`, code: 'NOT_FOUND' },
        404
      );
    }

    // 7. Non-API: Layani file statis frontend via Cloudflare Workers Static Assets
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
