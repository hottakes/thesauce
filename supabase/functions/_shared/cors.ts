/**
 * Environment-aware CORS configuration for Supabase Edge Functions.
 *
 * Reads ALLOWED_ORIGINS from environment, with fallback to development defaults.
 * Format: comma-separated list of origins
 * Example: "https://thesauce.app,https://www.thesauce.app"
 */

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

export function getAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');

  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  }

  // Fallback for local development
  return DEFAULT_DEV_ORIGINS;
}

export function getAllowedOrigin(requestOrigin?: string | null): string {
  const allowed = getAllowedOrigins();

  // If request origin is in allowed list, return it (enables CORS for that origin)
  if (requestOrigin && allowed.includes(requestOrigin)) {
    return requestOrigin;
  }

  // Return first allowed origin as default (for non-browser requests)
  return allowed[0] || '';
}

export function getCorsHeaders(req: Request): Record<string, string> {
  const origin = req.headers.get('Origin');

  return {
    'Access-Control-Allow-Origin': getAllowedOrigin(origin),
    'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Max-Age': '86400', // Cache preflight for 24 hours
  };
}

export function handleCorsPreflightRequest(req: Request): Response | null {
  if (req.method === 'OPTIONS') {
    return new Response(null, {
      status: 204,
      headers: getCorsHeaders(req),
    });
  }
  return null;
}
