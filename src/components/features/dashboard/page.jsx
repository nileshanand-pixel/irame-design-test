import React, { useState, useCallback, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Tabs, TabsContent } from '@/components/ui/tabs';
import DashboardHeader from './components/DashboardHeader';
import DashboardTabs from './components/DashboardTabs';
import DashboardActionBar from './components/DashboardActionBar';
import MyDashboardsTab from './components/MyDashboardsTab';
import SharedDashboardsTab from './components/SharedDashboardsTab';
import CreateDashboardModal from './components/CreateDashboardModal';
import { useDebouncedSearch } from './hooks/useDashboardSearch';
import {
	DEFAULT_TIME_FILTER,
	DASHBOARD_TABS,
} from './constants/dashboard.constants';

const DashboardPage = () => {
	const [searchParams, setSearchParams] = useSearchParams();

	const [timeFilter, setTimeFilter] = useState(DEFAULT_TIME_FILTER);
	const [searchValue, debouncedSearchValue, setSearchValue] =
		useDebouncedSearch(300);
	const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
	const navigate = useNavigate();

	// Get active tab from URL, default to MY_DASHBOARD
	const activeTab = useMemo(() => {
		const tabParam = searchParams.get('tab');
		return tabParam &&
			Object.values(DASHBOARD_TABS)
				?.map((t) => t.value)
				.includes(tabParam)
			? tabParam
			: DASHBOARD_TABS.MY_DASHBOARD.value;
	}, [searchParams]);

	// Sync URL with tab state on mount
	useEffect(() => {
		if (!searchParams.get('tab')) {
			setSearchParams({ tab: activeTab }, { replace: true });
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleTabChange = useCallback(
		(value) => {
			setSearchParams({ tab: value }, { replace: true });
			setSearchValue('');
			setTimeFilter(DEFAULT_TIME_FILTER);
		},
		[setSearchParams, setSearchValue],
	);

	const handleDashboardClick = useCallback(
		(dashboard) => {
			// Route to new dashboard detail page for dashboards from live-dashboard
			// Use a separate route to avoid conflicts with old dashboard flow
			navigate(`/app/dashboard/content?id=${dashboard.id}`);
		},
		[navigate],
	);

	const handleCreateDashboardClick = useCallback(() => {
		setIsCreateModalOpen(true);
	}, []);

	const handleDashboardCreateSuccess = useCallback(
		(data) => {
			// Stay on the live-dashboard page with the current active tab
			// The dashboard list will automatically refresh via query invalidation
			// No need to navigate away - just close the modal and stay on the page
			setSearchParams({ tab: activeTab }, { replace: true });
		},
		[activeTab, setSearchParams],
	);

	return (
		<div className="h-full w-full flex flex-col px-6 py-4 pt-1">
			<DashboardHeader />

			<Tabs
				value={activeTab}
				onValueChange={handleTabChange}
				className="h-[calc(100%-3rem)]"
			>
				<DashboardTabs />

				<DashboardActionBar
					searchValue={searchValue}
					onSearchChange={setSearchValue}
					timeFilter={timeFilter}
					onTimeFilterChange={setTimeFilter}
					onCreateDashboard={handleCreateDashboardClick}
				/>

				<div className="h-[calc(100%-9rem)] overflow-auto pb-2">
					<TabsContent
						value={DASHBOARD_TABS.MY_DASHBOARD.value}
						className="mt-0"
					>
						<MyDashboardsTab
							searchQuery={debouncedSearchValue}
							timeFilter={timeFilter}
							onDashboardClick={handleDashboardClick}
							onCreateDashboard={handleCreateDashboardClick}
						/>
					</TabsContent>

					{/* <TabsContent
						value={DASHBOARD_TABS.SHARED_DASHBOARD.value}
						className="mt-0"
					>
						<SharedDashboardsTab
							searchQuery={debouncedSearchValue}
							timeFilter={timeFilter}
							onDashboardClick={handleDashboardClick}
							onCreateDashboard={handleCreateDashboardClick}
						/>
					</TabsContent> */}
				</div>
			</Tabs>

			{/* Create Dashboard Modal */}
			<CreateDashboardModal
				open={isCreateModalOpen}
				onOpenChange={setIsCreateModalOpen}
				onSuccess={handleDashboardCreateSuccess}
			/>
		</div>
	);
};

export default DashboardPage;
