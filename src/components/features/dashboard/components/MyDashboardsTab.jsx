import React from 'react';
import { useMyDashboards } from '../hooks/useDashboardData';
import { useDashboardFilter } from '../hooks/useDashboardSearch';
import DashboardList from './DashboardList';

const MyDashboardsTab = ({
	searchQuery,
	timeFilter,
	onDashboardClick,
	onCreateDashboard,
	onShare,
}) => {
	const { data: dashboards = [], isLoading, error } = useMyDashboards();

	const filteredDashboards = useDashboardFilter(
		dashboards,
		searchQuery,
		timeFilter,
	);

	return (
		<DashboardList
			dashboards={filteredDashboards}
			isLoading={isLoading}
			error={error}
			searchQuery={searchQuery}
			onDashboardClick={onDashboardClick}
			onCreateDashboard={onCreateDashboard}
			onShare={onShare}
			isShared={false}
		/>
	);
};

export default MyDashboardsTab;
