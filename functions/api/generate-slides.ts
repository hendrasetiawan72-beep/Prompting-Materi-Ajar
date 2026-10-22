/**
 * Cloudflare Pages Function for /api/generate-slides
 */
interface Env {
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Max-Age': '86400',
};

export async function onRequestOptions() {
  return new Response(null, { status: 204, headers: CORS_HEADERS });
}

export async function onRequestPost(context: { request: Request; env: Env }) {
  const { request, env } = context;
  const apiKey = env.GEMINI_API_KEY || (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);

  if (!apiKey) {
    return new Response(
      JSON.stringify({
        error: 'Secret GEMINI_API_KEY belum dikonfigurasi di Cloudflare Worker Secret atau environment server.',
      }),
      { status: 503, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  let body: any;
  try {
    body = await request.json();
  } catch {
    return new Response(
      JSON.stringify({ error: 'Body permintaan tidak valid (JSON).' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  const prompt = body?.prompt;
  if (!prompt || typeof prompt !== 'string' || !prompt.trim()) {
    return new Response(
      JSON.stringify({ error: 'Prompt induk tidak boleh kosong' }),
      { status: 400, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }

  try {
    const endpoint = `https://generativelanguage.googleapis.com/v1beta/models/gemini-3.8-flash:generateContent?key=${encodeURIComponent(apiKey)}`;
    const response = await fetch(endpoint, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'User-Agent': 'aistudio-build',
      },
      body: JSON.stringify({
        systemInstruction: {
          parts: [
            {
              text: 'Kamu adalah desainer pembelajaran dan pengembang materi ajar berpengalaman sekaligus developer front-end. Ikuti aturan Bagian B-D dengan sangat disiplin, akurat, dan tanpa basa-basi.',
            },
          ],
        },
        contents: [
          {
            role: 'user',
            parts: [{ text: prompt }],
          },
        ],
        generationConfig: {
          thinkingConfig: {
            thinkingLevel: 'LOW',
          },
        },
      }),
    });

    if (!response.ok) {
      const errText = await response.text();
      return new Response(
        JSON.stringify({ error: `Gagal memproses prompt dengan Gemini AI (${response.status}): ${errText}` }),
        { status: 502, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
      );
    }

    const data: any = await response.json();
    const result = data?.candidates?.[0]?.content?.parts?.[0]?.text || '';
    return new Response(JSON.stringify({ result }), {
      status: 200,
      headers: { 'Content-Type': 'application/json', ...CORS_HEADERS },
    });
  } catch (err: any) {
    return new Response(
      JSON.stringify({ error: `Kesalahan jaringan saat memproses prompt: ${err.message}` }),
      { status: 500, headers: { 'Content-Type': 'application/json', ...CORS_HEADERS } }
    );
  }
}
