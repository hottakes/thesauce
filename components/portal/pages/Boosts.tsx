'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { supabase } from '@/lib/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addApplicantPoints } from '@/lib/applicant-utils';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Loader2,
  Upload,
  X,
  ChevronRight,
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

// Simplified rank system
const RANKS = [
  { min: 0, max: 50, name: 'Rookie', emoji: '🌱' },
  { min: 51, max: 100, name: 'Rising Star', emoji: '🔥' },
  { min: 101, max: 150, name: 'Sauce Squad', emoji: '⚡' },
  { min: 151, max: 200, name: 'VIP', emoji: '👑' },
  { min: 201, max: Infinity, name: 'Legend', emoji: '🏆' },
];

// Icon mapping for challenges based on title keywords
const getBoostEmoji = (title: string): string => {
  const lower = title.toLowerCase();
  if (lower.includes('tiktok')) return '🎵';
  if (lower.includes('instagram') || lower.includes('story')) return '📸';
  if (lower.includes('refer') || lower.includes('friend')) return '🤝';
  if (lower.includes('quiz') || lower.includes('brand')) return '🧠';
  if (lower.includes('follow')) return '🎵';
  return '⚡';
};

// Points badge color based on value
const getPointsBadgeClass = (points: number): string => {
  if (points >= 20) return 'bg-gradient-to-r from-amber-500 to-orange-500';
  if (points >= 10) return 'bg-gradient-to-r from-blue-500 to-cyan-500';
  return 'bg-gradient-to-r from-green-500 to-emerald-500';
};

function getRank(points: number) {
  return RANKS.find(r => points >= r.min && points <= r.max) || RANKS[0];
}

function getNextRank(points: number) {
  const currentIndex = RANKS.findIndex(r => points >= r.min && points <= r.max);
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
}

