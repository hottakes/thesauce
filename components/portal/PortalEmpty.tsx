import React from 'react';
import { Briefcase, Zap, Sparkles, PartyPopper } from 'lucide-react';
import { cn } from '@/lib/utils';

type EmptyType = 'opportunities' | 'boosts-complete' | 'coming-soon';

interface PortalEmptyProps {
  type: EmptyType;
  className?: string;
}

const emptyContent: Record<EmptyType, { icon: React.ReactNode; title: string; message: string }> = {
  opportunities: {
    icon: <Briefcase className="w-12 h-12 text-muted-foreground/50" />,
    title: 'No opportunities yet',
    message: 'New campaigns are added regularly. Check back soon!',
  },
  'boosts-complete': {
    icon: <PartyPopper className="w-12 h-12 text-primary" />,
    title: 'You\'ve completed all boosts! 🎉',
    message: 'Amazing work! Check back later for new ways to earn points.',
  },
  'coming-soon': {
    icon: <Sparkles className="w-12 h-12 text-primary/50" />,
    title: 'New opportunities coming soon',
    message: 'We\'re working on exciting new campaigns for you.',
  },
};

export const PortalEmpty: React.FC<PortalEmptyProps> = ({ type, className }) => {
  const content = emptyContent[type];
  
  return (
    <div className={cn(
      'flex flex-col items-center justify-center py-12 px-4 text-center animate-fade-in',
      type === 'boosts-complete' && 'glass-card rounded-xl',
      className
    )}>
      <div className="mb-4">{content.icon}</div>
      <h3 className="text-lg font-semibold text-foreground mb-2">{content.title}</h3>
      <p className="text-muted-foreground max-w-sm">{content.message}</p>
    </div>
  );
};
