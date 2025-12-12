import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

export const DashboardSkeleton: React.FC = () => (
  <div className="space-y-6 max-w-4xl animate-fade-in">
    {/* Welcome section */}
    <div className="flex items-center gap-4">
      <Skeleton className="w-14 h-14 rounded-full" />
      <div className="space-y-2">
        <Skeleton className="h-7 w-48" />
        <Skeleton className="h-4 w-64" />
      </div>
    </div>

    {/* Status card */}
    <Skeleton className="h-40 w-full rounded-xl" />

    {/* Stats row */}
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>

    {/* Opportunities section */}
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-32 rounded-xl" />
        ))}
      </div>
    </div>

    {/* Boosts section */}
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-16 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export const OpportunitiesSkeleton: React.FC = () => (
  <div className="space-y-6 animate-fade-in">
    <div className="space-y-2">
      <Skeleton className="h-8 w-48" />
      <Skeleton className="h-4 w-72" />
    </div>
    <div className="flex gap-2">
      {[1, 2, 3, 4, 5].map((i) => (
        <Skeleton key={i} className="h-9 w-24 rounded-full" />
      ))}
    </div>
    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {[1, 2, 3, 4].map((i) => (
        <Skeleton key={i} className="h-64 rounded-xl" />
      ))}
    </div>
  </div>
);

export const BoostsSkeleton: React.FC = () => (
  <div className="space-y-6 max-w-4xl animate-fade-in">
    {/* Header */}
    <Skeleton className="h-36 rounded-xl" />
    
    {/* Available section */}
    <div className="space-y-4">
      <Skeleton className="h-6 w-40" />
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Skeleton key={i} className="h-28 rounded-xl" />
        ))}
      </div>
    </div>
  </div>
);

export const ProfileSkeleton: React.FC = () => (
  <div className="space-y-6 max-w-2xl mx-auto animate-fade-in">
    {/* Header */}
    <div className="flex items-start gap-4">
      <Skeleton className="w-20 h-20 rounded-full" />
      <div className="space-y-2 flex-1">
        <Skeleton className="h-6 w-40" />
        <Skeleton className="h-4 w-32" />
        <Skeleton className="h-3 w-36" />
      </div>
    </div>

    {/* Status card */}
    <Skeleton className="h-32 rounded-xl" />

    {/* Vibe card */}
    <Skeleton className="h-48 rounded-xl" />

    {/* Stats */}
    <div className="grid grid-cols-3 gap-3">
      {[1, 2, 3].map((i) => (
        <Skeleton key={i} className="h-24 rounded-xl" />
      ))}
    </div>

    {/* Account section */}
    <Skeleton className="h-32 rounded-xl" />
  </div>
);
