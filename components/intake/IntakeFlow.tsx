'use client';

import { useState, useEffect, useRef } from "react";
import { useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { AnimatedBackground } from "./AnimatedBackground";
import { StageWrapper } from "./StageWrapper";
import { LandingStage } from "./stages/LandingStage";
import { QualifierStage } from "./stages/QualifierStage";
import { ProfileBuilderStage } from "./stages/ProfileBuilderStage";
import { ResultCardStage } from "./stages/ResultCardStage";
import { AccountCreationStage } from "./stages/AccountCreationStage";
import { EmailVerificationPendingStage } from "./stages/EmailVerificationPendingStage";
import confetti from "canvas-confetti";
import { supabase } from "@/lib/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ApplicantData,
  generateReferralCode,
  calculateApplicantScore,
  scoreToWaitlistPosition,
} from "@/types/applicant";

type Stage = "landing" | "qualifier" | "profile" | "result" | "account" | "email-verification";

interface AmbassadorType {
  id: string;
  name: string;
  description: string;
  assignment_weight: number;
}

const getWeightedRandomAmbassadorType = (types: AmbassadorType[]): AmbassadorType => {
  const totalWeight = types.reduce((sum, t) => sum + t.assignment_weight, 0);
  let random = Math.random() * totalWeight;
  
  for (const type of types) {
    random -= type.assignment_weight;
    if (random <= 0) {
      return type;
    }
  }
  return types[0];
};

