import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const DataSourceCardSkeleton = () => {
	return (
		<div className="flex gap-4 w-100 items-center py-4 px-6 border rounded-2xl border-primary10">
			<Skeleton className="w-1/5 h-16 bg-purple-10 rounded-md" />
			<div className="flex w-4/5 flex-col gap-2">
				<Skeleton className="h-6 bg-purple-10 w-4/5" />
				<Skeleton className="h-6 w-2/5 bg-purple-10 rounded-2xl" />
			</div>
		</div>
	);
};

export default DataSourceCardSkeleton;
