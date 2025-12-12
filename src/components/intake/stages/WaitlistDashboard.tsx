import { motion } from "framer-motion";
import { Link, ExternalLink, CheckCircle2, Loader2 } from "lucide-react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useState } from "react";

interface WaitlistDashboardProps {
  data: {
    applicantId?: string;
    waitlistPosition: number;
    referralCode: string;
    points: number;
  };
}

export const WaitlistDashboard = ({ data }: WaitlistDashboardProps) => {
  const [currentPoints, setCurrentPoints] = useState(data.points);
  const queryClient = useQueryClient();
  const { toast } = useToast();
  const progress = Math.min((currentPoints / 100) * 100, 100);

  const { data: challenges, isLoading: challengesLoading } = useQuery({
    queryKey: ["challenges"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("challenges")
        .select("id, title, description, points, icon, external_url")
        .eq("is_active", true)
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const { data: completions } = useQuery({
    queryKey: ["challenge_completions", data.applicantId],
    queryFn: async () => {
      if (!data.applicantId) return [];
      const { data: completionData, error } = await supabase
        .from("challenge_completions")
        .select("challenge_id")
        .eq("applicant_id", data.applicantId);
      if (error) throw error;
      return completionData?.map(c => c.challenge_id) || [];
    },
    enabled: !!data.applicantId,
  });

  const completeChallenge = useMutation({
    mutationFn: async ({ challengeId, points }: { challengeId: string; points: number }) => {
      if (!data.applicantId) throw new Error("No applicant ID");
      
      // Insert completion record
      const { error: completionError } = await supabase
        .from("challenge_completions")
        .insert({
          applicant_id: data.applicantId,
          challenge_id: challengeId,
        });
      
      if (completionError) {
        if (completionError.code === '23505') {
          throw new Error("Already completed");
        }
        throw completionError;
      }

      // Update applicant points
      const newPoints = currentPoints + points;
      const { error: updateError } = await supabase
        .from("applicants")
        .update({ points: newPoints })
        .eq("id", data.applicantId);
      
      if (updateError) throw updateError;
      
      return { newPoints };
    },
    onSuccess: ({ newPoints }) => {
      setCurrentPoints(newPoints);
      queryClient.invalidateQueries({ queryKey: ["challenge_completions", data.applicantId] });
      toast({
        title: "Challenge completed! 🎉",
        description: `You earned more spots on the waitlist!`,
      });
    },
    onError: (error: any) => {
      if (error.message === "Already completed") {
        toast({
          title: "Already done!",
          description: "You've already completed this challenge.",
        });
      } else {
        toast({
          title: "Error",
          description: "Couldn't complete challenge. Try again.",
          variant: "destructive",
        });
      }
    },
  });

  const handleChallengeClick = (challenge: { id: string; points: number; external_url: string | null }) => {
    const isCompleted = completions?.includes(challenge.id);
    
    if (isCompleted) {
      // Already completed, just open external URL if present
      if (challenge.external_url) {
        window.open(challenge.external_url, "_blank", "noopener,noreferrer");
      }
      return;
    }

    // Mark as completed
    completeChallenge.mutate({ challengeId: challenge.id, points: challenge.points });
    
    // Open external URL if present
    if (challenge.external_url) {
      window.open(challenge.external_url, "_blank", "noopener,noreferrer");
    }
  };

  const copyReferralLink = () => {
    navigator.clipboard.writeText(`sauce.app/join/${data.referralCode}`);
    toast({
      title: "Copied!",
      description: "Referral link copied to clipboard.",
    });
  };

  return (
    <div className="min-h-screen px-6 py-8">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="text-center mb-8"
      >
        <span className="text-4xl mb-2 block">🧃</span>
        <h1 className="text-2xl font-display font-bold mb-2">
          You're on the list!
        </h1>
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full glass-card">
          <span className="text-muted-foreground">Your position:</span>
          <span className="text-3xl font-display font-bold gradient-text">
            #{data.waitlistPosition}
          </span>
        </div>
      </motion.div>

      {/* Progress to Top 10 */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.1 }}
        className="glass-card p-5 rounded-2xl mb-6"
      >
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm font-medium">Progress to Top 10</span>
          <span className="text-sm text-muted-foreground">
            {currentPoints}/100 points
          </span>
        </div>
        <div className="h-3 bg-secondary rounded-full overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ delay: 0.3, duration: 0.8 }}
            className="h-full rounded-full"
            style={{ background: "var(--gradient-sauce)" }}
          />
        </div>
      </motion.div>

      {/* Challenges Section */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="mb-6"
      >
        <h2 className="text-lg font-display font-semibold mb-4">
          🚀 Boost your spot
        </h2>
        {challengesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <div className="space-y-3">
            {challenges?.map((challenge, index) => {
              const isCompleted = completions?.includes(challenge.id);
              
              return (
                <motion.div
                  key={challenge.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: 0.3 + index * 0.1 }}
                >
                  <button
                    onClick={() => handleChallengeClick(challenge)}
                    disabled={completeChallenge.isPending}
                    className={`glass-card p-4 rounded-xl flex items-center gap-4 w-full text-left transition-all ${
                      isCompleted ? "opacity-60" : "hover:scale-[1.02]"
                    }`}
                  >
                    <span className="text-2xl">{challenge.icon || "🎯"}</span>
                    <div className="flex-1">
                      <p className={`font-medium text-sm ${isCompleted ? "line-through" : ""}`}>
                        {challenge.title}
                      </p>
                      <p className="text-xs text-primary">+{challenge.points} spots</p>
                    </div>
                    {isCompleted ? (
                      <CheckCircle2 className="w-6 h-6 text-green-500" />
                    ) : (
                      <ExternalLink className="w-5 h-5 text-muted-foreground" />
                    )}
                  </button>
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.div>

      {/* Referral Link */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-5 rounded-2xl mb-6"
      >
        <div className="flex items-center gap-2 mb-3">
          <Link className="w-5 h-5 text-primary" />
          <span className="font-medium">Your referral link</span>
        </div>
        <div className="flex items-center gap-2">
          <input
            type="text"
            value={`sauce.app/join/${data.referralCode}`}
            readOnly
            className="flex-1 px-3 py-2 rounded-xl bg-background border border-border text-sm truncate"
          />
          <button 
            onClick={copyReferralLink}
            className="px-4 py-2 rounded-xl bg-primary text-primary-foreground text-sm font-medium whitespace-nowrap"
          >
            Copy
          </button>
        </div>
      </motion.div>

      {/* Footer Message */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.6 }}
        className="text-center text-muted-foreground text-sm"
      >
        <p>
          We'll be in touch soon. Keep your phone on.{" "}
          <span className="text-lg">🧃</span>
        </p>
      </motion.div>
    </div>
  );
};
