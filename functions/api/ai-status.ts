/**
 * Cloudflare Pages Function for /api/ai-status
 */
interface Env {
  GEMINI_API_KEY?: string;
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

export async function onRequestGet(context: { env: Env }) {
  const hasKey = Boolean(getGeminiApiKey(context.env));
  return new Response(JSON.stringify({ available: hasKey }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
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
        'Allow': 'GET, OPTIONS',
        ...CORS_HEADERS,
      },
    }
  );
}
