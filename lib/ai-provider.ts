/**
 * ==============================================================================
 * lib/ai-provider.ts
 * ==============================================================================
 * Modul bersama untuk pemanggilan AI di seluruh runtime aplikasi:
 *   - _worker.ts                  (Cloudflare Worker + Static Assets)
 *   - functions/api/*.ts          (Cloudflare Pages Functions)
 *   - server.ts                   (Express untuk dev lokal / AI Studio)
 *
 * Penyedia yang didukung:
 *   1. Groq   -> https://api.groq.com/openai/v1/chat/completions (OpenAI-compatible)
 *   2. Gemini -> https://generativelanguage.googleapis.com (REST generateContent)
 *
 * Urutan penyedia ditentukan oleh variabel AI_PROVIDER:
 *   - "auto"   (default) : Groq lebih dulu, lalu Gemini sebagai cadangan.
 *                          Penyedia tanpa API key otomatis dilewati.
 *   - "groq"             : hanya Groq.
 *   - "gemini"           : hanya Gemini (perilaku aplikasi sebelum Groq ditambahkan).
 *
 * Variabel lingkungan / secret yang dibaca:
 *   GROQ_API_KEY          API key Groq (https://console.groq.com/keys)
 *   GEMINI_API_KEY        API key Gemini (opsional bila Groq dipakai)
 *   AI_PROVIDER           auto | groq | gemini
 *   GROQ_MODEL            model utama Groq      (default: openai/gpt-oss-120b)
 *   GROQ_FALLBACK_MODEL   model cadangan Groq   (default: openai/gpt-oss-20b)
 *   GROQ_MAX_TOKENS       batas token keluaran  (default menyesuaikan jenis tugas)
 *   GROQ_REASONING_EFFORT low | medium | high   (default: low, khusus model gpt-oss)
 *
 * Catatan: modul ini hanya memakai fetch standar sehingga berjalan di Node 18+
 * maupun Cloudflare Workers tanpa dependensi tambahan.
 * ==============================================================================
 */

export interface AiEnv {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AI_PROVIDER?: string;
  GROQ_MODEL?: string;
  GROQ_FALLBACK_MODEL?: string;
  GROQ_MAX_TOKENS?: string;
  GROQ_REASONING_EFFORT?: string;
  [key: string]: any;
}

export type AiProviderName = 'groq' | 'gemini';

export const GROQ_CHAT_ENDPOINT = 'https://api.groq.com/openai/v1/chat/completions';

// Model Groq yang masih aktif per Oktober 2026. llama-3.3-70b-versatile dan
// llama-3.1-8b-instant sudah dihentikan Groq (16 Agustus 2026), jadi tidak dipakai.
export const DEFAULT_GROQ_MODEL = 'openai/gpt-oss-120b';
export const DEFAULT_GROQ_FALLBACK_MODEL = 'openai/gpt-oss-20b';

export interface GeminiAttempt {
  model: string;
  timeoutMs: number;
}

export const DEFAULT_GEMINI_ATTEMPTS: GeminiAttempt[] = [
  { model: 'gemini-3.8-flash', timeoutMs: 6000 },
  { model: 'gemini-3.5-flash', timeoutMs: 6000 },
  { model: 'gemini-flash-latest', timeoutMs: 6000 },
];

// ------------------------------------------------------------------------------
// Error terstruktur (pesan Bahasa Indonesia, siap ditampilkan ke pengguna)
// ------------------------------------------------------------------------------

export class AiError extends Error {
  status: number;
  code: string;
  provider?: AiProviderName;

  constructor(message: string, status: number, code: string, provider?: AiProviderName) {
    super(message);
    this.name = 'AiError';
    this.status = status;
    this.code = code;
    this.provider = provider;
  }
}

// ------------------------------------------------------------------------------
// Pembacaan konfigurasi
// ------------------------------------------------------------------------------

function cleanString(candidate: unknown): string | undefined {
  if (typeof candidate !== 'string') return undefined;
  const trimmed = candidate.trim();
  return trimmed.length > 0 ? trimmed : undefined;
}

function readProcessEnv(name: string): string | undefined {
  try {
    return typeof process !== 'undefined' ? cleanString(process.env?.[name]) : undefined;
  } catch {
    return undefined;
  }
}

