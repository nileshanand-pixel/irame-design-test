import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

const BusinessProcessPageSkeleton = () => (
	<div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
		{Array.from({ length: 16 }).map((_, i) => (
			<Card key={i} className="animate-pulse">
				<CardHeader>
					<div className="h-8 w-8 bg-gray-200 rounded-lg"></div>
				</CardHeader>
				<CardContent>
					<div className="h-5 bg-gray-200 rounded w-3/4 mb-3"></div>
					<div className="h-3 bg-gray-200 rounded w-full mb-2"></div>
					<div className="flex gap-2">
						{Array.from({ length: 3 }).map((_, i) => (
							<div
								key={i}
								className="h-4 w-16 bg-gray-200 rounded"
							></div>
						))}
					</div>
				</CardContent>
			</Card>
		))}
	</div>
);

export default BusinessProcessPageSkeleton;
