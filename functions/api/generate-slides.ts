/**
 * Cloudflare Pages Function for /api/generate-slides
 *
 * Pemanggilan AI: Groq (GROQ_API_KEY) sebagai penyedia utama dengan Gemini
 * (GEMINI_API_KEY) sebagai cadangan, lewat lib/ai-provider.ts.
 * Atur urutan penyedia dengan variabel AI_PROVIDER = auto | groq | gemini.
 */

import { AiError, generateText } from '../../lib/ai-provider';

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
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

function json(data: any, status = 200) {
  return new Response(JSON.stringify(data), {
    status,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;

  let body: any;
  try {
    body = await request.json();
  } catch {
    return json({ error: 'Body permintaan tidak valid (JSON).' }, 400);
  }

  const prompt = (body?.prompt || '').toString().trim();
  if (!prompt) {
    return json({ error: 'Prompt induk tidak boleh kosong' }, 400);
  }

  const systemInstruction =
    'Kamu adalah desainer pembelajaran dan pengembang materi ajar berpengalaman sekaligus developer front-end. Ikuti aturan Bagian B-D dengan sangat disiplin, akurat, dan tanpa basa-basi.';

  try {
    const ai = await generateText(env, {
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

    return json({ result: ai.text, provider: ai.provider, model: ai.model, truncated: Boolean(ai.truncated) }, 200);
  } catch (err: any) {
    if (err instanceof AiError) {
      return json({ error: err.message, code: err.code, provider: err.provider }, err.status);
    }
    return json({ error: `Kesalahan jaringan saat memproses prompt: ${err?.message}` }, 500);
  }
}

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
