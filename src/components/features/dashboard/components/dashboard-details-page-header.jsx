import React, { memo, useCallback, useRef, useState, useEffect } from 'react';
import { Switch } from '@/components/ui/switch';
import { LuPencil, LuLayoutGrid } from 'react-icons/lu';
import { MdRefresh } from 'react-icons/md';
import { Share2 } from 'lucide-react';
import { useRouter } from '@/hooks/useRouter';
import EditModeModal from './EditModeModal';
import AutoRefreshDropdown from './AutoRefreshDropdown';
import { logError } from '@/lib/logger';
import { toast } from '@/lib/toast';
import BreadCrumbs from '@/components/BreadCrumbs';
import { ShareDashboardDialog } from './ShareDashboardDialog';
import AddQueryCta from './add-query-cta';
import { useMutation, useQuery } from '@tanstack/react-query';
import {
	deleteUserDashboard,
	getDashboardById,
	refreshDashboard,
} from '../service/dashboard.service';
import TitleUpdateInput from './title-update-input';
import DescriptionUpdateInput from './description-update-input';
import { queryClient } from '@/lib/react-query';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import DashListIcon from '@/assets/svg/DashListIcon';
import EditModeButton from './EditModeButton';
import { formatRelativeTime } from '@/utils/date-utils';
import useConfirmDialog from '@/hooks/use-confirm-dialog';

