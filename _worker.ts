/**
 * Cloudflare Worker (_worker.ts)
 * Advanced Worker entrypoint for Cloudflare Workers / Pages.
 * Handles API routes: /api/kurikulum-ai, /api/autofill-topic, /api/ai-status, /api/generate-slides
 * and falls back to static assets via env.ASSETS.
 */

import { onRequestPost as handleKurikulumAi, onRequestOptions as handleOptions } from './functions/api/kurikulum-ai';
import { onRequestPost as handleGenerateSlides } from './functions/api/generate-slides';
import { onRequestGet as handleAiStatus } from './functions/api/ai-status';

export interface Env {
  ASSETS?: { fetch: (request: Request) => Promise<Response> };
  GEMINI_API_KEY?: string;
  [key: string]: any;
}

export default {
  async fetch(request: Request, env: Env, ctx: any): Promise<Response> {
    const url = new URL(request.url);

    // OPTIONS preflight
    if (request.method === 'OPTIONS') {
      return handleOptions();
    }

    // Route: /api/kurikulum-ai or /api/autofill-topic
    if (url.pathname === '/api/kurikulum-ai' || url.pathname === '/api/autofill-topic') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return handleKurikulumAi({ request, env });
    }

    // Route: /api/generate-slides
    if (url.pathname === '/api/generate-slides') {
      if (request.method !== 'POST') {
        return new Response('Method Not Allowed', { status: 405 });
      }
      return handleGenerateSlides({ request, env });
    }

    // Route: /api/ai-status
    if (url.pathname === '/api/ai-status') {
      return handleAiStatus({ env });
    }

    // Fallback to static assets if running in Cloudflare Pages / Workers Sites
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Not Found', { status: 404 });
  },
};
