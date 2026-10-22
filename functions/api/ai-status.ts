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
  'Access-Control-Allow-Headers': 'Content-Type',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestGet(context: { env: Env }) {
  const hasKey = Boolean(context.env.GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY));
  return new Response(JSON.stringify({ available: hasKey }), {
    status: 200,
    headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
  });
}
