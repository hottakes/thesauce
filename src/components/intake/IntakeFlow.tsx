import { useState, useEffect } from "react";
import { useQuery } from "@tanstack/react-query";
import { useNavigate } from "react-router-dom";
import { AnimatedBackground } from "./AnimatedBackground";
import { StageWrapper } from "./StageWrapper";
import { LandingStage } from "./stages/LandingStage";
import { QualifierStage } from "./stages/QualifierStage";
import { ProfileBuilderStage } from "./stages/ProfileBuilderStage";
import { ResultCardStage } from "./stages/ResultCardStage";
import { AccountCreationStage } from "./stages/AccountCreationStage";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ApplicantData,
  generateReferralCode,
  calculateApplicantScore,
  scoreToWaitlistPosition,
} from "@/types/applicant";

type Stage = "landing" | "qualifier" | "profile" | "result" | "account";

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
  const { toast } = useToast();
  const navigate = useNavigate();

  // Sign out any existing session when starting the intake flow
  // This ensures a clean state for new applicants
  useEffect(() => {
    supabase.auth.signOut();
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

    // Prepare complete applicant data
    const completeData = {
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
      console.log('Attempting to save applicant with data:', JSON.stringify(completeData, null, 2));
      
      const { data: insertedData, error } = await supabase
        .from('applicants')
        .insert(completeData)
        .select('id')
        .single();

      console.log('Insert result:', { insertedData, error });

      if (error) {
        console.error('Error saving applicant - full error:', JSON.stringify(error, null, 2));
        console.error('Error code:', error.code);
        console.error('Error message:', error.message);
        console.error('Error details:', error.details);
        toast({
          title: "Oops!",
          description: `There was an issue saving your application: ${error.message}`,
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Store the applicant ID for account linking
      setApplicantId(insertedData.id);

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
    } catch (err) {
      console.error('Error saving applicant:', err);
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

    setIsCreatingAccount(true);

    try {
      // Create the auth account
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: applicantData.email,
        password,
        options: {
          emailRedirectTo: `${window.location.origin}/portal`,
        },
      });

      if (signUpError) {
        // Check for specific error types
        if (signUpError.message.includes('already registered')) {
          toast({
            title: "Account Exists",
            description: "An account with this email already exists. Please log in to the portal instead.",
            variant: "destructive",
          });
        } else {
          toast({
            title: "Account Creation Failed",
            description: signUpError.message,
            variant: "destructive",
          });
        }
        setIsCreatingAccount(false);
        return;
      }

      if (!signUpData.user || !signUpData.session) {
        toast({
          title: "Error",
          description: "Failed to create account. Please try again.",
          variant: "destructive",
        });
        setIsCreatingAccount(false);
        return;
      }

      // Use edge function to link applicant record (bypasses RLS with service role)
      console.log('Calling link-applicant edge function with applicantId:', applicantId);
      const { data: linkData, error: linkError } = await supabase.functions.invoke('link-applicant', {
        body: { applicantId },
      });

      console.log('link-applicant response:', { data: linkData, error: linkError });

      if (linkError) {
        console.error('Error linking applicant to user:', linkError);
        toast({
          title: "Warning",
          description: "Account created but there was an issue linking your application. Please contact support.",
          variant: "default",
        });
      }

      toast({
        title: "Welcome to Sauce! 🧃",
        description: "Your account has been created successfully.",
      });

      // Navigate to portal
      navigate('/portal', { replace: true });
    } catch (err) {
      console.error('Error creating account:', err);
      toast({
        title: "Connection Error",
        description: "Please check your internet connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingAccount(false);
    }
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
      </StageWrapper>
    </div>
  );
};