const DashboardDetailsPageHeader = memo(
	({
		showActions = true,
		dashboardId,
		isEditMode,
		setIsEditMode,
		isEditModeModalOpen,
		setIsEditModeModalOpen,
		setIsNewContentAvailable,
		dashboardMetadata,
	}) => {
		const { navigate } = useRouter();
		const [ConfirmationDialog, confirm] = useConfirmDialog();
		const previousRefreshTimeRef = useRef(null);
		const [relativeRefreshTime, setRelativeRefreshTime] = useState('');
		const [isShareDialogOpen, setIsShareDialogOpen] = React.useState(false);

		const handleEditModeToggle = useCallback((checked) => {
			setIsEditMode(checked);
			if (checked) {
				setIsEditModeModalOpen(true);
			} else {
				setIsEditModeModalOpen(false);
			}
		}, []);

		// Check if last_refresh_time has changed and update relative time
		useEffect(() => {
			if (!dashboardMetadata?.last_refresh_time) return;

			const currentRefreshTime = dashboardMetadata.last_refresh_time;

			// Check if last_refresh_time has changed
			if (
				previousRefreshTimeRef.current &&
				previousRefreshTimeRef.current !== currentRefreshTime
			) {
				setIsNewContentAvailable(true);
			}

			// Update the ref with the current value
			previousRefreshTimeRef.current = currentRefreshTime;

			// Update relative time immediately
			setRelativeRefreshTime(formatRelativeTime(currentRefreshTime));

			// Update every 10 seconds to keep the relative time current
			const interval = setInterval(() => {
				setRelativeRefreshTime(formatRelativeTime(currentRefreshTime));
			}, 10000);

			return () => clearInterval(interval);
		}, [dashboardMetadata?.last_refresh_time]);

		const refreshMutation = useMutation({
			mutationFn: () => refreshDashboard(dashboardId),
			onSuccess: (data) => {
				toast.success(data?.message || 'Refresh Request Submitted');
				// Optionally invalidate queries to refetch dashboard data
				queryClient.invalidateQueries(['dashboard-metadata', dashboardId]);
				queryClient.invalidateQueries(['dashboard-content', dashboardId]);
			},
			onError: (error) => {
				logError(error, {
					feature: 'dashboard',
					action: 'refresh-dashboard',
					extra: {
						errorMessage: error.message,
						status: error.response?.status,
						dashboardId,
					},
				});
				toast.error('Failed to submit refresh request');
			},
		});

		const handleRefresh = useCallback(() => {
			refreshMutation.mutate();
		}, [refreshMutation]);

		const deleteMutation = useMutation({
			mutationFn: (id) => deleteUserDashboard(dashboardId),
			onSuccess: () => {
				toast.success('Dashboard deleted successfully');
				queryClient.invalidateQueries(
					['shared-dashboards'],
					['my-dashboards'],
				);
				navigate('/app/dashboard');
			},
			onError: (error, id) => {
				logError(error, {
					feature: 'dashboard',
					action: 'delete-dashboard',
					id,
				});
				toast.error(
					error?.response?.data?.message ||
						'Something went wrong while deleting dashboard',
				);
			},
		});

		const handleDelete = useCallback(async () => {
			const confirmed = await confirm({
				header: 'Delete Dashboard?',
				description:
					'Are you sure you want to delete this dashboard? This action cannot be undone and will remove all associated data.',
			});

			if (!confirmed) return;

			deleteMutation.mutate(dashboardId);
		}, [dashboardId, deleteMutation, confirm]);

		const handleEditModeButtonClick = useCallback(() => {
			setIsEditModeModalOpen((prev) => !prev);
		}, []);

		return (
			<>
				<div className="">
					<div className="flex items-center border-y px-8 py-[0.625rem] border-[#E5E7EB]  justify-between">
						<BreadCrumbs
							items={[
								{
									label: 'Dashboard',
									icon: (
										<DashListIcon
											width={14}
											height={14}
											color="#6A7282"
										/>
									),
									onClick: () => navigate('/app/dashboard'),
								},
								{
									label: dashboardMetadata?.title || 'Loading...',
								},
							]}
						/>

						<div className="flex items-center gap-4">
							<div className="flex items-center gap-2">
								<LuPencil className="w-4 h-4 text-primary100" />
								<span className="text-sm text-[#26064A]">
									Edit Mode
								</span>
								<Switch
									checked={isEditMode}
									onCheckedChange={handleEditModeToggle}
									className="data-[state=checked]:bg-[#6A12CD]"
								/>
							</div>

							<div
								className="flex justify-center items-center px-1 group hover:shadow-sm border border-[#E5E7EB] cursor-pointer rounded-md h-10 w-10"
								onClick={handleDelete}
							>
								{deleteMutation.isPending ? (
									<CircularLoader size="sm" />
								) : (
									<i className="bi-trash text-primary80 font-medium text-lg group-hover:text-red-500"></i>
								)}
							</div>

							<div
								className="flex justify-center items-center group hover:shadow-sm border border-[#E5E7EB] cursor-pointer rounded-md h-10 w-10"
								onClick={() => setIsShareDialogOpen(true)}
								title="Share Dashboard"
							>
								<Share2 className="w-[1.125rem] h-[1.125rem] text-primary80 group-hover:text-[#6A12CD]" />
							</div>
						</div>
					</div>

					<div className="flex items-center border-b px-8 border-[#E5E7EB] justify-between py-[0.625rem]">
						<div className="w-[31.25rem]">
							<TitleUpdateInput
								dashboardMetadata={dashboardMetadata}
								dashboardId={dashboardId}
								isEditMode={isEditMode}
							/>
						</div>

						{showActions && (
							<div className="flex items-center gap-4">
								{dashboardMetadata?.type === 'LIVE' && (
									<>
										<button
											onClick={handleRefresh}
											disabled={refreshMutation.isPending}
											className="flex items-center gap-2 text-sm text-[#26064A] font-normal hover:text-[#6A12CD] transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
										>
											<MdRefresh
												className={`w-4 h-4 ${refreshMutation.isPending ? 'animate-spin' : ''}`}
											/>
											{refreshMutation.isPending
												? 'Refreshing...'
												: relativeRefreshTime
													? `Refreshed ${relativeRefreshTime}`
													: 'Refresh'}
										</button>
										<AutoRefreshDropdown
											dashboardMetadata={dashboardMetadata}
											dashboardId={dashboardId}
										/>
									</>
								)}

								<AddQueryCta
									isLiveDashboard={
										dashboardMetadata?.type === 'LIVE'
									}
								/>
							</div>
						)}
					</div>

					<div className="flex items-center gap-3 px-8 py-2">
						<DescriptionUpdateInput
							dashboardMetadata={dashboardMetadata}
							dashboardId={dashboardId}
							isEditMode={isEditMode}
						/>
					</div>
				</div>

				<EditModeModal
					isOpen={isEditModeModalOpen}
					onClose={() => {
						setIsEditModeModalOpen(false);
					}}
				/>

				<ConfirmationDialog />

				<ShareDashboardDialog
					open={isShareDialogOpen}
					onClose={() => setIsShareDialogOpen(false)}
					dashboardId={dashboardId}
				/>

				{isEditMode && !isEditModeModalOpen && (
					<EditModeButton onClick={handleEditModeButtonClick} />
				)}
			</>
		);
	},
);

DashboardDetailsPageHeader.displayName = 'DashboardHeader';

export default DashboardDetailsPageHeader;
