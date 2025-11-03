import { DASHBOARD_TABS } from '@/constants/home-page.constant';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import dayjs from 'dayjs';

const getDateRangeDescription = (startDate, endDate) => {
	if (!startDate || !endDate) return 'last 30 days';

	const start = dayjs(startDate);
	const end = dayjs(endDate);
	const daysDiff = end.diff(start, 'day') + 1;

	// Check if it's a common range
	if (daysDiff === 30) return 'last 30 days';
	if (daysDiff === 15) return 'last 15 days';
	if (daysDiff === 7) return 'last 7 days';

	// For custom ranges, show the actual dates
	return `${start.format('MMM D, YYYY')} - ${end.format('MMM D, YYYY')}`;
};

export default function DashboardTabs({
	activeTabData,
	setActiveTabData,
	metricsData,
	isLoadingMetrics,
	dateRange,
}) {
	const dateRangeText = getDateRangeDescription(
		dateRange?.startDate,
		dateRange?.endDate,
	);
	return (
		<div className="grid grid-cols-4 gap-3 mb-[1.5rem]">
			{DASHBOARD_TABS?.length > 0 &&
				DASHBOARD_TABS.map((item) => {
					const isActive = activeTabData?.value === item.value;
					return (
						<div
							className="relative"
							key={item.value}
							onClick={() => setActiveTabData(item)}
						>
							<div className="overflow-hidden w-full relative p-3 border border-[#00000014] rounded-2xl flex flex-col gap-2 cursor-pointer">
								<div className="flex flex-col gap-1">
									<div className="font-semibold text-[#26064ACC]">
										{item.title}
									</div>
									{item.description && (
										<div className="text-xs text-[#00000099] font-medium">
											{item.description} in {dateRangeText}
										</div>
									)}
								</div>

								<div
									className={cn(
										'text-[#000000CC] text-[2rem] font-semibold',
										isActive && 'text-[#6A12CD]',
									)}
								>
									{isLoadingMetrics ? (
										<Skeleton className="h-12 w-16" />
									) : (
										(metricsData?.[item.value] ?? 0)
									)}
								</div>

								<div
									className={cn(
										'absolute -right-[1rem] -bottom-[1rem] border-[1rem] border-[#8B33AE05] rounded-full w-[4.5rem] h-[4.5rem] flex items-center justify-center',
										isActive && 'border-[#8B33AE1A]',
									)}
								>
									<img
										src={
											isActive ? item?.activeIcon : item?.icon
										}
										className="size-5"
									/>
								</div>
							</div>
							<div
								className={cn(
									'absolute w-[90%] h-2 bottom-[-1.5rem] left-1/2 -translate-x-1/2 rounded-t-lg z-10',
									isActive ? 'bg-[#6A12CD]' : 'bg-[#fff]',
								)}
							></div>
						</div>
					);
				})}
		</div>
	);
}
