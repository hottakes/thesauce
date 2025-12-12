import React, { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { 
  Briefcase, Plus, Search, Edit, Trash2, Users,
  MoreHorizontal, Upload, X, Image as ImageIcon
} from 'lucide-react';
import { OpportunityApplicationsDrawer } from '@/components/admin/OpportunityApplicationsDrawer';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { Tables } from '@/integrations/supabase/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Switch } from '@/components/ui/switch';
import { toast } from '@/hooks/use-toast';

type Opportunity = Tables<'opportunities'>;
type School = Tables<'schools'>;

const OPPORTUNITY_TYPES = ['Sampling', 'Events', 'Content', 'Tabling', 'Promotions'];
const STATUSES = ['draft', 'active', 'completed', 'cancelled'];

const statusStyles: Record<string, string> = {
  draft: 'bg-zinc-500/20 text-zinc-400',
  active: 'bg-emerald-500/20 text-emerald-400',
  completed: 'bg-blue-500/20 text-blue-400',
  cancelled: 'bg-red-500/20 text-red-400',
};

const emptyOpportunity = {
  title: '',
  brand_name: '',
  opportunity_type: 'Sampling',
  status: 'draft',
  short_description: '',
  description: '',
  compensation: '',
  location: '',
  start_date: '',
  end_date: '',
  spots_total: 10,
  spots_filled: 0,
  is_featured: false,
  requirements: [] as string[],
  schools: [] as string[],
  brand_logo_url: '',
};

export const AdminOpportunities: React.FC = () => {
  const queryClient = useQueryClient();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [typeFilter, setTypeFilter] = useState<string>('all');
  const [editModalOpen, setEditModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [selectedOpportunity, setSelectedOpportunity] = useState<Opportunity | null>(null);
  const [formData, setFormData] = useState(emptyOpportunity);
  const [requirements, setRequirements] = useState<string[]>([]);
  const [isUploading, setIsUploading] = useState(false);
  const [applicationsDrawerOpen, setApplicationsDrawerOpen] = useState(false);
  const [applicationsOpportunity, setApplicationsOpportunity] = useState<Opportunity | null>(null);

  // Fetch opportunities
  const { data: opportunities = [], isLoading } = useQuery({
    queryKey: ['admin-opportunities'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunities')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data as Opportunity[];
    },
  });

  // Fetch schools for multi-select
  const { data: schools = [] } = useQuery({
    queryKey: ['schools-list'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .eq('is_active', true)
        .order('sort_order');
      if (error) throw error;
      return data as School[];
    },
  });

  // Fetch application counts
  const { data: applicationCounts = {} } = useQuery({
    queryKey: ['opportunity-application-counts'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('opportunity_applications')
        .select('opportunity_id');
      if (error) throw error;
      
      const counts: Record<string, number> = {};
      data.forEach((app) => {
        counts[app.opportunity_id] = (counts[app.opportunity_id] || 0) + 1;
      });
      return counts;
    },
  });

  // Create/Update mutation
  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        title: data.title,
        brand_name: data.brand_name,
        opportunity_type: data.opportunity_type,
        status: data.status,
        short_description: data.short_description || null,
        description: data.description || null,
        compensation: data.compensation || null,
        location: data.location || null,
        start_date: data.start_date || null,
        end_date: data.end_date || null,
        spots_total: data.spots_total,
        spots_filled: data.spots_filled,
        is_featured: data.is_featured,
        requirements: data.requirements,
        schools: data.schools,
        brand_logo_url: data.brand_logo_url || null,
      };

      if (data.id) {
        const { error } = await supabase
          .from('opportunities')
          .update(payload)
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const { error } = await supabase
          .from('opportunities')
          .insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      setEditModalOpen(false);
      toast({ title: selectedOpportunity ? 'Opportunity updated' : 'Opportunity created' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error saving opportunity', description: error.message, variant: 'destructive' });
    },
  });

  // Delete mutation
  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      // First delete related applications
      await supabase
        .from('opportunity_applications')
        .delete()
        .eq('opportunity_id', id);
      
      const { error } = await supabase
        .from('opportunities')
        .delete()
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-opportunities'] });
      queryClient.invalidateQueries({ queryKey: ['opportunity-application-counts'] });
      setDeleteDialogOpen(false);
      setEditModalOpen(false);
      toast({ title: 'Opportunity deleted' });
    },
    onError: (error: Error) => {
      toast({ title: 'Error deleting opportunity', description: error.message, variant: 'destructive' });
    },
  });

  // Filter opportunities
  const filteredOpportunities = opportunities.filter((opp) => {
    const matchesSearch = 
      opp.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      opp.brand_name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === 'all' || opp.status === statusFilter;
    const matchesType = typeFilter === 'all' || opp.opportunity_type === typeFilter;
    return matchesSearch && matchesStatus && matchesType;
  });

  // Stats
  const stats = {
    total: opportunities.length,
    active: opportunities.filter((o) => o.status === 'active').length,
    draft: opportunities.filter((o) => o.status === 'draft').length,
    completed: opportunities.filter((o) => o.status === 'completed').length,
  };

  const handleOpenCreate = () => {
    setSelectedOpportunity(null);
    setFormData(emptyOpportunity);
    setRequirements([]);
    setEditModalOpen(true);
  };

  const handleOpenEdit = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setFormData({
      title: opportunity.title,
      brand_name: opportunity.brand_name,
      opportunity_type: opportunity.opportunity_type,
      status: opportunity.status || 'draft',
      short_description: opportunity.short_description || '',
      description: opportunity.description || '',
      compensation: opportunity.compensation || '',
      location: opportunity.location || '',
      start_date: opportunity.start_date || '',
      end_date: opportunity.end_date || '',
      spots_total: opportunity.spots_total || 10,
      spots_filled: opportunity.spots_filled || 0,
      is_featured: opportunity.is_featured || false,
      requirements: opportunity.requirements || [],
      schools: opportunity.schools || [],
      brand_logo_url: opportunity.brand_logo_url || '',
    });
    setRequirements(opportunity.requirements || []);
    setEditModalOpen(true);
  };

  const handleSave = () => {
    if (!formData.title.trim() || !formData.brand_name.trim()) {
      toast({ title: 'Title and Brand Name are required', variant: 'destructive' });
      return;
    }

    saveMutation.mutate({
      ...formData,
      requirements: requirements.filter((r) => r.trim().length > 0),
      id: selectedOpportunity?.id,
    });
  };

  const handleDelete = (opportunity: Opportunity) => {
    setSelectedOpportunity(opportunity);
    setDeleteDialogOpen(true);
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      toast({ title: 'Please upload an image file', variant: 'destructive' });
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      toast({ title: 'Image must be less than 5MB', variant: 'destructive' });
      return;
    }

    setIsUploading(true);
    const filename = `brand-logos/${Date.now()}_${file.name}`;
    
    const { data, error } = await supabase.storage
      .from('applicant-content')
      .upload(filename, file);

    if (error) {
      toast({ title: 'Upload failed', description: error.message, variant: 'destructive' });
      setIsUploading(false);
      return;
    }

    const { data: urlData } = supabase.storage
      .from('applicant-content')
      .getPublicUrl(filename);

    setFormData({ ...formData, brand_logo_url: urlData.publicUrl });
    setIsUploading(false);
    toast({ title: 'Logo uploaded' });
  };

  const toggleSchool = (schoolName: string) => {
    const current = formData.schools;
    if (current.includes(schoolName)) {
      setFormData({ ...formData, schools: current.filter((s) => s !== schoolName) });
    } else {
      setFormData({ ...formData, schools: [...current, schoolName] });
    }
  };

  const addRequirement = () => {
    setRequirements([...requirements, '']);
  };

  const updateRequirement = (index: number, value: string) => {
    const updated = [...requirements];
    updated[index] = value;
    setRequirements(updated);
  };

  const removeRequirement = (index: number) => {
    setRequirements(requirements.filter((_, i) => i !== index));
  };

  const formatDateRange = (start: string | null, end: string | null) => {
    if (!start && !end) return '—';
    if (start && end) {
      return `${format(new Date(start), 'MMM d')} - ${format(new Date(end), 'MMM d, yyyy')}`;
    }
    if (start) return `Starts ${format(new Date(start), 'MMM d, yyyy')}`;
    return '—';
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground flex items-center gap-2">
            <Briefcase className="w-6 h-6 text-primary" />
            Opportunities
          </h1>
          <p className="text-muted-foreground">Manage brand campaigns and opportunities</p>
        </div>
        <Button onClick={handleOpenCreate}>
          <Plus className="w-4 h-4 mr-2" />
          Add Opportunity
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-foreground">{stats.total}</p>
          <p className="text-sm text-muted-foreground">Total</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-emerald-400">{stats.active}</p>
          <p className="text-sm text-muted-foreground">Active</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-zinc-400">{stats.draft}</p>
          <p className="text-sm text-muted-foreground">Draft</p>
        </div>
        <div className="bg-card border border-border rounded-lg p-4">
          <p className="text-2xl font-bold text-blue-400">{stats.completed}</p>
          <p className="text-sm text-muted-foreground">Completed</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search by title or brand..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
        <Select value={statusFilter} onValueChange={setStatusFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Statuses</SelectItem>
            {STATUSES.map((status) => (
              <SelectItem key={status} value={status}>
                {status.charAt(0).toUpperCase() + status.slice(1)}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Select value={typeFilter} onValueChange={setTypeFilter}>
          <SelectTrigger className="w-40">
            <SelectValue placeholder="Type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Types</SelectItem>
            {OPPORTUNITY_TYPES.map((type) => (
              <SelectItem key={type} value={type}>{type}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Table */}
      <div className="bg-card border border-border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Title</TableHead>
              <TableHead>Brand</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Dates</TableHead>
              <TableHead>Spots</TableHead>
              <TableHead>Applications</TableHead>
              <TableHead className="w-12"></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  Loading...
                </TableCell>
              </TableRow>
            ) : filteredOpportunities.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                  No opportunities found
                </TableCell>
              </TableRow>
            ) : (
              filteredOpportunities.map((opportunity) => (
                <TableRow 
                  key={opportunity.id}
                  className="cursor-pointer hover:bg-muted/50"
                  onClick={() => handleOpenEdit(opportunity)}
                >
                  <TableCell className="font-medium">{opportunity.title}</TableCell>
                  <TableCell>{opportunity.brand_name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{opportunity.opportunity_type}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className={`${statusStyles[opportunity.status || 'draft']} border-0`}>
                      {opportunity.status}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {formatDateRange(opportunity.start_date, opportunity.end_date)}
                  </TableCell>
                  <TableCell>
                    {opportunity.spots_filled || 0}/{opportunity.spots_total || 0}
                  </TableCell>
                  <TableCell>
                    <Badge variant="secondary">
                      {applicationCounts[opportunity.id] || 0}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild onClick={(e) => e.stopPropagation()}>
                        <Button variant="ghost" size="icon">
                          <MoreHorizontal className="w-4 h-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="bg-popover border-border">
                        <DropdownMenuItem onClick={(e) => { e.stopPropagation(); handleOpenEdit(opportunity); }}>
                          <Edit className="w-4 h-4 mr-2" /> Edit
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={(e) => { 
                          e.stopPropagation(); 
                          setApplicationsOpportunity(opportunity);
                          setApplicationsDrawerOpen(true);
                        }}>
                          <Users className="w-4 h-4 mr-2" /> View Applications
                        </DropdownMenuItem>
                        <DropdownMenuItem 
                          onClick={(e) => { e.stopPropagation(); handleDelete(opportunity); }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" /> Delete
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Edit/Create Modal */}
      <Dialog open={editModalOpen} onOpenChange={setEditModalOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedOpportunity ? 'Edit Opportunity' : 'Create Opportunity'}
            </DialogTitle>
            <DialogDescription>
              {selectedOpportunity ? 'Update the opportunity details below.' : 'Fill in the details for the new opportunity.'}
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Brand Logo Upload */}
            <div className="space-y-2">
              <Label>Brand Logo</Label>
              <div className="flex items-center gap-4">
                {formData.brand_logo_url ? (
                  <div className="relative w-16 h-16">
                    <img 
                      src={formData.brand_logo_url} 
                      alt="Brand logo" 
                      className="w-16 h-16 rounded-lg object-cover"
                    />
                    <button
                      type="button"
                      onClick={() => setFormData({ ...formData, brand_logo_url: '' })}
                      className="absolute -top-2 -right-2 w-5 h-5 bg-destructive text-destructive-foreground rounded-full flex items-center justify-center"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-muted/50 border border-dashed border-border flex items-center justify-center">
                    <ImageIcon className="w-6 h-6 text-muted-foreground" />
                  </div>
                )}
                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleLogoUpload}
                  className="hidden"
                />
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm"
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  {isUploading ? 'Uploading...' : 'Upload Logo'}
                </Button>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="title">Title *</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  placeholder="Campus Ambassador"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="brand_name">Brand Name *</Label>
                <Input
                  id="brand_name"
                  value={formData.brand_name}
                  onChange={(e) => setFormData({ ...formData, brand_name: e.target.value })}
                  placeholder="Red Bull"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Type</Label>
                <Select 
                  value={formData.opportunity_type} 
                  onValueChange={(v) => setFormData({ ...formData, opportunity_type: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {OPPORTUNITY_TYPES.map((type) => (
                      <SelectItem key={type} value={type}>{type}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Status</Label>
                <Select 
                  value={formData.status} 
                  onValueChange={(v) => setFormData({ ...formData, status: v })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {STATUSES.map((status) => (
                      <SelectItem key={status} value={status}>
                        {status.charAt(0).toUpperCase() + status.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="short_description">Short Description (max 100 chars)</Label>
              <Input
                id="short_description"
                value={formData.short_description}
                onChange={(e) => setFormData({ ...formData, short_description: e.target.value.slice(0, 100) })}
                placeholder="Brief one-line description"
                maxLength={100}
              />
              <p className="text-xs text-muted-foreground">{formData.short_description.length}/100</p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="description">Full Description</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Detailed description of the opportunity..."
                rows={4}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="compensation">Compensation</Label>
                <Input
                  id="compensation"
                  value={formData.compensation}
                  onChange={(e) => setFormData({ ...formData, compensation: e.target.value })}
                  placeholder="$50 + free product"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="location">Location</Label>
                <Input
                  id="location"
                  value={formData.location}
                  onChange={(e) => setFormData({ ...formData, location: e.target.value })}
                  placeholder="Toronto, ON"
                />
              </div>
            </div>

            {/* Schools Multi-select */}
            <div className="space-y-2">
              <Label>Schools (leave empty for all schools)</Label>
              <div className="grid grid-cols-2 gap-2 max-h-40 overflow-y-auto p-2 border border-border rounded-lg bg-muted/20">
                {schools.map((school) => (
                  <label
                    key={school.id}
                    className="flex items-center gap-2 text-sm cursor-pointer hover:bg-muted/50 p-1 rounded"
                  >
                    <Checkbox
                      checked={formData.schools.includes(school.name)}
                      onCheckedChange={() => toggleSchool(school.name)}
                    />
                    <span className="truncate">{school.name}</span>
                  </label>
                ))}
              </div>
              {formData.schools.length > 0 && (
                <p className="text-xs text-muted-foreground">{formData.schools.length} school(s) selected</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="start_date">Start Date</Label>
                <Input
                  id="start_date"
                  type="date"
                  value={formData.start_date}
                  onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="end_date">End Date</Label>
                <Input
                  id="end_date"
                  type="date"
                  value={formData.end_date}
                  onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="spots_total">Total Spots</Label>
                <Input
                  id="spots_total"
                  type="number"
                  value={formData.spots_total}
                  onChange={(e) => setFormData({ ...formData, spots_total: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="spots_filled">Spots Filled</Label>
                <Input
                  id="spots_filled"
                  type="number"
                  value={formData.spots_filled}
                  onChange={(e) => setFormData({ ...formData, spots_filled: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>

            {/* Dynamic Requirements */}
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Requirements</Label>
                <Button type="button" variant="outline" size="sm" onClick={addRequirement}>
                  <Plus className="w-3 h-3 mr-1" /> Add
                </Button>
              </div>
              <div className="space-y-2">
                {requirements.map((req, index) => (
                  <div key={index} className="flex items-center gap-2">
                    <Input
                      value={req}
                      onChange={(e) => updateRequirement(index, e.target.value)}
                      placeholder="e.g., Must be 19+"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      onClick={() => removeRequirement(index)}
                      className="shrink-0"
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                ))}
                {requirements.length === 0 && (
                  <p className="text-sm text-muted-foreground">No requirements added</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_featured}
                onCheckedChange={(checked) => setFormData({ ...formData, is_featured: checked })}
              />
              <Label>Featured Opportunity</Label>
            </div>
          </div>

          <DialogFooter className="flex-col sm:flex-row gap-2">
            {selectedOpportunity && (
              <Button 
                variant="destructive" 
                onClick={() => handleDelete(selectedOpportunity)}
                className="sm:mr-auto"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Delete
              </Button>
            )}
            <Button variant="outline" onClick={() => setEditModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Opportunity?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete "{selectedOpportunity?.title}" and all related applications. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => selectedOpportunity && deleteMutation.mutate(selectedOpportunity.id)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Applications Drawer */}
      <OpportunityApplicationsDrawer
        opportunity={applicationsOpportunity}
        open={applicationsDrawerOpen}
        onClose={() => {
          setApplicationsDrawerOpen(false);
          setApplicationsOpportunity(null);
        }}
      />
    </div>
  );
};
