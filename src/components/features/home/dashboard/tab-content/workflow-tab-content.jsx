import CustomCarousel from '@/components/elements/custom-carousel';
import { useState, useRef, useEffect, useMemo } from 'react';
import workflowActiveIcon from '@/assets/icons/workflow-active.svg';
import Card from '../../workflow-library/card';
import { cn } from '@/lib/utils';
import { useInfiniteQuery } from '@tanstack/react-query';
import { getWorkflowsForDashboard } from '@/components/features/business-process/service/workflow.service';
import { Skeleton } from '@/components/ui/skeleton';
import { useNavigate } from 'react-router-dom';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import { Info, CaretLeft, CaretRight } from '@phosphor-icons/react';
import Tabs from '../../shared/tabs';

const TABS = [
	{
		label: 'Planned Workflows: ',
		tabKey: 'planned_workflow_count',
		apiCallKey: 'planned',
		emptyMessage: "You Don't Have Any Planned Workflows",
		tooltip: 'Workflows scheduled for this period.',
	},
	{
		label: 'Pending Workflows: ',
		tabKey: 'pending_workflow_count',
		apiCallKey: 'pending',
		emptyMessage: "You Don't Have Any Pending Workflows",
		tooltip: 'Scheduled but not yet executed.',
	},
	{
		label: 'Exceptions Raised: ',
		tabKey: 'exceptions_raised_workflow_count',
		apiCallKey: 'exceptions_raised',
		emptyMessage: "You Don't Have Any Exceptions Raised",
		tooltip: 'Workflows with at least one exception.',
	},
	{
		label: 'Adhoc Workflows runs: ',
		tabKey: 'adhoc_run_count',
		apiCallKey: 'adhoc',
		emptyMessage: "You Don't Have Any Adhoc Workflows Runs",
		tooltip: 'Unscheduled workflows that were executed.',
	},
];

