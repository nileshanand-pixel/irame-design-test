const SessionSkeleton = () => {
	return (
		<div className="flex items-center justify-between w-full rounded-lg py-2 pl-1 text-sm font-medium animate-pulse">
			<div className="flex items-center max-w-[12.5rem] px-2 py-1 gap-3">
				{/* Icon skeleton */}
				<div className="size-5 bg-purple-20 rounded-full shrink-0" />

				{/* Title skeleton */}
				<div className="h-4 bg-purple-20 rounded w-32" />
			</div>

			{/* Three dots skeleton */}
			<div className="me-3">
				<div className="size-4 bg-purple-20 rounded" />
			</div>
		</div>
	);
};

export default SessionSkeleton;