function getSetting(env: AiEnv | undefined, name: string): string | undefined {
  return (
    cleanString(env?.[name]) ||
    cleanString((globalThis as any)?.[name]) ||
    readProcessEnv(name)
  );
}

export function getGroqApiKey(env?: AiEnv): string | undefined {
  return (
    cleanString(env?.GROQ_API_KEY) ||
    cleanString((env as any)?.groq_api_key) ||
    cleanString((globalThis as any)?.GROQ_API_KEY) ||
    readProcessEnv('GROQ_API_KEY')
  );
}

export function getGeminiApiKey(env?: AiEnv): string | undefined {
  return (
    cleanString(env?.GEMINI_API_KEY) ||
    cleanString((env as any)?.gemini_api_key) ||
    cleanString((env as any)?.VITE_GEMINI_API_KEY) ||
    cleanString((globalThis as any)?.GEMINI_API_KEY) ||
    readProcessEnv('GEMINI_API_KEY')
  );
}

function getProviderPreference(env?: AiEnv): 'auto' | 'groq' | 'gemini' {
  const pref = (getSetting(env, 'AI_PROVIDER') || 'auto').toLowerCase();
  return pref === 'groq' || pref === 'gemini' ? pref : 'auto';
}

/** Urutan penyedia yang akan dicoba (hanya yang punya API key). */
export function getProviderOrder(env?: AiEnv): AiProviderName[] {
  const pref = getProviderPreference(env);
  const hasGroq = Boolean(getGroqApiKey(env));
  const hasGemini = Boolean(getGeminiApiKey(env));
  const order: AiProviderName[] = [];

  if (pref === 'groq') {
    if (hasGroq) order.push('groq');
  } else if (pref === 'gemini') {
    if (hasGemini) order.push('gemini');
  } else {
    if (hasGroq) order.push('groq');
    if (hasGemini) order.push('gemini');
  }
  return order;
}

export function getGroqModels(env?: AiEnv): string[] {
  const primary = getSetting(env, 'GROQ_MODEL') || DEFAULT_GROQ_MODEL;
  const fallback = getSetting(env, 'GROQ_FALLBACK_MODEL') || DEFAULT_GROQ_FALLBACK_MODEL;
  return primary === fallback ? [primary] : [primary, fallback];
}

export function getAiStatus(env?: AiEnv) {
  const order = getProviderOrder(env);
  return {
    available: order.length > 0,
    provider: order[0] ?? null,
    fallbackProvider: order[1] ?? null,
    providers: {
      groq: Boolean(getGroqApiKey(env)),
      gemini: Boolean(getGeminiApiKey(env)),
    },
    groqModel: order.includes('groq') ? getGroqModels(env)[0] : null,
  };
}

function missingKeyError(env?: AiEnv): AiError {
  const pref = getProviderPreference(env);
  let message: string;
  if (pref === 'groq') {
    message =
      'Secret GROQ_API_KEY belum dikonfigurasi. Jalankan `npx wrangler secret put GROQ_API_KEY` atau tambahkan di Cloudflare Dashboard > Workers & Pages > Settings > Variables and Secrets (lokal: isi file .dev.vars / .env).';
  } else if (pref === 'gemini') {
    message =
      'Secret GEMINI_API_KEY belum dikonfigurasi. Jalankan `npx wrangler secret put GEMINI_API_KEY` atau tambahkan di Cloudflare Dashboard > Workers & Pages > Settings > Variables and Secrets (lokal: isi file .dev.vars / .env).';
  } else {
    message =
      'API key AI belum dikonfigurasi. Isi secret GROQ_API_KEY (disarankan) atau GEMINI_API_KEY: jalankan `npx wrangler secret put GROQ_API_KEY`, atau tambahkan di Cloudflare Dashboard > Workers & Pages > Settings > Variables and Secrets (lokal: isi file .dev.vars / .env).';
  }
  return new AiError(message, 503, 'MISSING_API_KEY');
}

// ------------------------------------------------------------------------------
// Utilitas JSON & skema
// ------------------------------------------------------------------------------

