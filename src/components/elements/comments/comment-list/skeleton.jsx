import { Skeleton } from '@/components/ui/skeleton';

export default function CommentListSkeleton() {
	return (
		<div className="border-b border-[#D1D5DB] bg-[#fff]">
			{Array.from({ length: 2 }).map((comment) => (
				<div className="p-3 flex gap-3">
					<Skeleton className="w-6 h-6 rounded-full" />
					<div className="">
						<Skeleton className="h-[25px] w-[150px] mb-1" />
						<Skeleton className="h-[15px] w-[80px] mb-2" />
						<Skeleton className="h-[20px] w-[400px] mb-1" />
					</div>
				</div>
			))}
		</div>
	);
}
