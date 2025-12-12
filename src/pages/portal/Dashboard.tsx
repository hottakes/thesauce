import React from 'react';
import { Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { 
  User, 
  Trophy, 
  Zap, 
  Lock, 
  ArrowRight, 
  Briefcase,
  Clock,
  MapPin,
  DollarSign,
  Sparkles,
  CheckCircle2,
  Loader2
} from 'lucide-react';
import { cn } from '@/lib/utils';

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

export const PortalDashboard: React.FC = () => {
  const { applicant } = usePortalAuth();

  const { data: completionsCount = 0 } = useQuery({
    queryKey: ['challenge_completions_count', applicant?.id],
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

  const { data: opportunities = [], isLoading: oppsLoading } = useQuery({
    queryKey: ['featured_opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false })
        .limit(3);
      if (error) throw error;
      return data;
    },
  });

  const { data: incompleteChallenges = [], isLoading: challengesLoading } = useQuery({
    queryKey: ['incomplete_challenges', applicant?.id],
    queryFn: async () => {
      if (!applicant?.id) return [];
      
      // Get completed challenge IDs
      const { data: completions } = await supabase
        .from('challenge_completions')
        .select('challenge_id')
        .eq('applicant_id', applicant.id);
      
      const completedIds = completions?.map(c => c.challenge_id) || [];
      
      // Get active challenges not completed
      let query = supabase
        .from('challenges')
        .select('*')
        .eq('is_active', true)
        .order('sort_order')
        .limit(3);
      
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

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Welcome Section */}
      <div className="flex items-center gap-4">
        {applicant?.instagram_profile_pic ? (
          <img
            src={applicant.instagram_profile_pic}
            alt="Profile"
            className="w-14 h-14 rounded-full object-cover border-2 border-primary/30"
          />
        ) : (
          <div className="w-14 h-14 rounded-full bg-secondary flex items-center justify-center border-2 border-primary/30">
            <User className="w-7 h-7 text-muted-foreground" />
          </div>
        )}
        <div>
          <h1 className="text-2xl font-bold">
            Welcome back, <span className="gradient-text">@{applicant?.instagram_handle}</span>
          </h1>
          <p className="text-muted-foreground">
            Here's what's happening with your application
          </p>
        </div>
      </div>

      {/* Status Card */}
      <div className={cn('glass-card p-6 border-2', config.bg)}>
        <div className="flex items-start gap-4">
          <div className={cn('p-3 rounded-xl bg-background/50', config.icon)}>
            {status === 'accepted' ? (
              <CheckCircle2 className="w-8 h-8" />
            ) : status === 'rejected' ? (
              <Clock className="w-8 h-8" />
            ) : (
              <Sparkles className="w-8 h-8" />
            )}
          </div>
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1">
              <span className={cn('px-2 py-0.5 rounded-full text-xs font-medium text-white', config.badge)}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </span>
            </div>
            <h2 className="text-xl font-bold mb-1">{config.title}</h2>
            <p className="text-muted-foreground text-sm">{config.description}</p>
            
            {showPosition && applicant?.waitlist_position && (
              <div className="mt-3 inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-background/50">
                <Trophy className="w-4 h-4 text-primary" />
                <span className="text-sm font-medium">Position #{applicant.waitlist_position}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="mt-4 pt-4 border-t border-border/50 text-xs text-muted-foreground">
          Applied {applicant?.created_at ? format(new Date(applicant.created_at), 'MMMM d, yyyy') : 'recently'}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-3 gap-3">
        <div className="glass-card p-4 text-center">
          <Trophy className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">
            {isApproved ? 'N/A' : `#${applicant?.waitlist_position || '—'}`}
          </p>
          <p className="text-xs text-muted-foreground">Waitlist Position</p>
        </div>
        <div className="glass-card p-4 text-center">
          <Zap className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{applicant?.points || 0}</p>
          <p className="text-xs text-muted-foreground">Points Earned</p>
        </div>
        <div className="glass-card p-4 text-center">
          <CheckCircle2 className="w-5 h-5 text-primary mx-auto mb-2" />
          <p className="text-2xl font-bold">{completionsCount}</p>
          <p className="text-xs text-muted-foreground">Boosts Completed</p>
        </div>
      </div>

      {/* Live Opportunities */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            🔥 Live Opportunities
          </h2>
          <Link 
            to="/portal/opportunities" 
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        
        {oppsLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : opportunities.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">
            <Briefcase className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>No live opportunities right now. Check back soon!</p>
          </div>
        ) : (
          <div className="flex gap-3 overflow-x-auto pb-2 -mx-2 px-2 md:grid md:grid-cols-3 md:overflow-visible">
            {opportunities.map((opp) => (
              <div
                key={opp.id}
                className="relative flex-shrink-0 w-64 md:w-auto glass-card p-4 rounded-xl"
              >
                {!isApproved && (
                  <div className="absolute inset-0 bg-background/80 backdrop-blur-sm rounded-xl flex flex-col items-center justify-center z-10">
                    <Lock className="w-6 h-6 text-muted-foreground mb-2" />
                    <p className="text-xs text-muted-foreground text-center px-4">
                      Get approved to unlock
                    </p>
                  </div>
                )}
                
                <div className="flex items-center gap-2 mb-2">
                  {opp.brand_logo_url ? (
                    <img src={opp.brand_logo_url} alt={opp.brand_name} className="w-8 h-8 rounded-lg object-cover" />
                  ) : (
                    <div className="w-8 h-8 rounded-lg bg-primary/20 flex items-center justify-center">
                      <Briefcase className="w-4 h-4 text-primary" />
                    </div>
                  )}
                  <span className="text-xs text-muted-foreground">{opp.brand_name}</span>
                </div>
                
                <h3 className="font-semibold text-sm mb-2 line-clamp-2">{opp.title}</h3>
                
                <div className="flex items-center gap-3 text-xs text-muted-foreground">
                  {opp.compensation && (
                    <span className="flex items-center gap-1">
                      <DollarSign className="w-3 h-3" />
                      {opp.compensation}
                    </span>
                  )}
                  {opp.spots_total && (
                    <span className="flex items-center gap-1">
                      <User className="w-3 h-3" />
                      {(opp.spots_total - (opp.spots_filled || 0))} spots left
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* Boosts Preview */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            ⚡ Boost Your Position
          </h2>
          <Link 
            to="/portal/boosts" 
            className="text-sm text-primary hover:underline flex items-center gap-1"
          >
            View All <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {challengesLoading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : incompleteChallenges.length === 0 ? (
          <div className="glass-card p-6 text-center text-muted-foreground">
            <CheckCircle2 className="w-8 h-8 mx-auto mb-2 opacity-50" />
            <p>You've completed all available boosts! 🎉</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {incompleteChallenges.map((challenge) => (
              <Link
                key={challenge.id}
                to="/portal/boosts"
                className="glass-card p-4 rounded-xl flex items-center gap-3 hover:bg-card/70 transition-colors"
              >
                <span className="text-2xl">{challenge.icon || '🎯'}</span>
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-sm truncate">{challenge.title}</p>
                  <p className="text-xs text-primary">+{challenge.points} points</p>
                </div>
                <ArrowRight className="w-4 h-4 text-muted-foreground" />
              </Link>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
