import React, { useState, useEffect } from 'react';
import ReportListingPageHeader from './components/listing-page/report-listing-page-header';
import ReportFiles from './components/listing-page/ReportFiles';
import BreadCrumbs from '@/components/BreadCrumbs';
import { VIEWS, TABS } from './constants';
import ShareReportDialog from './components/ShareReportDialog';

// Helper function to find tab by fragment
const getTabByFragment = (fragment) => {
	return (
		Object.values(TABS).find((tab) => tab.fragment === fragment) ||
		TABS.MY_REPORTS
	);
};

const ReportsPage = () => {
	const [search, setSearch] = useState('');
	const [view, setView] = useState(VIEWS.LIST);
	// const [displayReportsCount, setDisplayReportsCount] = useState(0);

	// Initialize activeTab from URL fragment if present
	const [activeTab, setActiveTab] = useState(() => {
		const hash = window.location.hash.slice(1); // Remove the '#' prefix
		return getTabByFragment(hash);
	});

	const [sortValue, setSortValue] = useState(null);

	// const [teamFilter, setTeamFilter] = useState(null);
	const [ownerFilter, setOwnerFilter] = useState(null);

	// Update URL fragment when activeTab changes
	useEffect(() => {
		window.history.replaceState(null, '', `#${activeTab.fragment}`);
	}, [activeTab]);

	// Listen for hash changes (e.g., browser back/forward)
	useEffect(() => {
		const handleHashChange = () => {
			const hash = window.location.hash.slice(1);
			if (hash) {
				const newTab = getTabByFragment(hash);
				setActiveTab(newTab);
			}
		};

		window.addEventListener('hashchange', handleHashChange);
		return () => window.removeEventListener('hashchange', handleHashChange);
	}, []);

	return (
		<div className="w-full px-5 h-full flex flex-col gap-4 overflow-hidden">
			<BreadCrumbs
				items={[
					{
						label: 'Reports',
						icon: 'https://d2vkmtgu2mxkyq.cloudfront.net/report-icon.svg',
					},
					{
						label: activeTab.label,
					},
				]}
			/>

			<ReportListingPageHeader
				view={view}
				onViewChange={setView}
				activeTab={activeTab}
				onActiveTabChange={setActiveTab}
				search={search}
				onSearchChange={setSearch}
				sortValue={sortValue}
				onSortValueChange={setSortValue}
				// teamFilter={teamFilter}
				// onTeamFilterChange={setTeamFilter}
				ownerFilter={ownerFilter}
				onOwnerFilterChange={setOwnerFilter}
				// displayReportsCount={displayReportsCount}
			/>

			<div className="flex-1 overflow-y-auto pb-6">
				<ReportFiles
					view={view}
					activeTab={activeTab}
					search={search}
					sortValue={sortValue}
					ownerFilter={ownerFilter}
					// onDisplayReportsChange={setDisplayReportsCount}
				/>
			</div>

			<ShareReportDialog />
		</div>
	);
};

export default ReportsPage;
