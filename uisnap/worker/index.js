/**
 * UISnap Gemini Proxy — Cloudflare Worker
 *
 * This worker proxies Gemini API requests from the UISnap Chrome extension.
 * Your API key is stored as a Worker Secret (never in code).
 *
 * Deploy steps:
 *   1. Go to https://workers.cloudflare.com → Create Worker
 *   2. Paste this entire file
 *   3. Save & Deploy
 *   4. Go to Settings → Variables → Add Secret:
 *        Name:  GEMINI_API_KEY
 *        Value: your actual Gemini API key
 *   5. Copy your worker URL (e.g. https://uisnap-proxy.yourname.workers.dev)
 *   6. Paste it into lib/gemini.ts as PROXY_URL
 */

const GEMINI_MODEL = "gemini-2.5-flash-preview-05-20"
const GEMINI_API_BASE = "https://generativelanguage.googleapis.com/v1beta/models"

const ALLOWED_ORIGIN_PATTERN = /^chrome-extension:\/\//

export default {
  async fetch(request, env) {
    // Handle CORS preflight
    if (request.method === "OPTIONS") {
      return new Response(null, {
        headers: {
          "Access-Control-Allow-Origin": "*",
          "Access-Control-Allow-Methods": "POST, OPTIONS",
          "Access-Control-Allow-Headers": "Content-Type",
          "Access-Control-Max-Age": "86400",
        },
      })
    }

    // Only allow POST
    if (request.method !== "POST") {
      return new Response(JSON.stringify({ error: "Method not allowed" }), {
        status: 405,
        headers: corsHeaders(),
      })
    }

    // Only accept requests from Chrome extensions
    const origin = request.headers.get("Origin") || ""
    if (origin && !ALLOWED_ORIGIN_PATTERN.test(origin)) {
      return new Response(JSON.stringify({ error: "Forbidden" }), {
        status: 403,
        headers: corsHeaders(),
      })
    }

    const apiKey = env.GEMINI_API_KEY
    if (!apiKey) {
      return new Response(JSON.stringify({ error: "API key not configured" }), {
        status: 500,
        headers: corsHeaders(),
      })
    }

    try {
      const body = await request.json()

      const geminiUrl = `${GEMINI_API_BASE}/${GEMINI_MODEL}:generateContent?key=${apiKey}`

      const geminiResponse = await fetch(geminiUrl, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      })

      const data = await geminiResponse.json()

      return new Response(JSON.stringify(data), {
        status: geminiResponse.status,
        headers: {
          "Content-Type": "application/json",
          ...corsHeaders(),
        },
      })
    } catch (err) {
      return new Response(JSON.stringify({ error: "Proxy error: " + String(err) }), {
        status: 500,
        headers: corsHeaders(),
      })
    }
  },
}

function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "POST, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type",
  }
}
