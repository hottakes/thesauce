'use client';

import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Briefcase, Lock, MapPin, Calendar, Users, Check, ChevronRight, 
  Flame, Eye, Clock, Zap, ArrowRight, TrendingUp 
} from 'lucide-react';
import { format, differenceInDays } from 'date-fns';
import { supabase } from '@/lib/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { Tables } from '@/lib/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
import Link from 'next/link';
import {
  Drawer,
  DrawerContent,
  DrawerHeader,
  DrawerTitle,
  DrawerDescription,
  DrawerFooter,
  DrawerClose,
} from '@/components/ui/drawer';
import { toast } from '@/hooks/use-toast';
import { OpportunitiesSkeleton } from '@/components/portal/PortalSkeleton';
import { PortalError } from '@/components/portal/PortalError';

type Opportunity = Tables<'opportunities'>;
type OpportunityApplication = Tables<'opportunity_applications'>;

const OPPORTUNITY_TYPES = [
  { value: 'all', label: 'All' },
  { value: 'sampling', label: 'Sampling' },
  { value: 'event', label: 'Events' },
  { value: 'content', label: 'Content' },
  { value: 'promotion', label: 'Promotions' },
];

const typeBadgeColors: Record<string, string> = {
  sampling: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  event: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  content: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  tabling: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  promotion: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

// Fake names for social proof ticker
const FAKE_NAMES = ['Sarah', 'Mike', 'Jessica', 'David', 'Emma', 'Tyler', 'Olivia', 'Jake', 'Sophia', 'Chris'];
const SCHOOLS = ['Western', 'U of T', 'York', 'McMaster', 'Waterloo', 'Queen\'s', 'Laurier', 'Ottawa', 'TMU', 'Guelph'];

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4 } }
};

