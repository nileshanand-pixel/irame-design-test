import { useState } from 'react';
import DashboardTabs from './dashboard-tabs';
import { DASHBOARD_TABS } from '@/constants/home-page.constant';
import dayjs from 'dayjs';
import DateRangePicker from '@/components/elements/DateRangePicker';
import { useQuery } from '@tanstack/react-query';
import { getUsersMetrics } from '../service/home-page.service';

const PREDEFINED_DATE_PICKER_OPTIONS = [
	{
		label: 'Last 30 days',
		key: 'last_30_days',
		startDate: dayjs().subtract(29, 'day').toISOString(),
		endDate: dayjs().toISOString(),
	},
	{
		label: 'Last 15 days',
		key: 'last_15_days',
		startDate: dayjs().subtract(14, 'day').toISOString(),
		endDate: dayjs().toISOString(),
	},
	{
		label: 'Last 7 days',
		key: 'last_7_days',
		startDate: dayjs().subtract(6, 'day').toISOString(),
		endDate: dayjs().toISOString(),
	},
];

export default function Dashboard() {
	const [activeTabData, setActiveTabData] = useState(DASHBOARD_TABS[0]);
	const [dateRange, setDateRange] = useState({
		startDate: PREDEFINED_DATE_PICKER_OPTIONS[0]?.startDate,
		endDate: PREDEFINED_DATE_PICKER_OPTIONS[0]?.endDate,
	});
	const ActiveComponent = activeTabData?.component;

	const { data: metricsData, isLoading: isLoadingMetrics } = useQuery({
		queryKey: ['users-metrics', dateRange],
		queryFn: getUsersMetrics,
		enabled: !!dateRange?.startDate && !!dateRange?.endDate,
	});

	return (
		<div className="">
			<div className="flex justify-between items-end mb-4">
				<div className="text-sm font-medium text-[#00000066]">Dashboard</div>

				<div>
					<DateRangePicker
						onChange={setDateRange}
						predefinedOptions={PREDEFINED_DATE_PICKER_OPTIONS}
					/>
				</div>
			</div>

			<DashboardTabs
				activeTabData={activeTabData}
				setActiveTabData={setActiveTabData}
				metricsData={metricsData}
				isLoadingMetrics={isLoadingMetrics}
				dateRange={dateRange}
			/>

			{activeTabData?.component && (
				<ActiveComponent
					dateRange={dateRange}
					metricsData={metricsData}
					isLoadingMetrics={isLoadingMetrics}
				/>
			)}
		</div>
	);
}
