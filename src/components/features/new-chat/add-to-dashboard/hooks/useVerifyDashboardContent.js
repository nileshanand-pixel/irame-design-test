import { useQueries } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getDashboardContent } from '../../../dashboard/service/dashboard.service';
import { QUERY_KEYS } from '../constants';
import { getDashboardId } from '../utils/dashboard-helpers';
import { extractTableUrl } from '../../../dashboard/utils/dashboard-table.utils';

/**
 * Custom hook to verify which dashboards actually have content for a specific query
 * Filters out dashboards where all content has been deleted
 *
 * @param {Array} dashboards - Array of dashboard objects to verify
 * @param {string} queryId - Query ID to check for
 * @param {boolean} enabled - Whether to enable verification
 * @returns {Array} Array of dashboard objects that have actual content for the query
 */
export const useVerifyDashboardContent = ({
	dashboards = [],
	queryId = null,
	enabled = true,
} = {}) => {
	// Fetch content for all dashboards in parallel
	const contentQueries = useQueries({
		queries: dashboards.map((dashboard) => {
			const dashboardId = getDashboardId(dashboard);
			return {
				queryKey: [
					...QUERY_KEYS.DASHBOARD_CONTENT(dashboardId),
					'verify',
					queryId,
				],
				queryFn: () => getDashboardContent(dashboardId),
				enabled: enabled && !!dashboardId && !!queryId,
				staleTime: 30000, // Cache for 30 seconds
				retry: false, // Don't retry failed queries to avoid blocking
			};
		}),
	});

	// Filter dashboards that have actual content for this query
	// Show dashboards optimistically, only hide if we confirm they have no content
	const verifiedDashboards = useMemo(() => {
		if (!queryId || !enabled || dashboards.length === 0) {
			return dashboards;
		}

		return dashboards.filter((dashboard, index) => {
			const contentQuery = contentQueries[index];

			// Always show dashboards optimistically while loading or if we don't have data yet
			if (contentQuery.isLoading || !contentQuery.data) {
				return true;
			}

			// If query failed, show the dashboard (optimistic)
			if (contentQuery.isError) {
				return true;
			}

			const dashboardContent = contentQuery.data;
			if (!Array.isArray(dashboardContent)) {
				return true;
			}

			// Find content items with matching query_id
			const matchingContentItems = dashboardContent.filter((item) => {
				const itemQueryId = item.query_id || item.queryId;
				return itemQueryId && String(itemQueryId) === String(queryId);
			});

			// If no matching content items found, hide the dashboard
			if (matchingContentItems.length === 0) {
				return false;
			}

			// Check if any matching content item has graphs or tables
			const hasContent = matchingContentItems.some((item) => {
				const hasGraphs = item?.content?.graph?.graphs?.length > 0;
				const hasTable = !!item?.content?.table;
				if (hasTable) {
					const tableUrl = extractTableUrl(item);
					if (tableUrl) {
						return true;
					}
				}
				return hasGraphs || hasTable;
			});

			return hasContent;
		});
	}, [dashboards, contentQueries, queryId, enabled]);

	const isLoading = contentQueries.some((query) => query.isLoading);

	return {
		verifiedDashboards,
		isLoading,
	};
};
