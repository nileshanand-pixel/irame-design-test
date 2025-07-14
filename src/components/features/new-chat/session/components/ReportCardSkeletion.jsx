import React from 'react';
import { Skeleton } from '@/components/ui/skeleton';

const renderReportCTASkeleton = () => (
	<div className="flex gap-2 items-center">
		<Skeleton className="w-20 h-5 bg-purple-20 rounded-md" />
		<Skeleton className="w-5 h-5 bg-purple-20 rounded-lg" />
	</div>
);

function ReportCardSkeleton({ count = 4 }) {
	return Array.from({ length: count }).map((_, i) => (
		<div
			key={i}
			className="w-full rounded-xl flex flex-col border gap-2 border-primary16 px-3 py-2"
		>
			<div className="flex justify-between items-center">
				<Skeleton className="w-1/3 h-6 bg-purple-20 rounded-md" />
				{renderReportCTASkeleton()}
			</div>
			<div className="w-full border-t border-primary8"></div>
			<div className="w-fit rounded-lg">
				<Skeleton className="w-20 bg-purple-20 h-6 rounded-lg" />
			</div>
		</div>
	));
}

export default ReportCardSkeleton;
