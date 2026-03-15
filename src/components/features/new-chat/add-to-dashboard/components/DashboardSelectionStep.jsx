import React, { useMemo, useState, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { FaArrowRight, FaPlus } from 'react-icons/fa';
import DashboardDropdown from './DashboardDropdown';
import QueryDashboardsList from './QueryDashboardsList';
import { isDashboardInList, getDashboardId } from '../utils/dashboard-helpers';
import { useDashboardData } from '../hooks/useDashboardData';
import { queryClient } from '@/lib/react-query';
import { QUERY_KEYS } from '../constants';
import CreateDashboardModal from '../../../dashboard/components/CreateDashboardModal';

/**
 * DashboardSelectionStep Component
 *
 * Handles Step 1 of the Add to Dashboard flow:
 * - Fetches and displays all dashboards in dropdown
 * - Fetches and displays dashboards containing current query in list
 * - Manages dashboard selection state
 * - Handles dashboard creation
 * - Validates selection before continuing
 *
 * @param {string} queryId - ID of the current query
 * @param {function} onContinue - Callback when user clicks Continue (receives selected dashboard)
 * @param {string} [initialSelectedDashboardId] - Optional pre-selected dashboard ID
 * @param {object} [initialSelectedDashboard] - Optional pre-selected dashboard object
 */
const DashboardSelectionStep = ({
	queryId,
	onContinue,
	initialSelectedDashboardId = null,
	initialSelectedDashboard = null,
}) => {
	// Local state for dashboard selection
	const [selectedDashboardIdFromDropdown, setSelectedDashboardIdFromDropdown] =
		useState(initialSelectedDashboardId);
	const [selectedQueryDashboardId, setSelectedQueryDashboardId] = useState(null);
	const [showCreateModal, setShowCreateModal] = useState(false);

	// Fetch dashboard data
	const {
		dashboards,
		queryDashboards,
		isLoading: isLoadingDashboards,
	} = useDashboardData({
		enabled: true,
		queryId,
	});

	// Get selected dashboard object
	const selectedDashboard = useMemo(() => {
		if (initialSelectedDashboard) {
			return initialSelectedDashboard;
		}

		if (selectedDashboardIdFromDropdown) {
			const dashboard = dashboards.find(
				(d) => getDashboardId(d) === selectedDashboardIdFromDropdown,
			);
			if (dashboard) return dashboard;
		}

		if (selectedQueryDashboardId) {
			const dashboard = queryDashboards.find(
				(d) => getDashboardId(d) === selectedQueryDashboardId,
			);
			if (dashboard) return dashboard;
		}

		return null;
	}, [
		initialSelectedDashboard,
		selectedDashboardIdFromDropdown,
		selectedQueryDashboardId,
		dashboards,
		queryDashboards,
	]);

	// Check if selected dashboard from dropdown already has this query
	const queryExistsInSelectedDashboard = useMemo(() => {
		if (!selectedDashboard || !selectedDashboardIdFromDropdown) return false;
		return isDashboardInList(selectedDashboard, queryDashboards);
	}, [selectedDashboard, selectedDashboardIdFromDropdown, queryDashboards]);

	// Handler: Select dashboard from dropdown
	const handleSelectDashboardFromDropdown = useCallback((dashboardId) => {
		setSelectedDashboardIdFromDropdown(dashboardId);
		setSelectedQueryDashboardId(null);
	}, []);

	// Handler: Select dashboard from query dashboards list
	const handleSelectQueryDashboard = useCallback((dashboardId) => {
		setSelectedQueryDashboardId(dashboardId);
		setSelectedDashboardIdFromDropdown(null);
	}, []);

	// Handler: Create new dashboard success
	const handleCreateDashboardSuccess = useCallback(
		(data) => {
			if (data) {
				const dashboardId = getDashboardId(data);
				if (dashboardId) {
					setSelectedDashboardIdFromDropdown(dashboardId);
					setSelectedQueryDashboardId(null);
					setShowCreateModal(false);
					queryClient.invalidateQueries({
						queryKey: QUERY_KEYS.MY_DASHBOARDS,
					});
					queryClient.invalidateQueries({
						queryKey: QUERY_KEYS.DASHBOARDS_CONTAINING_QUERY(queryId),
					});
				}
			}
		},
		[queryId],
	);

	// Handler: Continue to next step
	const handleContinue = useCallback(() => {
		if (!selectedDashboard) return;
		onContinue(selectedDashboard);
	}, [selectedDashboard, onContinue]);

	return (
		<>
			<div className="flex-shrink-0 px-4">
				<div className="flex items-center gap-4">
					<div className="flex-1">
						<DashboardDropdown
							value={selectedDashboardIdFromDropdown}
							onChange={handleSelectDashboardFromDropdown}
							dashboards={dashboards}
							isLoading={isLoadingDashboards}
							placeholder="Select a dashboard"
						/>
					</div>

					<div className="flex-shrink-0 pt-0 ">
						<Button
							onClick={() => setShowCreateModal(true)}
							// className="bg-[#6A12CD] hover:bg-[#5a0fb8] text-[#FEFEFE] flex gap-2 items-center text-lg px-4 py-2 rounded-lg font-medium font-sans"
							className="flex items-center gap-2 px-4 py-2 text-base"
						>
							<FaPlus className="size-3" />
							<span>Dashboard</span>
						</Button>
					</div>
				</div>

				{queryExistsInSelectedDashboard && (
					<p className="text-sm text-purple-100 mt-2 px-1 font-medium">
						Query is already added in this dashboard.
					</p>
				)}
			</div>

			<div className="overflow-y-auto px-4 pb-4 min-h-0">
				{queryDashboards && queryDashboards.length > 0 && (
					<p className="text-sm text-[#26064ACC] font-medium mb-4 px-1">
						Existing dashboards for this query
					</p>
				)}
				<QueryDashboardsList
					items={queryDashboards}
					loading={isLoadingDashboards}
					selectedDashboardId={selectedQueryDashboardId}
					onSelect={handleSelectQueryDashboard}
					onOpenDashboard={(url) =>
						window.open(url, '_blank', 'noopener,noreferrer')
					}
				/>
			</div>

			<div className="flex-shrink-0 flex items-center justify-end gap-3 border-t pt-4 px-6 pb-6">
				<Button
					onClick={handleContinue}
					disabled={!selectedDashboard}
					className="px-6 flex gap-1.5"
				>
					<span className="text-base font-medium">Continue</span>
					<FaArrowRight className="size-3" />
				</Button>
			</div>

			{/* Create Dashboard Modal */}
			<CreateDashboardModal
				open={showCreateModal}
				onOpenChange={setShowCreateModal}
				onSuccess={handleCreateDashboardSuccess}
			/>
		</>
	);
};

export default DashboardSelectionStep;
