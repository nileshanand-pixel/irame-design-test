import React from 'react';
import { useSharedDashboards } from '../hooks/useDashboardData';
import { useDashboardFilter } from '../hooks/useDashboardSearch';
import DashboardList from './DashboardList';

const SharedDashboardsTab = ({
	searchQuery,
	timeFilter,
	onDashboardClick,
	onCreateDashboard,
}) => {
	const { data: dashboards = [], isLoading, error } = useSharedDashboards();

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
			isShared={true}
		/>
	);
};

export default SharedDashboardsTab;
