import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

const AccessSkeleton = () => {
  return (
    <div className="flex items-center justify-between p-4 bg-white border border-gray-300 rounded-lg shadow-sm space-x-4">
      {/* Placeholder for the user icon */}
      <div className="flex items-center space-x-2">
        <Skeleton className="h-10 w-10 rounded-full bg-purple-8" />

        {/* Placeholder for the name */}
        <Skeleton className="h-4 w-40 bg-purple-8 rounded" />
      </div>

      {/* Placeholder for the access level */}
      <Skeleton className="h-4 w-20 bg-purple-8 rounded-full" />
    </div>
  );
};

const AccessSkeletonList = () => {
  return (
    <div className="space-y-4 mt-6">
      <AccessSkeleton />
      <AccessSkeleton />
    </div>
  );
};

export default AccessSkeletonList;
