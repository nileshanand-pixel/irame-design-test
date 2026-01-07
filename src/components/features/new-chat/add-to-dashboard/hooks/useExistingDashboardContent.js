import { useQuery } from '@tanstack/react-query';
import { useMemo } from 'react';
import { getDashboardContent } from '../../../dashboard/service/dashboard.service';
import { logError } from '@/lib/logger';
import { QUERY_KEYS } from '../constants';
import { getDashboardId } from '../utils/dashboard-helpers';
import { extractTableUrl } from '../../../dashboard/utils/dashboard-table.utils';

/**
 * Custom hook to fetch and parse existing dashboard content for a specific query
 * Extracts existing graphs and tables that are already in the dashboard
 *
 * @param {Object} options - Hook options
 * @param {Object|null} options.dashboard - Selected dashboard object
 * @param {string|null} options.queryId - Current query ID
 * @param {boolean} options.enabled - Whether to enable the query
 * @returns {Object} Existing content data and loading state
 */
export const useExistingDashboardContent = ({
	dashboard,
	queryId,
	enabled = true,
} = {}) => {
	const dashboardId = useMemo(() => {
		if (!dashboard) return null;
		return getDashboardId(dashboard);
	}, [dashboard]);

	// Fetch dashboard content
	const {
		data: dashboardContent,
		isLoading,
		error,
	} = useQuery({
		queryKey: QUERY_KEYS.DASHBOARD_CONTENT(dashboardId),
		queryFn: () => getDashboardContent(dashboardId),
		enabled: enabled && !!dashboardId && !!queryId,
		staleTime: 30000, // Cache for 30 seconds
	});

	// Parse existing content for the current query
	const existingContent = useMemo(() => {
		if (!dashboardContent || !Array.isArray(dashboardContent) || !queryId) {
			return {
				contentIds: [],
				existingGraphIds: [],
				existingTableUrl: null,
				hasExistingContent: false,
			};
		}

		// Find ALL content items with matching query_id
		const matchingContentItems = dashboardContent.filter((item) => {
			const itemQueryId = item.query_id || item.queryId;
			return itemQueryId && String(itemQueryId) === String(queryId);
		});

		if (matchingContentItems.length === 0) {
			return {
				contentIds: [],
				existingGraphIds: [],
				existingTableUrl: null,
				hasExistingContent: false,
			};
		}

		const allGraphIds = [];
		const contentItemsWithGraphs = [];
		const contentItemsWithTables = [];
		let existingTableUrl = null;

		matchingContentItems.forEach((matchingContent) => {
			const contentId =
				matchingContent.dashboard_content_id ||
				matchingContent.contentId ||
				matchingContent.id;

			if (!contentId) return;

			const graphList = matchingContent?.content?.graph?.graphs || [];
			const graphIds = graphList
				.map((graph) => graph.id || graph.graph_id)
				.filter((id) => id != null)
				.map((id) => String(id));

			if (graphIds.length > 0) {
				contentItemsWithGraphs.push({
					contentId: String(contentId),
					graphIds: graphIds,
				});
				allGraphIds.push(...graphIds);
			}

			if (matchingContent?.content?.table) {
				const extractedUrl = extractTableUrl(matchingContent);
				if (extractedUrl) {
					if (!existingTableUrl) {
						existingTableUrl = extractedUrl;
					}
					contentItemsWithTables.push({
						contentId: String(contentId),
						tableUrl: extractedUrl,
					});
				}
			}
		});

		const uniqueGraphIds = [...new Set(allGraphIds)];

		return {
			contentItemsWithGraphs,
			contentItemsWithTables,
			existingGraphIds: uniqueGraphIds,
			existingTableUrl,
			hasExistingContent: true,
		};
	}, [dashboardContent, queryId]);

	// Log errors
	if (error) {
		logError(error, {
			feature: 'add-to-dashboard',
			action: 'fetch-existing-content',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				dashboardId,
				queryId,
			},
		});
	}

	return {
		...existingContent,
		isLoading,
		error,
	};
};
