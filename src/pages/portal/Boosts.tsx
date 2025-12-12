import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { addApplicantPoints } from '@/lib/applicant-utils';
import confetti from 'canvas-confetti';
import { format } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, 
  CheckCircle2, 
  ExternalLink, 
  Loader2,
  Upload,
  X,
  Clock,
  Flame,
  Trophy,
  Star,
  Crown,
  Award,
  TrendingUp,
  Users,
  ChevronRight,
  Sparkles
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

// Rank system configuration
const RANKS = [
  { min: 0, max: 50, name: 'Rookie', emoji: '🌱', color: 'from-green-400 to-emerald-500' },
  { min: 51, max: 100, name: 'Rising Star', emoji: '⭐', color: 'from-yellow-400 to-orange-500' },
  { min: 101, max: 150, name: 'Sauce Squad', emoji: '🔥', color: 'from-orange-400 to-red-500' },
  { min: 151, max: 200, name: 'VIP', emoji: '👑', color: 'from-purple-400 to-pink-500' },
  { min: 201, max: Infinity, name: 'Legend', emoji: '🏆', color: 'from-amber-400 to-yellow-500' },
];

// Achievement badges
const ACHIEVEMENTS = [
  { id: 'first_boost', name: 'First Boost', emoji: '🎯', description: 'Complete your first boost', check: (completed: number) => completed >= 1 },
  { id: 'on_a_roll', name: 'On a Roll', emoji: '🎢', description: 'Complete 3 boosts', check: (completed: number) => completed >= 3 },
  { id: 'halfway', name: 'Halfway Hero', emoji: '⚡', description: 'Complete 50% of boosts', check: (completed: number, total: number) => completed >= total / 2 },
  { id: 'fully_loaded', name: 'Fully Loaded', emoji: '💪', description: 'Complete all boosts', check: (completed: number, total: number) => completed >= total && total > 0 },
];

