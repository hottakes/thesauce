import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * Link Applicant Edge Function
 *
 * Links an applicant record to an authenticated user account.
 * Requires verify_jwt = true in config.toml - Supabase validates the JWT
 * before this code runs, ensuring only authenticated users can call this function.
 */

serve(async (req) => {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req);

  try {
    const { applicantId } = await req.json();

    if (!applicantId) {
      return new Response(
        JSON.stringify({ error: 'Missing applicantId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // With verify_jwt = true, Supabase validates the JWT before reaching this code.
    // The Authorization header is guaranteed to contain a valid token at this point.
    const authHeader = req.headers.get('Authorization')!;

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use the validated JWT to get user info
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    // Defensive check - should not happen with verify_jwt = true
    if (userError || !user) {
      return new Response(
        JSON.stringify({ error: 'Authentication failed' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Use service role to update the applicant record (bypasses RLS)
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the applicant exists and email matches
    const { data: applicant, error: fetchError } = await adminClient
      .from('applicants')
      .select('id, email, user_id')
      .eq('id', applicantId)
      .single();

    if (fetchError || !applicant) {
      return new Response(
        JSON.stringify({ error: 'Applicant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify email matches for security - prevents linking to wrong user
    if (applicant.email?.toLowerCase() !== user.email?.toLowerCase()) {
      return new Response(
        JSON.stringify({ error: 'Email mismatch - cannot link applicant to different user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already linked (idempotent operation)
    if (applicant.user_id) {
      return new Response(
        JSON.stringify({ success: true, message: 'Already linked' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Update the applicant with the user_id
    const { error: updateError } = await adminClient
      .from('applicants')
      .update({ user_id: user.id })
      .eq('id', applicantId);

    if (updateError) {
      return new Response(
        JSON.stringify({ error: 'Failed to link applicant' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch {
    const corsHeaders = getCorsHeaders(req);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
