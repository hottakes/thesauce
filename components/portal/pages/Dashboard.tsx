'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { supabase } from '@/lib/supabase/client';
import { format } from 'date-fns';
import { motion } from 'framer-motion';
import { 
  User, 
  Trophy, 
  Lock, 
  ArrowRight, 
  Sparkles,
  CheckCircle2,
  Clock,
  ChevronRight,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { Tables } from '@/lib/supabase/types';
import { DashboardSkeleton } from '@/components/portal/PortalSkeleton';
import { PortalError } from '@/components/portal/PortalError';
import { PortalEmpty } from '@/components/portal/PortalEmpty';

const statusConfig = {
  new: {
    bg: 'bg-blue-500/10 border-blue-500/30',
    icon: 'text-blue-400',
    badge: 'bg-blue-500',
    title: 'Application Received',
    description: "We're reviewing your application. Hang tight!",
  },
  reviewed: {
    bg: 'bg-amber-500/10 border-amber-500/30',
    icon: 'text-amber-400',
    badge: 'bg-amber-500',
    title: 'Under Review',
    description: 'Your application is being reviewed by our team.',
  },
  contacted: {
    bg: 'bg-purple-500/10 border-purple-500/30',
    icon: 'text-purple-400',
    badge: 'bg-purple-500',
    title: "We've Reached Out",
    description: "Check your email — we've sent you a message.",
  },
  accepted: {
    bg: 'bg-green-500/10 border-green-500/30',
    icon: 'text-green-400',
    badge: 'bg-green-500',
    title: "You're In! 🎉",
    description: 'Welcome to Sauce. You now have access to exclusive opportunities.',
  },
  rejected: {
    bg: 'bg-muted/50 border-muted-foreground/20',
    icon: 'text-muted-foreground',
    badge: 'bg-muted-foreground',
    title: 'Not Selected',
    description: "Unfortunately we couldn't move forward with your application at this time.",
  },
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: { staggerChildren: 0.08 }
  }
};

const itemVariants = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.25 } }
};

// Helper to get emoji for boost
const getBoostEmoji = (title: string, icon: string | null): string => {
  const lowerTitle = title.toLowerCase();
  if (lowerTitle.includes('tiktok')) return '🎵';
  if (lowerTitle.includes('instagram') || lowerTitle.includes('story')) return '📸';
  if (lowerTitle.includes('refer') || lowerTitle.includes('friend')) return '🤝';
  if (lowerTitle.includes('quiz') || lowerTitle.includes('brand')) return '🧠';
  return icon || '🎯';
};

// Points badge color helper
const getPointsBadgeClass = (points: number): string => {
  if (points >= 20) return 'bg-purple-500/20 text-purple-400';
  if (points >= 10) return 'bg-blue-500/20 text-blue-400';
  return 'bg-green-500/20 text-green-400';
};

