import { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import { getMyDashboards } from '../../../dashboard/service/dashboard.service';
import { logError } from '@/lib/logger';
import { QUERY_KEYS } from '../constants';

/**
 * Custom hook for fetching and managing dashboard data
 * Makes a single API call with query_id parameter to get:
 * 1. dashboard_list - All user dashboards (for dropdown)
 * 2. dashboards_containing_query_list - Dashboards containing the current query (for list)
 *
 * @param {Object} options - Hook options
 * @param {boolean} options.enabled - Whether queries should be enabled
 * @param {string} options.queryId - Query ID for filtering dashboards
 * @returns {Object} Dashboard data and state
 */
export const useDashboardData = ({ enabled = true, queryId = null } = {}) => {
	const [dashboards, setDashboards] = useState([]);
	const [queryDashboards, setQueryDashboards] = useState([]);

	// Single API call with query_id parameter
	// Returns both dashboard_list and dashboards_containing_query_list
	const dashboardQuery = useQuery({
		queryKey: QUERY_KEYS.DASHBOARDS_CONTAINING_QUERY(queryId),
		queryFn: () => getMyDashboards({ query_id: queryId }),
		enabled: enabled && !!queryId,
	});

	// Extract dashboard_list (all dashboards for dropdown)
	useEffect(() => {
		if (dashboardQuery.data) {
			const dashboardList = Array.isArray(dashboardQuery.data)
				? dashboardQuery.data
				: [];
			setDashboards(dashboardList);
		}
	}, [dashboardQuery.data]);

	// Extract dashboards_containing_query_list (dashboards with current query)
	useEffect(() => {
		if (dashboardQuery.data) {
			const queryDashboardList =
				dashboardQuery.data?.dashboardsContainingQuery || [];
			setQueryDashboards(
				Array.isArray(queryDashboardList) ? queryDashboardList : [],
			);
		}
	}, [dashboardQuery.data]);

	// Error logging
	useEffect(() => {
		if (dashboardQuery.error) {
			logError(dashboardQuery.error, {
				feature: 'add-to-dashboard',
				action: 'fetch-dashboards',
				extra: {
					errorMessage: dashboardQuery.error.message,
					status: dashboardQuery.error.response?.status,
					queryId,
				},
			});
		}
	}, [dashboardQuery.error, queryId]);

	return {
		dashboards, // All user dashboards (for dropdown)
		queryDashboards, // Dashboards containing current query (for list)
		isLoading: dashboardQuery.isLoading,
		isError: dashboardQuery.isError,
	};
};
