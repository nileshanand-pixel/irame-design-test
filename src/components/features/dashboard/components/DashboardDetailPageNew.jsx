import React, { useState, useCallback, useMemo, useEffect } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import {
	getDashboardContent,
	deleteDashboardContentItem,
	getDashboardById,
} from '../service/dashboard.service';
import EmptyDashboardState from './EmptyDashboardState';
import GraphDetailModal from './GraphDetailModal/GraphDetailModal';
import DeleteConfirmationModal from './DeleteConfirmationModal';
import DashboardGraphCard from './DashboardGraphCard';
import DashboardTableCard from './DashboardTableCard';
import { cn, getSupportedGraphs } from '@/lib/utils';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import { normalizeGraphData } from '@/utils/graph.utils';
import { removeQueryString } from '@/utils/url';
import DashboardDetailsPageHeader from './dashboard-details-page-header';
import CircularLoader from '@/components/elements/loading/CircularLoader';

const QUERY_KEYS = {
	DASHBOARD_DETAILS: (id) => ['dashboard-details-new', id],
	MY_DASHBOARDS: ['live-dashboard', 'my-dashboards'],
	SHARED_DASHBOARDS: ['live-dashboard', 'shared-dashboards'],
	USER_DASHBOARD: ['user-dashboard'],
};

export const invalidateDashboardQueries = (queryClient, dashboardId) => {
	queryClient.invalidateQueries(QUERY_KEYS.DASHBOARD_DETAILS(dashboardId));
	queryClient.invalidateQueries(QUERY_KEYS.MY_DASHBOARDS);
	queryClient.invalidateQueries(QUERY_KEYS.SHARED_DASHBOARDS);
	queryClient.invalidateQueries(QUERY_KEYS.USER_DASHBOARD);
};