export const PortalBoosts: React.FC = () => {
  const { applicant } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Animate points counter
  useEffect(() => {
    const target = applicant?.points || 0;
    const diff = target - displayPoints;
    if (diff === 0) return;
    
    const step = Math.ceil(Math.abs(diff) / 15);
    const timer = setTimeout(() => {
      setDisplayPoints(prev => {
        if (diff > 0) return Math.min(prev + step, target);
        return Math.max(prev - step, target);
      });
    }, 40);
    
    return () => clearTimeout(timer);
  }, [applicant?.points, displayPoints]);

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
  const totalAvailablePoints = availableChallenges.reduce((acc, c) => acc + c.points, 0);

  const currentPoints = applicant?.points || 0;
  const currentRank = getRank(currentPoints);
  const nextRank = getNextRank(currentPoints);
  const progressToNextRank = nextRank 
    ? ((currentPoints - currentRank.min) / (nextRank.min - currentRank.min)) * 100 
    : 100;

  const completeChallengeMutation = useMutation({
    mutationFn: async ({ challenge, proofUrl }: { challenge: Challenge; proofUrl?: string }) => {
      if (!applicant?.id) throw new Error('No applicant ID');

      const prevRank = getRank(applicant.points || 0);

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

      const { points: newPoints, waitlist_position: newPosition } = await addApplicantPoints(
        applicant.id,
        applicant.points || 0,
        challenge.points
      );

      const newRank = getRank(newPoints);
      const leveledUp = newRank.name !== prevRank.name;

      return { newPoints, newPosition, challengePoints: challenge.points, leveledUp, newRank };
    },
    onSuccess: ({ challengePoints, leveledUp, newRank }) => {
      confetti({
        particleCount: 100,
        spread: 70,
        origin: { y: 0.6 },
        colors: ['#FF6B35', '#FF3366', '#FFD700'],
      });

      if (leveledUp) {
        setShowLevelUp(true);
      }

      toast({
        title: `+${challengePoints} pts earned!`,
        description: leveledUp 
          ? `You're now ${newRank.emoji} ${newRank.name}!` 
          : 'Position updated!',
      });

      queryClient.invalidateQueries({ queryKey: ['my_completions', applicant?.id] });
      queryClient.invalidateQueries({ queryKey: ['all_challenges'] });
      queryClient.invalidateQueries({ queryKey: ['portal_applicant'] });
      
      setSelectedChallenge(null);
      setProofFile(null);
    },
    onError: (error: Error) => {
      toast({
        title: error.message === 'Already completed' ? 'Already done' : 'Error',
        description: error.message === 'Already completed' 
          ? "You've already completed this." 
          : 'Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleChallengeClick = (challenge: Challenge) => {
    if (challenge.external_url) {
      window.open(challenge.external_url, '_blank', 'noopener,noreferrer');
    }
    setSelectedChallenge(challenge);
  };

  const handleConfirmCompletion = async () => {
    if (!selectedChallenge) return;

    setIsUploading(true);
    let proofUrl: string | undefined;

    try {
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

  const isLoading = challengesLoading || completionsLoading;

  // Progress dots
  const renderProgressDots = () => {
    return challenges.map((challenge) => (
      <span
        key={challenge.id}
        className={cn(
          "w-2.5 h-2.5 rounded-full transition-colors",
          completedIds.has(challenge.id) ? "bg-primary" : "bg-muted"
        )}
      />
    ));
  };

  return (
    <div className="max-w-md mx-auto pb-24 px-4">
      {/* Header - Centered Points Circle */}
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="flex flex-col items-center pt-4 pb-6"
      >
        {/* Circular Progress with Points */}
        <div className="relative w-32 h-32 mb-3">
          {/* Background circle */}
          <svg className="w-full h-full -rotate-90">
            <circle
              cx="64"
              cy="64"
              r="56"
              stroke="currentColor"
              strokeWidth="8"
              fill="none"
              className="text-muted"
            />
            <motion.circle
              cx="64"
              cy="64"
              r="56"
              stroke="url(#progressGradient)"
              strokeWidth="8"
              fill="none"
              strokeLinecap="round"
              initial={{ strokeDasharray: "0 352" }}
              animate={{ strokeDasharray: `${(progressToNextRank / 100) * 352} 352` }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            />
            <defs>
              <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%" stopColor="hsl(var(--primary))" />
                <stop offset="100%" stopColor="#FF3366" />
              </linearGradient>
            </defs>
          </svg>
          
          {/* Center content */}
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <motion.span 
              key={displayPoints}
              className="text-4xl font-black text-foreground"
              initial={{ scale: 1.3 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", stiffness: 300 }}
            >
              {displayPoints}
            </motion.span>
            <span className="text-lg">🔥</span>
          </div>
        </div>

        {/* Rank Label */}
        <p className="text-lg font-semibold text-foreground">
          {currentRank.name} {currentRank.emoji}
        </p>
      </motion.div>

      {/* Waitlist Pill */}
      {applicant?.waitlist_position && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="flex justify-center mb-6"
        >
          <span className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-muted text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">#{applicant.waitlist_position}</span>
            on waitlist • Complete boosts to climb
          </span>
        </motion.div>
      )}

      {/* Progress Dots */}
      {challenges.length > 0 && (
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="flex items-center justify-center gap-1.5 mb-8"
        >
          {renderProgressDots()}
        </motion.div>
      )}

      {isLoading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Boost Cards */}
          <div className="space-y-3">
            {availableChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 + index * 0.08 }}
                whileHover={{ y: -2, scale: 1.01 }}
                whileTap={{ scale: 0.98 }}
                onClick={() => handleChallengeClick(challenge)}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card border border-border cursor-pointer transition-shadow hover:shadow-lg hover:shadow-primary/5"
              >
                {/* Large Emoji */}
                <motion.span 
                  className="text-3xl flex-shrink-0"
                  whileHover={{ scale: 1.2, rotate: [0, -5, 5, 0] }}
                  transition={{ duration: 0.3 }}
                >
                  {getBoostEmoji(challenge.title)}
                </motion.span>
                
                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                    <span className={cn(
                      "px-2 py-0.5 rounded-full text-xs font-bold text-white",
                      getPointsBadgeClass(challenge.points)
                    )}>
                      +{challenge.points}
                    </span>
                  </div>
                  {challenge.description && (
                    <p className="text-sm text-muted-foreground truncate mt-0.5">
                      {challenge.description.split('.')[0]}
                    </p>
                  )}
                </div>

                {/* Arrow */}
                <ChevronRight className="w-5 h-5 text-muted-foreground flex-shrink-0" />
              </motion.div>
            ))}

            {/* Completed Cards */}
            {completedChallenges.map((challenge, index) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.1 + (availableChallenges.length + index) * 0.08 }}
                className="flex items-center gap-4 p-4 rounded-2xl bg-card/50 border border-border/50 opacity-60"
              >
                <span className="text-3xl flex-shrink-0 grayscale">
                  {getBoostEmoji(challenge.title)}
                </span>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-foreground">{challenge.title}</h3>
                    <span className="text-green-500 text-sm">✓</span>
                  </div>
                </div>

                <span className="text-xs text-muted-foreground">Done</span>
              </motion.div>
            ))}
          </div>

          {/* Empty state */}
          {challenges.length === 0 && (
            <div className="text-center py-12 text-muted-foreground">
              No boosts available yet
            </div>
          )}
        </>
      )}

      {/* Bottom Line */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="fixed bottom-20 left-0 right-0 flex justify-center px-4 pointer-events-none"
      >
        <span className="bg-card/90 backdrop-blur-sm px-6 py-3 rounded-full text-sm font-medium border border-border shadow-lg">
          {totalAvailablePoints > 0 
            ? `${totalAvailablePoints} pts waiting for you 👆` 
            : "You're maxed! 🏆"
          }
        </span>
      </motion.div>

      {/* Confirmation Modal */}
      <Dialog open={!!selectedChallenge} onOpenChange={() => {
        setSelectedChallenge(null);
        setProofFile(null);
      }}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-3xl">{selectedChallenge ? getBoostEmoji(selectedChallenge.title) : '⚡'}</span>
              <span>Did you complete this?</span>
            </DialogTitle>
            <DialogDescription>
              {selectedChallenge?.title}
            </DialogDescription>
          </DialogHeader>

          <div className="py-4">
            <label className="text-sm text-muted-foreground mb-2 block">
              Proof (optional)
            </label>
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
                <span className="text-sm text-muted-foreground">Upload screenshot</span>
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

          <DialogFooter className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => {
                setSelectedChallenge(null);
                setProofFile(null);
              }}
              disabled={isUploading || completeChallengeMutation.isPending}
              className="flex-1"
            >
              Cancel
            </Button>
            <Button
              onClick={handleConfirmCompletion}
              disabled={isUploading || completeChallengeMutation.isPending}
              className="flex-1 bg-gradient-to-r from-primary to-pink-500 hover:opacity-90"
            >
              {(isUploading || completeChallengeMutation.isPending) ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                "Yes!"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Up Modal */}
      <Dialog open={showLevelUp} onOpenChange={setShowLevelUp}>
        <DialogContent className="sm:max-w-xs text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10 }}
            className="text-6xl mx-auto mb-4"
          >
            {currentRank.emoji}
          </motion.div>
          <h2 className="text-xl font-bold">Level Up!</h2>
          <p className="text-muted-foreground">
            You're now <span className="font-semibold text-foreground">{currentRank.name}</span>
          </p>
          <Button 
            onClick={() => setShowLevelUp(false)}
            className="w-full mt-4"
          >
            Nice!
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