export const PortalDashboard: React.FC = () => {
  const { applicant, isLoading: authLoading } = usePortalAuth();
  const [hoveredOpp, setHoveredOpp] = useState<string | null>(null);

  const { data: completionsCount = 0 } = useQuery({
    queryKey: ['portal_completions_count', applicant?.id],
    queryFn: async () => {
      if (!applicant?.id) return 0;
      const { count, error } = await supabase
        .from('challenge_completions')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', applicant.id);
      if (error) throw error;
      return count || 0;
    },
    enabled: !!applicant?.id,
  });

  const { data: opportunities = [], isLoading: oppsLoading, error: oppsError, refetch: refetchOpps } = useQuery({
    queryKey: ['featured_opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(2);
      if (error) throw error;
      return data;
    },
  });

  const { data: incompleteChallenges = [], isLoading: challengesLoading, error: challengesError, refetch: refetchChallenges } = useQuery({
    queryKey: ['portal_incomplete_challenges', applicant?.id],
    queryFn: async () => {
      if (!applicant?.id) return [];
      
      const { data: completions } = await supabase
        .from('challenge_completions')
        .select('challenge_id')
        .eq('applicant_id', applicant.id);
      
      const completedIds = completions?.map((c: { challenge_id: string }) => c.challenge_id) || [];
      
      let query = supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(4);
      
      if (completedIds.length > 0) {
        query = query.not('id', 'in', `(${completedIds.join(',')})`);
      }
      
      const { data, error } = await query;
      if (error) throw error;
      return data;
    },
    enabled: !!applicant?.id,
  });

  const status = (applicant?.status || 'new') as keyof typeof statusConfig;
  const config = statusConfig[status] || statusConfig.new;
  const isApproved = status === 'accepted';
  const showPosition = status === 'new' || status === 'reviewed';
  const isLoading = authLoading || oppsLoading || challengesLoading;

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  if (oppsError || challengesError) {
    return (
      <PortalError 
        onRetry={() => {
          refetchOpps();
          refetchChallenges();
        }}
      />
    );
  }

  return (
    <motion.div 
      className="space-y-5 max-w-4xl"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Welcome Section */}
      <motion.div className="flex items-center gap-4" variants={itemVariants}>
        {applicant?.instagram_profile_pic ? (
          <img
            src={applicant.instagram_profile_pic}
            alt="Profile"
            className="w-12 h-12 rounded-full object-cover border-2 border-primary/30"
          />
        ) : (
          <div className="w-12 h-12 rounded-full bg-secondary flex items-center justify-center border-2 border-primary/30">
            <User className="w-6 h-6 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-xl font-bold">
            Welcome, <span className="text-primary">@{applicant?.instagram_handle}</span>
          </h1>
          <p className="text-sm text-muted-foreground">
            Here&apos;s your dashboard
          </p>
        </div>
      </motion.div>

      {/* Status Card */}
      <motion.div className={cn('glass-card p-5 border', config.bg)} variants={itemVariants}>
        <div className="flex items-start gap-3">
          <div className={cn('p-2.5 rounded-xl bg-background/50', config.icon)}>
            {status === 'accepted' ? (
              <CheckCircle2 className="w-6 h-6" />
            ) : status === 'rejected' ? (
              <Clock className="w-6 h-6" />
            ) : (
              <Sparkles className="w-6 h-6" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium text-white', config.badge)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <h2 className="text-lg font-bold mb-0.5">{config.title}</h2>
            <p className="text-muted-foreground text-sm">{config.description}</p>
            
            {showPosition && applicant?.waitlist_position && (
              <div className="mt-2 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-background/50">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Position #{applicant.waitlist_position}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-3 pt-3 border-t border-border/30 text-xs text-muted-foreground">
          Applied {applicant?.created_at ? format(new Date(applicant.created_at), 'MMM d, yyyy') : 'recently'}
        </div>
      </motion.div>

      {/* Quick Stats - Simplified Pills */}
      <motion.div className="flex gap-2" variants={itemVariants}>
        <div className="flex-1 glass-card px-4 py-2.5 rounded-xl flex items-center justify-center gap-2">
          <span className="text-lg font-bold text-foreground">
            {isApproved ? '✓' : `#${applicant?.waitlist_position || '—'}`}
          </span>
          <span className="text-xs text-muted-foreground">position</span>
        </div>
        <div className="flex-1 glass-card px-4 py-2.5 rounded-xl flex items-center justify-center gap-2">
          <span className="text-lg font-bold text-primary">{applicant?.points || 0}</span>
          <span className="text-xs text-muted-foreground">pts</span>
        </div>
        <div className="flex-1 glass-card px-4 py-2.5 rounded-xl flex items-center justify-center gap-2">
          <span className="text-lg font-bold text-foreground">{completionsCount}</span>
          <span className="text-xs text-muted-foreground">boosts</span>
        </div>
      </motion.div>

      {/* Live Opportunities - FOMO Design */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            🔥 Live Opportunities
          </h2>
          <Link 
            href="/portal/opportunities" 
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-3 h-3" />
          </Link>
        </div>
        
        {opportunities.length === 0 ? (
          <PortalEmpty type="coming-soon" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {opportunities.map((opp: Tables<'opportunities'>, index: number) => {
              const spotsLeft = opp.spots_total ? (opp.spots_total - (opp.spots_filled || 0)) : null;
              const isHovered = hoveredOpp === opp.id;
              
              return (
                <motion.div
                  key={opp.id}
                  initial={{ opacity: 0, y: 16 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="relative glass-card rounded-xl overflow-hidden group cursor-pointer"
                  style={{ minHeight: '120px' }}
                  onMouseEnter={() => setHoveredOpp(opp.id)}
                  onMouseLeave={() => setHoveredOpp(null)}
                  whileHover={{ scale: 1.02, y: -2 }}
                >
                  {/* Card Content - Always Visible */}
                  <div className="p-4 relative z-0">
                    {/* Brand Row */}
                    <div className="flex items-center gap-2 mb-2">
                      {opp.brand_logo_url ? (
                        <img src={opp.brand_logo_url} alt={opp.brand_name} className="w-10 h-10 rounded-lg object-cover" />
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-gradient-to-br from-primary/30 to-primary/10 flex items-center justify-center">
                          <span className="text-lg font-bold text-primary">{opp.brand_name.charAt(0)}</span>
                        </div>
                      )}
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground">{opp.brand_name}</p>
                        <h3 className="font-semibold text-sm truncate">{opp.title}</h3>
                      </div>
                    </div>
                    
                    {/* Compensation - Prominent */}
                    {opp.compensation && (
                      <p className="text-primary font-bold text-base mb-2">{opp.compensation}</p>
                    )}
                    
                    {/* Spots & Features */}
                    <div className="flex items-center gap-2 flex-wrap">
                      {spotsLeft !== null && (
                        <span className={cn(
                          "text-xs px-2 py-0.5 rounded-full font-medium",
                          spotsLeft <= 5 
                            ? "bg-red-500/20 text-red-400" 
                            : "bg-muted text-muted-foreground"
                        )}>
                          🔥 {spotsLeft} spots left
                        </span>
                      )}
                      {opp.is_featured && (
                        <span className="text-xs px-2 py-0.5 rounded-full bg-amber-500/20 text-amber-400 font-medium">
                          ⭐ Featured
                        </span>
                      )}
                    </div>
                  </div>
                  
                  {/* Lock Overlay for Unapproved - Light, Shows Content */}
                  {!isApproved && (
                    <>
                      {/* Subtle dark overlay */}
                      <div className="absolute inset-0 bg-background/15 z-10 transition-opacity duration-200" />
                      
                      {/* Small lock in corner */}
                      <div className={cn(
                        "absolute top-3 right-3 z-20 p-1.5 rounded-full bg-background/80 backdrop-blur-sm transition-all duration-200",
                        isHovered && "scale-110"
                      )}>
                        <Lock className={cn(
                          "w-3.5 h-3.5 text-muted-foreground transition-colors",
                          isHovered && "text-primary"
                        )} />
                      </div>
                      
                      {/* Hover tooltip */}
                      <div className={cn(
                        "absolute inset-x-0 bottom-0 z-20 px-4 py-2 bg-background/90 backdrop-blur-sm transition-all duration-200 text-center",
                        isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"
                      )}>
                        <p className="text-xs font-medium text-muted-foreground">
                          Get approved to unlock 🔓
                        </p>
                      </div>
                    </>
                  )}
                  
                  {/* Apply button for approved users */}
                  {isApproved && (
                    <Link 
                      href="/portal/opportunities"
                      className="absolute top-3 right-3 z-20 px-3 py-1 rounded-full bg-primary text-primary-foreground text-xs font-medium hover:bg-primary/90 transition-colors"
                    >
                      Apply
                    </Link>
                  )}
                </motion.div>
              );
            })}
          </div>
        )}
      </motion.section>

      {/* Boosts Preview - Horizontal Scroll Pills */}
      <motion.section variants={itemVariants}>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-bold flex items-center gap-2">
            ⚡ Quick Boosts
          </h2>
          <Link 
            href="/portal/boosts" 
            className="text-xs text-primary hover:underline flex items-center gap-1"
          >
            All Boosts <ArrowRight className="w-3 h-3" />
          </Link>
        </div>

        {incompleteChallenges.length === 0 ? (
          <PortalEmpty type="boosts-complete" />
        ) : (
          <div className="flex gap-2 overflow-x-auto pb-2 -mx-1 px-1 scrollbar-hide">
            {incompleteChallenges.map((challenge: Tables<'challenges'>, index: number) => (
              <motion.div
                key={challenge.id}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.05 }}
              >
                <Link
                  href="/portal/boosts"
                  className="flex-shrink-0 glass-card px-4 py-2.5 rounded-xl flex items-center gap-2.5 hover:bg-card/70 transition-all hover:scale-[1.02] whitespace-nowrap"
                >
                  <span className="text-xl">{getBoostEmoji(challenge.title, challenge.icon)}</span>
                  <span className="text-sm font-medium">{challenge.title}</span>
                  <span className={cn(
                    "text-xs px-2 py-0.5 rounded-full font-medium",
                    getPointsBadgeClass(challenge.points)
                  )}>
                    +{challenge.points}
                  </span>
                </Link>
              </motion.div>
            ))}
            
            {/* More indicator */}
            <Link
              href="/portal/boosts"
              className="flex-shrink-0 glass-card px-3 py-2.5 rounded-xl flex items-center gap-1 text-muted-foreground hover:text-primary transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </Link>
          </div>
        )}
      </motion.section>
    </motion.div>
  );
};
