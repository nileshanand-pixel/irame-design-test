import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardHeader, CardContent } from '@/components/ui/card';

const WorkFlowDataSourceCardSkeleton = () => (
	<Card className="mb-8 text-primary80 border border-black/10 rounded-xl shadow-none">
		<CardHeader>
			<div className="flex justify-between border-b pb-3">
				<div>
					<Skeleton className="h-6 w-48 mb-2 bg-gray-200" />
					<Skeleton className="h-4 w-64 bg-gray-200" />
				</div>
				<Skeleton className="h-10 w-48 bg-gray-200" />
			</div>
		</CardHeader>
		<CardContent className="space-y-6">
			{/* Queue Status Skeleton */}
			<div className="flex items-center gap-3 px-4 py-3 bg-black/5 rounded-lg">
				<Skeleton className="h-4 w-4 bg-gray-200 rounded-full" />
				<Skeleton className="h-4 w-32 bg-gray-200" />
			</div>

			{/* Files Section Skeleton */}
			<div className="mt-6 border-b pb-6">
				<Skeleton className="h-5 w-24 mb-4 bg-gray-200" />
				{[1, 2, 3].map((i) => (
					<div
						key={i}
						className="px-4 py-2.5 rounded-lg mt-2 bg-gray-100 animate-pulse"
					>
						<div className="flex gap-2 items-center">
							<Skeleton className="w-6 h-6 bg-gray-200 rounded" />
							<Skeleton className="h-4 w-48 bg-gray-200" />
						</div>
					</div>
				))}
			</div>

			{/* Variables Section Skeleton */}
			<div>
				<Skeleton className="h-5 w-24 mb-4 bg-gray-200" />
				{[1, 2].map((i) => (
					<div key={i} className="mb-4">
						<Skeleton className="h-4 w-32 mb-2 bg-gray-200" />
						<Skeleton className="h-10 w-full bg-gray-200" />
					</div>
				))}
			</div>

			{/* Recommendations Skeleton */}
			<div className="mb-6">
				<Skeleton className="h-5 w-32 mb-4 bg-gray-200" />
				<div className="flex gap-2">
					{[1, 2].map((i) => (
						<Skeleton
							key={i}
							className="h-10 w-48 bg-gray-200 rounded-lg"
						/>
					))}
				</div>
			</div>
		</CardContent>
	</Card>
);

export default WorkFlowDataSourceCardSkeleton;
