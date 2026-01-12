/**
 * Environment-aware CORS configuration for Supabase Edge Functions.
 *
 * IMPORTANT: ALLOWED_ORIGINS must be set in production!
 * Format: comma-separated list of origins
 * Example: "https://thesauce.app,https://www.thesauce.app"
 */

const DEFAULT_DEV_ORIGINS = [
  'http://localhost:3000',
  'http://127.0.0.1:3000',
];

// Check if we're running in Supabase Edge Functions (production)
function isProduction(): boolean {
  return !!Deno.env.get('DENO_DEPLOYMENT_ID');
}

export function getAllowedOrigins(): string[] {
  const envOrigins = Deno.env.get('ALLOWED_ORIGINS');

  if (envOrigins) {
    return envOrigins.split(',').map((o) => o.trim()).filter(Boolean);
  }

  // In production, require explicit ALLOWED_ORIGINS configuration
  // Returning empty array will reject all CORS requests
  if (isProduction()) {
    return [];
  }

  // Fallback for local development only
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
