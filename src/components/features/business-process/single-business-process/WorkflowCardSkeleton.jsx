import React from 'react';
import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

const WorkflowSkeleton = () => (
	<Card className="mb-4">
		<CardContent className="p-6">
			<div className="flex items-start gap-4">
				<Skeleton className="h-6 w-6" />
				<div className="flex-1">
					<Skeleton className="h-6 w-1/3 mb-2" />
					<Skeleton className="h-4 w-2/3 mb-3" />
					<div className="flex gap-2">
						<Skeleton className="h-5 w-16" />
						<Skeleton className="h-5 w-16" />
						<Skeleton className="h-5 w-16" />
					</div>
				</div>
			</div>
		</CardContent>
	</Card>
);

export default WorkflowSkeleton;
