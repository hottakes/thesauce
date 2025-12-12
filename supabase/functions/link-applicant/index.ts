import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { applicantId } = await req.json();

    if (!applicantId) {
      console.error('Missing applicantId in request');
      return new Response(
        JSON.stringify({ error: 'Missing applicantId' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Get the user from the authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      console.error('Missing authorization header');
      return new Response(
        JSON.stringify({ error: 'Missing authorization header' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create a client with the user's JWT to get their user info
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseAnonKey = Deno.env.get('SUPABASE_ANON_KEY')!;
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;

    // Use the user's JWT to get their user ID
    const userClient = createClient(supabaseUrl, supabaseAnonKey, {
      global: { headers: { Authorization: authHeader } }
    });

    const { data: { user }, error: userError } = await userClient.auth.getUser();

    if (userError || !user) {
      console.error('Error getting user:', userError);
      return new Response(
        JSON.stringify({ error: 'Invalid or expired token' }),
        { status: 401, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Linking applicant ${applicantId} to user ${user.id} (${user.email})`);

    // Use service role to update the applicant record
    const adminClient = createClient(supabaseUrl, supabaseServiceKey);

    // Verify the applicant exists and email matches
    const { data: applicant, error: fetchError } = await adminClient
      .from('applicants')
      .select('id, email, user_id')
      .eq('id', applicantId)
      .single();

    if (fetchError || !applicant) {
      console.error('Applicant not found:', fetchError);
      return new Response(
        JSON.stringify({ error: 'Applicant not found' }),
        { status: 404, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Verify email matches for security
    if (applicant.email?.toLowerCase() !== user.email?.toLowerCase()) {
      console.error(`Email mismatch: applicant email ${applicant.email} vs user email ${user.email}`);
      return new Response(
        JSON.stringify({ error: 'Email mismatch - cannot link applicant to different user' }),
        { status: 403, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Check if already linked
    if (applicant.user_id) {
      console.log(`Applicant already linked to user ${applicant.user_id}`);
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
      console.error('Error updating applicant:', updateError);
      return new Response(
        JSON.stringify({ error: 'Failed to link applicant' }),
        { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Successfully linked applicant ${applicantId} to user ${user.id}`);

    return new Response(
      JSON.stringify({ success: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Unexpected error:', error);
    return new Response(
      JSON.stringify({ error: 'Internal server error' }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