/** Membersihkan pagar kode ```json dan mem-parse JSON dari keluaran model. */
export function extractJson(raw: string): any {
  const cleaned = (raw || '')
    .replace(/^\s*```(?:json)?\s*/i, '')
    .replace(/\s*```\s*$/i, '')
    .trim();
  try {
    return JSON.parse(cleaned);
  } catch {
    const start = cleaned.indexOf('{');
    const end = cleaned.lastIndexOf('}');
    if (start !== -1 && end > start) {
      return JSON.parse(cleaned.slice(start, end + 1));
    }
    throw new Error('Keluaran model bukan JSON yang valid.');
  }
}

/**
 * Mengubah JSON Schema standar (huruf kecil, dipakai Groq) menjadi skema Gemini:
 * tipe diubah ke huruf besar dan properti yang tidak didukung Gemini dibuang.
 */
export function toGeminiSchema(schema: any): any {
  if (!schema || typeof schema !== 'object') return schema;
  const out: any = {};
  if (typeof schema.type === 'string') out.type = schema.type.toUpperCase();
  if (schema.description) out.description = schema.description;
  if (schema.enum) out.enum = schema.enum;
  if (schema.required) out.required = schema.required;
  if (schema.properties) {
    out.properties = {};
    for (const [key, value] of Object.entries(schema.properties)) {
      out.properties[key] = toGeminiSchema(value);
    }
  }
  if (schema.items) out.items = toGeminiSchema(schema.items);
  return out;
}

