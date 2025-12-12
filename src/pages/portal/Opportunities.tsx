import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { motion } from 'framer-motion';
import { Briefcase, Lock, MapPin, Calendar, Users, Check, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { ScrollArea, ScrollBar } from '@/components/ui/scroll-area';
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
import { PortalEmpty } from '@/components/portal/PortalEmpty';

type Opportunity = Tables<'opportunities'>;
type OpportunityApplication = Tables<'opportunity_applications'>;

const OPPORTUNITY_TYPES = ['All', 'Sampling', 'Events', 'Content', 'Promotions'];

const typeBadgeColors: Record<string, string> = {
  Sampling: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
  Events: 'bg-purple-500/20 text-purple-400 border-purple-500/30',
  Content: 'bg-blue-500/20 text-blue-400 border-blue-500/30',
  Promotions: 'bg-amber-500/20 text-amber-400 border-amber-500/30',
};

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.08 } }
};

const itemVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } }
};

export const PortalOpportunities: React.FC = () => {
  const { applicant } = usePortalAuth();
  const queryClient = useQueryClient();
  const [activeFilter, setActiveFilter] = useState('All');
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const isApproved = applicant?.status === 'accepted';

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

      if (activeFilter !== 'All') {
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
        title: "Application submitted!",
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

  const spotsProgress = (filled: number | null, total: number | null) => {
    if (!total) return 0;
    return ((filled || 0) / total) * 100;
  };

  if (isLoading) {
    return <OpportunitiesSkeleton />;
  }

  if (error) {
    return <PortalError onRetry={refetch} />;
  }

  return (
    <motion.div 
      className="space-y-6"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {/* Header */}
      <motion.div variants={itemVariants}>
        <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
          <Briefcase className="w-6 h-6 text-primary" />
          Opportunities
        </h1>
        <p className="text-muted-foreground mt-1">
          {isApproved
            ? "Apply to campaigns that match your vibe"
            : "Get approved to unlock exclusive opportunities"}
        </p>
      </motion.div>

      {/* Filter Tabs */}
      <motion.div variants={itemVariants}>
        <ScrollArea className="w-full">
          <div className="flex gap-2 pb-2">
            {OPPORTUNITY_TYPES.map((type) => (
              <Button
                key={type}
                variant={activeFilter === type ? "default" : "outline"}
                size="sm"
                onClick={() => setActiveFilter(type)}
                className={activeFilter === type 
                  ? "bg-primary text-primary-foreground" 
                  : "bg-card/50 border-border/50 text-muted-foreground hover:text-foreground"
                }
              >
                {type}
              </Button>
            ))}
          </div>
          <ScrollBar orientation="horizontal" />
        </ScrollArea>
      </motion.div>

      {/* Opportunities Grid */}
      {opportunities.length === 0 ? (
        <PortalEmpty type="opportunities" />
      ) : (
        <motion.div 
          className="grid grid-cols-1 md:grid-cols-2 gap-4"
          variants={containerVariants}
        >
          {opportunities.map((opportunity, index) => {
            const eligible = isEligible(opportunity);
            const applied = hasApplied(opportunity.id);
            const locked = !isApproved;

            return (
              <motion.div
                key={opportunity.id}
                variants={itemVariants}
                onClick={() => handleCardClick(opportunity)}
                className={`relative bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 transition-all ${
                  locked || !eligible
                    ? 'cursor-default'
                    : 'cursor-pointer hover:border-primary/50 hover:bg-card/70 hover:scale-[1.01]'
                }`}
              >
                {/* Card Content */}
                <div className={locked ? 'opacity-40' : ''}>
                  {/* Brand Header */}
                  <div className="flex items-start gap-3 mb-3">
                    {opportunity.brand_logo_url ? (
                      <img
                        src={opportunity.brand_logo_url}
                        alt={opportunity.brand_name}
                        className="w-12 h-12 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-12 h-12 rounded-lg bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center text-primary-foreground font-bold text-lg">
                        {opportunity.brand_name.charAt(0)}
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-muted-foreground">{opportunity.brand_name}</p>
                      <h3 className="font-semibold text-foreground truncate">{opportunity.title}</h3>
                    </div>
                    <Badge
                      variant="outline"
                      className={typeBadgeColors[opportunity.opportunity_type] || 'bg-secondary'}
                    >
                      {opportunity.opportunity_type}
                    </Badge>
                  </div>

                  {/* Short Description */}
                  {opportunity.short_description && (
                    <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                      {opportunity.short_description}
                    </p>
                  )}

                  {/* Details */}
                  <div className="space-y-2 text-sm">
                    {opportunity.compensation && (
                      <div className="flex items-center gap-2 text-emerald-400">
                        <span className="font-medium">{opportunity.compensation}</span>
                      </div>
                    )}

                    <div className="flex items-center gap-4 text-muted-foreground">
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
                    </div>

                    {opportunity.spots_total && (
                      <div className="space-y-1">
                        <div className="flex items-center justify-between text-xs">
                          <span className="flex items-center gap-1 text-muted-foreground">
                            <Users className="w-3 h-3" />
                            {(opportunity.spots_total - (opportunity.spots_filled || 0))} of {opportunity.spots_total} spots left
                          </span>
                        </div>
                        <Progress
                          value={spotsProgress(opportunity.spots_filled, opportunity.spots_total)}
                          className="h-1.5"
                        />
                      </div>
                    )}
                  </div>

                  {/* Eligibility / Apply Status */}
                  {isApproved && !locked && (
                    <div className="mt-3 pt-3 border-t border-border/30">
                      {!eligible ? (
                        <p className="text-sm text-muted-foreground">
                          Not available at your school
                        </p>
                      ) : applied ? (
                        <div className="flex items-center gap-1 text-sm text-emerald-400">
                          <Check className="w-4 h-4" />
                          Applied
                        </div>
                      ) : (
                        <div className="flex items-center gap-1 text-sm text-primary">
                          Apply <ChevronRight className="w-4 h-4" />
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Lock Overlay */}
                {locked && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-background/60 backdrop-blur-[2px] rounded-xl">
                    <Lock className="w-8 h-8 text-muted-foreground mb-2" />
                    <p className="text-sm text-muted-foreground">Get approved to unlock</p>
                  </div>
                )}
              </motion.div>
            );
          })}
        </motion.div>
      )}

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
                    <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center text-primary-foreground font-bold text-2xl">
                      {selectedOpportunity.brand_name.charAt(0)}
                    </div>
                  )}
                  <div className="flex-1">
                    <p className="text-sm text-muted-foreground">{selectedOpportunity.brand_name}</p>
                    <DrawerTitle className="text-xl">{selectedOpportunity.title}</DrawerTitle>
                    <Badge
                      variant="outline"
                      className={`mt-2 ${typeBadgeColors[selectedOpportunity.opportunity_type] || ''}`}
                    >
                      {selectedOpportunity.opportunity_type}
                    </Badge>
                  </div>
                </div>
              </DrawerHeader>

              <div className="px-4 pb-4 space-y-4 overflow-y-auto">
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
                  {selectedOpportunity.compensation && (
                    <div>
                      <p className="text-muted-foreground">Compensation</p>
                      <p className="font-medium text-emerald-400">{selectedOpportunity.compensation}</p>
                    </div>
                  )}
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
                    <div>
                      <p className="text-muted-foreground">Spots</p>
                      <p className="font-medium text-foreground">
                        {(selectedOpportunity.spots_total - (selectedOpportunity.spots_filled || 0))} of {selectedOpportunity.spots_total} remaining
                      </p>
                    </div>
                  )}
                </div>

                {/* Spots Progress */}
                {selectedOpportunity.spots_total && (
                  <Progress
                    value={spotsProgress(selectedOpportunity.spots_filled, selectedOpportunity.spots_total)}
                    className="h-2"
                  />
                )}
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
