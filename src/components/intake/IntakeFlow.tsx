import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { AnimatedBackground } from "./AnimatedBackground";
import { StageWrapper } from "./StageWrapper";
import { LandingStage } from "./stages/LandingStage";
import { QualifierStage } from "./stages/QualifierStage";
import { ProfileBuilderStage } from "./stages/ProfileBuilderStage";
import { ResultCardStage } from "./stages/ResultCardStage";
import { WaitlistDashboard } from "./stages/WaitlistDashboard";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  ApplicantData,
  generateReferralCode,
  calculateApplicantScore,
  scoreToWaitlistPosition,
} from "@/types/applicant";

type Stage = "landing" | "qualifier" | "profile" | "result" | "dashboard";

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
  const { toast } = useToast();

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
      const { data: insertedData, error } = await supabase
        .from('applicants')
        .insert(completeData)
        .select('id')
        .single();

      if (error) {
        console.error('Error saving applicant:', error);
        toast({
          title: "Oops!",
          description: "There was an issue saving your application. Please try again.",
          variant: "destructive",
        });
        setIsSaving(false);
        return;
      }

      // Store the applicant ID for challenge tracking
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

  const getResultCardData = () => ({
    instagramHandle: applicantData.instagramHandle || "user",
    householdSize: applicantData.householdSize || 1,
    personalityTraits: applicantData.personalityTraits || [],
    ambassadorType: selectedAmbassadorType 
      ? { name: selectedAmbassadorType.name, description: selectedAmbassadorType.description }
      : { name: "Ambassador", description: "Welcome to the Sauce crew!" },
  });

  const getDashboardData = () => ({
    applicantId: applicantId,
    waitlistPosition: applicantData.waitlistPosition || 50,
    referralCode: applicantData.referralCode || generateReferralCode(),
    points: applicantData.points || 50,
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
            onContinue={() => setStage("dashboard")}
          />
        )}
        {stage === "dashboard" && (
          <WaitlistDashboard data={getDashboardData()} />
        )}
      </StageWrapper>
    </div>
  );
};