export const PortalOpportunities: React.FC = () => {
  const { applicant } = usePortalAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('all');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);
  const [socialProof, setSocialProof] = useState({ name: 'Sarah', school: 'Western' });
  const [viewerCounts, setViewerCounts] = useState<Record<string, number>>({});

  const isApproved = applicant?.status === 'accepted';

  // Rotate social proof ticker
  useEffect(() => {
    const interval = setInterval(() => {
      setSocialProof({
        name: FAKE_NAMES[Math.floor(Math.random() * FAKE_NAMES.length)],
        school: SCHOOLS[Math.floor(Math.random() * SCHOOLS.length)],
      });
    }, 4000);
    return () => clearInterval(interval);
  }, []);

  // Simulate live viewer counts
  useEffect(() => {
    const updateViewers = () => {
      const counts: Record<string, number> = {};
      opportunities.forEach(opp => {
        counts[opp.id] = Math.floor(Math.random() * 15) + 5;
      });
      setViewerCounts(counts);
    };
    updateViewers();
    const interval = setInterval(updateViewers, 8000);
    return () => clearInterval(interval);
  }, []);

  // Fetch opportunities
  const { data: opportunities = [], isLoading, error, refetch } = useQuery({
    queryKey: ['opportunities', activeFilter],
    queryFn: async () => {
      let query = supabase
        .from('opportunities')
        .select('*')
        .eq('status', 'active')
        .order('is_featured', { ascending: false })
        .order('created_at', { ascending: false });

      if (activeFilter !== 'all') {
        query = query.eq('opportunity_type', activeFilter);
      }

      const { data, error } = await query;
      if (error) throw error;
      return data as Opportunity[];
    },
  });

  // Fetch user's applications
  const { data: applications = [] } = useQuery({
    queryKey: ['opportunity-applications', applicant?.id],
    queryFn: async () => {
      if (!applicant?.id) return [];
      const { data, error } = await supabase
        .from('opportunity_applications')
        .select('*')
        .eq('applicant_id', applicant.id);
      if (error) throw error;
      return data as OpportunityApplication[];
    },
    enabled: !!applicant?.id,
  });

  // Apply mutation
  const applyMutation = useMutation({
    mutationFn: async (opportunityId: string) => {
      if (!applicant?.id) throw new Error('Not authenticated');
      const { error } = await supabase
        .from('opportunity_applications')
        .insert({
          applicant_id: applicant.id,
          opportunity_id: opportunityId,
          status: 'pending',
        });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-applications'] });
      toast({
        title: "Application submitted! 🎉",
        description: "We'll be in touch soon.",
      });
    },
    onError: () => {
      toast({
        title: "Failed to apply",
        description: "Please try again later.",
        variant: "destructive",
      });
    },
  });

  const hasApplied = (opportunityId: string) => {
    return applications.some(app => app.opportunity_id === opportunityId);
  };

  const isEligible = (opportunity: Opportunity) => {
    if (!applicant?.school) return true;
    if (!opportunity.schools || opportunity.schools.length === 0) return true;
    return opportunity.schools.includes(applicant.school);
  };

  const handleCardClick = (opportunity: Opportunity) => {
    if (!isApproved) return;
    if (!isEligible(opportunity)) return;
    setSelectedOpportunity(opportunity);
    setDrawerOpen(true);
  };

  const handleApply = () => {
    if (!selectedOpportunity) return;
    applyMutation.mutate(selectedOpportunity.id);
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return 'Ongoing';
    if (start && end) {
      return `${format(new Date(start), 'MMM d')} - ${format(new Date(end), 'MMM d')}`;
    }
    if (start) return `Starts ${format(new Date(start), 'MMM d')}`;
    return 'Ongoing';
  };

  const getDaysRemaining = (endDate: string | null) => {
    if (!endDate) return null;
    const days = differenceInDays(new Date(endDate), new Date());
    return days > 0 ? days : null;
  };

  const getSpotsRemaining = (opp: Opportunity) => {
    if (!opp.spots_total) return null;
    return opp.spots_total - (opp.spots_filled || 0);
  };

  const getSpotsFillPercent = (opp: Opportunity) => {
    if (!opp.spots_total) return 0;
    return ((opp.spots_filled || 0) / opp.spots_total) * 100;
  };

  if (isLoading) {
    return <OpportunitiesSkeleton />;
  }

  if (error) {
    return <PortalError onRetry={refetch} />;
  }

  const locked = !isApproved;

  return (
    <motion.div 
      className="space-y-6 pb-24"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Waitlist Banner for Locked Users */}
      {locked && (
        <motion.div 
          variants={itemVariants}
          className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-accent/10 to-primary/10 p-4"
        >
          <div className="absolute inset-0 animate-gradient bg-gradient-to-r from-primary/5 via-accent/5 to-primary/5" />
          <div className="relative flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-primary/20 border border-primary/30">
                <Lock className="w-5 h-5 text-primary" />
              </div>
              <div>
                <p className="font-semibold text-foreground">
                  You're #{applicant?.waitlist_position || '...'} on the waitlist
                </p>
                <p className="text-sm text-muted-foreground">
                  Complete boosts to get approved faster!
                </p>
              </div>
            </div>
            <Link href="/portal/boosts">
              <Button size="sm" className="bg-primary hover:bg-primary/90 gap-2">
                <Zap className="w-4 h-4" />
                Boost Now
                <ArrowRight className="w-4 h-4" />
              </Button>
            </Link>
          </div>
        </motion.div>
      )}

      {/* Header */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Opportunities
          </h1>
          <p className="text-muted-foreground mt-1">
            {locked 
              ? `🔥 ${opportunities.length} exclusive opportunities available right now`
              : "Apply to campaigns that match your vibe"
            }
          </p>
        </div>
        
        {/* Stats Badge */}
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="bg-emerald-500/10 border-emerald-500/30 text-emerald-400 gap-1">
            <TrendingUp className="w-3 h-3" />
            12 ambassadors earned $2,400 last month
          </Badge>
        </div>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants}>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {OPPORTUNITY_TYPES.map((type) => (
              <Button
                key={type.value}
                variant={activeFilter === type.value ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(type.value)}
                className={activeFilter === type.value 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground"
                }
              >
                {type.label}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </motion.div>

      {/* Opportunities Grid */}
      {opportunities.length === 0 ? (
        <motion.div 
          variants={itemVariants}
          className="flex flex-col items-center justify-center py-16 text-center"
        >
          <div className="w-16 h-16 rounded-full bg-muted/50 flex items-center justify-center mb-4">
            <Briefcase className="w-8 h-8 text-muted-foreground" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-2">No opportunities right now</h3>
          <p className="text-muted-foreground max-w-sm">
            But you're in the right place. We drop new ones every week. 👀
          </p>
        </motion.div>
      ) : (
        <motion.div 
          className="grid grid-cols-1 gap-4"
          variants={containerVariants}
        >
          {opportunities.map((opportunity) => {
            const eligible = isEligible(opportunity);
            const applied = hasApplied(opportunity.id);
            const spotsRemaining = getSpotsRemaining(opportunity);
            const fillPercent = getSpotsFillPercent(opportunity);
            const daysRemaining = getDaysRemaining(opportunity.end_date);
            const isHovered = hoveredCard === opportunity.id;

            return (
              <motion.div
                key={opportunity.id}
                variants={itemVariants}
                onMouseEnter={() => setHoveredCard(opportunity.id)}
                onMouseLeave={() => setHoveredCard(null)}
                onClick={() => handleCardClick(opportunity)}
                className={`relative group overflow-hidden rounded-2xl transition-all duration-300 ${
                  locked 
                    ? 'cursor-default' 
                    : eligible && !applied
                      ? 'cursor-pointer hover:scale-[1.02]'
                      : 'cursor-default'
                } ${
                  opportunity.is_featured 
                    ? 'ring-2 ring-primary/50 ring-offset-2 ring-offset-background' 
                    : ''
                }`}
              >
                {/* Featured Glow Effect */}
                {opportunity.is_featured && (
                  <div className="absolute inset-0 bg-gradient-to-r from-primary/20 via-accent/20 to-primary/20 animate-gradient blur-xl" />
                )}

                {/* Card Content */}
                <div className={`relative glass-card p-5 h-full transition-opacity ${locked ? 'opacity-90' : ''}`}>
                  {/* Desktop: Horizontal Layout */}
                  <div className="flex flex-col md:flex-row gap-4">
                    {/* Brand Logo */}
                    <div className="flex-shrink-0">
                      {opportunity.brand_logo_url ? (
                        <img
                          src={opportunity.brand_logo_url}
                          alt={opportunity.brand_name}
                          className="w-20 h-20 rounded-xl object-cover border border-border/30"
                        />
                      ) : (
                        <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl">
                          {opportunity.brand_name.charAt(0)}
                        </div>
                      )}
                    </div>

                    {/* Details */}
                    <div className="flex-1 min-w-0 space-y-3">
                      {/* Header Row */}
                      <div className="flex flex-wrap items-start gap-2">
                        <div className="flex-1 min-w-0">
                          <p className="text-sm text-muted-foreground">{opportunity.brand_name}</p>
                          <h3 className="text-lg font-bold text-foreground truncate">{opportunity.title}</h3>
                        </div>
                        
                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          <Badge
                            variant="outline"
                            className={typeBadgeColors[opportunity.opportunity_type] || 'bg-secondary'}
                          >
                            {opportunity.opportunity_type}
                          </Badge>
                          {opportunity.is_featured && (
                            <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground gap-1">
                              <Flame className="w-3 h-3" />
                              Hot
                            </Badge>
                          )}
                        </div>
                      </div>

                      {/* Compensation - PROMINENT */}
                      {opportunity.compensation && (
                        <div className="flex items-center gap-2">
                          <span className="text-xl font-bold gradient-text">
                            {opportunity.compensation}
                          </span>
                        </div>
                      )}

                      {/* Short Description */}
                      {opportunity.short_description && (
                        <p className="text-sm text-muted-foreground line-clamp-2">
                          {opportunity.short_description}
                        </p>
                      )}

                      {/* Meta Info Row */}
                      <div className="flex flex-wrap items-center gap-4 text-sm text-muted-foreground">
                        {opportunity.location && (
                          <span className="flex items-center gap-1">
                            <MapPin className="w-3.5 h-3.5" />
                            {opportunity.location}
                          </span>
                        )}
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5" />
                          {formatDateRange(opportunity.start_date, opportunity.end_date)}
                        </span>
                        {viewerCounts[opportunity.id] && (
                          <span className="flex items-center gap-1 text-primary">
                            <Eye className="w-3.5 h-3.5" />
                            {viewerCounts[opportunity.id]} viewing
                          </span>
                        )}
                      </div>

                      {/* Urgency Indicators */}
                      <div className="flex flex-wrap items-center gap-3">
                        {/* Spots Remaining */}
                        {spotsRemaining !== null && (
                          <div className="flex items-center gap-2">
                            <Progress value={fillPercent} className="w-24 h-2" />
                            <span className={`text-sm font-medium ${
                              spotsRemaining <= 5 
                                ? 'text-destructive' 
                                : fillPercent >= 50 
                                  ? 'text-amber-400' 
                                  : 'text-muted-foreground'
                            }`}>
                              {spotsRemaining <= 5 ? (
                                <>Only {spotsRemaining} spots left!</>
                              ) : fillPercent >= 50 ? (
                                <>Filling Fast</>
                              ) : (
                                <>{spotsRemaining} spots</>
                              )}
                            </span>
                          </div>
                        )}

                        {/* Days Countdown */}
                        {daysRemaining !== null && daysRemaining <= 7 && (
                          <Badge variant="outline" className="text-amber-400 border-amber-400/30 bg-amber-500/10 gap-1">
                            <Clock className="w-3 h-3" />
                            Ends in {daysRemaining} day{daysRemaining !== 1 ? 's' : ''}
                          </Badge>
                        )}
                      </div>

                      {/* Action Row for Approved Users */}
                      {!locked && (
                        <div className="pt-2">
                          {!eligible ? (
                            <p className="text-sm text-muted-foreground">
                              Not available at your school
                            </p>
                          ) : applied ? (
                            <div className="flex items-center gap-2 text-emerald-400">
                              <Check className="w-5 h-5" />
                              <span className="font-medium">Applied</span>
                            </div>
                          ) : (
                            <Button 
                              size="sm" 
                              className="bg-primary hover:bg-primary/90 gap-2"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleCardClick(opportunity);
                              }}
                            >
                              Apply Now
                              <ChevronRight className="w-4 h-4" />
                            </Button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                {/* Lock Overlay for Unapproved Users */}
                {locked && (
                  <>
                    {/* Subtle gradient overlay */}
                    <div className="absolute inset-0 bg-gradient-to-t from-background/40 via-transparent to-transparent pointer-events-none" />
                    
                    {/* Lock icon in corner */}
                    <div className={`absolute top-4 right-4 transition-all duration-300 ${
                      isHovered ? 'scale-110' : ''
                    }`}>
                      <div className={`p-2 rounded-full bg-background/80 backdrop-blur-sm border border-border/50 ${
                        isHovered ? 'pulse-glow' : ''
                      }`}>
                        <Lock className={`w-4 h-4 text-primary ${isHovered ? 'animate-pulse' : ''}`} />
                      </div>
                    </div>

                    {/* Hover overlay with message */}
                    <AnimatePresence>
                      {isHovered && (
                        <motion.div
                          initial={{ opacity: 0 }}
                          animate={{ opacity: 1 }}
                          exit={{ opacity: 0 }}
                          className="absolute inset-0 flex items-center justify-center bg-background/60 backdrop-blur-[2px]"
                        >
                          <div className="text-center px-4">
                            <Lock className="w-8 h-8 text-primary mx-auto mb-2" />
                            <p className="text-sm font-medium text-foreground">
                              Complete your application to unlock
                            </p>
                            <Link href="/portal/boosts" onClick={(e) => e.stopPropagation()}>
                              <Button size="sm" variant="outline" className="mt-3 gap-2">
                                <Zap className="w-4 h-4" />
                                Boost Now
                              </Button>
                            </Link>
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

      {/* Social Proof Ticker */}
      <motion.div
        variants={itemVariants}
        className="fixed bottom-20 left-4 right-4 md:left-auto md:right-8 md:w-auto z-40"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={socialProof.name + socialProof.school}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-card/80 backdrop-blur-lg border border-border/50 shadow-lg"
          >
            <div className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
            <span className="text-sm text-muted-foreground">
              <span className="text-foreground font-medium">{socialProof.name}</span> from {socialProof.school} just applied
            </span>
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Opportunity Detail Drawer */}
      <Drawer open={drawerOpen} onOpenChange={setDrawerOpen}>
        <DrawerContent className="max-h-[90vh]">
          {selectedOpportunity && (
            <>
              <DrawerHeader className="text-left">
                <div className="flex items-start gap-4">
                  {selectedOpportunity.brand_logo_url ? (
                    <img
                      src={selectedOpportunity.brand_logo_url}
                      alt={selectedOpportunity.brand_name}
                      className="w-16 h-16 rounded-xl object-cover"
                    />
                  ) : (
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center text-primary-foreground font-bold text-2xl">
                      {selectedOpportunity.brand_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{selectedOpportunity.brand_name}</p>
                    <DrawerTitle className="text-xl">{selectedOpportunity.title}</DrawerTitle>
                    <div className="flex items-center gap-2 mt-2">
                      <Badge
                        variant="outline"
                        className={typeBadgeColors[selectedOpportunity.opportunity_type] || ''}
                      >
                        {selectedOpportunity.opportunity_type}
                      </Badge>
                      {selectedOpportunity.is_featured && (
                        <Badge className="bg-gradient-to-r from-primary to-accent text-primary-foreground gap-1">
                          <Flame className="w-3 h-3" />
                          Hot
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>
              </DrawerHeader>

              <div className="px-4 pb-4 space-y-4 overflow-y-auto">
                {/* Compensation - Prominent */}
                {selectedOpportunity.compensation && (
                  <div className="p-4 rounded-xl bg-gradient-to-r from-primary/10 to-accent/10 border border-primary/20">
                    <p className="text-sm text-muted-foreground mb-1">Compensation</p>
                    <p className="text-2xl font-bold gradient-text">{selectedOpportunity.compensation}</p>
                  </div>
                )}

                {/* Description */}
                {selectedOpportunity.description && (
                  <DrawerDescription className="text-foreground/80">
                    {selectedOpportunity.description}
                  </DrawerDescription>
                )}

                {/* Requirements */}
                {selectedOpportunity.requirements && selectedOpportunity.requirements.length > 0 && (
                  <div>
                    <h4 className="font-medium text-foreground mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {selectedOpportunity.requirements.map((req, i) => (
                        <li key={i} className="text-sm text-muted-foreground flex items-start gap-2">
                          <span className="text-primary mt-0.5">•</span>
                          {req}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Details Grid */}
                <div className="grid grid-cols-2 gap-4 text-sm">
                  {selectedOpportunity.location && (
                    <div>
                      <p className="text-muted-foreground">Location</p>
                      <p className="font-medium text-foreground">{selectedOpportunity.location}</p>
                    </div>
                  )}
                  <div>
                    <p className="text-muted-foreground">Dates</p>
                    <p className="font-medium text-foreground">
                      {formatDateRange(selectedOpportunity.start_date, selectedOpportunity.end_date)}
                    </p>
                  </div>
                  {selectedOpportunity.spots_total && (
                    <div className="col-span-2">
                      <p className="text-muted-foreground mb-1">
                        Spots: {(selectedOpportunity.spots_total - (selectedOpportunity.spots_filled || 0))} of {selectedOpportunity.spots_total} remaining
                      </p>
                      <Progress
                        value={getSpotsFillPercent(selectedOpportunity)}
                        className="h-2"
                      />
                    </div>
                  )}
                </div>
              </div>

              <DrawerFooter>
                {hasApplied(selectedOpportunity.id) ? (
                  <Button disabled className="w-full bg-emerald-600">
                    <Check className="w-4 h-4 mr-2" />
                    Applied
                  </Button>
                ) : (
                  <Button
                    onClick={handleApply}
                    disabled={applyMutation.isPending}
                    className="w-full"
                  >
                    {applyMutation.isPending ? 'Applying...' : 'Apply for this Opportunity'}
                  </Button>
                )}
                <DrawerClose asChild>
                  <Button variant="outline">Close</Button>
                </DrawerClose>
              </DrawerFooter>
            </>
          )}
        </DrawerContent>
      </Drawer>
    </motion.div>
  );
};
