/**
 * Cloudflare Pages Function / Worker Handler for /api/kurikulum-ai
 * Compatible with Cloudflare Workers runtime and Pages Functions.
 * Reads GEMINI_API_KEY from Cloudflare Worker Secrets (context.env.GEMINI_API_KEY).
 */

interface Env {
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

// In-memory rate limiting per IP for Worker edge instance (20 req / min)
const requestCounts = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const record = requestCounts.get(ip);
  if (!record || now > record.resetTime) {
    requestCounts.set(ip, { count: 1, resetTime: now + 60000 });
    return true;
  }
  if (record.count >= 20) {
    return false;
  }
  record.count += 1;
  return true;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function onRequestOptions() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  // Rate Limiting
  const clientIp = request.headers.get('cf-connecting-ip') || request.headers.get('x-forwarded-for') || 'global';
  if (!checkRateLimit(clientIp)) {
    return new Response(
      JSON.stringify({
        error: 'Terlalu banyak permintaan dalam waktu singkat (Rate Limit). Silakan tunggu 1 menit sebelum mencoba kembali.',
      }),
      { status: 429, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  // Get API key from Cloudflare Worker Secret
  const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'Secret GEMINI_API_KEY belum dikonfigurasi pada Cloudflare Worker Secrets atau environment server.',
        code: 'MISSING_API_KEY',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  // Parse & Validate Request Body
  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Format body request tidak valid (bukan JSON).' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const topic = (body.topik || body.topic || '').toString().trim().slice(0, 300);
  const subject = (body.mataPelajaran || body.subject || 'Umum').toString().trim().slice(0, 100);
  const grade = (body.jenjangKelas || body.grade || 'SMP/SMA').toString().trim().slice(0, 100);

  if (!topic || topic.length < 2) {
    return new Response(
      JSON.stringify({ error: 'Topik atau materi pembelajaran wajib diisi (minimal 2 karakter).' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const systemInstruction = `Kamu adalah pakar kurikulum dan pengembang materi ajar Indonesia (Kurikulum Merdeka) serta perancang pembelajaran berdiferensiasi dan Deep Learning (Mindful, Meaningful, Joyful).
Tugasmu adalah merumuskan perencanaan kurikulum yang spesifik, kaya pedagogi, dan operasional untuk materi yang diminta.
Hasil harus dalam format JSON murni yang sesuai dengan schema yang ditentukan.`;

  const userPrompt = `Rumuskan perencanaan materi ajar berikut:
- Topik / Materi Pembelajaran: ${topic}
- Mata Pelajaran: ${subject}
- Jenjang / Kelas / Fase: ${grade}

Format output JSON harus memiliki keys berikut:
1. "tujuanPembelajaran": Rumusan CP & TP yang spesifik, operasional selaras Kurikulum Merdeka
2. "indikatorBelajar": 3-4 indikator ketercapaian tujuan pembelajaran (IKTP) yang terukur
3. "kemampuanAwal": Prasyarat atau kompetensi awal yang biasanya sudah dimiliki siswa
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
8. "rekomendasiAktivitas": Array berisi 3-5 nama aktivitas dari daftar berikut yang paling cocok:
   ["studi kasus singkat", "think-pair-share", "demonstrasi + latihan terbimbing", "latihan soal bertahap", "kuis interaktif", "diskusi kelompok", "simulasi/role play", "investigasi data/sumber", "proyek/produk"]

Hanya kembalikan JSON valid tanpa teks pengantar atau penutup.`;

  const schemaConfig = {
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

  const executeGeminiCall = async (modelName: string) => {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${encodeURIComponent(apiKey)}`;
    const payload = {
      systemInstruction: { parts: [{ text: systemInstruction }] },
      contents: [{ role: 'user', parts: [{ text: userPrompt }] }],
      generationConfig: {
        responseMimeType: 'application/json',
        temperature: 0.7,
        topP: 0.95,
        thinkingConfig: { thinkingLevel: 'LOW' },
        responseSchema: schemaConfig,
      },
    };

    return fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'aistudio-build',
      },
      body: JSON.stringify(payload),
    });
  };

  try {
    // Primary: gemini-3.8-flash. Fallback if temporary 503 high demand spike: gemini-3.5-flash
    let response = await executeGeminiCall('gemini-3.8-flash');

    if (!response.ok && (response.status === 503 || response.status === 429)) {
      const errTxt = await response.clone().text().catch(() => '');
      if (response.status === 503 || errTxt.includes('high demand') || errTxt.includes('UNAVAILABLE')) {
        response = await executeGeminiCall('gemini-3.5-flash');
      }
    }

    if (!response.ok) {
      const errorText = await response.text();
      let parsedError: any = {};
      try {
        parsedError = JSON.parse(errorText);
      } catch {
        // ignore
      }

      const status = response.status;
      const errorMsg = parsedError?.error?.message || '';

      if (status === 429 || errorMsg.includes('RESOURCE_EXHAUSTED') || errorMsg.includes('quota')) {
        return new Response(
          JSON.stringify({
            error: 'Batas kuota harian atau frekuensi permintaan Gemini API telah tercapai (Quota / Rate Limit). Silakan coba lagi beberapa saat kemudian.',
            code: 'QUOTA_EXHAUSTED',
          }),
          { status: 429, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      if (status === 400 || status === 403) {
        return new Response(
          JSON.stringify({
            error: `Autentikasi Gemini API gagal atau kunci tidak valid (${parsedError?.error?.status || status}). Pastikan GEMINI_API_KEY benar.`,
            code: 'AUTH_ERROR',
          }),
          { status: status, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
        );
      }

      return new Response(
        JSON.stringify({
          error: `Gagal memanggil model Gemini (${status}): ${errorMsg || 'Terjadi kesalahan pada server AI.'}`,
          code: 'UPSTREAM_ERROR',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const data: any = await response.json();
    const rawText = data?.candidates?.[0]?.content?.parts?.[0]?.text || '{}';

    // Parse JSON
    let parsed: any;
    try {
      const cleanJson = rawText.replace(/^```json\s*/i, '').replace(/```\s*$/i, '').trim();
      parsed = JSON.parse(cleanJson);
    } catch {
      return new Response(
        JSON.stringify({
          error: 'Format data dari Gemini AI tidak dapat diproses. Silakan coba klik Buatkan Isian Otomatis lagi.',
          code: 'PARSE_ERROR',
        }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    // Normalize and alias fields to guarantee compatibility with existing code
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
      headers: {
        'Content-Type': 'application/json',
        ...CORS_HEADERS,
      },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({
        error: `Kesalahan jaringan saat menghubungi Gemini API: ${err.message || 'Koneksi gagal'}`,
        code: 'NETWORK_ERROR',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
}
