/**
 * Cloudflare Pages Function for /api/debug-key
 * Endpoint debug sementara untuk memeriksa ketersediaan GROQ_API_KEY dan GEMINI_API_KEY
 * tanpa membocorkan nilai key.
 */

import { getAiStatus, getGeminiApiKey, getGroqApiKey } from '../../lib/ai-provider';

interface Env {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AI_PROVIDER?: string;
  [key: string]: any;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
  'Access-Control-Max-Age': '86400',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { env: Env }) {
  const geminiKey = getGeminiApiKey(context.env);
  const groqKey = getGroqApiKey(context.env);
  const envKeys: string[] = [];
  if (context.env && typeof context.env === 'object') {
    envKeys.push(...Object.keys(context.env));
  }
  return new Response(
    JSON.stringify({
      // Kompatibilitas lama: hasKey/keyLength merujuk ke GEMINI_API_KEY
      hasKey: Boolean(geminiKey),
      keyLength: geminiKey ? geminiKey.length : 0,
      hasGroqKey: Boolean(groqKey),
      groqKeyLength: groqKey ? groqKey.length : 0,
      hasGeminiKey: Boolean(geminiKey),
      geminiKeyLength: geminiKey ? geminiKey.length : 0,
      status: getAiStatus(context.env),
      envKeys,
    }),
    {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    }
  );
}

export async function onRequest(context: { request: Request; env: Env }) {
  const method = context.request.method.toUpperCase();
  if (method === 'OPTIONS') {
    return onRequestOptions();
  }
  if (method === 'GET') {
    return onRequestGet(context);
  }
  return new Response(
    JSON.stringify({
      error: `Metode ${context.request.method} tidak diizinkan. Gunakan GET.`,
      code: 'METHOD_NOT_ALLOWED',
    }),
    {
      status: 405,
      headers: {
        'Content-Type': 'application/json',
        Allow: 'GET, OPTIONS',
        ...CORS_HEADERS,
      },
    }
  );
}
