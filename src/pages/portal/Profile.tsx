import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { 
  User, ExternalLink, BadgeCheck, Calendar, Zap, Trophy, 
  Briefcase, Lock, LogOut, Trash2, Play, Eye
} from 'lucide-react';
import { format } from 'date-fns';
import { supabase } from '@/integrations/supabase/client';
import { usePortalAuth } from '@/hooks/usePortalAuth';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
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
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { toast } from '@/hooks/use-toast';

const statusStyles: Record<string, { bg: string; text: string; label: string }> = {
  new: { bg: 'bg-blue-500/20', text: 'text-blue-400', label: 'Application Received' },
  reviewed: { bg: 'bg-amber-500/20', text: 'text-amber-400', label: 'Under Review' },
  contacted: { bg: 'bg-purple-500/20', text: 'text-purple-400', label: 'Contacted' },
  accepted: { bg: 'bg-emerald-500/20', text: 'text-emerald-400', label: 'Accepted' },
  rejected: { bg: 'bg-zinc-500/20', text: 'text-zinc-400', label: 'Not Selected' },
};

const ambassadorDescriptions: Record<string, string> = {
  'The Connector': 'You bring people together and know everyone on campus.',
  'The Content King': 'Your content game is unmatched. You create trends.',
  'The Party Starter': 'Every party needs you. You bring the energy.',
  'The Hype Machine': 'You get people excited about everything.',
  'The Trendsetter': 'You\'re always ahead of the curve.',
  'The Insider': 'You know all the spots and have all the connections.',
};

