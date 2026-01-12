'use client';

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { Download, Trash2, AlertTriangle } from 'lucide-react';
import { useState } from 'react';
import { Tables } from '@/lib/supabase/types';

export const AdminSettings = () => {
  const { toast } = useToast();
  const queryClient = useQueryClient();
  const [deleteConfirm, setDeleteConfirm] = useState('');

  const { data: settings } = useQuery({
    queryKey: ['admin-settings'],
    queryFn: async () => {
      const { data } = await supabase.from('settings').select('*');
      const settingsMap: Record<string, any> = {};
      data?.forEach((s: Tables<'settings'>) => {
        settingsMap[s.key] = JSON.parse(s.value as string);
      });
      return settingsMap;
    },
  });

  const updateSetting = useMutation({
    mutationFn: async ({ key, value }: { key: string; value: any }) => {
      const { error } = await supabase
        .from('settings')
        // @ts-ignore - Supabase types infer never in strict mode
        .upsert({ key, value: JSON.stringify(value), updated_at: new Date().toISOString() });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-settings'] });
      toast({ title: 'Setting saved' });
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  const exportAllData = async () => {
    const { data: applicants } = await supabase.from('applicants').select('*');
    const blob = new Blob([JSON.stringify(applicants, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `sauce-backup-${new Date().toISOString().split('T')[0]}.json`;
    a.click();
    toast({ title: 'Backup downloaded' });
  };

  const deleteAllApplicants = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from('applicants').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-applicants'] });
      queryClient.invalidateQueries({ queryKey: ['admin-total-applicants'] });
      toast({ title: 'All applicants deleted' });
      setDeleteConfirm('');
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'An error occurred';
      toast({ title: 'Error', description: message, variant: 'destructive' });
    },
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-muted-foreground">Configure your ambassador program</p>
      </div>

      <div className="grid gap-6">
        {/* Branding */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Branding</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Agency Name</Label>
                <Input
                  value={settings?.agency_name || ''}
                  onChange={(e) => updateSetting.mutate({ key: 'agency_name', value: e.target.value })}
                  placeholder="Sauce"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact Email</Label>
                <Input
                  type="email"
                  value={settings?.contact_email || ''}
                  onChange={(e) => updateSetting.mutate({ key: 'contact_email', value: e.target.value })}
                  placeholder="hello@example.com"
                />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Application Flow */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Application Flow</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email Collection</Label>
                <Select
                  value={settings?.email_requirement || 'end'}
                  onValueChange={(value) => updateSetting.mutate({ key: 'email_requirement', value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="start">At Start</SelectItem>
                    <SelectItem value="end">At End</SelectItem>
                    <SelectItem value="optional">Optional</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Minimum Age</Label>
                <Input
                  type="number"
                  value={settings?.minimum_age || 19}
                  onChange={(e) => updateSetting.mutate({ key: 'minimum_age', value: parseInt(e.target.value) || 19 })}
                />
              </div>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <Label>Age Verification</Label>
                <p className="text-sm text-muted-foreground">Ask applicants to verify their age</p>
              </div>
              <Switch
                checked={settings?.age_gate_enabled === true}
                onCheckedChange={(checked) => updateSetting.mutate({ key: 'age_gate_enabled', value: checked })}
              />
            </div>
          </CardContent>
        </Card>

        {/* Waitlist */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Waitlist</CardTitle>
            <CardDescription>Configure initial waitlist position range</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Min Position</Label>
                <Input
                  type="number"
                  value={settings?.waitlist_start_min || 1}
                  onChange={(e) => updateSetting.mutate({ key: 'waitlist_start_min', value: parseInt(e.target.value) || 1 })}
                />
              </div>
              <div className="space-y-2">
                <Label>Max Position</Label>
                <Input
                  type="number"
                  value={settings?.waitlist_start_max || 100}
                  onChange={(e) => updateSetting.mutate({ key: 'waitlist_start_max', value: parseInt(e.target.value) || 100 })}
                />
              </div>
            </div>
            <p className="text-sm text-muted-foreground">
              New applicants get a random position between these values
            </p>
          </CardContent>
        </Card>

        {/* Notifications */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Notifications</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <Label>Email on New Application</Label>
                <p className="text-sm text-muted-foreground">Get notified when someone applies</p>
              </div>
              <Switch
                checked={settings?.notify_on_apply === true}
                onCheckedChange={(checked) => updateSetting.mutate({ key: 'notify_on_apply', value: checked })}
              />
            </div>
            {settings?.notify_on_apply && (
              <div className="space-y-2">
                <Label>Notification Email</Label>
                <Input
                  type="email"
                  value={settings?.notification_email || ''}
                  onChange={(e) => updateSetting.mutate({ key: 'notification_email', value: e.target.value })}
                  placeholder="admin@example.com"
                />
              </div>
            )}
          </CardContent>
        </Card>

        {/* Danger Zone */}
        <Card className="border-destructive/50">
          <CardHeader>
            <CardTitle className="text-lg text-destructive flex items-center gap-2">
              <AlertTriangle className="h-5 w-5" />
              Danger Zone
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="font-medium">Export Full Backup</p>
                <p className="text-sm text-muted-foreground">Download all applicant data as JSON</p>
              </div>
              <Button variant="outline" onClick={exportAllData}>
                <Download className="h-4 w-4 mr-2" />
                Export
              </Button>
            </div>
            <div className="border-t border-border pt-4">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <p className="font-medium text-destructive">Delete All Applicants</p>
                  <p className="text-sm text-muted-foreground">This action cannot be undone</p>
                </div>
              </div>
              <div className="flex gap-2">
                <Input
                  placeholder='Type "DELETE ALL" to confirm'
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                />
                <Button
                  variant="destructive"
                  disabled={deleteConfirm !== 'DELETE ALL' || deleteAllApplicants.isPending}
                  onClick={() => deleteAllApplicants.mutate()}
                >
                  <Trash2 className="h-4 w-4 mr-2" />
                  Delete
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};
