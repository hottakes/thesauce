'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
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
import { Plus, Pencil, Trash2, AlertTriangle } from 'lucide-react';

interface AmbassadorType {
  id: string;
  name: string;
  description: string;
  assignment_weight: number;
  is_active: boolean;
}

export const AdminAmbassadorTypes = () => {
  const [editItem, setEditItem] = useState<AmbassadorType | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    assignment_weight: 16,
    is_active: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: types, isLoading } = useQuery({
    queryKey: ['admin-ambassador-types'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('ambassador_types')
        .select('*')
        .order('name');
      if (error) throw error;
      return data as AmbassadorType[];
    },
  });

  const totalWeight = types?.filter((t) => t.is_active).reduce((sum, t) => sum + t.assignment_weight, 0) || 0;

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        name: data.name,
        description: data.description,
        assignment_weight: data.assignment_weight,
        is_active: data.is_active,
      };

      if (data.id) {
        // @ts-ignore - Supabase types infer never in strict mode
        const { error } = await supabase.from('ambassador_types').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        // @ts-ignore - Supabase types infer never in strict mode
        const { error } = await supabase.from('ambassador_types').insert(payload);
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ambassador-types'] });
      setIsDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Ambassador type saved' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('ambassador_types').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ambassador-types'] });
      toast({ title: 'Ambassador type deleted' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      // @ts-ignore - Supabase types infer never in strict mode
      const { error } = await supabase.from('ambassador_types').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-ambassador-types'] });
    },
  });

  const openDialog = (item?: AmbassadorType) => {
    if (item) {
      setEditItem(item);
      setFormData({
        name: item.name,
        description: item.description,
        assignment_weight: item.assignment_weight,
        is_active: item.is_active,
      });
    } else {
      setEditItem(null);
      setFormData({ name: '', description: '', assignment_weight: 16, is_active: true });
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Ambassador Types</h1>
          <p className="text-muted-foreground">Manage types assigned on result cards</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Type
        </Button>
      </div>

      {totalWeight !== 100 && types && types.length > 0 && (
        <div className="flex items-center gap-2 p-4 bg-yellow-500/10 border border-yellow-500/20 rounded-lg">
          <AlertTriangle className="h-5 w-5 text-yellow-500" />
          <p className="text-sm text-yellow-500">
            Active weights sum to {totalWeight}% (should be 100%)
          </p>
        </div>
      )}

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Name</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Description</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Weight</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Active</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : types?.length === 0 ? (
                <tr>
                  <td colSpan={5} className="p-8 text-center text-muted-foreground">No types</td>
                </tr>
              ) : (
                types?.map((type) => (
                  <tr key={type.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="p-4 font-medium">{type.name}</td>
                    <td className="p-4 text-sm text-muted-foreground max-w-xs truncate">
                      {type.description}
                    </td>
                    <td className="p-4">
                      <Badge variant="secondary">{type.assignment_weight}%</Badge>
                    </td>
                    <td className="p-4">
                      <Switch
                        checked={type.is_active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: type.id, is_active: checked })}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(type)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this type?')) deleteMutation.mutate(type.id);
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
            <DialogTitle>{editItem ? 'Edit Ambassador Type' : 'Add Ambassador Type'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Name</Label>
              <Input
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="The Connector"
              />
            </div>
            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="One sentence describing this type..."
              />
            </div>
            <div className="space-y-2">
              <Label>Assignment Weight (%)</Label>
              <Input
                type="number"
                value={formData.assignment_weight}
                onChange={(e) => setFormData({ ...formData, assignment_weight: parseInt(e.target.value) || 0 })}
              />
              <p className="text-xs text-muted-foreground">Percentage chance of being assigned this type</p>
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
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
            <Button onClick={() => saveMutation.mutate({ ...formData, id: editItem?.id })} disabled={saveMutation.isPending}>
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};