export const PortalProfile: React.FC = () => {
  const { applicant, signOut } = usePortalAuth();
  const navigate = useNavigate();
  
  const [passwordModalOpen, setPasswordModalOpen] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [contentPreview, setContentPreview] = useState<string | null>(null);
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dangerZoneOpen, setDangerZoneOpen] = useState(false);

  // Fetch challenge completions count
  const { data: boostsCount = 0 } = useQuery({
    queryKey: ['boosts-count', applicant?.id],
    queryFn: async () => {
      if (!applicant?.id) return 0;
      const { count } = await supabase
        .from('challenge_completions')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', applicant.id);
      return count || 0;
    },
    enabled: !!applicant?.id,
  });

  // Fetch opportunity applications count
  const { data: applicationsCount = 0 } = useQuery({
    queryKey: ['applications-count', applicant?.id],
    queryFn: async () => {
      if (!applicant?.id) return 0;
      const { count } = await supabase
        .from('opportunity_applications')
        .select('*', { count: 'exact', head: true })
        .eq('applicant_id', applicant.id);
      return count || 0;
    },
    enabled: !!applicant?.id && applicant.status === 'accepted',
  });

  if (!applicant) return null;

  const status = statusStyles[applicant.status] || statusStyles.new;
  const contentUrls = (applicant.content_urls as string[]) || [];

  const handlePasswordChange = async () => {
    if (newPassword !== confirmPassword) {
      toast({ title: "Passwords don't match", variant: "destructive" });
      return;
    }
    if (newPassword.length < 6) {
      toast({ title: "Password must be at least 6 characters", variant: "destructive" });
      return;
    }

    setIsUpdatingPassword(true);
    const { error } = await supabase.auth.updateUser({ password: newPassword });
    setIsUpdatingPassword(false);

    if (error) {
      toast({ title: "Failed to update password", description: error.message, variant: "destructive" });
    } else {
      toast({ title: "Password updated successfully" });
      setPasswordModalOpen(false);
      setNewPassword('');
      setConfirmPassword('');
    }
  };

  const handleDeleteAccount = async () => {
    setIsDeleting(true);
    
    // Delete applicant record (RLS should allow this or we need admin)
    const { error: deleteError } = await supabase
      .from('applicants')
      .delete()
      .eq('id', applicant.id);

    if (deleteError) {
      toast({ title: "Failed to delete account", description: deleteError.message, variant: "destructive" });
      setIsDeleting(false);
      return;
    }

    // Sign out and redirect
    await signOut();
    navigate('/');
    toast({ title: "Account deleted" });
  };

  const handleSignOut = async () => {
    await signOut();
    navigate('/portal/login');
  };

  const isMediaFile = (url: string) => {
    const ext = url.split('.').pop()?.toLowerCase();
    return ['mp4', 'webm', 'mov', 'mp3', 'wav', 'm4a'].includes(ext || '');
  };

  return (
    <div className="space-y-6 max-w-2xl mx-auto">
      {/* Profile Header */}
      <div className="flex items-start gap-4">
        {applicant.instagram_profile_pic ? (
          <img
            src={applicant.instagram_profile_pic}
            alt="Profile"
            className="w-20 h-20 rounded-full object-cover border-2 border-primary/50"
          />
        ) : (
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-primary/50 to-primary flex items-center justify-center">
            <User className="w-10 h-10 text-primary-foreground" />
          </div>
        )}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <a
              href={`https://instagram.com/${applicant.instagram_handle}`}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xl font-bold text-foreground hover:text-primary transition-colors flex items-center gap-1"
            >
              @{applicant.instagram_handle}
              <ExternalLink className="w-4 h-4" />
            </a>
            {applicant.instagram_verified && (
              <BadgeCheck className="w-5 h-5 text-blue-400" />
            )}
          </div>
          <p className="text-muted-foreground">{applicant.school}</p>
          <p className="text-sm text-muted-foreground/70 flex items-center gap-1 mt-1">
            <Calendar className="w-3.5 h-3.5" />
            Member since {format(new Date(applicant.created_at), 'MMMM yyyy')}
          </p>
        </div>
      </div>

      {/* Status & Type Card */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-3">
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Status</span>
          <Badge className={`${status.bg} ${status.text} border-0`}>
            {status.label}
          </Badge>
        </div>
        <div className="flex items-center justify-between">
          <span className="text-sm text-muted-foreground">Ambassador Type</span>
          <span className="font-medium text-foreground">{applicant.ambassador_type}</span>
        </div>
        {ambassadorDescriptions[applicant.ambassador_type] && (
          <p className="text-sm text-muted-foreground italic">
            "{ambassadorDescriptions[applicant.ambassador_type]}"
          </p>
        )}
        {applicant.status === 'accepted' && applicant.approved_at && (
          <p className="text-sm text-emerald-400">
            Approved on {format(new Date(applicant.approved_at), 'MMMM d, yyyy')}
          </p>
        )}
      </div>

      {/* Your Vibe Section */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-foreground">Your Vibe</h3>
        
        {applicant.personality_traits.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Personality</p>
            <div className="flex flex-wrap gap-2">
              {applicant.personality_traits.map((trait) => (
                <Badge key={trait} variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                  {trait}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {applicant.interests.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Interests</p>
            <div className="flex flex-wrap gap-2">
              {applicant.interests.map((interest) => (
                <Badge key={interest} variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                  {interest}
                </Badge>
              ))}
            </div>
          </div>
        )}

        {applicant.scene_types.length > 0 && (
          <div>
            <p className="text-sm text-muted-foreground mb-2">Your Scene</p>
            <div className="flex flex-wrap gap-2">
              {applicant.scene_types.map((scene) => (
                <Badge key={scene} variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/30">
                  {scene}
                </Badge>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Stats Row */}
      <div className="grid grid-cols-3 gap-3">
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
          <Zap className="w-5 h-5 mx-auto text-primary mb-1" />
          <p className="text-2xl font-bold text-foreground">{applicant.points}</p>
          <p className="text-xs text-muted-foreground">Points</p>
        </div>
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
          <Trophy className="w-5 h-5 mx-auto text-amber-400 mb-1" />
          <p className="text-2xl font-bold text-foreground">{boostsCount}</p>
          <p className="text-xs text-muted-foreground">Boosts</p>
        </div>
        {applicant.status === 'accepted' ? (
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
            <Briefcase className="w-5 h-5 mx-auto text-emerald-400 mb-1" />
            <p className="text-2xl font-bold text-foreground">{applicationsCount}</p>
            <p className="text-xs text-muted-foreground">Applied</p>
          </div>
        ) : (
          <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 text-center">
            <span className="text-2xl font-bold text-foreground">#{applicant.waitlist_position}</span>
            <p className="text-xs text-muted-foreground">Position</p>
          </div>
        )}
      </div>

      {/* Your Content Section */}
      {(contentUrls.length > 0 || applicant.pitch_url) && (
        <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-4">
          <h3 className="font-semibold text-foreground">Your Content</h3>
          
          {contentUrls.length > 0 && (
            <div className="grid grid-cols-3 gap-2">
              {contentUrls.map((url, idx) => (
                <button
                  key={idx}
                  onClick={() => setContentPreview(url)}
                  className="aspect-square rounded-lg overflow-hidden bg-muted/20 relative group"
                >
                  {isMediaFile(url) ? (
                    <div className="w-full h-full flex items-center justify-center bg-muted/30">
                      <Play className="w-8 h-8 text-muted-foreground" />
                    </div>
                  ) : (
                    <img src={url} alt={`Content ${idx + 1}`} className="w-full h-full object-cover" />
                  )}
                  <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                    <Eye className="w-5 h-5 text-white" />
                  </div>
                </button>
              ))}
            </div>
          )}

          {applicant.pitch_url && (
            <div>
              <p className="text-sm text-muted-foreground mb-2">Your Pitch</p>
              {applicant.pitch_type === 'video' ? (
                <video src={applicant.pitch_url} controls className="w-full rounded-lg max-h-48" />
              ) : (
                <audio src={applicant.pitch_url} controls className="w-full" />
              )}
            </div>
          )}
        </div>
      )}

      {/* Account Section */}
      <div className="bg-card/50 backdrop-blur-sm border border-border/50 rounded-xl p-4 space-y-4">
        <h3 className="font-semibold text-foreground">Account</h3>
        
        {applicant.email && (
          <div className="flex items-center justify-between py-2 border-b border-border/30">
            <span className="text-sm text-muted-foreground">Email</span>
            <span className="text-sm text-foreground">{applicant.email}</span>
          </div>
        )}

        <div className="flex gap-3">
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={() => setPasswordModalOpen(true)}
          >
            <Lock className="w-4 h-4 mr-2" />
            Change Password
          </Button>
          <Button 
            variant="outline" 
            className="flex-1"
            onClick={handleSignOut}
          >
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </div>

      {/* Danger Zone */}
      <Collapsible open={dangerZoneOpen} onOpenChange={setDangerZoneOpen}>
        <CollapsibleTrigger asChild>
          <Button variant="ghost" className="w-full text-muted-foreground hover:text-destructive">
            {dangerZoneOpen ? 'Hide' : 'Show'} Danger Zone
          </Button>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-destructive/10 border border-destructive/30 rounded-xl p-4 mt-2">
            <h3 className="font-semibold text-destructive mb-2">Danger Zone</h3>
            <p className="text-sm text-muted-foreground mb-4">
              Once you delete your account, there is no going back. Please be certain.
            </p>
            <Button 
              variant="destructive"
              onClick={() => setDeleteDialogOpen(true)}
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Delete Account
            </Button>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Password Change Modal */}
      <Dialog open={passwordModalOpen} onOpenChange={setPasswordModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change Password</DialogTitle>
            <DialogDescription>
              Enter your new password below.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="new-password">New Password</Label>
              <Input
                id="new-password"
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">Confirm Password</Label>
              <Input
                id="confirm-password"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPasswordModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handlePasswordChange} disabled={isUpdatingPassword}>
              {isUpdatingPassword ? 'Updating...' : 'Update Password'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently delete your application and account. 
              This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteAccount}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? 'Deleting...' : 'Delete Account'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Content Preview Modal */}
      <Dialog open={!!contentPreview} onOpenChange={() => setContentPreview(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Content Preview</DialogTitle>
          </DialogHeader>
          {contentPreview && (
            isMediaFile(contentPreview) ? (
              contentPreview.includes('.mp4') || contentPreview.includes('.webm') || contentPreview.includes('.mov') ? (
                <video src={contentPreview} controls className="w-full rounded-lg" />
              ) : (
                <audio src={contentPreview} controls className="w-full" />
              )
            ) : (
              <img src={contentPreview} alt="Content" className="w-full rounded-lg" />
            )
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};
