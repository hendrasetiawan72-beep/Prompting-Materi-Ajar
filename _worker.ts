/**
 * ==============================================================================
 * Cloudflare Worker Entrypoint (_worker.ts)
 * ==============================================================================
 * Dikonfigurasi sebagai Full Cloudflare Worker dengan Static Assets.
 *
 * Menangani routing API:
 *   - POST    /api/kurikulum-ai
 *   - POST    /api/autofill-topic (alias)
 *   - GET     /api/ai-status
 *   - GET     /api/debug-key (diagnostic status kunci Groq & Gemini)
 *   - OPTIONS (CORS preflight) untuk seluruh rute /api/*
 *
 * Fitur:
 *   1. Mencegah kebocoran method POST ke static asset handler (penyebab HTTP 405).
 *   2. Memanggil AI lewat lib/ai-provider.ts: Groq sebagai penyedia utama
 *      (GROQ_API_KEY) dengan Gemini sebagai cadangan (GEMINI_API_KEY).
 *      Atur urutan dengan variabel AI_PROVIDER = auto | groq | gemini.
 *   3. Menyediakan endpoint debug aman /api/debug-key tanpa membocorkan nilai rahasia.
 * ==============================================================================
 */

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

export interface Env {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AI_PROVIDER?: string;
  GROQ_MODEL?: string;
  GROQ_FALLBACK_MODEL?: string;
  GROQ_MAX_TOKENS?: string;
  GROQ_REASONING_EFFORT?: string;
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

// Helper: ubah AiError menjadi response JSON yang konsisten
function aiErrorResponse(err: unknown, fallbackMessage: string): Response {
  if (err instanceof AiError) {
    const extra: Record<string, string> = err.status === 429 ? { 'Retry-After': '30' } : {};
    return jsonResponse({ error: err.message, code: err.code, provider: err.provider }, err.status, extra);
  }
  const message = (err as any)?.message || fallbackMessage;
  return jsonResponse({ error: message, code: 'NETWORK_ERROR' }, 500);
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

  let body: any = {};
  try {
    body = await request.json();
  } catch {
    return jsonResponse({ error: 'Body permintaan harus berupa JSON yang valid.' }, 400);
  }

  // Frontend mengirim topik/mataPelajaran/jenjangKelas (beserta alias topic/subject/grade).
  const topik = body.topik || body.topic;
  const mataPelajaran = body.mataPelajaran || body.subject;
  const jenjang = body.jenjang || body.jenjangKelas || body.grade;
  const { durasi, jumlahSiswa, kebutuhanKhusus, targetAudience, pendekatan } = body;

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

  try {
    // Groq (utama) -> Gemini (cadangan), sesuai AI_PROVIDER dan API key yang tersedia
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

    // Normalisasi struktur output untuk kompatibilitas frontend penuh
    return jsonResponse(normalizeCurriculumResult(ai.json), 200, {
      'X-AI-Provider': ai.provider,
      'X-AI-Model': ai.model,
    });
  } catch (err: any) {
    return aiErrorResponse(err, 'Kesalahan jaringan saat memproses kurikulum dengan AI.');
  }
}

// Handler /api/debug-key (diagnostic ketersediaan secret tanpa membocorkan nilai)
function handleDebugKey(request: Request, env: Env): Response {
  const geminiKey = getGeminiApiKey(env);
  const groqKey = getGroqApiKey(env);
  const envKeys: string[] = [];

  if (env && typeof env === 'object') {
    for (const key of Object.keys(env)) {
      envKeys.push(key);
    }
  }

  return jsonResponse(
    {
      // Kompatibilitas lama: hasKey/keyLength merujuk ke GEMINI_API_KEY
      hasKey: Boolean(geminiKey),
      keyLength: geminiKey ? geminiKey.length : 0,
      hasGroqKey: Boolean(groqKey),
      groqKeyLength: groqKey ? groqKey.length : 0,
      hasGeminiKey: Boolean(geminiKey),
      geminiKeyLength: geminiKey ? geminiKey.length : 0,
      status: getAiStatus(env),
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

    // 3. Routing: /api/ai-status
    if (pathname === '/api/ai-status') {
      if (method !== 'GET') {
        return jsonResponse(
          { error: `Metode ${request.method} tidak diizinkan. Gunakan GET.`, code: 'METHOD_NOT_ALLOWED' },
          405,
          { Allow: 'GET, OPTIONS' }
        );
      }
      return jsonResponse(getAiStatus(env), 200);
    }

    // 4. Routing: /api/debug-key
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
