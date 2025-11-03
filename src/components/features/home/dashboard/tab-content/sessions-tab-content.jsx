import CustomCarousel from '@/components/elements/custom-carousel';
import Card from '../../workflow-library/card';
import queriesActiveIcon from '@/assets/icons/session-active.svg';
import { getUserSessionForDashboard } from '@/components/features/new-chat/service/new-chat.service';
import { useInfiniteQuery } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function SessionsTabContent({ dateRange }) {
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
		queryKey: ['sessions', dateRange],
		queryFn: getUserSessionForDashboard,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => {
			// Return the next cursor if there's more data, otherwise undefined
			return lastPage?.cursor ? lastPage?.cursor : undefined;
		},
	});

	// Flatten all pages into a single array of sessions
	const sessions = data?.pages?.flatMap((page) => page?.session_list) || [];

	return (
		<div className="py-4 pt-5 px-6 bg-[#6A12CD05] rounded-2xl border border-[#00000014]">
			<div className="mb-5">
				<div className="flex items-center gap-2">
					<span className="text-[#000000CC] font-semibold">
						Sessions Run Status
					</span>
				</div>
			</div>

			{isLoading ? (
				<div className="flex items-center gap-3 h-[13.90rem]">
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
				</div>
			) : sessions?.length > 0 ? (
				<CustomCarousel
					items={sessions}
					isLoading={isLoading}
					isFetchingNextPage={isFetchingNextPage}
					hasNextPage={hasNextPage}
					fetchNextPage={fetchNextPage}
					renderItem={(item) => (
						<Card
							icon={queriesActiveIcon}
							description={item.title}
							descriptionLines={4}
							onClickHandler={() => {
								navigate(
									`/app/new-chat/session?sessionId=${item.session_id}&source=side_bar&datasource_id=${item.datasource_id}`,
								);
							}}
						/>
					)}
				/>
			) : (
				<div className="pb-8 flex flex-col gap-4 items-center">
					<div className="p-4 rounded-full bg-[#F2E8FA]">
						<img src={queriesActiveIcon} className="size-5" />
					</div>

					<div className="text-xl font-semibold text-[#26064A]">
						Run your first Sessions
					</div>

					<div className="text-sm text-[#26064ACC]">
						Get instant insights by running your first data query it only
						takes a few clicks.
					</div>

					<Button
						onClick={() => {
							dispatch(
								updateUtilProp([
									{
										key: 'isDatasourceSelectionModalOpen',
										value: true,
									},
								]),
							);
						}}
					>
						Continue
					</Button>
				</div>
			)}
		</div>
	);
}
