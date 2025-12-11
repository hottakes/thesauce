import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { useToast } from '@/hooks/use-toast';
import { format, parseISO } from 'date-fns';
import { Search, Filter, Download, Trash2, Eye, ChevronLeft, ChevronRight, Check, Upload, Video, Mic, Play, Image, X, User, CheckCircle } from 'lucide-react';

const STATUS_OPTIONS = ['new', 'reviewed', 'contacted', 'accepted', 'rejected'];

export const AdminApplicants = () => {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  const [viewApplicant, setViewApplicant] = useState<any>(null);
  const [showFilters, setShowFilters] = useState(false);
  const perPage = 25;
  
  const { toast } = useToast();
  const queryClient = useQueryClient();

  // Fetch schools for filter
  const { data: schools } = useQuery({
    queryKey: ['admin-schools-filter'],
    queryFn: async () => {
      const { data } = await supabase.from('schools').select('name').order('sort_order');
      return data || [];
    },
  });

  // Fetch applicants
  const { data: applicantsData, isLoading } = useQuery({
    queryKey: ['admin-applicants', search, statusFilter, schoolFilter, page],
    queryFn: async () => {
      let query = supabase
        .from('applicants')
        .select('*', { count: 'exact' })
        .order('created_at', { ascending: false });

      if (search) {
        query = query.or(`instagram_handle.ilike.%${search}%,email.ilike.%${search}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('status', statusFilter);
      }
      if (schoolFilter !== 'all') {
        query = query.eq('school', schoolFilter);
      }

      const from = (page - 1) * perPage;
      const to = from + perPage - 1;
      query = query.range(from, to);

      const { data, count } = await query;
      return { data: data || [], count: count || 0 };
    },
  });

  // Update status mutation
  const updateStatus = useMutation({
    mutationFn: async ({ ids, status }: { ids: string[]; status: string }) => {
      const { error } = await supabase
        .from('applicants')
        .update({ status })
        .in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applicants'] });
      setSelectedIds([]);
      toast({ title: 'Status updated successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteApplicants = useMutation({
    mutationFn: async (ids: string[]) => {
      const { error } = await supabase.from('applicants').delete().in('id', ids);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applicants'] });
      setSelectedIds([]);
      toast({ title: 'Applicants deleted' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const handleSelectAll = () => {
    if (selectedIds.length === applicantsData?.data.length) {
      setSelectedIds([]);
    } else {
      setSelectedIds(applicantsData?.data.map((a) => a.id) || []);
    }
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((i) => i !== id) : [...prev, id]
    );
  };

  const exportCSV = () => {
    if (!applicantsData?.data.length) return;
    const headers = ['Instagram', 'Email', 'School', 'Status', 'Ambassador Type', 'Position', 'Points', 'Applied'];
    const rows = applicantsData.data.map((a) => [
      a.instagram_handle,
      a.email || '',
      a.school,
      a.status,
      a.ambassador_type,
      a.waitlist_position,
      a.points,
      format(parseISO(a.created_at), 'yyyy-MM-dd HH:mm'),
    ]);
    const csv = [headers, ...rows].map((r) => r.join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `applicants-${format(new Date(), 'yyyy-MM-dd')}.csv`;
    a.click();
  };

  const totalPages = Math.ceil((applicantsData?.count || 0) / perPage);

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold">Applicants</h1>
          <p className="text-muted-foreground">{applicantsData?.count || 0} total applicants</p>
        </div>
        <Button onClick={exportCSV} variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Export CSV
        </Button>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search by Instagram or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[150px]">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={schoolFilter} onValueChange={setSchoolFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="School" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Schools</SelectItem>
                {schools?.map((s) => (
                  <SelectItem key={s.name} value={s.name}>
                    {s.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Bulk Actions */}
      {selectedIds.length > 0 && (
        <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
          <span className="text-sm font-medium">{selectedIds.length} selected</span>
          <Select
            onValueChange={(status) => updateStatus.mutate({ ids: selectedIds, status })}
          >
            <SelectTrigger className="w-[150px]">
              <SelectValue placeholder="Change status" />
            </SelectTrigger>
            <SelectContent>
              {STATUS_OPTIONS.map((s) => (
                <SelectItem key={s} value={s}>
                  {s.charAt(0).toUpperCase() + s.slice(1)}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button
            variant="destructive"
            size="sm"
            onClick={() => {
              if (confirm('Delete selected applicants?')) {
                deleteApplicants.mutate(selectedIds);
              }
            }}
          >
            <Trash2 className="h-4 w-4 mr-2" />
            Delete
          </Button>
        </div>
      )}

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th className="p-4">
                    <Checkbox
                      checked={selectedIds.length === applicantsData?.data.length && applicantsData?.data.length > 0}
                      onCheckedChange={handleSelectAll}
                    />
                  </th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Instagram</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">School</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Position</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Content</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Pitch</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Applied</th>
                  <th className="text-left p-4 text-sm font-medium text-muted-foreground">Applied</th>
                  <th className="p-4"></th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      Loading...
                    </td>
                  </tr>
                ) : applicantsData?.data.length === 0 ? (
                  <tr>
                    <td colSpan={10} className="p-8 text-center text-muted-foreground">
                      No applicants found
                    </td>
                  </tr>
                ) : (
                  applicantsData?.data.map((applicant) => (
                    <tr
                      key={applicant.id}
                      className="border-b border-border/50 hover:bg-secondary/50 cursor-pointer"
                      onClick={() => setViewApplicant(applicant)}
                    >
                      <td className="p-4" onClick={(e) => e.stopPropagation()}>
                        <Checkbox
                          checked={selectedIds.includes(applicant.id)}
                          onCheckedChange={() => handleSelect(applicant.id)}
                        />
                      </td>
                      <td className="p-4 text-sm font-medium">@{applicant.instagram_handle}</td>
                      <td className="p-4 text-sm text-muted-foreground">{applicant.school}</td>
                      <td className="p-4">
                        <Badge variant={applicant.status === 'accepted' ? 'default' : 'secondary'}>
                          {applicant.status}
                        </Badge>
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">{applicant.ambassador_type}</td>
                      <td className="p-4 text-sm">#{applicant.waitlist_position}</td>
                      <td className="p-4">
                        {(applicant.content_urls as string[])?.length > 0 ? (
                          <span className="text-sm font-medium text-green-600">
                            {(applicant.content_urls as string[]).length} files
                          </span>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4">
                        {applicant.pitch_url ? (
                          <Badge variant="secondary" className="text-xs">
                            {applicant.pitch_type === 'video' ? '🎥 Video' : '🎤 Audio'}
                          </Badge>
                        ) : (
                          <span className="text-muted-foreground">—</span>
                        )}
                      </td>
                      <td className="p-4 text-sm text-muted-foreground">
                        {format(parseISO(applicant.created_at), 'MMM d')}
                      </td>
                      <td className="p-4">
                        <Button variant="ghost" size="icon">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>

      {/* Pagination */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          Showing {((page - 1) * perPage) + 1}-{Math.min(page * perPage, applicantsData?.count || 0)} of {applicantsData?.count || 0}
        </p>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            disabled={page === 1}
            onClick={() => setPage((p) => p - 1)}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button
            variant="outline"
            size="sm"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* View Dialog */}
      <Dialog open={!!viewApplicant} onOpenChange={() => setViewApplicant(null)}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Applicant Details</DialogTitle>
          </DialogHeader>
          {viewApplicant && (
            <div className="space-y-6">
              {/* Instagram Profile Card */}
              <div className="flex items-center gap-4 p-4 bg-secondary rounded-lg">
                {viewApplicant.instagram_profile_pic ? (
                  <img
                    src={viewApplicant.instagram_profile_pic}
                    alt={viewApplicant.instagram_handle}
                    className="w-16 h-16 rounded-full object-cover border-2 border-primary"
                  />
                ) : (
                  <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center border-2 border-border">
                    <User className="w-8 h-8 text-muted-foreground" />
                  </div>
                )}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-lg">@{viewApplicant.instagram_handle}</span>
                    {viewApplicant.instagram_verified && (
                      <CheckCircle className="w-5 h-5 text-blue-500 fill-blue-500" />
                    )}
                  </div>
                  {viewApplicant.instagram_followers !== null && (
                    <p className="text-sm text-muted-foreground">
                      <span className="text-primary font-medium">
                        {viewApplicant.instagram_followers >= 1000000 
                          ? `${(viewApplicant.instagram_followers / 1000000).toFixed(1)}M` 
                          : viewApplicant.instagram_followers >= 1000 
                          ? `${(viewApplicant.instagram_followers / 1000).toFixed(1)}K`
                          : viewApplicant.instagram_followers}
                      </span>{" "}
                      followers
                    </p>
                  )}
                </div>
                <a 
                  href={`https://instagram.com/${viewApplicant.instagram_handle}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-primary hover:underline text-sm"
                >
                  View Profile →
                </a>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Email</p>
                  <p className="font-medium">{viewApplicant.email || '—'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">School</p>
                  <p className="font-medium">{viewApplicant.school}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Age Verified</p>
                  <p className="font-medium">{viewApplicant.is_19_plus ? 'Yes' : 'No'}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Ambassador Type</p>
                  <p className="font-medium">{viewApplicant.ambassador_type}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Personality Traits</p>
                <div className="flex flex-wrap gap-2">
                  {viewApplicant.personality_traits?.map((trait: string) => (
                    <Badge key={trait} variant="secondary">{trait}</Badge>
                  ))}
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Interests</p>
                <div className="flex flex-wrap gap-2">
                  {viewApplicant.interests?.map((interest: string) => (
                    <Badge key={interest} variant="secondary">{interest}</Badge>
                  ))}
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Household Size</p>
                  <p className="font-medium">{viewApplicant.household_size}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Content Uploaded</p>
                  <p className="font-medium">{viewApplicant.content_uploaded ? 'Yes' : 'No'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Scene Types</p>
                <div className="flex flex-wrap gap-2">
                  {viewApplicant.scene_types?.map((scene: string) => (
                    <Badge key={scene} variant="secondary">{scene}</Badge>
                  ))}
                </div>
              </div>

              {/* Uploaded Content Section */}
              {(viewApplicant.content_urls as string[])?.length > 0 && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">Uploaded Content ({(viewApplicant.content_urls as string[]).length} files)</p>
                  <div className="grid grid-cols-3 gap-2">
                    {(viewApplicant.content_urls as string[]).map((url: string, idx: number) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden bg-secondary">
                        {url.includes('.mp4') || url.includes('.mov') || url.includes('.webm') ? (
                          <video src={url} className="w-full h-full object-cover" />
                        ) : (
                          <img src={url} alt={`Content ${idx + 1}`} className="w-full h-full object-cover" />
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pitch Recording Section */}
              {viewApplicant.pitch_url && (
                <div>
                  <p className="text-sm text-muted-foreground mb-2">
                    Pitch Recording ({viewApplicant.pitch_type === 'video' ? '🎥 Video' : '🎤 Audio'})
                  </p>
                  {viewApplicant.pitch_type === 'video' ? (
                    <video
                      src={viewApplicant.pitch_url}
                      controls
                      className="w-full max-w-md rounded-lg"
                    />
                  ) : (
                    <audio
                      src={viewApplicant.pitch_url}
                      controls
                      className="w-full max-w-md"
                    />
                  )}
                </div>
              )}

              <div className="grid grid-cols-3 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Ambassador Type</p>
                  <p className="font-medium">{viewApplicant.ambassador_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Position</p>
                  <p className="font-medium">#{viewApplicant.waitlist_position}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Points</p>
                  <p className="font-medium">{viewApplicant.points}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-muted-foreground mb-2">Status</p>
                <Select
                  value={viewApplicant.status}
                  onValueChange={(status) => {
                    updateStatus.mutate({ ids: [viewApplicant.id], status });
                    setViewApplicant({ ...viewApplicant, status });
                  }}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUS_OPTIONS.map((s) => (
                      <SelectItem key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