export default function WorkflowTabContent({
	dateRange,
	metricsData,
	isLoadingMetrics,
}) {
	const [activeTabData, setActiveTabData] = useState(TABS[0]);
	const [activeBusinessProcess, setActiveBusinessProcess] = useState('all');
	const [showLeftScroll, setShowLeftScroll] = useState(false);
	const [showRightScroll, setShowRightScroll] = useState(false);
	const [openPopoverId, setOpenPopoverId] = useState(null);
	const scrollContainerRef = useRef(null);

	const navigate = useNavigate();
	const {
		data,
		isLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: [
			'workflows',
			dateRange,
			activeTabData?.apiCallKey,
			activeBusinessProcess,
		],
		queryFn: getWorkflowsForDashboard,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => {
			// Return the next cursor if there's more data, otherwise undefined
			return lastPage?.cursor ? lastPage?.cursor : undefined;
		},
	});

	const workflowsData = data?.pages?.flatMap((page) => page?.workflows) || [];
	const businessProcessesData =
		data?.pages?.flatMap((page) => page?.business_process_count) || [];

	// Check scroll position and update indicators
	const checkScrollPosition = () => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const { scrollLeft, scrollWidth, clientWidth } = container;
		setShowLeftScroll(scrollLeft > 0);
		setShowRightScroll(scrollLeft < scrollWidth - clientWidth - 1);
	};

	// Scroll handler
	const handleScroll = (direction) => {
		const container = scrollContainerRef.current;
		if (!container) return;

		const scrollAmount = 200;
		const newScrollLeft =
			direction === 'left'
				? container.scrollLeft - scrollAmount
				: container.scrollLeft + scrollAmount;

		container.scrollTo({
			left: newScrollLeft,
			behavior: 'smooth',
		});
	};

	// Set up scroll listener and initial check
	useEffect(() => {
		const container = scrollContainerRef.current;
		if (!container) return;

		checkScrollPosition();
		container.addEventListener('scroll', checkScrollPosition);

		// Check on resize
		const resizeObserver = new ResizeObserver(checkScrollPosition);
		resizeObserver.observe(container);

		return () => {
			container.removeEventListener('scroll', checkScrollPosition);
			resizeObserver.disconnect();
		};
	}, [businessProcessesData]);

	const UPDATED_TABS = useMemo(() => {
		return TABS.map((tab) => {
			return {
				...tab,
				label: `${tab.label} ${metricsData?.[tab.tabKey] ?? 0}`,
			};
		});
	});

	// Handler to close all popovers when carousel scrolls
	const handleCarouselScroll = () => {
		setOpenPopoverId(null);
	};

	return (
		<div className="rounded-2xl py-4 px-6 border border-[#00000014] bg-[#6A12CD05] flex flex-col gap-4 items-start">
			{/* <div className="border border-[#00000014] p-2 gap-1 bg-[#FFFFFF] inline-flex rounded-full"> */}
			<div className="w-full bg-white">
				<Tabs
					items={UPDATED_TABS}
					isActive={(item) => {
						return item.tabKey === activeTabData.tabKey;
					}}
					onChange={(item) => {
						setActiveBusinessProcess('all');
						setActiveTabData(item);
					}}
				/>
			</div>
			{/* {TABS.map((tab) => {
					const isActive = activeTabData?.tabKey === tab.tabKey;

					return (
						<div
							className={cn(
								'py-2 px-4 flex gap-1 items-center rounded-full text-[#00000099] font-medium text-sm cursor-pointer',
								isActive && 'bg-[#26064ACC] text-[#ffffff] ',
							)}
							key={tab.tabKey}
							onClick={() => setActiveTabData(tab)}
						>
							<span className="flex items-center gap-1">
								{tab.tooltip && (
									<TooltipProvider delayDuration={0}>
										<Tooltip>
											<TooltipTrigger
												className="inline-flex items-center"
												onClick={(e) => e.stopPropagation()}
											>
												<Info size={14} weight="bold" className="opacity-80" />
											</TooltipTrigger>
											<TooltipContent>
												<div className="text-sm font-normal max-w-[300px]">
													{tab.tooltip}
												</div>
											</TooltipContent>
										</Tooltip>
									</TooltipProvider>
								)}
								{tab.label}
							</span>
							{metricsData?.[tab.tabKey] ?? 0}
						</div>
					);
				})} */}
			{/* </div> */}

			{isLoading ? (
				// true ? (
				<div>
					{/* <Skeleton className="h-[2.5rem] w-1/2 rounded-full mb-4" /> */}
					<Skeleton className="h-[2.5rem] w-full rounded-full mb-4" />
					<div className="flex items-center gap-3 h-[13.90rem]">
						<Skeleton className="h-[13.90rem] w-[18.75rem]" />
						<Skeleton className="h-[13.90rem] w-[18.75rem]" />
						<Skeleton className="h-[13.90rem] w-[18.75rem]" />
						<Skeleton className="h-[13.90rem] w-[18.75rem]" />
					</div>
				</div>
			) : workflowsData?.length > 0 ? (
				<>
					{/* Scrollable Business Process Filter with indicators */}
					<div className="w-[calc(100%-5.75rem)] relative">
						{/* Left scroll button */}
						{showLeftScroll && (
							<button
								onClick={() => handleScroll('left')}
								className="absolute left-1 top-1/2 -translate-y-1/2 z-10 bg-white border border-[#26064A0A] rounded-lg p-1 shadow-sm hover:bg-gray-50 hover:border-[#26064A14] transition-all"
								aria-label="Scroll left"
							>
								<CaretLeft
									size={12}
									weight="bold"
									className="text-[#26064A99]"
								/>
							</button>
						)}

						{/* Right scroll button */}
						{showRightScroll && (
							<button
								onClick={() => handleScroll('right')}
								className="absolute right-1 top-1/2 -translate-y-1/2 z-10 bg-white border border-[#26064A0A] rounded-lg p-1 shadow-sm hover:bg-gray-50 hover:border-[#26064A14] transition-all"
								aria-label="Scroll right"
							>
								<CaretRight
									size={12}
									weight="bold"
									className="text-[#26064A99]"
								/>
							</button>
						)}

						{/* Left gradient fade */}
						{showLeftScroll && (
							<div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-white/90 to-transparent z-[5] pointer-events-none rounded-l-lg" />
						)}

						{/* Right gradient fade */}
						{showRightScroll && (
							<div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-white/90 to-transparent z-[5] pointer-events-none rounded-r-lg" />
						)}

						{/* Scrollable container */}
						<div
							ref={scrollContainerRef}
							className="p-2 bg-[#FFFFFF] flex overflow-x-auto overflow-y-hidden gap-2 rounded-lg scrollbar-hide"
							style={{
								scrollbarWidth: 'none',
								msOverflowStyle: 'none',
							}}
						>
							<div
								className={cn(
									'py-2 px-3 border border-[#26064A0A] rounded-lg shrink-0 cursor-pointer text-sm font-medium',
									activeBusinessProcess === 'all' &&
										'bg-[#6A12CD0A] text-[#6A12CD]',
								)}
								onClick={() => setActiveBusinessProcess('all')}
							>
								<div>All</div>
							</div>

							{businessProcessesData.map((item) => (
								<div
									key={item.id}
									className={cn(
										'py-2 px-3 border border-[#26064A0A] rounded-lg shrink-0 cursor-pointer text-sm font-medium',
										activeBusinessProcess === item.id &&
											'bg-[#6A12CD0A] text-[#6A12CD]',
									)}
									onClick={() => setActiveBusinessProcess(item.id)}
								>
									<div>{`${item.name} (${item.count})`}</div>
								</div>
							))}
						</div>
					</div>

					{/* workflow cards with pagination */}
					<CustomCarousel
						items={workflowsData}
						isLoading={isLoading}
						isFetchingNextPage={isFetchingNextPage}
						hasNextPage={hasNextPage}
						fetchNextPage={fetchNextPage}
						onScroll={handleCarouselScroll}
						renderItem={(item) => {
							const badges = [...item.tags];

							if (item.last_executed_date) {
								badges.push(item.last_executed_date);
							}

							if (item.frequency && item.frequency !== 'NONE') {
								badges.push(item.frequency);
							}

							return (
								<Card
									icon={workflowActiveIcon}
									heading={item.name}
									headingLines={1}
									description={item.description}
									descriptionLines={2}
									badges={badges}
									popoverOpen={openPopoverId === item.id}
									onPopoverOpenChange={(open) => {
										setOpenPopoverId(open ? item.id : null);
									}}
									onClickHandler={() => {
										navigate(
											`/app/business-process/${item.business_process_id}/workflows/${item.id}`,
										);
									}}
								/>
							);
						}}
					/>
				</>
			) : (
				<div className="py-8 flex flex-col gap-4 items-center w-full h-[15.125rem]">
					<div className="p-4 rounded-full bg-[#F2E8FA]">
						<img src={workflowActiveIcon} className="size-5" />
					</div>

					<div className="text-xl font-semibold text-[#26064A]">
						{activeTabData?.emptyMessage}
					</div>

					<div className="text-sm text-[#26064ACC]">
						Looks like you're all caught up no pending tasks right now!
					</div>
				</div>
			)}
		</div>
	);
}
