'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical } from 'lucide-react';

interface FormOption {
  id: string;
  label: string;
  emoji?: string;
  sort_order: number;
  is_active: boolean;
}

type TableName = 'personality_traits' | 'interests' | 'venue_types';

const FormOptionTable = ({
  tableName,
  title,
  settingsKey,
}: {
  tableName: TableName;
  title: string;
  settingsKey?: string;
}) => {
  const [editItem, setEditItem] = useState<FormOption | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({ label: '', emoji: '', is_active: true });
  const [maxSelection, setMaxSelection] = useState<number | null>(null);

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: items, isLoading } = useQuery({
    queryKey: ['admin', tableName],
    queryFn: async () => {
      const { data, error } = await supabase
        .from(tableName)
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as FormOption[];
    },
  });

  // Load max selection setting
  useQuery({
    queryKey: ['admin-setting', settingsKey],
    enabled: !!settingsKey,
    queryFn: async () => {
      const { data } = await supabase
        .from('settings')
        .select('value')
        .eq('key', settingsKey)
        .maybeSingle();
      if (data) {
        setMaxSelection(JSON.parse(data.value as string));
      }
      return data;
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      if (data.id) {
        const { error } = await supabase
          .from(tableName)
          .update({ label: data.label, emoji: data.emoji || null, is_active: data.is_active })
          .eq('id', data.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(...(items?.map((i) => i.sort_order) || [0]));
        const { error } = await supabase.from(tableName).insert({
          label: data.label,
          emoji: data.emoji || null,
          is_active: data.is_active,
          sort_order: maxOrder + 1,
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', tableName] });
      setIsDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Saved successfully' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from(tableName).delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', tableName] });
      toast({ title: 'Deleted' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from(tableName).update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin', tableName] });
    },
  });

  const saveMaxSelection = useMutation({
    mutationFn: async (value: number) => {
      if (!settingsKey) return;
      const { error } = await supabase
        .from('settings')
        .upsert({ key: settingsKey, value: JSON.stringify(value), updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      toast({ title: 'Setting saved' });
    },
  });

  const openDialog = (item?: FormOption) => {
    if (item) {
      setEditItem(item);
      setFormData({ label: item.label, emoji: item.emoji || '', is_active: item.is_active });
    } else {
      setEditItem(null);
      setFormData({ label: '', emoji: '', is_active: true });
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold">{title}</h2>
        <Button size="sm" onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add
        </Button>
      </div>

      <table className="w-full">
        <thead>
          <tr className="border-b border-border">
            <th className="w-10"></th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Label</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Emoji</th>
            <th className="text-left p-3 text-sm font-medium text-muted-foreground">Active</th>
            <th className="p-3"></th>
          </tr>
        </thead>
        <tbody>
          {isLoading ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-muted-foreground">Loading...</td>
            </tr>
          ) : items?.length === 0 ? (
            <tr>
              <td colSpan={5} className="p-4 text-center text-muted-foreground">No items</td>
            </tr>
          ) : (
            items?.map((item) => (
              <tr key={item.id} className="border-b border-border/50">
                <td className="p-3">
                  <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                </td>
                <td className="p-3 font-medium">{item.label}</td>
                <td className="p-3">{item.emoji || '—'}</td>
                <td className="p-3">
                  <Switch
                    checked={item.is_active}
                    onCheckedChange={(checked) => toggleActive.mutate({ id: item.id, is_active: checked })}
                  />
                </td>
                <td className="p-3">
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openDialog(item)}>
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => {
                        if (confirm('Delete this item?')) deleteMutation.mutate(item.id);
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

      {settingsKey && (
        <div className="flex items-center gap-4 pt-4 border-t border-border">
          <Label className="text-sm text-muted-foreground">Max selections (0 = unlimited):</Label>
          <Input
            type="number"
            className="w-24"
            value={maxSelection ?? ''}
            onChange={(e) => setMaxSelection(parseInt(e.target.value) || 0)}
          />
          <Button size="sm" variant="outline" onClick={() => maxSelection !== null && saveMaxSelection.mutate(maxSelection)}>
            Save
          </Button>
        </div>
      )}

      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editItem ? 'Edit Item' : 'Add Item'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Label</Label>
              <Input
                value={formData.label}
                onChange={(e) => setFormData({ ...formData, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Emoji (optional)</Label>
              <Input
                value={formData.emoji}
                onChange={(e) => setFormData({ ...formData, emoji: e.target.value })}
                placeholder="🎉"
              />
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

export const AdminFormBuilder = () => {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Form Builder</h1>
        <p className="text-muted-foreground">Manage options shown in the intake flow</p>
      </div>

      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="traits">
            <TabsList className="mb-6">
              <TabsTrigger value="traits">Personality Traits</TabsTrigger>
              <TabsTrigger value="interests">Interests</TabsTrigger>
              <TabsTrigger value="venues">Venue Types</TabsTrigger>
            </TabsList>
            <TabsContent value="traits">
              <FormOptionTable
                tableName="personality_traits"
                title="Personality Traits"
                settingsKey="max_personality_traits"
              />
            </TabsContent>
            <TabsContent value="interests">
              <FormOptionTable
                tableName="interests"
                title="Interests"
                settingsKey="max_interests"
              />
            </TabsContent>
            <TabsContent value="venues">
              <FormOptionTable tableName="venue_types" title="Venue Types" />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};
