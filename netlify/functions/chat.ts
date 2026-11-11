/**
 * Thinkr AI Proxy — Netlify serverless function.
 *
 * This function is the ONLY place that touches API keys.
 * API keys are environment variables — they never reach the client bundle.
 *
 * Token budget (enforced client-side before calling here):
 *   System prompt  ≈  400 tokens
 *   Top 3-4 chunks ≈ 1200 tokens
 *   Last 4 turns   ≈  600 tokens
 *   Question       ≈  100 tokens
 *   TOTAL          ≈ 2300 tokens (well under free-tier limits)
 *
 * Flow:
 *   1. Try primary provider (Groq) — fast, generous free tier.
 *   2. On 429 / 5xx / timeout: exponential backoff then try fallback (OpenRouter).
 *   3. If both fail: return { error: 'both_failed' } with HTTP 503.
 *
 * Privacy: We log nothing about message content. Only errors are logged.
 */

import type { Handler, HandlerEvent } from '@netlify/functions'

// ── Types ────────────────────────────────────────────────────────────────

interface ChatMessage {
  role: 'system' | 'user' | 'assistant'
  content: string
}

interface RequestBody {
  messages: ChatMessage[]
  userApiKey?: string   // optional: student's own Groq key
  attempt?: number      // 0 = first try, 1+ = retry/fallback
}

// ── Provider configuration ───────────────────────────────────────────────

function getProviders(userApiKey?: string) {
  const primary = {
    name: 'groq',
    baseUrl: process.env.LLM_PRIMARY_BASE_URL ?? 'https://api.groq.com/openai/v1',
    apiKey: userApiKey || (process.env.LLM_PRIMARY_API_KEY ?? ''),
    model: process.env.LLM_PRIMARY_MODEL ?? 'llama-3.3-70b-versatile',
  }

  const fallback = {
    name: 'openrouter',
    baseUrl: process.env.LLM_FALLBACK_BASE_URL ?? 'https://openrouter.ai/api/v1',
    apiKey: process.env.LLM_FALLBACK_API_KEY ?? '',
    model: process.env.LLM_FALLBACK_MODEL ?? 'meta-llama/llama-3.1-8b-instruct:free',
  }

  return { primary, fallback }
}

// ── CORS headers ─────────────────────────────────────────────────────────

const CORS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

// ── Main handler ──────────────────────────────────────────────────────────

export const handler: Handler = async (event: HandlerEvent) => {
  // Handle CORS preflight
  if (event.httpMethod === 'OPTIONS') {
    return { statusCode: 204, headers: CORS, body: '' }
  }

  if (event.httpMethod !== 'POST') {
    return { statusCode: 405, headers: CORS, body: JSON.stringify({ error: 'Method not allowed' }) }
  }

  let body: RequestBody
  try {
    body = JSON.parse(event.body ?? '{}')
  } catch {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'Invalid JSON' }) }
  }

  if (!body.messages || !Array.isArray(body.messages)) {
    return { statusCode: 400, headers: CORS, body: JSON.stringify({ error: 'messages array required' }) }
  }

  const { primary, fallback } = getProviders(body.userApiKey)
  const attempt = body.attempt ?? 0

  // Choose provider based on attempt number
  const provider = attempt === 0 ? primary : fallback

  // If we're on the second attempt and already used fallback, give up
  if (attempt >= 2) {
    return {
      statusCode: 503,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'both_failed' }),
    }
  }

  try {
    const response = await callLLM(provider, body.messages)

    if (!response.ok) {
      // 429 = rate limit, 5xx = server error — both trigger fallback on client
      const errorText = await response.text().catch(() => '')
      console.error(`[thinkr-proxy] ${provider.name} returned ${response.status}: ${errorText.slice(0, 200)}`)

      return {
        statusCode: response.status,
        headers: { ...CORS, 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: `provider_error`, status: response.status }),
      }
    }

    // Stream SSE back to the client
    const sseBody = await response.text()
    return {
      statusCode: 200,
      headers: {
        ...CORS,
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache',
        'X-Provider': provider.name,
      },
      body: sseBody,
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err)
    console.error(`[thinkr-proxy] ${provider.name} error: ${message}`)

    return {
      statusCode: 500,
      headers: { ...CORS, 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'network_error' }),
    }
  }
}

// ── LLM call ─────────────────────────────────────────────────────────────

async function callLLM(
  provider: { baseUrl: string; apiKey: string; model: string },
  messages: ChatMessage[]
): Promise<Response> {
  const url = `${provider.baseUrl}/chat/completions`

  return fetch(url, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${provider.apiKey}`,
      // OpenRouter requires these headers
      'HTTP-Referer': 'https://thinkr.app',
      'X-Title': 'Thinkr AI Study Companion',
    },
    body: JSON.stringify({
      model: provider.model,
      messages,
      stream: true,
      max_tokens: 1024,
      temperature: 0.7,
    }),
  })
}