// Skema keluaran perencanaan kurikulum (dipakai /api/kurikulum-ai & /api/autofill-topic).
// Semua field wajib dan additionalProperties=false agar kompatibel dengan
// mode strict Groq (constrained decoding pada model gpt-oss).
export const CURRICULUM_SCHEMA_NAME = 'rencana_kurikulum';
export const CURRICULUM_JSON_SCHEMA = {
  type: 'object',
  properties: {
    tujuanPembelajaran: {
      type: 'string',
      description: 'Rumusan Capaian Pembelajaran & Tujuan Pembelajaran operasional',
    },
    indikatorBelajar: {
      type: 'string',
      description: 'Indikator ketercapaian tujuan pembelajaran yang terukur',
    },
    kemampuanAwal: {
      type: 'string',
      description: 'Prasyarat dasar yang sudah dimiliki siswa',
    },
    pendekatan: {
      type: 'string',
      description: 'Pendekatan pedagogis yang cocok',
    },
    karakterSiswa: {
      type: 'string',
      description: 'Karakteristik dan tantangan siswa di jenjang ini',
    },
    konteksDekat: {
      type: 'string',
      description: 'Konteks kehidupan nyata atau analogi yang relevan',
    },
    alurMateri: {
      type: 'array',
      items: { type: 'string' },
      description: 'Langkah alur pembelajaran yang runtut',
    },
    rekomendasiAktivitas: {
      type: 'array',
      items: { type: 'string' },
      description: 'Rekomendasi nama aktivitas',
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
  additionalProperties: false,
};

/** Normalisasi keluaran kurikulum agar kompatibel penuh dengan frontend. */
export function normalizeCurriculumResult(parsed: any) {
  const p = parsed || {};
  const alur = Array.isArray(p.alurMateri)
    ? p.alurMateri
    : Array.isArray(p.alurRekomendasi)
      ? p.alurRekomendasi
      : [];
  const aktivitas = Array.isArray(p.rekomendasiAktivitas)
    ? p.rekomendasiAktivitas
    : Array.isArray(p.aktivitasRekomendasi)
      ? p.aktivitasRekomendasi
      : [];

  return {
    tujuanPembelajaran: p.tujuanPembelajaran || '',
    cptpatp: p.tujuanPembelajaran || p.cptpatp || '',
    indikatorBelajar: p.indikatorBelajar || '',
    indikator: p.indikatorBelajar || p.indikator || '',
    kemampuanAwal: p.kemampuanAwal || '',
    pengetahuanAwal: p.kemampuanAwal || p.pengetahuanAwal || '',
    pendekatan: p.pendekatan || '',
    karakterSiswa: p.karakterSiswa || '',
    konteksDekat: p.konteksDekat || '',
    alurMateri: alur,
    alurRekomendasi: alur,
    rekomendasiAktivitas: aktivitas,
    aktivitasRekomendasi: aktivitas,
  };
}

// ------------------------------------------------------------------------------
// Permintaan & hasil generik
// ------------------------------------------------------------------------------

export interface GenerateRequest {
  systemInstruction: string;
  userPrompt: string;
  /** Bila diisi, keluaran dipaksa berupa JSON sesuai skema ini (JSON Schema huruf kecil). */
  jsonSchema?: { name: string; schema: Record<string, any> };
  temperature?: number;
  topP?: number;
  /** Timeout per percobaan model Groq (ms). Default 30000. */
  groqTimeoutMs?: number;
  /** Batas token keluaran Groq. Bisa ditimpa GROQ_MAX_TOKENS. Default 4096. */
  groqMaxTokens?: number;
  /** Daftar model Gemini + timeout untuk jalur cadangan. */
  geminiAttempts?: GeminiAttempt[];
}

export interface GenerateResult {
  text: string;
  /** Hasil parse JSON bila jsonSchema diminta. */
  json?: any;
  provider: AiProviderName;
  model: string;
}

interface RawOutput {
  text: string;
}

// ------------------------------------------------------------------------------
// Groq (OpenAI-compatible chat completions)
// ------------------------------------------------------------------------------

function isGptOssModel(model: string): boolean {
  return /(^|\/)gpt-oss-/i.test(model) && !/safeguard/i.test(model);
}

function buildGroqBody(model: string, req: GenerateRequest, env: AiEnv | undefined) {
  const envMax = Number.parseInt(getSetting(env, 'GROQ_MAX_TOKENS') || '', 10);
  const maxTokens = Number.isFinite(envMax) && envMax > 0 ? envMax : req.groqMaxTokens ?? 4096;

  const body: Record<string, any> = {
    model,
    messages: [
      { role: 'system', content: req.systemInstruction },
      { role: 'user', content: req.userPrompt },
    ],
    max_completion_tokens: maxTokens,
  };

  if (req.temperature !== undefined) body.temperature = req.temperature;
  if (req.topP !== undefined) body.top_p = req.topP;

  if (isGptOssModel(model)) {
    const effort = (getSetting(env, 'GROQ_REASONING_EFFORT') || 'low').toLowerCase();
    body.reasoning_effort = ['low', 'medium', 'high'].includes(effort) ? effort : 'low';
    body.include_reasoning = false;
  }

  if (req.jsonSchema) {
    if (isGptOssModel(model)) {
      // Structured Outputs strict: keluaran dijamin sesuai skema.
      body.response_format = {
        type: 'json_schema',
        json_schema: {
          name: req.jsonSchema.name,
          strict: true,
          schema: req.jsonSchema.schema,
        },
      };
    } else {
      // Model lain (mis. dipilih lewat GROQ_MODEL): mode JSON biasa.
      // Prompt pengguna sudah memuat kata "JSON" sebagaimana disyaratkan Groq.
      body.response_format = { type: 'json_object' };
    }
  }

  return body;
}

function mapGroqError(status: number, errBody: any, rawText: string): AiError {
  const code: string = errBody?.error?.code || '';
  const msg: string = errBody?.error?.message || rawText || `HTTP ${status}`;

  if (status === 401 || status === 403) {
    return new AiError(
      'GROQ_API_KEY tidak valid atau tidak memiliki izin. Periksa kembali secret GROQ_API_KEY.',
      status,
      'AUTH_ERROR',
      'groq'
    );
  }
  if (status === 413) {
    return new AiError(
      'Permintaan terlalu besar untuk batas token per menit Groq (plan Free untuk gpt-oss hanya 8K TPM). Upgrade ke Developer plan, kecilkan prompt, atau isi GEMINI_API_KEY sebagai cadangan.',
      413,
      'PAYLOAD_TOO_LARGE',
      'groq'
    );
  }
  if (status === 429) {
    return new AiError(
      'Batas kuota harian atau frekuensi permintaan Groq API telah tercapai (Rate Limit). Silakan coba lagi beberapa saat kemudian.',
      429,
      'QUOTA_EXHAUSTED',
      'groq'
    );
  }
  if (
    code === 'model_not_found' ||
    code === 'model_decommissioned' ||
    /decommission|does not exist|not found/i.test(msg)
  ) {
    return new AiError(
      `Model Groq tidak tersedia atau sudah dihentikan (${msg}). Perbarui GROQ_MODEL ke model aktif di console.groq.com/docs/models.`,
      status === 404 ? 404 : 400,
      'MODEL_UNAVAILABLE',
      'groq'
    );
  }
  if (status >= 500) {
    return new AiError(
      `Layanan Groq sedang sibuk atau bermasalah (${status}). Silakan coba lagi sesaat lagi.`,
      503,
      'UPSTREAM_BUSY',
      'groq'
    );
  }
  return new AiError(`Gagal memanggil model Groq (${status}): ${msg}`, 502, 'UPSTREAM_ERROR', 'groq');
}

async function callGroq(
  apiKey: string,
  model: string,
  req: GenerateRequest,
  env: AiEnv | undefined,
  timeoutMs: number
): Promise<RawOutput> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), timeoutMs);

  try {
    const res = await fetch(GROQ_CHAT_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${apiKey}`,
      },
      body: JSON.stringify(buildGroqBody(model, req, env)),
      signal: controller.signal,
    });

    if (!res.ok) {
      const rawText = await res.text();
      let errBody: any = {};
      try {
        errBody = JSON.parse(rawText);
      } catch {
        // abaikan: body bukan JSON
      }
      throw mapGroqError(res.status, errBody, rawText);
    }

    const data: any = await res.json();
    const choice = data?.choices?.[0];
    const text: string = choice?.message?.content || '';
    if (!text.trim()) {
      throw new AiError('Groq mengembalikan respons kosong.', 502, 'EMPTY_RESPONSE', 'groq');
    }
    return { text };
  } catch (err: any) {
    if (err instanceof AiError) throw err;
    if (err?.name === 'AbortError') {
      throw new AiError(
        `Groq tidak merespons dalam ${Math.round(timeoutMs / 1000)} detik.`,
        503,
        'UPSTREAM_BUSY',
        'groq'
      );
    }
    throw new AiError(
      `Gagal menghubungi server Groq: ${err?.message || 'koneksi gagal'}`,
      504,
      'NETWORK_ERROR',
      'groq'
    );
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------------------
// Gemini (REST generateContent)
// ------------------------------------------------------------------------------

function mapGeminiError(status: number, errBody: any, rawText: string): AiError {
  const msg: string = errBody?.error?.message || rawText || `HTTP ${status}`;

  if (status === 429 || msg.includes('RESOURCE_EXHAUSTED') || msg.toLowerCase().includes('quota')) {
    return new AiError(
      'Batas kuota harian atau frekuensi permintaan Gemini API telah tercapai (Quota / Rate Limit). Silakan coba lagi beberapa saat kemudian.',
      429,
      'QUOTA_EXHAUSTED',
      'gemini'
    );
  }
  if (status === 401 || status === 403 || msg.includes('API_KEY_INVALID')) {
    return new AiError(
      'Kunci GEMINI_API_KEY tidak valid atau izin ditolak. Pastikan Secret GEMINI_API_KEY sudah benar.',
      status === 401 ? 401 : 403,
      'AUTH_ERROR',
      'gemini'
    );
  }
  if (status === 503) {
    return new AiError(
      'Layanan Gemini sedang mengalami lonjakan permintaan. Silakan coba lagi sesaat lagi.',
      503,
      'UPSTREAM_BUSY',
      'gemini'
    );
  }
  return new AiError(`Gagal memanggil model Gemini (${status}): ${msg}`, 502, 'UPSTREAM_ERROR', 'gemini');
}

async function callGemini(
  apiKey: string,
  attempt: GeminiAttempt,
  req: GenerateRequest
): Promise<RawOutput> {
  const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/${attempt.model}:generateContent?key=${encodeURIComponent(apiKey)}`;

  const generationConfig: Record<string, any> = {
    thinkingConfig: { thinkingLevel: 'LOW' },
  };
  if (req.temperature !== undefined) generationConfig.temperature = req.temperature;
  if (req.topP !== undefined) generationConfig.topP = req.topP;
  if (req.jsonSchema) {
    generationConfig.responseMimeType = 'application/json';
    generationConfig.responseSchema = toGeminiSchema(req.jsonSchema.schema);
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), attempt.timeoutMs);

  try {
    const res = await fetch(endpoint, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        systemInstruction: { parts: [{ text: req.systemInstruction }] },
        contents: [{ role: 'user', parts: [{ text: req.userPrompt }] }],
        generationConfig,
      }),
      signal: controller.signal,
    });

    if (!res.ok) {
      const rawText = await res.text();
      let errBody: any = {};
      try {
        errBody = JSON.parse(rawText);
      } catch {
        // abaikan: body bukan JSON
      }
      throw mapGeminiError(res.status, errBody, rawText);
    }

    const data: any = await res.json();
    const candidate = data?.candidates?.[0];
    const parts: any[] = candidate?.content?.parts || [];
    const text = parts
      .filter((part) => !part?.thought)
      .map((part) => part?.text || '')
      .join('');
    if (!text.trim()) {
      throw new AiError('Gemini mengembalikan respons kosong.', 502, 'EMPTY_RESPONSE', 'gemini');
    }
    return { text };
  } catch (err: any) {
    if (err instanceof AiError) throw err;
    if (err?.name === 'AbortError') {
      throw new AiError(
        `Gemini tidak merespons dalam ${Math.round(attempt.timeoutMs / 1000)} detik.`,
        503,
        'UPSTREAM_BUSY',
        'gemini'
      );
    }
    throw new AiError(
      `Gagal menghubungi server Gemini: ${err?.message || 'koneksi gagal'}`,
      504,
      'NETWORK_ERROR',
      'gemini'
    );
  } finally {
    clearTimeout(timer);
  }
}

