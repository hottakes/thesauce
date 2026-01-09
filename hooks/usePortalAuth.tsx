'use client';

import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { Session, User, AuthChangeEvent } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase/client';
import { Tables } from '@/lib/supabase/types';
import { toast } from '@/hooks/use-toast';

type Applicant = Tables<'applicants'>;

interface PortalAuthContextType {
  session: Session | null;
  user: User | null;
  applicant: Applicant | null;
  isLoading: boolean;
  error: Error | null;
  signOut: () => Promise<void>;
  refetchApplicant: () => Promise<void>;
}

const PortalAuthContext = createContext<PortalAuthContextType | undefined>(undefined);

export const PortalAuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [session, setSession] = useState<Session | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [applicant, setApplicant] = useState<Applicant | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchApplicant = useCallback(async (userId: string) => {
    if (!supabase) return;
    try {
      setError(null);
      const { data, error: fetchError } = await supabase
        .from('applicants')
        .select('*')
        .eq('user_id', userId)
        .maybeSingle();

      if (fetchError) {
        setError(new Error(fetchError.message));
      }

      setApplicant(data);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Failed to fetch applicant'));
    } finally {
      setIsLoading(false);
    }
  }, []);

  const refetchApplicant = useCallback(async () => {
    if (user?.id) {
      await fetchApplicant(user.id);
    }
  }, [user?.id, fetchApplicant]);

  useEffect(() => {
    if (!supabase) return;

    // Set up auth state listener FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event: AuthChangeEvent, currentSession: Session | null) => {
        // Handle session expiry
        if (event === 'SIGNED_OUT' || event === 'TOKEN_REFRESHED' && !currentSession) {
          setSession(null);
          setUser(null);
          setApplicant(null);
          setIsLoading(false);

          // Show session expired message
          if (event === 'SIGNED_OUT' && session) {
            toast({
              title: 'Session expired',
              description: 'Your session has expired. Please sign in again.',
              variant: 'destructive',
            });
          }
          return;
        }

        setSession(currentSession);
        setUser(currentSession?.user ?? null);

        // Defer applicant fetch to avoid deadlock
        if (currentSession?.user) {
          setTimeout(() => {
            fetchApplicant(currentSession.user.id);
          }, 0);
        } else {
          setApplicant(null);
          setIsLoading(false);
        }
      }
    );

    // THEN check for existing session
    supabase.auth.getSession().then(({ data: { session: initialSession } }: { data: { session: Session | null } }) => {
      setSession(initialSession);
      setUser(initialSession?.user ?? null);

      if (initialSession?.user) {
        fetchApplicant(initialSession.user.id);
      } else {
        setIsLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [fetchApplicant]);

  const signOut = async () => {
    if (!supabase) return;
    try {
      await supabase.auth.signOut();
    } catch {
      // Errors handled by clearing state below
    } finally {
      // Always clear state regardless of errors
      setSession(null);
      setUser(null);
      setApplicant(null);
    }
  };

  return (
    <PortalAuthContext.Provider value={{ session, user, applicant, isLoading, error, signOut, refetchApplicant }}>
      {children}
    </PortalAuthContext.Provider>
  );
};

export const usePortalAuth = () => {
  const context = useContext(PortalAuthContext);
  if (context === undefined) {
    throw new Error('usePortalAuth must be used within a PortalAuthProvider');
  }
  return context;
};
