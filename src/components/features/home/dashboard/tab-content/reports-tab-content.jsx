import CustomCarousel from '@/components/elements/custom-carousel';
import Card from '../../workflow-library/card';
import reportActiveIcon from '@/assets/icons/reports-active.svg';
import { getUserReportsForDashboard } from '@/components/features/reports/service/reports.service';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { openModal } from '@/redux/reducer/modalReducer';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function ReportsTabContent({ dateRange }) {
	const navigate = useNavigate();
	const dispatch = useDispatch();

	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ['reports', dateRange],
		queryFn: getUserReportsForDashboard,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => {
			// Return the next cursor if there's more data, otherwise undefined
			return lastPage?.cursor ? lastPage?.cursor : undefined;
		},
	});

	// Flatten all pages into a single array of reports
	const reportsData = data?.pages?.flatMap((page) => page?.reports) || [];

	return (
		<div className="py-4 pt-5 px-6 bg-[#6A12CD05] rounded-2xl border border-[#00000014]">
			<div className="mb-5">
				<div className="flex items-center gap-2">
					<span className="text-[#000000CC] font-semibold">
						Recent Reports Created
					</span>
					{/* <span className="text-[#344054] text-[0.75rem] font-medium">
						Latest Reports Updates: 6
					</span> */}
				</div>
			</div>

			{isLoading ? (
				<div className="flex items-center gap-3 h-[13.90rem]">
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
				</div>
			) : reportsData?.length > 0 ? (
				<CustomCarousel
					items={reportsData}
					isLoading={isLoading}
					isFetchingNextPage={isFetchingNextPage}
					hasNextPage={hasNextPage}
					fetchNextPage={fetchNextPage}
					renderItem={(item) => (
						<Card
							icon={reportActiveIcon}
							description={item.name}
							descriptionLines={4}
							onClickHandler={() => {
								navigate(`/app/reports/${item.report_id}`);
							}}
						/>
					)}
				/>
			) : (
				<div className="pb-8 flex flex-col gap-4 items-center">
					<div className="p-4 rounded-full bg-[#F2E8FA]">
						<img src={reportActiveIcon} className="size-5" />
					</div>

					<div className="text-xl font-semibold text-[#26064A]">
						Create your first Report
					</div>

					<div className="text-sm text-[#26064ACC]">
						Bring your data to life with a custom view
					</div>

					<Button
						onClick={() =>
							dispatch(
								openModal({
									modalName: 'createReport',
									revalidateQuery: ['reports', dateRange],
								}),
							)
						}
					>
						Create
					</Button>
				</div>
			)}
		</div>
	);
}
