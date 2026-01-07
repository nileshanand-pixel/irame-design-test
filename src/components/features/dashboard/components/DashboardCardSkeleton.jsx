import { Skeleton } from '@/components/ui/skeleton';

const DashboardCardSkeleton = () => {
	return (
		<div className="flex items-center justify-between p-6 border border-gray-200 rounded-lg">
			<div className="flex items-center gap-4 flex-1">
				<Skeleton className="w-12 h-12 rounded-lg bg-purple-4" />
				<div className="flex-1 space-y-2">
					<Skeleton className="h-5 bg-purple-4 w-64" />
					<Skeleton className="h-4 bg-purple-4 w-96" />
				</div>
			</div>
			<div className="flex items-center gap-6">
				<Skeleton className="h-4 w-24 bg-purple-4" />
				<Skeleton className="h-4 w-32 bg-purple-4" />
			</div>
		</div>
	);
};

export default DashboardCardSkeleton;
