import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

interface InstagramProfile {
  username: string;
  profilePic: string | null;
  followers: number | null;
  verified: boolean;
  found: boolean;
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { username } = await req.json();
    
    if (!username) {
      return new Response(
        JSON.stringify({ error: 'Username is required' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Clean the username (remove @ if present)
    const cleanUsername = username.replace(/^@/, '').trim().toLowerCase();
    
    if (!cleanUsername || cleanUsername.length < 1) {
      return new Response(
        JSON.stringify({ error: 'Invalid username' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`Looking up Instagram profile for: ${cleanUsername}`);

    // Use Instagram's public web API to fetch profile data
    // This fetches the publicly available JSON data from Instagram
    const response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(cleanUsername)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'X-IG-App-ID': '936619743392459', // Instagram web app ID
        },
      }
    );

    if (!response.ok) {
      console.log(`Instagram API returned status: ${response.status}`);
      
      if (response.status === 404) {
        return new Response(
          JSON.stringify({ 
            found: false, 
            username: cleanUsername,
            profilePic: null,
            followers: null,
            verified: false
          } as InstagramProfile),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }
      
      // For rate limiting or other errors, return a soft failure
      return new Response(
        JSON.stringify({ 
          found: true, // Assume valid to not block user
          username: cleanUsername,
          profilePic: null,
          followers: null,
          verified: false,
          error: 'Could not verify profile at this time'
        }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const data = await response.json();
    const user = data?.data?.user;

    if (!user) {
      return new Response(
        JSON.stringify({ 
          found: false, 
          username: cleanUsername,
          profilePic: null,
          followers: null,
          verified: false
        } as InstagramProfile),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const profile: InstagramProfile = {
      found: true,
      username: user.username || cleanUsername,
      profilePic: user.profile_pic_url_hd || user.profile_pic_url || null,
      followers: user.edge_followed_by?.count ?? null,
      verified: user.is_verified || false,
    };

    console.log(`Found profile for ${cleanUsername}: ${profile.followers} followers, verified: ${profile.verified}`);

    return new Response(
      JSON.stringify(profile),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error looking up Instagram profile:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to lookup profile',
        found: true, // Don't block user on error
        username: '',
        profilePic: null,
        followers: null,
        verified: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