// ------------------------------------------------------------------------------
// Orkestrasi: coba setiap penyedia & model sesuai urutan, berhenti saat berhasil
// ------------------------------------------------------------------------------

function pickErrorToThrow(errors: AiError[]): AiError {
  const first = errors[0];
  const otherProviderError = errors.find((e) => e.provider && e.provider !== first.provider);
  if (!otherProviderError) return first;

  const label = otherProviderError.provider === 'groq' ? 'Groq' : 'Gemini';
  return new AiError(
    `${first.message} Penyedia cadangan (${label}) juga gagal: ${otherProviderError.message}`,
    first.status,
    first.code,
    first.provider
  );
}

export async function generateText(env: AiEnv | undefined, req: GenerateRequest): Promise<GenerateResult> {
  const order = getProviderOrder(env);
  if (order.length === 0) {
    throw missingKeyError(env);
  }

  const errors: AiError[] = [];

  for (const provider of order) {
    if (provider === 'groq') {
      const apiKey = getGroqApiKey(env)!;
      for (const model of getGroqModels(env)) {
        try {
          const out = await callGroq(apiKey, model, req, env, req.groqTimeoutMs ?? 30000);
          const result: GenerateResult = {
            text: out.text,
            provider: 'groq',
            model,
          };
          if (req.jsonSchema) {
            try {
              result.json = extractJson(out.text);
            } catch {
              throw new AiError(
                'Format data dari Groq tidak valid (bukan JSON).',
                502,
                'PARSE_ERROR',
                'groq'
              );
            }
          }
          return result;
        } catch (err: any) {
          const aiErr = err instanceof AiError ? err : new AiError(err?.message || 'Kesalahan tak dikenal', 500, 'UPSTREAM_ERROR', 'groq');
          errors.push(aiErr);
          console.warn(`[AI] groq/${model} gagal: ${aiErr.code} - ${aiErr.message}`);
          if (aiErr.code === 'AUTH_ERROR') break; // key salah: model lain pasti gagal juga
        }
      }
    } else {
      const apiKey = getGeminiApiKey(env)!;
      for (const attempt of req.geminiAttempts ?? DEFAULT_GEMINI_ATTEMPTS) {
        try {
          const out = await callGemini(apiKey, attempt, req);
          const result: GenerateResult = {
            text: out.text,
            provider: 'gemini',
            model: attempt.model,
          };
          if (req.jsonSchema) {
            try {
              result.json = extractJson(out.text);
            } catch {
              throw new AiError(
                'Format data dari Gemini tidak valid (bukan JSON).',
                502,
                'PARSE_ERROR',
                'gemini'
              );
            }
          }
          return result;
        } catch (err: any) {
          const aiErr = err instanceof AiError ? err : new AiError(err?.message || 'Kesalahan tak dikenal', 500, 'UPSTREAM_ERROR', 'gemini');
          errors.push(aiErr);
          console.warn(`[AI] gemini/${attempt.model} gagal: ${aiErr.code} - ${aiErr.message}`);
          if (aiErr.code === 'AUTH_ERROR') break;
        }
      }
    }
  }

  throw pickErrorToThrow(errors);
}
