import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextRequest, NextResponse } from 'next/server';
import type { Database } from '@/lib/supabase/types';

interface CookieToSet {
  name: string;
  value: string;
  options: CookieOptions;
}

export async function POST(request: NextRequest) {
  try {
    const { email, password, applicantId, redirectTo } = await request.json();

    if (!email || !password) {
      return NextResponse.json(
        { error: 'Email and password are required' },
        { status: 400 }
      );
    }

    const cookieStore = await cookies();
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

    if (!supabaseUrl || !supabaseAnonKey) {
      return NextResponse.json(
        { error: 'Server configuration error' },
        { status: 500 }
      );
    }

    const supabase = createServerClient<Database>(supabaseUrl, supabaseAnonKey, {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: CookieToSet[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // Ignore errors from Server Component context
          }
        },
      },
    });

    // Create the auth account
    const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: redirectTo || undefined,
      },
    });

    if (signUpError) {
      // Check for rate limiting
      const isRateLimited = signUpError.message.toLowerCase().includes('rate') ||
        signUpError.message.toLowerCase().includes('too many') ||
        signUpError.status === 429;

      if (isRateLimited) {
        return NextResponse.json(
          {
            error: 'Too many signup attempts. Please wait a few minutes before trying again.',
            code: 'RATE_LIMITED'
          },
          { status: 429 }
        );
      }

      // Check for existing user
      if (signUpError.message.includes('already registered')) {
        return NextResponse.json(
          {
            error: 'An account with this email already exists. Please log in instead.',
            code: 'USER_EXISTS'
          },
          { status: 409 }
        );
      }

      return NextResponse.json(
        { error: signUpError.message },
        { status: 400 }
      );
    }

    // Check if user was created
    if (!signUpData.user) {
      return NextResponse.json(
        { error: 'Failed to create account. Please try again.' },
        { status: 500 }
      );
    }

    // Check if email confirmation is required (no session returned)
    // Also check for fake success (user already exists - identities will be empty)
    const emailConfirmationRequired = !signUpData.session;
    const userAlreadyExists = signUpData.user.identities?.length === 0;

    if (userAlreadyExists) {
      return NextResponse.json(
        {
          error: 'An account with this email already exists. Please log in instead.',
          code: 'USER_EXISTS'
        },
        { status: 409 }
      );
    }

    // If we have a session, link the applicant immediately
    if (signUpData.session && applicantId) {
      const { error: linkError } = await supabase.functions.invoke('link-applicant', {
        body: { applicantId },
      });

      if (linkError) {
        return NextResponse.json({
          success: true,
          user: signUpData.user,
          hasSession: true,
          warning: 'Account created but there was an issue linking your application. Please contact support.',
        });
      }
    }

    // Return success - indicate whether email confirmation is needed
    return NextResponse.json({
      success: true,
      user: signUpData.user,
      hasSession: !!signUpData.session,
      emailConfirmationRequired,
      applicantId: emailConfirmationRequired ? applicantId : undefined, // Pass back for later linking
    });

  } catch (error) {
    console.error('Signup error:', error);
    return NextResponse.json(
      { error: 'An unexpected error occurred. Please try again.' },
      { status: 500 }
    );
  }
}
