import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

interface School {
  id: string;
  name: string;
  spots_total: number;
  spots_remaining: number;
  is_active: boolean;
  sort_order: number;
}

export const AdminSchools = () => {
  const [editSchool, setEditSchool] = useState<School | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    spots_total: 50,
    spots_remaining: 50,
    is_active: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: schools, isLoading } = useQuery({
    queryKey: ['admin-schools'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('schools')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as School[];
    },
  });

  // Get application counts per school
  const { data: applicationCounts } = useQuery({
    queryKey: ['admin-school-counts'],
    queryFn: async () => {
      const { data } = await supabase.from('applicants').select('school');
      const counts: Record<string, number> = {};
      data?.forEach((a) => {
        counts[a.school] = (counts[a.school] || 0) + 1;
      });
      return counts;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from('schools')
          .update({
            name: data.name,
            spots_total: data.spots_total,
            spots_remaining: data.spots_remaining,
            is_active: data.is_active,
          })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(...(schools?.map((s) => s.sort_order) || [0]));
        const { error } = await supabase.from('schools').insert({
          name: data.name,
          spots_total: data.spots_total,
          spots_remaining: data.spots_remaining,
          is_active: data.is_active,
          sort_order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
      setIsDialogOpen(false);
      setEditSchool(null);
      toast({ title: 'School saved successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('schools').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
      toast({ title: 'School deleted' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase
        .from('schools')
        .update({ is_active })
        .eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-schools'] });
    },
  });

  const openDialog = (school?: School) => {
    if (school) {
      setEditSchool(school);
      setFormData({
        name: school.name,
        spots_total: school.spots_total,
        spots_remaining: school.spots_remaining,
        is_active: school.is_active,
      });
    } else {
      setEditSchool(null);
      setFormData({ name: '', spots_total: 50, spots_remaining: 50, is_active: true });
    }
    setIsDialogOpen(true);
  };

  const handleSave = () => {
    if (!formData.name.trim()) {
      toast({ title: 'Error', description: 'Name is required', variant: 'destructive' });
      return;
    }
    saveMutation.mutate({ ...formData, id: editSchool?.id });
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Schools</h1>
          <p className="text-muted-foreground">Manage universities in the intake flow</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add School
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10"></th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">School Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Total Spots</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Remaining</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Applications</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Status</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    Loading...
                  </td>
                </tr>
              ) : schools?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No schools added yet
                  </td>
                </tr>
              ) : (
                schools?.map((school) => (
                  <tr key={school.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="p-4">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </td>
                    <td className="p-4 font-medium">{school.name}</td>
                    <td className="p-4 text-muted-foreground">{school.spots_total}</td>
                    <td className="p-4 text-muted-foreground">{school.spots_remaining}</td>
                    <td className="p-4 text-muted-foreground">
                      {applicationCounts?.[school.name] || 0}
                    </td>
                    <td className="p-4">
                      <Switch
                        checked={school.is_active}
                        onCheckedChange={(checked) =>
                          toggleActive.mutate({ id: school.id, is_active: checked })
                        }
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(school)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this school?')) {
                              deleteMutation.mutate(school.id);
                            }
                          }}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </CardContent>
      </Card>

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editSchool ? 'Edit School' : 'Add School'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>School Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="University of..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Total Spots</Label>
                <Input
                  type="number"
                  value={formData.spots_total}
                  onChange={(e) => setFormData({ ...formData, spots_total: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Spots Remaining</Label>
                <Input
                  type="number"
                  value={formData.spots_remaining}
                  onChange={(e) => setFormData({ ...formData, spots_remaining: parseInt(e.target.value) || 0 })}
                />
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.is_active}
                onCheckedChange={(checked) => setFormData({ ...formData, is_active: checked })}
              />
              <Label>Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSave} disabled={saveMutation.isPending}>
              {saveMutation.isPending ? 'Saving...' : 'Save'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
