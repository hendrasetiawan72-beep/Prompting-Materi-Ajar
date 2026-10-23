/**
 * Cloudflare Pages Function for /api/ai-status
 * Melaporkan ketersediaan AI: penyedia utama (Groq/Gemini) dan cadangan.
 */

import { getAiStatus } from '../../lib/ai-provider';

interface Env {
  GROQ_API_KEY?: string;
  GEMINI_API_KEY?: string;
  AI_PROVIDER?: string;
  GROQ_MODEL?: string;
  GROQ_FALLBACK_MODEL?: string;
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
  return new Response(JSON.stringify(getAiStatus(context.env)), {
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
