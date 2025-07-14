export function WorkflowPageSkeleton() {
	return (
		<div className="h-full w-full p-4 space-y-4">
			{/* Breadcrumb Skeleton */}
			<div className="h-8 bg-gray-200 rounded w-1/3 animate-pulse"></div>

			{/* Header Skeleton */}
			<div className="h-12 bg-gray-200 rounded w-1/4 animate-pulse"></div>

			{/* Details Skeleton */}
			<div className="grid grid-cols-2 gap-4">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="h-10 bg-gray-200 rounded animate-pulse"
					></div>
				))}
			</div>

			{/* Data Source Card Skeleton */}
			<div className="h-64 bg-gray-200 rounded-lg animate-pulse"></div>

			{/* Steps Skeleton */}
			<div className="space-y-4">
				{[1, 2, 3, 4].map((i) => (
					<div
						key={i}
						className="h-24 bg-gray-200 rounded-lg animate-pulse"
					></div>
				))}
			</div>
		</div>
	);
}
