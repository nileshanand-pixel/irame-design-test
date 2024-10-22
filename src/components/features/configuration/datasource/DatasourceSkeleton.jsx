import TableLoader from '@/components/elements/loading/TableLoader';

const DataSourceSkeleton = () => {
	return (
		<div className="animate-pulse rounded-2xl bg-primary8 h-[65vh] mt-4 p-4">
			{/* Header Skeleton */}
			<div className="flex justify-between w-full">
				<div className="h-6 w-1/3 !bg-purple-8 rounded-md" ></div>
				<div className="flex gap-4">
					<div className="h-8 w-24 !bg-purple-8 rounded-md"></div>
					<div className="h-8 w-24 !bg-purple-8 rounded-md" ></div>
				</div>
			</div>

			{/* Tabs Skeleton */}
			<div className="mt-6">
				<div className="flex gap-4">
					<div className="h-8 w-20 !bg-purple-8 rounded-md" ></div>
					<div className="h-8 w-20 !bg-purple-8 rounded-md" ></div>
				</div>
			</div>

			{/* About Dataset Skeleton */}
			<div className="mt-10">
				<div className="h-4 w-1/4 !bg-purple-8 rounded-md" ></div>
				<div className="mt-2 h-4 w-3/4 !bg-purple-8 rounded-md" ></div>
				<div className="mt-2 h-4 w-2/3 !bg-purple-8 rounded-md" ></div>
				<div className="mt-4 h-6 w-28 !bg-purple-8 rounded-md" ></div>
			</div>

			{/* Chosen Analysis Type Skeleton */}
			<div className="mt-10 flex gap-4">
				<div className="h-8 w-32 !bg-purple-8 rounded-md" ></div>
				<div className="h-8 w-32 !bg-purple-8 rounded-md" ></div>
				<div className="h-8 w-32 !bg-purple-8 rounded-md" ></div>
			</div>

			{/* Table Skeleton */}
			<TableLoader/>
		</div>
	);
};

export default DataSourceSkeleton;