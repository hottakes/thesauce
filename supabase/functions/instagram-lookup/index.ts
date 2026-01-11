import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { getCorsHeaders, handleCorsPreflightRequest } from "../_shared/cors.ts";

/**
 * Instagram Lookup Edge Function
 *
 * Fetches Instagram profile information for intake form validation.
 * This function is intentionally public (verify_jwt = false) because
 * it's called during the application process before users create accounts.
 */

interface InstagramProfile {
  username: string;
  profilePic: string | null;
  followers: number | null;
  verified: boolean;
  found: boolean;
}

// Initialize Supabase client with service role for storage operations
const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function downloadAndStoreProfilePic(imageUrl: string, username: string): Promise<string | null> {
  try {
    console.log(`Downloading profile picture for ${username} from Instagram CDN...`);
    
    // Fetch the image from Instagram's CDN
    const imageResponse = await fetch(imageUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
      },
    });

    if (!imageResponse.ok) {
      console.error(`Failed to download image: ${imageResponse.status}`);
      return null;
    }

    const imageBlob = await imageResponse.blob();
    const imageBuffer = await imageBlob.arrayBuffer();
    const imageBytes = new Uint8Array(imageBuffer);

    // Generate unique filename
    const filename = `${username}_${Date.now()}.jpg`;
    const storagePath = `instagram-profiles/${filename}`;

    console.log(`Uploading profile picture to Supabase Storage: ${storagePath}`);

    // Upload to Supabase Storage
    const { data, error } = await supabase.storage
      .from('instagram-profiles')
      .upload(filename, imageBytes, {
        contentType: 'image/jpeg',
        upsert: true,
      });

    if (error) {
      console.error('Storage upload error:', error);
      return null;
    }

    // Get the public URL
    const { data: urlData } = supabase.storage
      .from('instagram-profiles')
      .getPublicUrl(filename);

    console.log(`Profile picture stored successfully: ${urlData.publicUrl}`);
    return urlData.publicUrl;

  } catch (error) {
    console.error('Error downloading/storing profile picture:', error);
    return null;
  }
}

serve(async (req) => {
  // Handle CORS preflight requests
  const preflightResponse = handleCorsPreflightRequest(req);
  if (preflightResponse) return preflightResponse;

  const corsHeaders = getCorsHeaders(req);

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
    const response = await fetch(
      `https://www.instagram.com/api/v1/users/web_profile_info/?username=${encodeURIComponent(cleanUsername)}`,
      {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
          'Accept': 'application/json',
          'X-IG-App-ID': '936619743392459',
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
          found: true,
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

    // Get the original Instagram profile pic URL
    const instagramProfilePicUrl = user.profile_pic_url_hd || user.profile_pic_url || null;
    
    // Download and store the profile picture in Supabase Storage
    let storedProfilePicUrl: string | null = null;
    if (instagramProfilePicUrl) {
      storedProfilePicUrl = await downloadAndStoreProfilePic(instagramProfilePicUrl, cleanUsername);
    }

    const profile: InstagramProfile = {
      found: true,
      username: user.username || cleanUsername,
      profilePic: storedProfilePicUrl, // Use the permanent Supabase Storage URL
      followers: user.edge_followed_by?.count ?? null,
      verified: user.is_verified || false,
    };

    console.log(`Found profile for ${cleanUsername}: ${profile.followers} followers, verified: ${profile.verified}, profilePic stored: ${!!storedProfilePicUrl}`);

    return new Response(
      JSON.stringify(profile),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );

  } catch (error) {
    console.error('Error looking up Instagram profile:', error);
    return new Response(
      JSON.stringify({ 
        error: 'Failed to lookup profile',
        found: true,
        username: '',
        profilePic: null,
        followers: null,
        verified: false
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
