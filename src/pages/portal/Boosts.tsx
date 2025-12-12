import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { 
  Zap, 
  CheckCircle2, 
  ExternalLink, 
  Loader2,
  Upload,
  X,
  Clock
} from 'lucide-react';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  points: number;
  icon: string | null;
  external_url: string | null;
  verification_type: string;
}

interface ChallengeCompletion {
  id: string;
  challenge_id: string;
  completed_at: string;
  verified: boolean;
  proof_url: string | null;
}

export const PortalBoosts: React.FC = () => {
  const { applicant } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const { data: challenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['all_challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as Challenge[];
    },
  });

  const { data: completions = [], isLoading: completionsLoading } = useQuery({
    queryKey: ['my_completions', applicant?.id],
    queryFn: async () => {
      if (!applicant?.id) return [];
      const { data, error } = await supabase
        .from('challenge_completions')
        .select('*')
        .eq('applicant_id', applicant.id)
        .order('completed_at', { ascending: false });
      if (error) throw error;
      return data as ChallengeCompletion[];
    },
    enabled: !!applicant?.id,
  });

  const completedIds = new Set(completions.map(c => c.challenge_id));
  const availableChallenges = challenges.filter(c => !completedIds.has(c.id));
  const completedChallenges = challenges.filter(c => completedIds.has(c.id));

  const completeChallengeMutation = useMutation({
    mutationFn: async ({ challenge, proofUrl }: { challenge: Challenge; proofUrl?: string }) => {
      if (!applicant?.id) throw new Error('No applicant ID');

      // Insert completion record
      const { error: completionError } = await supabase
        .from('challenge_completions')
        .insert({
          applicant_id: applicant.id,
          challenge_id: challenge.id,
          proof_url: proofUrl || null,
        });

      if (completionError) {
        if (completionError.code === '23505') {
          throw new Error('Already completed');
        }
        throw completionError;
      }

      // Calculate new points
      const newPoints = (applicant.points || 0) + challenge.points;

      // Recalculate waitlist position (higher score = lower position)
      const maxScore = 175;
      const minPosition = 1;
      const maxPosition = 100;
      const normalizedScore = Math.min(newPoints, maxScore) / maxScore;
      const basePosition = Math.round(maxPosition - (normalizedScore * (maxPosition - minPosition)));
      const randomOffset = Math.floor(Math.random() * 5) - 2;
      const newPosition = Math.max(1, Math.min(100, basePosition + randomOffset));

      // Update applicant
      const { error: updateError } = await supabase
        .from('applicants')
        .update({ 
          points: newPoints,
          waitlist_position: newPosition
        })
        .eq('id', applicant.id);

      if (updateError) throw updateError;

      return { newPoints, newPosition, challengePoints: challenge.points };
    },
    onSuccess: ({ challengePoints }) => {
      // Trigger confetti
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B35', '#FF3366', '#FFD700'],
      });

      toast({
        title: `🎉 +${challengePoints} points earned!`,
        description: 'Your waitlist position has been updated.',
      });

      // Refetch data
      queryClient.invalidateQueries({ queryKey: ['my_completions', applicant?.id] });
      queryClient.invalidateQueries({ queryKey: ['all_challenges'] });
      
      // Close modal
      setSelectedChallenge(null);
      setProofFile(null);
    },
    onError: (error: Error) => {
      if (error.message === 'Already completed') {
        toast({
          title: 'Already completed',
          description: "You've already completed this challenge.",
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Error',
          description: 'Failed to complete challenge. Please try again.',
          variant: 'destructive',
        });
      }
    },
  });

  const handleChallengeClick = (challenge: Challenge) => {
    // If has external URL, open it first
    if (challenge.external_url) {
      window.open(challenge.external_url, '_blank', 'noopener,noreferrer');
    }
    // Show confirmation modal
    setSelectedChallenge(challenge);
  };

  const handleConfirmCompletion = async () => {
    if (!selectedChallenge) return;

    setIsUploading(true);
    let proofUrl: string | undefined;

    try {
      // Upload proof if provided
      if (proofFile && applicant?.id) {
        const fileExt = proofFile.name.split('.').pop();
        const fileName = `${applicant.id}/${selectedChallenge.id}_${Date.now()}.${fileExt}`;
        
        const { error: uploadError } = await supabase.storage
          .from('applicant-content')
          .upload(fileName, proofFile);

        if (!uploadError) {
          const { data: urlData } = supabase.storage
            .from('applicant-content')
            .getPublicUrl(fileName);
          proofUrl = urlData.publicUrl;
        }
      }

      await completeChallengeMutation.mutateAsync({ 
        challenge: selectedChallenge, 
        proofUrl 
      });
    } finally {
      setIsUploading(false);
    }
  };

  const currentPoints = applicant?.points || 0;
  const progressPercent = Math.min((currentPoints / 100) * 100, 100);
  const isLoading = challengesLoading || completionsLoading;

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header Section */}
      <div className="glass-card p-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold mb-1">⚡ Boost Your Position</h1>
            <p className="text-muted-foreground">
              Complete challenges to earn points and move up the waitlist
            </p>
          </div>
          <div className="flex items-center gap-3 px-5 py-3 rounded-2xl bg-primary/10 border border-primary/20">
            <Zap className="w-6 h-6 text-primary" />
            <span className="text-2xl font-bold">{currentPoints}</span>
            <span className="text-muted-foreground">points</span>
          </div>
        </div>
        
        <div className="mt-4">
          <div className="flex items-center justify-between text-sm mb-2">
            <span className="text-muted-foreground">Progress to 100 points</span>
            <span className="font-medium">{currentPoints}/100</span>
          </div>
          <Progress value={progressPercent} className="h-2" />
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Available Challenges */}
          <section>
            <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Available Boosts
              <span className="text-sm font-normal text-muted-foreground">
                ({availableChallenges.length})
              </span>
            </h2>

            {availableChallenges.length === 0 ? (
              <div className="glass-card p-8 text-center">
                <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-3" />
                <h3 className="font-bold mb-1">All Boosts Completed!</h3>
                <p className="text-muted-foreground">
                  You've completed all available boosts. Check back for new challenges.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {availableChallenges.map((challenge) => (
                  <div
                    key={challenge.id}
                    className="glass-card p-5 rounded-xl hover:bg-card/70 transition-colors"
                  >
                    <div className="flex items-start gap-4">
                      <span className="text-3xl">{challenge.icon || '⚡'}</span>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2 mb-1">
                          <h3 className="font-semibold">{challenge.title}</h3>
                          <span className="flex-shrink-0 px-2 py-0.5 rounded-full bg-primary/20 text-primary text-xs font-medium">
                            +{challenge.points} pts
                          </span>
                        </div>
                        {challenge.description && (
                          <p className="text-sm text-muted-foreground mb-3">
                            {challenge.description}
                          </p>
                        )}
                        <Button
                          onClick={() => handleChallengeClick(challenge)}
                          size="sm"
                          className="w-full md:w-auto"
                        >
                          {challenge.external_url && (
                            <ExternalLink className="w-4 h-4 mr-2" />
                          )}
                          Complete
                        </Button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Challenges */}
          {completedChallenges.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Completed
                <span className="text-sm font-normal text-muted-foreground">
                  ({completedChallenges.length}/{challenges.length})
                </span>
              </h2>

              <div className="space-y-2">
                {completedChallenges.map((challenge) => {
                  const completion = completions.find(c => c.challenge_id === challenge.id);
                  return (
                    <div
                      key={challenge.id}
                      className="glass-card p-4 rounded-xl opacity-70"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl grayscale">{challenge.icon || '⚡'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium line-through">{challenge.title}</h3>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="text-green-500">+{challenge.points} pts earned</span>
                            {completion?.completed_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(completion.completed_at), 'MMM d, yyyy')}
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Confirmation Modal */}
      <Dialog open={!!selectedChallenge} onOpenChange={() => {
        setSelectedChallenge(null);
        setProofFile(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <span className="text-2xl">{selectedChallenge?.icon || '⚡'}</span>
              Complete Challenge
            </DialogTitle>
            <DialogDescription>
              Did you complete "{selectedChallenge?.title}"?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            {/* Optional Proof Upload */}
            <div>
              <label className="text-sm font-medium mb-2 block">
                Upload proof (optional)
              </label>
              <div className="relative">
                {proofFile ? (
                  <div className="flex items-center gap-2 p-3 rounded-xl bg-secondary">
                    <Upload className="w-4 h-4 text-muted-foreground" />
                    <span className="text-sm flex-1 truncate">{proofFile.name}</span>
                    <button
                      onClick={() => setProofFile(null)}
                      className="p-1 hover:bg-background rounded-full"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <label className="flex items-center justify-center gap-2 p-4 rounded-xl border-2 border-dashed border-border hover:border-primary/50 cursor-pointer transition-colors">
                    <Upload className="w-5 h-5 text-muted-foreground" />
                    <span className="text-sm text-muted-foreground">
                      Click to upload screenshot
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) setProofFile(file);
                      }}
                    />
                  </label>
                )}
              </div>
            </div>

            {selectedChallenge?.external_url && (
              <p className="text-xs text-muted-foreground">
                Make sure you've completed the action in the tab that opened.
              </p>
            )}
          </div>

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedChallenge(null);
                setProofFile(null);
              }}
              disabled={isUploading || completeChallengeMutation.isPending}
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCompletion}
              disabled={isUploading || completeChallengeMutation.isPending}
            >
              {(isUploading || completeChallengeMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes, I did it"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