// Simulated live activity names
const FAKE_NAMES = ['Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'Ethan', 'Sophia', 'Mason', 'Isabella', 'Lucas', 'Mia', 'Oliver', 'Charlotte', 'Aiden', 'Amelia'];
const FAKE_SCHOOLS = ['Western', 'Waterloo', 'U of T', 'McMaster', 'Queen\'s', 'York', 'Guelph', 'Ottawa', 'Laurier', 'TMU'];

function getRank(points: number) {
  return RANKS.find(r => points >= r.min && points <= r.max) || RANKS[0];
}

function getNextRank(points: number) {
  const currentIndex = RANKS.findIndex(r => points >= r.min && points <= r.max);
  return currentIndex < RANKS.length - 1 ? RANKS[currentIndex + 1] : null;
}

function getPointsToNextRank(points: number) {
  const nextRank = getNextRank(points);
  return nextRank ? nextRank.min - points : 0;
}

export const PortalBoosts: React.FC = () => {
  const { applicant } = usePortalAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();
  
  const [selectedChallenge, setSelectedChallenge] = useState<Challenge | null>(null);
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [displayPoints, setDisplayPoints] = useState(0);
  const [liveActivity, setLiveActivity] = useState({ name: '', school: '', points: 0 });
  const [showLevelUp, setShowLevelUp] = useState(false);

  // Animate points counter
  useEffect(() => {
    const target = applicant?.points || 0;
    const diff = target - displayPoints;
    if (diff === 0) return;
    
    const step = Math.ceil(Math.abs(diff) / 20);
    const timer = setTimeout(() => {
      setDisplayPoints(prev => {
        if (diff > 0) return Math.min(prev + step, target);
        return Math.max(prev - step, target);
      });
    }, 30);
    
    return () => clearTimeout(timer);
  }, [applicant?.points, displayPoints]);

  // Simulate live activity ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setLiveActivity({
        name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
        school: FAKE_SCHOOLS[Math.floor(Math.random() * FAKE_SCHOOLS.length)],
        points: [5, 10, 15, 20][Math.floor(Math.random() * 4)],
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

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
  const completionPercent = challenges.length > 0 ? (completedChallenges.length / challenges.length) * 100 : 0;

  const currentPoints = applicant?.points || 0;
  const currentRank = getRank(currentPoints);
  const nextRank = getNextRank(currentPoints);
  const pointsToNext = getPointsToNextRank(currentPoints);
  const progressToNextRank = nextRank 
    ? ((currentPoints - currentRank.min) / (nextRank.min - currentRank.min)) * 100 
    : 100;

  // Get earned achievements
  const earnedAchievements = ACHIEVEMENTS.filter(a => a.check(completedChallenges.length, challenges.length));

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
      // Trigger confetti
      confetti({
        particleCount: 150,
        spread: 100,
        origin: { y: 0.6 },
        colors: ['#FF6B35', '#FF3366', '#FFD700', '#00FF88'],
      });

      if (leveledUp) {
        setShowLevelUp(true);
        // Extra celebration for level up
        setTimeout(() => {
          confetti({
            particleCount: 200,
            spread: 120,
            origin: { y: 0.5 },
          });
        }, 500);
      }

      toast({
        title: `🎉 +${challengePoints} points earned!`,
        description: leveledUp 
          ? `You leveled up to ${newRank.emoji} ${newRank.name}!` 
          : 'Your waitlist position has been updated!',
      });

      queryClient.invalidateQueries({ queryKey: ['my_completions', applicant?.id] });
      queryClient.invalidateQueries({ queryKey: ['all_challenges'] });
      queryClient.invalidateQueries({ queryKey: ['portal_applicant'] });
      queryClient.invalidateQueries({ queryKey: ['portal_completions_count'] });
      queryClient.invalidateQueries({ queryKey: ['portal_incomplete_challenges'] });
      
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

  return (
    <div className="space-y-6 max-w-4xl pb-8">
      {/* Live Activity Ticker */}
      <AnimatePresence mode="wait">
        <motion.div
          key={liveActivity.name + liveActivity.school}
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 10 }}
          className="flex items-center justify-center gap-2 text-sm text-muted-foreground"
        >
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
          <span>
            <span className="font-medium text-foreground">{liveActivity.name}</span> from {liveActivity.school} just earned <span className="text-primary font-medium">+{liveActivity.points} pts</span>
          </span>
        </motion.div>
      </AnimatePresence>

      {/* Rank & Level Section */}
      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl border border-border/50 bg-card p-6"
      >
        {/* Background gradient */}
        <div className={cn(
          "absolute inset-0 opacity-10 bg-gradient-to-br",
          currentRank.color
        )} />
        
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center gap-6">
            {/* Rank Badge */}
            <div className="flex items-center gap-4">
              <motion.div 
                className={cn(
                  "w-20 h-20 rounded-2xl flex items-center justify-center text-4xl bg-gradient-to-br shadow-lg",
                  currentRank.color
                )}
                animate={{ 
                  scale: progressToNextRank > 80 ? [1, 1.05, 1] : 1,
                }}
                transition={{ 
                  repeat: progressToNextRank > 80 ? Infinity : 0,
                  duration: 1.5 
                }}
              >
                {currentRank.emoji}
              </motion.div>
              <div>
                <p className="text-sm text-muted-foreground">Current Rank</p>
                <h2 className="text-2xl font-bold">{currentRank.name}</h2>
                {nextRank && (
                  <p className="text-sm text-muted-foreground">
                    <span className="text-primary font-medium">{pointsToNext} pts</span> to {nextRank.emoji} {nextRank.name}
                  </p>
                )}
              </div>
            </div>

            {/* Points Display */}
            <div className="flex-1 md:text-right">
              <div className="inline-flex items-center gap-3 px-6 py-3 rounded-2xl bg-background/50 border border-border/50">
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2, repeatDelay: 3 }}
                >
                  <Flame className="w-8 h-8 text-primary" />
                </motion.div>
                <div className="text-left">
                  <motion.span 
                    key={displayPoints}
                    className="text-4xl font-black text-primary"
                    initial={{ scale: 1.2 }}
                    animate={{ scale: 1 }}
                  >
                    {displayPoints}
                  </motion.span>
                  <p className="text-sm text-muted-foreground">total points</p>
                </div>
              </div>
            </div>
          </div>

          {/* Progress to Next Rank */}
          {nextRank && (
            <div className="mt-6">
              <div className="flex items-center justify-between text-sm mb-2">
                <span className="text-muted-foreground flex items-center gap-2">
                  <TrendingUp className="w-4 h-4" />
                  Progress to {nextRank.name}
                </span>
                <span className="font-medium">{Math.round(progressToNextRank)}%</span>
              </div>
              <div className="h-3 rounded-full bg-secondary overflow-hidden">
                <motion.div 
                  className={cn("h-full rounded-full bg-gradient-to-r", currentRank.color)}
                  initial={{ width: 0 }}
                  animate={{ width: `${progressToNextRank}%` }}
                  transition={{ duration: 0.5, ease: "easeOut" }}
                />
              </div>
            </div>
          )}

          {/* Waitlist Position */}
          {applicant?.waitlist_position && (
            <div className="mt-4 flex items-center gap-2 text-sm">
              <Crown className="w-4 h-4 text-amber-500" />
              <span className="text-muted-foreground">
                Waitlist Position: <span className="font-bold text-foreground">#{applicant.waitlist_position}</span>
              </span>
              <span className="text-muted-foreground">•</span>
              <span className="text-green-500 font-medium">Top performers get approved 3x faster</span>
            </div>
          )}
        </div>
      </motion.div>

      {/* Achievements Row */}
      <div className="flex items-center gap-3 overflow-x-auto pb-2 scrollbar-hide">
        <span className="text-sm text-muted-foreground flex-shrink-0">Achievements:</span>
        {ACHIEVEMENTS.map((achievement, index) => {
          const earned = earnedAchievements.includes(achievement);
          return (
            <motion.div
              key={achievement.id}
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: index * 0.1 }}
              className={cn(
                "flex items-center gap-2 px-3 py-1.5 rounded-full border text-sm flex-shrink-0 transition-all",
                earned 
                  ? "bg-primary/20 border-primary/40 text-foreground" 
                  : "bg-secondary/50 border-border/50 text-muted-foreground opacity-50"
              )}
              title={achievement.description}
            >
              <span>{achievement.emoji}</span>
              <span className="font-medium">{achievement.name}</span>
              {earned && <CheckCircle2 className="w-3 h-3 text-green-500" />}
            </motion.div>
          );
        })}
      </div>

      {/* Completion Progress */}
      <div className="glass-card p-4 rounded-xl">
        <div className="flex items-center justify-between mb-3">
          <span className="font-medium flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-primary" />
            Boost Progress
          </span>
          <span className="text-sm text-muted-foreground">
            {completedChallenges.length}/{challenges.length} completed
          </span>
        </div>
        <div className="flex gap-1.5">
          {challenges.map((challenge, i) => (
            <motion.div
              key={challenge.id}
              initial={{ scaleY: 0 }}
              animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.05 }}
              className={cn(
                "flex-1 h-3 rounded-full transition-colors",
                completedIds.has(challenge.id) 
                  ? "bg-gradient-to-r from-primary to-pink-500" 
                  : "bg-secondary"
              )}
            />
          ))}
        </div>
        {completionPercent === 100 && (
          <motion.p 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-center mt-3 text-green-500 font-medium"
          >
            🎉 ALL BOOSTS COMPLETE! You're maxed out!
          </motion.p>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-primary">{completedChallenges.length}</p>
          <p className="text-xs text-muted-foreground">Boosts Done</p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-foreground">Top {Math.round((1 - (applicant?.waitlist_position || 50) / 100) * 100)}%</p>
          <p className="text-xs text-muted-foreground">Your Ranking</p>
        </div>
        <div className="glass-card p-4 rounded-xl text-center">
          <p className="text-2xl font-bold text-green-500">+{completedChallenges.reduce((acc, c) => {
            const challenge = challenges.find(ch => ch.id === c.id);
            return acc + (challenge?.points || 0);
          }, 0)}</p>
          <p className="text-xs text-muted-foreground">Pts Earned</p>
        </div>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center py-12">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      ) : (
        <>
          {/* Available Boosts */}
          <section>
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Zap className="w-5 h-5 text-primary" />
              Available Boosts
              {availableChallenges.length > 0 && (
                <span className="px-2 py-0.5 rounded-full bg-primary/20 text-primary text-sm">
                  {availableChallenges.length} left
                </span>
              )}
            </h2>

            {availableChallenges.length === 0 ? (
              <motion.div 
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                className="glass-card p-8 text-center rounded-2xl border-green-500/30"
              >
                <motion.div
                  animate={{ rotate: [0, 10, -10, 0] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  <Trophy className="w-16 h-16 text-amber-500 mx-auto mb-4" />
                </motion.div>
                <h3 className="text-xl font-bold mb-2">You're Maxed Out! 👑</h3>
                <p className="text-muted-foreground mb-4">
                  You've completed all available boosts. Check back for new ones or wait for your approval.
                </p>
                <p className="text-sm text-primary">Top performers get approved 3x faster</p>
              </motion.div>
            ) : (
              <div className="grid grid-cols-1 gap-4">
                {availableChallenges.map((challenge, index) => (
                  <motion.div
                    key={challenge.id}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: index * 0.1 }}
                    whileHover={{ y: -4, scale: 1.01 }}
                    whileTap={{ scale: 0.98 }}
                    onClick={() => handleChallengeClick(challenge)}
                    className="glass-card p-5 rounded-2xl cursor-pointer group relative overflow-hidden border border-transparent hover:border-primary/30 transition-all"
                  >
                    {/* Glow effect on hover */}
                    <div className="absolute inset-0 bg-gradient-to-r from-primary/5 to-pink-500/5 opacity-0 group-hover:opacity-100 transition-opacity" />
                    
                    <div className="relative z-10 flex items-center gap-4">
                      <motion.span 
                        className="text-4xl"
                        animate={{ scale: 1 }}
                        whileHover={{ scale: 1.2, rotate: [0, -10, 10, 0] }}
                        transition={{ duration: 0.3 }}
                      >
                        {challenge.icon || '⚡'}
                      </motion.span>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h3 className="font-bold text-lg">{challenge.title}</h3>
                          <motion.span 
                            className="px-3 py-1 rounded-full bg-gradient-to-r from-primary to-pink-500 text-white text-sm font-bold"
                            animate={{ scale: [1, 1.05, 1] }}
                            transition={{ repeat: Infinity, duration: 2 }}
                          >
                            +{challenge.points} pts
                          </motion.span>
                        </div>
                        {challenge.description && (
                          <p className="text-sm text-muted-foreground mb-2">
                            {challenge.description}
                          </p>
                        )}
                        <div className="flex items-center gap-3 text-xs text-muted-foreground">
                          <span className="flex items-center gap-1">
                            <Clock className="w-3 h-3" />
                            ~30 sec
                          </span>
                          {challenge.external_url && (
                            <span className="flex items-center gap-1">
                              <ExternalLink className="w-3 h-3" />
                              Opens link
                            </span>
                          )}
                        </div>
                      </div>

                      <Button 
                        size="sm" 
                        className="flex-shrink-0 bg-gradient-to-r from-primary to-pink-500 hover:opacity-90 text-white font-bold group-hover:scale-105 transition-transform"
                      >
                        DO THIS
                        <ChevronRight className="w-4 h-4 ml-1" />
                      </Button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}
          </section>

          {/* Completed Boosts */}
          {completedChallenges.length > 0 && (
            <section>
              <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-green-500" />
                Completed
              </h2>

              <div className="space-y-2">
                {completedChallenges.map((challenge) => {
                  const completion = completions.find(c => c.challenge_id === challenge.id);
                  return (
                    <motion.div
                      key={challenge.id}
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      className="glass-card p-4 rounded-xl opacity-70 border border-green-500/20"
                    >
                      <div className="flex items-center gap-4">
                        <span className="text-2xl grayscale opacity-60">{challenge.icon || '⚡'}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <h3 className="font-medium">{challenge.title}</h3>
                            <CheckCircle2 className="w-4 h-4 text-green-500" />
                          </div>
                          <div className="flex items-center gap-3 text-xs text-muted-foreground mt-1">
                            <span className="text-green-500 font-medium">+{challenge.points} pts earned</span>
                            {completion?.completed_at && (
                              <span className="flex items-center gap-1">
                                <Clock className="w-3 h-3" />
                                {format(new Date(completion.completed_at), 'MMM d')}
                              </span>
                            )}
                          </div>
                        </div>
                        <span className="text-green-500 text-sm font-medium">DONE ✓</span>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
            </section>
          )}
        </>
      )}

      {/* Bottom CTA */}
      <motion.div 
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.5 }}
        className="glass-card p-6 rounded-2xl text-center"
      >
        {availableChallenges.length > 0 ? (
          <>
            <p className="text-lg font-medium mb-2">
              You're SO close. Finish these and watch your position climb 📈
            </p>
            <p className="text-sm text-muted-foreground">
              {availableChallenges.length} boost{availableChallenges.length > 1 ? 's' : ''} remaining • {availableChallenges.reduce((acc, c) => acc + c.points, 0)} potential points
            </p>
          </>
        ) : (
          <>
            <Trophy className="w-10 h-10 text-amber-500 mx-auto mb-3" />
            <p className="text-lg font-medium mb-2">
              You're maxed out! 👑
            </p>
            <p className="text-sm text-muted-foreground">
              Check back for new boosts or wait for your approval. Top performers get approved first!
            </p>
          </>
        )}
      </motion.div>

      {/* Confirmation Modal */}
      <Dialog open={!!selectedChallenge} onOpenChange={() => {
        setSelectedChallenge(null);
        setProofFile(null);
      }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-3">
              <span className="text-3xl">{selectedChallenge?.icon || '⚡'}</span>
              <div>
                <p className="text-xl">Complete Boost</p>
                <p className="text-sm font-normal text-primary">+{selectedChallenge?.points} pts</p>
              </div>
            </DialogTitle>
            <DialogDescription>
              Did you complete "{selectedChallenge?.title}"?
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
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
              className="bg-gradient-to-r from-primary to-pink-500 hover:opacity-90"
            >
              {(isUploading || completeChallengeMutation.isPending) ? (
                <>
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                "Yes, I did it! 🎉"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Level Up Modal */}
      <Dialog open={showLevelUp} onOpenChange={setShowLevelUp}>
        <DialogContent className="sm:max-w-sm text-center">
          <motion.div
            initial={{ scale: 0, rotate: -180 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", damping: 10 }}
            className={cn(
              "w-24 h-24 mx-auto rounded-3xl flex items-center justify-center text-5xl bg-gradient-to-br shadow-2xl mb-4",
              currentRank.color
            )}
          >
            {currentRank.emoji}
          </motion.div>
          <h2 className="text-2xl font-bold mb-2">Level Up! 🎉</h2>
          <p className="text-muted-foreground mb-4">
            You've reached <span className="font-bold text-foreground">{currentRank.name}</span>!
          </p>
          <Button 
            onClick={() => setShowLevelUp(false)}
            className="w-full bg-gradient-to-r from-primary to-pink-500"
          >
            Keep Going! 🚀
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
};