export const IntakeFlow = () => {
  const [stage, setStage] = useState<Stage>("landing");
  const [applicantData, setApplicantData] = useState<Partial<ApplicantData>>({
    points: 0,
  });
  const [selectedAmbassadorType, setSelectedAmbassadorType] = useState<AmbassadorType | null>(null);
  const [applicantId, setApplicantId] = useState<string | undefined>();
  const [isSaving, setIsSaving] = useState(false);
  const [isCreatingAccount, setIsCreatingAccount] = useState(false);
  const [isReady, setIsReady] = useState(false);
  const [verificationEmail, setVerificationEmail] = useState<string>('');
  const signupInProgressRef = useRef(false);
  const { toast } = useToast();
  const router = useRouter();

  // Sign out any existing session when starting the intake flow
  // This ensures a clean state for new applicants
  useEffect(() => {
    const clearSession = async () => {
      try {
        await supabase.auth.signOut();
      } catch {
        // Ignore sign-out errors - we still want to proceed with a clean state
      }
      setIsReady(true);
    };
    clearSession();
  }, []);

  const { data: ambassadorTypes, isLoading: ambassadorTypesLoading } = useQuery({
    queryKey: ["ambassador_types"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("ambassador_types")
        .select("id, name, description, assignment_weight")
        .eq("is_active", true);
      if (error) throw error;
      return data as AmbassadorType[];
    },
    enabled: isReady, // Only fetch after session is cleared
  });

  const handleQualifierComplete = (data: {
    school: string;
    is19Plus: boolean;
    firstName: string;
    lastName: string;
    email: string;
    instagramHandle: string;
    instagramProfilePic?: string | null;
    instagramFollowers?: number | null;
    instagramVerified?: boolean;
  }) => {
    setApplicantData((prev) => ({ ...prev, ...data }));
    setStage("profile");
  };

  const handleProfileComplete = async (data: {
    personalityTraits: string[];
    interests: string[];
    householdSize: number;
    sceneTypes: string[];
    sceneCustom: string;
    contentUploaded: boolean;
    contentUrls: string[];
    pitchUrl: string | null;
    pitchType: 'video' | 'audio' | null;
  }) => {
    if (!ambassadorTypes || ambassadorTypes.length === 0) {
      toast({
        title: "Loading...",
        description: "Please wait while we prepare your results.",
        variant: "destructive",
      });
      return;
    }

    setIsSaving(true);
    
    const ambassadorType = getWeightedRandomAmbassadorType(ambassadorTypes);
    setSelectedAmbassadorType(ambassadorType);
    const referralCode = generateReferralCode();
    
    // Calculate score and derive waitlist position
    const score = calculateApplicantScore({
      interests: data.interests,
      householdSize: data.householdSize,
      contentUploaded: data.contentUploaded,
    });
    const waitlistPosition = scoreToWaitlistPosition(score);

    // Generate UUID on client side to avoid needing SELECT after INSERT
    const generatedId = crypto.randomUUID();
    
    // Prepare complete applicant data
    const completeData = {
      id: generatedId, // Use client-generated ID
      school: applicantData.school!,
      is_19_plus: applicantData.is19Plus!,
      first_name: applicantData.firstName || null,
      last_name: applicantData.lastName || null,
      email: applicantData.email || null,
      instagram_handle: applicantData.instagramHandle!,
      instagram_profile_pic: applicantData.instagramProfilePic || null,
      instagram_followers: applicantData.instagramFollowers || null,
      instagram_verified: applicantData.instagramVerified || false,
      personality_traits: data.personalityTraits,
      interests: data.interests,
      household_size: data.householdSize,
      scene_types: data.sceneTypes,
      scene_custom: data.sceneCustom || null,
      content_uploaded: data.contentUploaded,
      content_urls: data.contentUrls,
      pitch_url: data.pitchUrl,
      pitch_type: data.pitchType,
      ambassador_type: ambassadorType.name,
      waitlist_position: waitlistPosition,
      referral_code: referralCode,
      points: score,
    };

    try {
      // Don't use .select() - just insert and use the client-generated ID
      const { error } = await supabase
        .from('applicants')
        // @ts-ignore - Supabase types infer never in strict mode
        .insert(completeData);

      if (error) {
        toast({
          title: "Oops!",
          description: "There was an issue saving your application. Please try again.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Store the applicant ID for account linking (using our client-generated ID)
      setApplicantId(generatedId);

      // Update local state and proceed
      setApplicantData((prev) => ({
        ...prev,
        ...data,
        ambassadorType: ambassadorType.name,
        referralCode,
        waitlistPosition,
        points: score,
      }));
      setStage("result");
    } catch {
      toast({
        title: "Connection Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsSaving(false);
    }
  };

  const handleAccountCreate = async (password: string) => {
    if (!applicantId || !applicantData.email) {
      toast({
        title: "Error",
        description: "Missing application data. Please try again.",
        variant: "destructive",
      });
      return;
    }

    // Prevent multiple concurrent signup attempts
    if (signupInProgressRef.current) {
      return;
    }
    signupInProgressRef.current = true;
    setIsCreatingAccount(true);

    const baseUrl = process.env.NEXT_PUBLIC_APP_URL ||
      (typeof window !== 'undefined' ? window.location.origin : '');

    // Retry logic with exponential backoff for rate limiting
    const maxRetries = 3;
    let lastError: string | null = null;

    for (let attempt = 0; attempt < maxRetries; attempt++) {
      try {
        // Use server-side API route for signup (better rate limit handling)
        const response = await fetch('/api/auth/signup', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            email: applicantData.email,
            password,
            applicantId,
            redirectTo: `${baseUrl}/portal`,
          }),
        });

        const result = await response.json();

        if (!response.ok) {
          // Check for rate limiting (429)
          if (response.status === 429 && attempt < maxRetries - 1) {
            // Wait with exponential backoff: 2s, 4s, 8s
            const waitTime = Math.pow(2, attempt + 1) * 1000;
            await new Promise(resolve => setTimeout(resolve, waitTime));
            continue;
          }

          // Handle specific error types
          if (response.status === 429 || result.code === 'RATE_LIMITED') {
            toast({
              title: "Too Many Attempts",
              description: "Please wait a few minutes before trying again. Supabase limits signup requests.",
              variant: "destructive",
            });
          } else if (response.status === 409 || result.code === 'USER_EXISTS') {
            toast({
              title: "Account Exists",
              description: "An account with this email already exists. Please log in to the portal instead.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Account Creation Failed",
              description: result.error || "Please try again.",
              variant: "destructive",
            });
          }
          signupInProgressRef.current = false;
          setIsCreatingAccount(false);
          return;
        }

        // Handle warning (account created but linking failed)
        if (result.warning) {
          toast({
            title: "Warning",
            description: result.warning,
            variant: "default",
          });
        }

        // Check if email confirmation is required
        if (result.emailConfirmationRequired) {
          setVerificationEmail(applicantData.email!);
          toast({
            title: "Almost there!",
            description: "Check your email to complete signup.",
          });
          setStage('email-verification');
          signupInProgressRef.current = false;
          setIsCreatingAccount(false);
          return;
        }

        // Refresh the client session to pick up the new session cookies
        await supabase.auth.getSession();

        // Fire celebratory confetti for immediate session
        const colors = ["#FF6B35", "#FF3366", "#FFD700", "#00FF88"];
        confetti({
          particleCount: 80,
          spread: 70,
          origin: { y: 0.6 },
          colors: colors,
        });

        toast({
          title: "Welcome to Sauce!",
          description: "Your account has been created successfully.",
        });

        // Navigate to portal
        router.replace('/portal');
        return;
      } catch (error) {
        lastError = (error as Error).message;
        // Retry on network errors
        if (attempt < maxRetries - 1) {
          const waitTime = Math.pow(2, attempt + 1) * 1000;
          await new Promise(resolve => setTimeout(resolve, waitTime));
          continue;
        }
      }
    }

    // All retries failed
    toast({
      title: "Connection Error",
      description: lastError || "Please check your internet connection and try again.",
      variant: "destructive",
    });
    signupInProgressRef.current = false;
    setIsCreatingAccount(false);
  };

  const handleResendEmail = async () => {
    const response = await fetch('/api/auth/resend-verification', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: verificationEmail }),
    });

    if (response.status === 429) {
      toast({
        title: "Please wait",
        description: "Too many requests. Try again in 60 seconds.",
        variant: "destructive",
      });
      throw new Error('Rate limited');
    }

    if (!response.ok) {
      const data = await response.json();
      toast({
        title: "Error",
        description: data.error || "Failed to resend email.",
        variant: "destructive",
      });
      throw new Error(data.error);
    }

    toast({
      title: "Email sent!",
      description: "Check your inbox.",
    });
  };

  const getResultCardData = () => ({
    instagramHandle: applicantData.instagramHandle || "user",
    householdSize: applicantData.householdSize || 1,
    personalityTraits: applicantData.personalityTraits || [],
    ambassadorType: selectedAmbassadorType 
      ? { name: selectedAmbassadorType.name, description: selectedAmbassadorType.description }
      : { name: "Ambassador", description: "Welcome to the Sauce crew!" },
  });

  return (
    <div className="relative min-h-screen">
      <AnimatedBackground />

      <StageWrapper stageKey={stage}>
        {stage === "landing" && (
          <LandingStage onStart={() => setStage("qualifier")} />
        )}
        {stage === "qualifier" && (
          <QualifierStage onComplete={handleQualifierComplete} />
        )}
        {stage === "profile" && (
          <ProfileBuilderStage 
            onComplete={handleProfileComplete} 
            isSaving={isSaving || ambassadorTypesLoading}
            applicantId={applicantId}
          />
        )}
        {stage === "result" && (
          <ResultCardStage
            data={getResultCardData()}
            onContinue={() => setStage("account")}
          />
        )}
        {stage === "account" && (
          <AccountCreationStage
            email={applicantData.email || ''}
            onComplete={handleAccountCreate}
            isCreating={isCreatingAccount}
          />
        )}
        {stage === "email-verification" && (
          <EmailVerificationPendingStage
            email={verificationEmail}
            onResendEmail={handleResendEmail}
            onBackToAccount={() => setStage('account')}
          />
        )}
      </StageWrapper>
    </div>
  );
};
