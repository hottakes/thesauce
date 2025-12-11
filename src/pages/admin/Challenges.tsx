import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
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
  DialogFooter,
} from '@/components/ui/dialog';
import { useToast } from '@/hooks/use-toast';
import { Plus, Pencil, Trash2, GripVertical, ExternalLink } from 'lucide-react';

interface Challenge {
  id: string;
  title: string;
  description: string | null;
  points: number;
  verification_type: string;
  icon: string | null;
  external_url: string | null;
  sort_order: number;
  is_active: boolean;
}

export const AdminChallenges = () => {
  const [editItem, setEditItem] = useState<Challenge | null>(null);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    points: 5,
    verification_type: 'honor',
    icon: '',
    external_url: '',
    is_active: true,
  });

  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: challenges, isLoading } = useQuery({
    queryKey: ['admin-challenges'],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('challenges')
        .select('*')
        .order('sort_order');
      if (error) throw error;
      return data as Challenge[];
    },
  });

  const saveMutation = useMutation({
    mutationFn: async (data: typeof formData & { id?: string }) => {
      const payload = {
        title: data.title,
        description: data.description || null,
        points: data.points,
        verification_type: data.verification_type,
        icon: data.icon || null,
        external_url: data.external_url || null,
        is_active: data.is_active,
      };

      if (data.id) {
        const { error } = await supabase.from('challenges').update(payload).eq('id', data.id);
        if (error) throw error;
      } else {
        const maxOrder = Math.max(...(challenges?.map((c) => c.sort_order) || [0]));
        const { error } = await supabase.from('challenges').insert({ ...payload, sort_order: maxOrder + 1 });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      setIsDialogOpen(false);
      setEditItem(null);
      toast({ title: 'Challenge saved' });
    },
    onError: (err: any) => {
      toast({ title: 'Error', description: err.message, variant: 'destructive' });
    },
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from('challenges').delete().eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
      toast({ title: 'Challenge deleted' });
    },
  });

  const toggleActive = useMutation({
    mutationFn: async ({ id, is_active }: { id: string; is_active: boolean }) => {
      const { error } = await supabase.from('challenges').update({ is_active }).eq('id', id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-challenges'] });
    },
  });

  const openDialog = (item?: Challenge) => {
    if (item) {
      setEditItem(item);
      setFormData({
        title: item.title,
        description: item.description || '',
        points: item.points,
        verification_type: item.verification_type,
        icon: item.icon || '',
        external_url: item.external_url || '',
        is_active: item.is_active,
      });
    } else {
      setEditItem(null);
      setFormData({
        title: '',
        description: '',
        points: 5,
        verification_type: 'honor',
        icon: '',
        external_url: '',
        is_active: true,
      });
    }
    setIsDialogOpen(true);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Challenges</h1>
          <p className="text-muted-foreground">Manage waitlist boost challenges</p>
        </div>
        <Button onClick={() => openDialog()}>
          <Plus className="h-4 w-4 mr-2" />
          Add Challenge
        </Button>
      </div>

      <Card>
        <CardContent className="p-0">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="w-10"></th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Title</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Points</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Verification</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Link</th>
                <th className="text-left p-4 text-sm font-medium text-muted-foreground">Active</th>
                <th className="p-4"></th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">Loading...</td>
                </tr>
              ) : challenges?.length === 0 ? (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">No challenges</td>
                </tr>
              ) : (
                challenges?.map((challenge) => (
                  <tr key={challenge.id} className="border-b border-border/50 hover:bg-secondary/50">
                    <td className="p-4">
                      <GripVertical className="h-4 w-4 text-muted-foreground cursor-grab" />
                    </td>
                    <td className="p-4">
                      <div>
                        <p className="font-medium">{challenge.title}</p>
                        {challenge.description && (
                          <p className="text-sm text-muted-foreground">{challenge.description}</p>
                        )}
                      </div>
                    </td>
                    <td className="p-4 text-primary font-medium">+{challenge.points}</td>
                    <td className="p-4 text-muted-foreground capitalize">{challenge.verification_type}</td>
                    <td className="p-4">
                      {challenge.external_url ? (
                        <a
                          href={challenge.external_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:underline inline-flex items-center gap-1"
                        >
                          Link <ExternalLink className="h-3 w-3" />
                        </a>
                      ) : (
                        <span className="text-muted-foreground">—</span>
                      )}
                    </td>
                    <td className="p-4">
                      <Switch
                        checked={challenge.is_active}
                        onCheckedChange={(checked) => toggleActive.mutate({ id: challenge.id, is_active: checked })}
                      />
                    </td>
                    <td className="p-4">
                      <div className="flex gap-2">
                        <Button variant="ghost" size="icon" onClick={() => openDialog(challenge)}>
                          <Pencil className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => {
                            if (confirm('Delete this challenge?')) deleteMutation.mutate(challenge.id);
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
            <DialogTitle>{editItem ? 'Edit Challenge' : 'Add Challenge'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Title</Label>
              <Input
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Follow us on TikTok"
              />
            </div>
            <div className="space-y-2">
              <Label>Description (optional)</Label>
              <Textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Show us some love..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Points</Label>
                <Input
                  type="number"
                  value={formData.points}
                  onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) || 0 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Verification</Label>
                <Select
                  value={formData.verification_type}
                  onValueChange={(value) => setFormData({ ...formData, verification_type: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="honor">Honor</SelectItem>
                    <SelectItem value="screenshot">Screenshot</SelectItem>
                    <SelectItem value="auto">Auto</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div className="space-y-2">
              <Label>External URL (optional)</Label>
              <Input
                value={formData.external_url}
                onChange={(e) => setFormData({ ...formData, external_url: e.target.value })}
                placeholder="https://..."
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
