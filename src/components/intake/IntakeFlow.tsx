import { useState } from "react";
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
  getRandomAmbassadorType,
} from "@/types/applicant";

type Stage = "landing" | "qualifier" | "profile" | "result" | "dashboard";

export const IntakeFlow = () => {
  const [stage, setStage] = useState<Stage>("landing");
  const [applicantData, setApplicantData] = useState<Partial<ApplicantData>>({
    points: 0,
  });
  const [isSaving, setIsSaving] = useState(false);
  const { toast } = useToast();

  const handleQualifierComplete = (data: {
    school: string;
    is19Plus: boolean;
    instagramHandle: string;
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
  }) => {
    setIsSaving(true);
    
    const ambassadorType = getRandomAmbassadorType();
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
      instagram_handle: applicantData.instagramHandle!,
      personality_traits: data.personalityTraits,
      interests: data.interests,
      household_size: data.householdSize,
      scene_types: data.sceneTypes,
      scene_custom: data.sceneCustom || null,
      content_uploaded: data.contentUploaded,
      ambassador_type: ambassadorType.name,
      waitlist_position: waitlistPosition,
      referral_code: referralCode,
      points: score,
    };

    try {
      const { error } = await supabase
        .from('applicants')
        .insert(completeData);

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
    ambassadorType: getRandomAmbassadorType(),
  });

  const getDashboardData = () => ({
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
          <ProfileBuilderStage onComplete={handleProfileComplete} isSaving={isSaving} />
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