const DashboardDetailPageNew = () => {
	const { query } = useRouter();
	const queryClient = useQueryClient();

	const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
	const [selectedGraph, setSelectedGraph] = useState(null);
	const [selectedContentItem, setSelectedContentItem] = useState(null);
	const [isNewContentAvailable, setIsNewContentAvailable] = useState(false);

	const [dashboardWidgets, setDashboardWidgets] = useState([]);
	const [isEditModeActive, setIsEditModeActive] = useState(false);
	const [isEditModeModalOpen, setIsEditModeModalOpen] = useState(false);
	const [deleteModalOpen, setDeleteModalOpen] = useState(false);
	const [itemToDelete, setItemToDelete] = useState(null);
	const [deletingItems, setDeletingItems] = useState(new Set()); // Track items being deleted

	const dashboardId = query.id;

	// React Query mutation for deleting dashboard items
	const deleteMutation = useMutation({
		mutationFn: ({ dashboardId, contentId, itemId, itemType }) =>
			deleteDashboardContentItem(dashboardId, contentId, itemId, itemType),
		onSuccess: (data, variables) => {
			const { contentId, itemId, itemType } = variables;

			// Remove from deleting state
			setDeletingItems((prev) => {
				const newSet = new Set(prev);
				newSet.delete(`${contentId}-${itemId}`);
				return newSet;
			});

			// Show success message
			toast.success(
				`${itemType === 'graph' ? 'Graph' : 'Table'} deleted successfully`,
			);

			// Invalidate and refetch dashboard content
			queryClient.invalidateQueries(QUERY_KEYS.DASHBOARD_DETAILS(dashboardId));
		},
		onError: (error, variables) => {
			const { contentId, itemId, itemType } = variables;

			// Remove from deleting state
			setDeletingItems((prev) => {
				const newSet = new Set(prev);
				newSet.delete(`${contentId}-${itemId}`);
				return newSet;
			});

			logError(error, {
				feature: 'dashboard',
				action: 'delete-dashboard-content-item',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
					dashboardId: variables.dashboardId,
					contentId,
					itemId,
					itemType,
				},
			});

			toast.error(`Failed to delete ${itemType}. Please try again.`);
		},
	});

	const {
		data: dashboardContent,
		isLoading,
		refetch,
	} = useQuery({
		queryKey: QUERY_KEYS.DASHBOARD_DETAILS(dashboardId),
		queryFn: () => getDashboardContent(dashboardId),
		enabled: !!dashboardId,
		onError: (error) => {
			logError(error, {
				feature: 'dashboard',
				action: 'fetch-dashboard-content',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
					dashboardId,
				},
			});
		},
	});

	const hasContent = useMemo(
		() =>
			!isLoading &&
			dashboardContent &&
			Array.isArray(dashboardContent) &&
			dashboardContent.length > 0,
		[isLoading, dashboardContent],
	);

	const {
		data: dashboardMetadata,
		isError,
		error,
	} = useQuery({
		queryKey: ['dashboard-metadata', dashboardId],
		queryFn: () => getDashboardById(dashboardId),
		enabled: !!dashboardId,
		refetchInterval: 60000,
		refetchIntervalInBackground: true,
	});

	useEffect(() => {
		if (isError && error) {
			logError(error, {
				feature: 'dashboard',
				action: 'fetch-dashboard-metadata',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
					dashboardId,
				},
			});
		}
	}, [isError, error, dashboardId]);

	const processedDashboard = useMemo(() => {
		if (!dashboardContent || !Array.isArray(dashboardContent)) {
			return [];
		}

		const processed = dashboardContent.map((item) => {
			const graphList = item?.content?.graph?.graphs || [];
			const supportedGraphs = getSupportedGraphs(graphList);
			const normalizedGraphs = supportedGraphs?.map(normalizeGraphData);

			return {
				...item,
				normalizedGraphs,
			};
		});

		// Sort: Items with graphs first, then items with only tables
		return processed.sort((a, b) => {
			const aHasGraphs = a.normalizedGraphs && a.normalizedGraphs.length > 0;
			const bHasGraphs = b.normalizedGraphs && b.normalizedGraphs.length > 0;

			// Items with graphs come first
			if (aHasGraphs && !bHasGraphs) return -1;
			if (!aHasGraphs && bHasGraphs) return 1;
			return 0; // Maintain original order for same type
		});
	}, [dashboardContent]);

	// Sync dashboard state when processed data changes
	useEffect(() => {
		if (processedDashboard.length === 0 && dashboardWidgets.length === 0) {
			return;
		}

		// Initial load: set dashboard when empty
		if (dashboardWidgets.length === 0) {
			setDashboardWidgets(processedDashboard);
			return;
		}

		// Always sync with server data after fetching
		// This handles both additions and deletions properly
		setDashboardWidgets(processedDashboard);
	}, [processedDashboard, dashboardWidgets.length]);

	const handleTableClick = useCallback(
		(contentItem) => {
			// For tables, we need to extract the table URL to create the key
			const tableData = contentItem?.content?.table;
			const tableUrl = tableData?.csv_url || tableData?.sample_url;
			if (tableUrl) {
				const normalizedUrl = removeQueryString(tableUrl);
				const itemKey = `${contentItem.dashboard_content_id}-${normalizedUrl}`;
				if (deletingItems.has(itemKey)) {
					return; // Don't open modal if item is being deleted
				}
			}

			setSelectedGraph(null);
			setSelectedContentItem(contentItem);
			setIsDetailModalOpen(true);
		},
		[deletingItems],
	);

	const handleDeleteClick = useCallback(
		(contentId, itemId, itemType) => {
			// For tables, itemId is always a valid URL - remove query parameters to match DB format
			let actualItemId = itemId;
			if (itemType === 'table') {
				// API always provides valid URL, just normalize it
				if (itemId && (itemId.includes('http') || itemId.includes('s3'))) {
					actualItemId = removeQueryString(itemId);
				} else {
					logError(new Error('Invalid table URL format'), {
						feature: 'dashboard',
						action: 'delete-table-prepare',
						extra: { contentId, itemId, itemType },
					});
					toast.error('Invalid table URL. Please refresh and try again.');
					return;
				}
			}

			setItemToDelete({
				contentId,
				itemId: actualItemId,
				itemType,
			});
			setDeleteModalOpen(true);
		},
		[dashboardWidgets],
	);

	const handleDeleteConfirm = useCallback(() => {
		if (!itemToDelete || deleteMutation.isPending) {
			return;
		}

		const { contentId, itemId, itemType } = itemToDelete;

		// Add to deleting state immediately
		setDeletingItems((prev) => {
			const newSet = new Set(prev);
			newSet.add(`${contentId}-${itemId}`);
			return newSet;
		});

		// Close modal
		setDeleteModalOpen(false);
		setItemToDelete(null);

		// Trigger mutation (will handle success/error in mutation callbacks)
		deleteMutation.mutate({
			dashboardId,
			contentId,
			itemId,
			itemType,
		});
	}, [itemToDelete, deleteMutation, dashboardId]);

	// Render all widgets (graphs and tables) for the dashboard
	// Render graphs first, then tables
	const renderWidgets = useMemo(() => {
		if (!dashboardWidgets?.length) return null;

		const allGraphCards = [];
		const allTableCards = [];

		// Separate graphs and tables from all content items
		dashboardWidgets.forEach((item) => {
			const normalizedGraphs = item.normalizedGraphs || [];

			// Add all graph cards from this content item
			normalizedGraphs.forEach((graph) => {
				const isDeleting = deletingItems.has(
					`${item.dashboard_content_id}-${graph.id}`,
				);

				allGraphCards.push(
					<DashboardGraphCard
						key={`${item.dashboard_content_id}-${graph.id}`}
						graph={graph}
						item={item}
						isEditModeActive={isEditModeActive}
						onDeleteClick={handleDeleteClick}
						isDeleting={isDeleting}
					/>,
				);
			});

			// Add table card if it exists
			if (item?.content?.table) {
				const tableData = item.content.table;
				const tableUrl = tableData?.csv_url || tableData?.sample_url;
				const normalizedUrl = tableUrl ? tableUrl.split('?')[0] : '';
				const isDeleting = deletingItems.has(
					`${item.dashboard_content_id}-${normalizedUrl}`,
				);

				allTableCards.push(
					<DashboardTableCard
						key={`${item.dashboard_content_id}-table`}
						item={item}
						isEditModeActive={isEditModeActive}
						onTableClick={handleTableClick}
						onDeleteClick={handleDeleteClick}
						isDeleting={isDeleting}
					/>,
				);
			}
		});

		// Return graphs first, then tables
		return [...allGraphCards, ...allTableCards];
	}, [
		dashboardWidgets,
		isEditModeActive,
		handleTableClick,
		handleDeleteClick,
		deletingItems,
	]);

	const commonHeaderProps = useMemo(
		() => ({
			dashboardId,
			isEditMode: isEditModeActive,
			setIsEditMode: setIsEditModeActive,
			isEditModeModalOpen: isEditModeModalOpen,
			setIsEditModeModalOpen: setIsEditModeModalOpen,
			dashboardMetadata: dashboardMetadata,
		}),
		[dashboardId, isEditModeActive, isEditModeModalOpen, dashboardMetadata],
	);

	if (isLoading) {
		return (
			<div className="w-full h-full flex items-center justify-center gap-2">
				<CircularLoader size="sm" />
				<div className="text-primary60">Loading dashboard...</div>
			</div>
		);
	}

	if (!hasContent) {
		return (
			<>
				<div className="w-full h-full">
					<DashboardDetailsPageHeader
						{...commonHeaderProps}
						showActions={false}
					/>
					<div className="h-[calc(100%-9.3rem)]">
						<EmptyDashboardState
							isLiveDashboard={dashboardMetadata?.type === 'LIVE'}
						/>
					</div>
				</div>
			</>
		);
	}

	// Main content
	return (
		<>
			<div className="w-full h-full flex flex-col overflow-hidden">
				{/* Header Section - Fixed */}
				<div className="flex-shrink-0">
					<DashboardDetailsPageHeader
						{...commonHeaderProps}
						showActions={true}
						setIsNewContentAvailable={setIsNewContentAvailable}
					/>
				</div>

				<div className="flex-1 overflow-y-auto overflow-x-hidden px-6 pb-4 pt-4">
					<div
						className={cn(
							'mb-4 flex justify-center transition-all duration-300 ease-in-out overflow-hidden',
							isNewContentAvailable ? 'h-auto' : 'h-0 ',
						)}
					>
						<button
							onClick={() => {
								refetch();
								setIsNewContentAvailable(false);
							}}
							className="flex items-center gap-2 px-4 py-2 bg-[#6A12CD] text-white rounded-lg hover:bg-[#5a0fad] transition-colors shadow-md"
						>
							<i className="bi bi-arrow-clockwise"></i>
							<span className="font-medium">
								New content available - Reload
							</span>
						</button>
					</div>
					<div className="grid grid-cols-2 gap-5 min-w-0">
						{renderWidgets}
					</div>
				</div>
			</div>

			<GraphDetailModal
				open={isDetailModalOpen}
				onOpenChange={setIsDetailModalOpen}
				selectedGraph={selectedGraph}
				contentItem={selectedContentItem}
			/>

			<DeleteConfirmationModal
				open={deleteModalOpen}
				onOpenChange={setDeleteModalOpen}
				onConfirm={handleDeleteConfirm}
				itemType={itemToDelete?.itemType}
				isLoading={deleteMutation.isPending}
			/>
		</>
	);
};

export default DashboardDetailPageNew;
