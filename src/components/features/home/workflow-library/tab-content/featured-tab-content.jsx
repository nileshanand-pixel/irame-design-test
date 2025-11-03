import CustomCarousel from '@/components/elements/custom-carousel';
import Card from '../card';
import workflowActiveIcon from '@/assets/icons/workflow-active.svg';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getFeaturedWorkflows } from '@/components/features/business-process/service/workflow.service';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';

export default function FeaturedTabContent() {
	const navigate = useNavigate();

	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ['featured-workflows'],
		queryFn: getFeaturedWorkflows,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => {
			// Return the next cursor if there's more data, otherwise undefined
			return lastPage?.cursor ? lastPage?.cursor : undefined;
		},
	});

	// Flatten all pages into a single array of workflows
	const workflowsData =
		data?.pages?.flatMap((page) => page?.workflow_checks) || [];

	return (
		<div className="pt-4">
			{isLoading ? (
				<div className="flex items-center gap-3 h-[13.90rem]">
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					<Skeleton className="h-[13.90rem] w-[18.75rem]" />
				</div>
			) : workflowsData?.length > 0 ? (
				<CustomCarousel
					items={workflowsData}
					showArrows={false}
					isLoading={isLoading}
					isFetchingNextPage={isFetchingNextPage}
					hasNextPage={hasNextPage}
					fetchNextPage={fetchNextPage}
					renderItem={(item) => (
						<Card
							icon={workflowActiveIcon}
							heading={item.name}
							description={item.description}
							badges={item.tags}
							descriptionLines={2}
							headingLines={1}
							onClickHandler={() => {
								navigate(
									`/app/business-process/${item.business_process_id}/workflows/${item.external_id}`,
								);
							}}
						/>
					)}
				/>
			) : (
				<div className="pb-8 flex flex-col gap-4 items-center">
					<div className="p-4 rounded-full bg-[#F2E8FA]">
						<img src={workflowActiveIcon} className="size-5" />
					</div>

					<div className="text-xl font-semibold text-[#26064A]">
						Create your first Workflow
					</div>

					<div className="text-sm text-[#26064ACC]">
						Bring your data to life with a custom view
					</div>

					<Button onClick={() => navigate('/app/business-process')}>
						Create
					</Button>
				</div>
			)}
		</div>
	);
}
