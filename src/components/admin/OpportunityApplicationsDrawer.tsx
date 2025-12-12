import React, { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Search, Check, X, User, ExternalLink, ChevronLeft
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { toast } from '@/hooks/use-toast';

type Opportunity = Tables<'opportunities'>;
type OpportunityApplication = Tables<'opportunity_applications'>;
type Applicant = Tables<'applicants'>;

interface ApplicationWithApplicant extends OpportunityApplication {
  applicant: Applicant;
}

const APPLICATION_STATUSES = ['pending', 'approved', 'rejected'];

const statusStyles: Record<string, string> = {
  pending: 'bg-amber-500/20 text-amber-400',
  approved: 'bg-emerald-500/20 text-emerald-400',
  rejected: 'bg-red-500/20 text-red-400',
};

interface OpportunityApplicationsDrawerProps {
  opportunity: Opportunity | null;
  open: boolean;
  onClose: () => void;
}

export const OpportunityApplicationsDrawer: React.FC<OpportunityApplicationsDrawerProps> = ({
  opportunity,
  open,
  onClose,
}) => {
  const queryClient = useQueryClient();
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [applicantDetailOpen, setApplicantDetailOpen] = useState(false);
  const [selectedApplicant, setSelectedApplicant] = useState<Applicant | null>(null);

  // Fetch applications with applicant data
  const { data: applications = [], isLoading } = useQuery({
    queryKey: ['opportunity-applications', opportunity?.id],
    queryFn: async () => {
      if (!opportunity?.id) return [];
      const { data, error } = await supabase
        .from('opportunity_applications')
        .select('*, applicant:applicants(*)')
        .eq('opportunity_id', opportunity.id)
        .order('applied_at', { ascending: false });
      if (error) throw error;
      return data as unknown as ApplicationWithApplicant[];
    },
    enabled: !!opportunity?.id && open,
  });

  // Update application status
  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status, wasApproved }: { id: string; status: string; wasApproved: boolean }) => {
      const updates: Partial<OpportunityApplication> = { status };
      
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
      } else if (status !== 'approved') {
        updates.approved_at = null;
      }

      const { error } = await supabase
        .from('opportunity_applications')
        .update(updates)
        .eq('id', id);
      if (error) throw error;

      // Update spots_filled on opportunity
      if (opportunity && status === 'approved' && !wasApproved) {
        await supabase
          .from('opportunities')
          .update({ spots_filled: (opportunity.spots_filled || 0) + 1 })
          .eq('id', opportunity.id);
      } else if (opportunity && status !== 'approved' && wasApproved) {
        await supabase
          .from('opportunities')
          .update({ spots_filled: Math.max(0, (opportunity.spots_filled || 0) - 1) })
          .eq('id', opportunity.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-applications', opportunity?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      toast({ title: 'Status updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating status', description: error.message, variant: 'destructive' });
    },
  });

  // Bulk update mutation
  const bulkUpdateMutation = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      // Get current statuses to calculate spots_filled delta
      const currentApps = applications.filter(a => ids.includes(a.id));
      const currentlyApproved = currentApps.filter(a => a.status === 'approved').length;
      const willBeApproved = status === 'approved' ? ids.length : 0;
      const delta = willBeApproved - currentlyApproved;

      const updates: Partial<OpportunityApplication> = { status };
      if (status === 'approved') {
        updates.approved_at = new Date().toISOString();
      } else {
        updates.approved_at = null;
      }

      const { error } = await supabase
        .from('opportunity_applications')
        .update(updates)
        .in('id', ids);
      if (error) throw error;

      // Update spots_filled
      if (opportunity && delta !== 0) {
        await supabase
          .from('opportunities')
          .update({ spots_filled: Math.max(0, (opportunity.spots_filled || 0) + delta) })
          .eq('id', opportunity.id);
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['opportunity-applications', opportunity?.id] });
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      setSelectedIds(new Set());
      toast({ title: 'Applications updated' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error updating applications', description: error.message, variant: 'destructive' });
    },
  });

  // Filter applications
  const filteredApplications = applications.filter((app) => {
    const applicant = app.applicant;
    const matchesSearch = 
      applicant.instagram_handle.toLowerCase().includes(searchQuery.toLowerCase()) ||
      `${applicant.first_name || ''} ${applicant.last_name || ''}`.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || app.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  const toggleSelect = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) {
      newSet.delete(id);
    } else {
      newSet.add(id);
    }
    setSelectedIds(newSet);
  };

  const toggleSelectAll = () => {
    if (selectedIds.size === filteredApplications.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(filteredApplications.map(a => a.id)));
    }
  };

  const handleStatusChange = (app: ApplicationWithApplicant, newStatus: string) => {
    updateStatusMutation.mutate({
      id: app.id,
      status: newStatus,
      wasApproved: app.status === 'approved',
    });
  };

  const handleBulkAction = (status: string) => {
    if (selectedIds.size === 0) return;
    bulkUpdateMutation.mutate({ ids: Array.from(selectedIds), status });
  };

  const viewApplicant = (applicant: Applicant) => {
    setSelectedApplicant(applicant);
    setApplicantDetailOpen(true);
  };

  if (!opportunity) return null;

  return (
    <>
      <Sheet open={open} onOpenChange={(o) => !o && onClose()}>
        <SheetContent className="w-full sm:max-w-2xl overflow-y-auto">
          <SheetHeader>
            <SheetTitle className="flex items-center gap-2">
              <Button variant="ghost" size="icon" onClick={onClose} className="mr-2">
                <ChevronLeft className="w-4 h-4" />
              </Button>
              Applications for "{opportunity.title}"
            </SheetTitle>
            <SheetDescription>
              {applications.length} application{applications.length !== 1 ? 's' : ''} received
            </SheetDescription>
          </SheetHeader>

          <div className="mt-6 space-y-4">
            {/* Filters */}
            <div className="flex flex-col sm:flex-row gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder="Search by handle or name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-32">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All</SelectItem>
                  {APPLICATION_STATUSES.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status.charAt(0).toUpperCase() + status.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {/* Bulk Actions */}
            {selectedIds.size > 0 && (
              <div className="flex items-center gap-3 p-3 bg-muted/50 rounded-lg">
                <span className="text-sm text-muted-foreground">
                  {selectedIds.size} selected
                </span>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('approved')}
                  disabled={bulkUpdateMutation.isPending}
                  className="text-emerald-400 border-emerald-500/50 hover:bg-emerald-500/10"
                >
                  <Check className="w-3 h-3 mr-1" />
                  Approve Selected
                </Button>
                <Button
                  size="sm"
                  variant="outline"
                  onClick={() => handleBulkAction('rejected')}
                  disabled={bulkUpdateMutation.isPending}
                  className="text-red-400 border-red-500/50 hover:bg-red-500/10"
                >
                  <X className="w-3 h-3 mr-1" />
                  Reject Selected
                </Button>
              </div>
            )}

            {/* Applications Table */}
            <div className="border border-border rounded-lg overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-10">
                      <Checkbox
                        checked={filteredApplications.length > 0 && selectedIds.size === filteredApplications.length}
                        onCheckedChange={toggleSelectAll}
                      />
                    </TableHead>
                    <TableHead>Applicant</TableHead>
                    <TableHead>School</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Applied</TableHead>
                    <TableHead className="w-28">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {isLoading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        Loading...
                      </TableCell>
                    </TableRow>
                  ) : filteredApplications.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                        No applications found
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredApplications.map((app) => (
                      <TableRow key={app.id}>
                        <TableCell>
                          <Checkbox
                            checked={selectedIds.has(app.id)}
                            onCheckedChange={() => toggleSelect(app.id)}
                          />
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {app.applicant.instagram_profile_pic ? (
                              <img
                                src={app.applicant.instagram_profile_pic}
                                alt=""
                                className="w-8 h-8 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center">
                                <User className="w-4 h-4 text-muted-foreground" />
                              </div>
                            )}
                            <div>
                              <p className="font-medium text-sm">@{app.applicant.instagram_handle}</p>
                              <p className="text-xs text-muted-foreground">
                                {app.applicant.first_name} {app.applicant.last_name}
                              </p>
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">{app.applicant.school}</TableCell>
                        <TableCell>
                          <Select
                            value={app.status || 'pending'}
                            onValueChange={(v) => handleStatusChange(app, v)}
                          >
                            <SelectTrigger className="w-28 h-8">
                              <Badge className={`${statusStyles[app.status || 'pending']} border-0`}>
                                {app.status || 'pending'}
                              </Badge>
                            </SelectTrigger>
                            <SelectContent>
                              {APPLICATION_STATUSES.map((status) => (
                                <SelectItem key={status} value={status}>
                                  {status.charAt(0).toUpperCase() + status.slice(1)}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">
                          {format(new Date(app.applied_at), 'MMM d, yyyy')}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => viewApplicant(app.applicant)}
                            >
                              <ExternalLink className="w-3 h-3" />
                            </Button>
                            {app.status !== 'approved' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(app, 'approved')}
                                className="text-emerald-400 hover:text-emerald-300"
                              >
                                <Check className="w-3 h-3" />
                              </Button>
                            )}
                            {app.status !== 'rejected' && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => handleStatusChange(app, 'rejected')}
                                className="text-red-400 hover:text-red-300"
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      {/* Applicant Detail Modal */}
      <Dialog open={applicantDetailOpen} onOpenChange={setApplicantDetailOpen}>
        <DialogContent className="max-w-lg max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applicant Details</DialogTitle>
          </DialogHeader>
          {selectedApplicant && (
            <div className="space-y-4">
              <div className="flex items-center gap-4">
                {selectedApplicant.instagram_profile_pic ? (
                  <img
                    src={selectedApplicant.instagram_profile_pic}
                    alt=""
                    className="w-16 h-16 rounded-full object-cover"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <p className="font-semibold text-lg">@{selectedApplicant.instagram_handle}</p>
                  <p className="text-muted-foreground">
                    {selectedApplicant.first_name} {selectedApplicant.last_name}
                  </p>
                  <p className="text-sm text-muted-foreground">{selectedApplicant.email}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                <div>
                  <p className="text-muted-foreground">School</p>
                  <p className="font-medium">{selectedApplicant.school}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Ambassador Type</p>
                  <p className="font-medium">{selectedApplicant.ambassador_type}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Followers</p>
                  <p className="font-medium">{selectedApplicant.instagram_followers?.toLocaleString() || 'N/A'}</p>
                </div>
                <div>
                  <p className="text-muted-foreground">Points</p>
                  <p className="font-medium">{selectedApplicant.points}</p>
                </div>
              </div>

              {selectedApplicant.personality_traits.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Personality</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedApplicant.personality_traits.map((trait) => (
                      <Badge key={trait} variant="outline" className="text-xs">
                        {trait}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              {selectedApplicant.interests.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Interests</p>
                  <div className="flex flex-wrap gap-1">
                    {selectedApplicant.interests.map((interest) => (
                      <Badge key={interest} variant="outline" className="text-xs">
                        {interest}
                      </Badge>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  asChild
                >
                  <a
                    href={`https://instagram.com/${selectedApplicant.instagram_handle}`}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    View Instagram
                    <ExternalLink className="w-3 h-3 ml-1" />
                  </a>
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
