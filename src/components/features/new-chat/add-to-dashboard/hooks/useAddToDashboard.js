import React, { useState, useCallback } from 'react';
import { queryClient } from '@/lib/react-query';
import { toast } from '@/lib/toast';
import { Button } from '@/components/ui/button';
import { useRouter } from '@/hooks/useRouter';
import {
	createDashboardContent,
	deleteDashboardContentItems,
} from '../../../dashboard/service/dashboard.service';
import { handleAddToDashboardError } from '../utils/error-handler';
import { logError } from '@/lib/logger';
import { QUERY_KEYS } from '../constants';
import { getDashboardId, getDashboardTitle } from '../utils/dashboard-helpers';

/**
 * Custom hook for handling add to dashboard submission
 *
 * @param {Object} options - Hook options
 * @param {Function} options.onSuccess - Success callback
 * @param {Function} options.onError - Error callback
 * @returns {Object} Submission state and handler
 */
export const useAddToDashboard = ({ onSuccess, onError } = {}) => {
	const [isSubmitting, setIsSubmitting] = useState(false);
	const { navigate } = useRouter();

	const submit = useCallback(
		async ({
			dashboard,
			queryId,
			selectedGraph,
			selectedTable,
			widgets,
			queryDataQuery,
			existingContent = null,
		}) => {
			// Validation
			if (!dashboard || !queryId) {
				toast.error('Please select a dashboard');
				return;
			}

			if (queryDataQuery.isLoading) {
				toast.error('Loading query data. Please wait...');
				return;
			}

			if (queryDataQuery.isError) {
				toast.error('Failed to load query data. Please try again.');
				return;
			}

			if (!queryDataQuery.data) {
				toast.error('Query data not available. Please try again.');
				return;
			}

			if (!selectedGraph && !selectedTable) {
				toast.error('Please select at least one graph or table');
				return;
			}

			setIsSubmitting(true);

			try {
				// Validate graph ID if selected
				if (selectedGraph) {
					const graphExists = widgets.graphs.some(
						(g) => g.id === selectedGraph,
					);
					if (!graphExists) {
						toast.error('Selected graph not found in query data');
						setIsSubmitting(false);
						return;
					}
				}

				// Extract table URL from query response (API expects exact match)
				let tableUrlToSend = null;
				if (selectedTable) {
					const tableWidget = widgets.tables.find(
						(t) => t.id === selectedTable,
					);
					if (!tableWidget) {
						toast.error('Selected table not found in query data');
						setIsSubmitting(false);
						return;
					}

					const queryAnswer = queryDataQuery.data?.answer || {};
					const responseDataframe =
						queryAnswer.response_dataframe?.tool_data;

					if (responseDataframe) {
						// API expects exact URL from query response - prefer csv_url over sample_url
						tableUrlToSend =
							responseDataframe.csv_url ||
							responseDataframe.sample_url;

						if (!tableUrlToSend) {
							logError(
								new Error('Table URL not found in query response'),
								{
									feature: 'add-to-dashboard',
									action: 'extract-table-url',
									extra: {
										queryId,
										hasCsvUrl: !!responseDataframe?.csv_url,
										hasSampleUrl:
											!!responseDataframe?.sample_url,
									},
								},
							);
							toast.error('Table URL not found in query response');
							setIsSubmitting(false);
							return;
						}
					} else {
						// Fallback: use widget's tableUrl (raw URL)
						tableUrlToSend = tableWidget.tableUrl || tableWidget.csv_url;
					}
				}

				// Prepare content data
				const contentData = {
					queryId,
				};

				if (selectedGraph) {
					contentData.graphIds = [String(selectedGraph)];
				}

				if (selectedTable && tableUrlToSend) {
					contentData.tableUrls = [String(tableUrlToSend)];
				}

				// Final validation
				if (!contentData.graphIds && !contentData.tableUrls) {
					toast.error('Please select at least one graph or table');
					setIsSubmitting(false);
					return;
				}

				// Get dashboard ID
				const dashboardId = getDashboardId(dashboard);
				if (!dashboardId) {
					toast.error('Invalid dashboard selected');
					setIsSubmitting(false);
					return;
				}

				// Check if we need to replace existing content
				const hasExistingContent =
					existingContent?.hasExistingContent === true;
				const contentItemsWithGraphs =
					existingContent?.contentItemsWithGraphs || [];
				const contentItemsWithTables =
					existingContent?.contentItemsWithTables || [];
				const existingGraphIds = existingContent?.existingGraphIds || [];
				const existingTableUrl = existingContent?.existingTableUrl;

				// Replace graph if existing and user selected a new one
				const isReplacingGraph = Boolean(
					hasExistingContent &&
						selectedGraph &&
						existingGraphIds.length > 0,
				);

				// Replace table if existing and user selected a new one
				const isReplacingTable = Boolean(
					hasExistingContent &&
						existingTableUrl &&
						selectedTable &&
						tableUrlToSend,
				);

				// Delete existing table if user didn't select it OR if replacing
				const shouldDeleteExistingTable = Boolean(
					hasExistingContent &&
						existingTableUrl &&
						(!selectedTable || isReplacingTable),
				);

				// Delete existing graphs if replacing
				if (isReplacingGraph && contentItemsWithGraphs.length > 0) {
					const deletePromises = contentItemsWithGraphs.map(
						async ({ contentId, graphIds }) => {
							try {
								await deleteDashboardContentItems(
									dashboardId,
									contentId,
									{
										graph_ids: graphIds,
									},
								);
							} catch (deleteError) {
								logError(deleteError, {
									feature: 'add-to-dashboard',
									action: 'delete-existing-graphs',
									extra: {
										dashboardId,
										contentId,
										graphIds,
									},
								});
								// Continue even if one delete fails
							}
						},
					);

					await Promise.allSettled(deletePromises);
				}

				// Delete existing table if user didn't select it or if replacing
				if (shouldDeleteExistingTable && contentItemsWithTables.length > 0) {
					const deleteTablePromises = contentItemsWithTables.map(
						async ({ contentId, tableUrl }) => {
							try {
								await deleteDashboardContentItems(
									dashboardId,
									contentId,
									{
										table_urls: [tableUrl],
									},
								);
							} catch (deleteError) {
								logError(deleteError, {
									feature: 'add-to-dashboard',
									action: 'delete-existing-table',
									extra: {
										dashboardId,
										contentId,
										tableUrl,
									},
								});
							}
						},
					);

					await Promise.allSettled(deleteTablePromises);
				}

				// Ensure only ONE graph and ONE table is sent (API contract)
				if (contentData.graphIds?.length > 1) {
					contentData.graphIds = [contentData.graphIds[0]];
				}
				if (contentData.tableUrls?.length > 1) {
					contentData.tableUrls = [contentData.tableUrls[0]];
				}

				// Call API to create/update content
				await createDashboardContent(dashboardId, contentData);

				// Success message based on operation type
				const dashboardTitle = getDashboardTitle(dashboard);
				let successMessage = '';

				if (isReplacingGraph && isReplacingTable) {
					successMessage = `Graph and table updated in ${dashboardTitle}`;
				} else if (isReplacingGraph) {
					successMessage = `Graph updated in ${dashboardTitle}`;
				} else if (isReplacingTable) {
					successMessage = `Table updated in ${dashboardTitle}`;
				} else if (selectedTable && hasExistingContent) {
					successMessage = `Table added to ${dashboardTitle}`;
				} else {
					const widgetCount =
						(selectedGraph ? 1 : 0) + (selectedTable ? 1 : 0);
					successMessage = `Successfully added ${widgetCount} widget${widgetCount > 1 ? 's' : ''} to ${dashboardTitle}`;
				}

				// Invalidate queries to refresh dashboard content
				queryClient.invalidateQueries(QUERY_KEYS.MY_DASHBOARDS);
				queryClient.invalidateQueries(
					QUERY_KEYS.DASHBOARDS_CONTAINING_QUERY(queryId),
				);
				if (dashboardId) {
					queryClient.invalidateQueries(
						QUERY_KEYS.DASHBOARD_CONTENT(dashboardId),
					);
					queryClient.invalidateQueries([
						'dashboard-details-new',
						dashboardId,
					]);
				}

				// Create "View" button for toast
				const viewButton = React.createElement(
					Button,
					{
						onClick: async () => {
							await queryClient.refetchQueries([
								'dashboard-details-new',
								dashboardId,
							]);
							navigate(`/app/dashboard/content?id=${dashboardId}`);
						},
						className:
							'rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80 text-sm px-3 py-1',
					},
					'View',
				);

				toast.success(successMessage, {
					action: viewButton,
					duration: 5000,
				});

				if (onSuccess) {
					onSuccess();
				}
			} catch (error) {
				handleAddToDashboardError(error, {
					logError,
					extra: {
						dashboardId: getDashboardId(dashboard),
						queryId,
						selectedGraph,
						selectedTable,
					},
				});

				if (onError) {
					onError(error);
				}
			} finally {
				setIsSubmitting(false);
			}
		},
		[onSuccess, onError],
	);

	return {
		isSubmitting,
		submit,
	};
};
