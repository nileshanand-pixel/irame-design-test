import { Skeleton } from '@/components/ui/skeleton';
import React from 'react';

const CardSkeleton = () => {
	return (
		<div className="w-full mt-6 p-6 bg-white border border-primary1 rounded-xl space-y-4">
			{/* Placeholder for the image */}
			<div className="h-32 w-full bg-purple-4 rounded-md" />

			{/* Placeholder for the report name */}
			<div className="space-y-2">
				<Skeleton className="h-6 w-1/3 bg-purple-8 rounded" />
				<div className="flex space-x-2">
					<Skeleton className="h-4 w-20 bg-purple-8 rounded-full" />
					<Skeleton className="h-4 w-20 bg-purple-8 rounded-full" />
					<Skeleton className="h-4 w-8 bg-purple-8 rounded-full" />
				</div>
			</div>

			{/* Placeholder for the description */}
			<Skeleton className="h-4 w-full bg-purple-8 rounded" />
			<Skeleton className="h-4 w-3/4 bg-purple-8 rounded" />

			{/* Placeholder for the data source */}
			<div className="flex items-center space-x-2">
				<Skeleton className="h-4 w-6 bg-purple-8 rounded-full" />
				<Skeleton className="h-4 w-32 bg-purple-8 rounded" />
			</div>
		</div>
	);
};

export default CardSkeleton;
