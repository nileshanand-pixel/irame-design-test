import React, { memo, useCallback } from 'react';
import { cn } from '@/lib/utils';
import { formatTimeAgo } from '@/utils/common';
import { MdOutlineAccessTime } from 'react-icons/md';
import OwnerIcon from '../../../../assets/svg/OwnerIcon';
import DashListIcon from '../../../../assets/svg/DashListIcon';
import DashFilledIcon from '../../../../assets/svg/DashFilledIcon';
import { useMutation } from '@tanstack/react-query';
import { deleteUserDashboard } from '../service/dashboard.service';
import { toast } from '@/lib/toast';
import { queryClient } from '@/lib/react-query';
import { logError } from '@/lib/logger';
import DotsDropdown from '@/components/elements/DotsDropdown';
import upperFirst from 'lodash.upperfirst';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import { Trash2 } from 'lucide-react';

const DashboardCard = ({ dashboard, onClick, isShared = false }) => {
	const [ConfirmationDialog, confirm] = useConfirmDialog();

	const handleClick = useCallback(() => {
		if (onClick) {
			onClick(dashboard);
		}
	}, [onClick, dashboard]);

	const ownerName = dashboard.createdBy?.name || 'Unknown';

	const deleteMutation = useMutation({
		mutationFn: (id) => deleteUserDashboard(id),
		onSuccess: () => {
			toast.success('Dashboard deleted successfully');
			queryClient.invalidateQueries(
				isShared ? ['shared-dashboards'] : ['my-dashboards'],
			);
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

	const handleDelete = async (e) => {
		e.stopPropagation();

		const confirmed = await confirm({
			header: 'Delete Dashboard?',
			description:
				'Are you sure you want to delete this dashboard? This action cannot be undone.',
		});

		if (!confirmed) return;

		deleteMutation.mutateAsync(dashboard?.dashboard_id);
	};

	const dashboardActions = [
		{
			type: 'item',
			label: 'Delete',
			show: true,
			onClick: handleDelete,
			icon: <Trash2 className="size-4 text-primary60" />,
		},
	];

	return (
		<div
			onClick={handleClick}
			className={cn(
				'flex items-center justify-between gap-10 group rounded-lg p-4 pr-6 bg-white cursor-pointer',
				'border border-[#E2E8F0]',
				'hover:border-l-4 hover:border-l-[#6A12CD] hover:shadow-sm',
				'transition-all duration-200 ease-in-out',
			)}
		>
			<div className="flex items-center gap-2 flex-1 min-w-0">
				<div className="flex-shrink-0 size-9 bg-purple-4 group-hover:bg-purple-8 rounded-lg p-2 flex items-center justify-center ">
					<DashListIcon
						width={24}
						height={24}
						color="#6A12CD"
						className="block group-hover:hidden"
					/>
					<DashFilledIcon
						width={14}
						height={14}
						color="#6A12CD"
						className="hidden group-hover:block"
					/>
				</div>

				<div className="flex-1 min-w-0">
					<div className="flex items-center gap-2 mb-1">
						<h3 className="text-sm font-medium text-[#26064A] truncate">
							{upperFirst(dashboard.title)}
						</h3>
						{/* Type badge */}
						{dashboard.type === 'LIVE' && (
							<div className="flex items-center shrink-0">
								<span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
									<span className="size-2 bg-green-600 rounded-full animate-pulse"></span>
									Live
								</span>
							</div>
						)}
					</div>
					<p className="text-xs text-[#26064ACC] line-clamp-1 leading-5">
						{dashboard.description || 'No description'}
					</p>
				</div>
			</div>

			<div className="flex items-center gap-6 flex-shrink-0 ml-4">
				<div className="flex items-center gap-2 text-xs font-medium text-[#26064A] leading-5">
					<MdOutlineAccessTime className="size-4 text-[#26064A]" />
					<span>
						{dashboard.timeAgo || formatTimeAgo(dashboard.updatedAt)}
					</span>
				</div>

				{isShared && (
					<div className="flex items-center gap-1">
						<OwnerIcon width={16} height={16} color="#26064A" />
						<span className="text-[#26064A] text-xs font-medium leading-4">
							Owner:{' '}
						</span>
						<span className="text-[#26064A] text-xs leading-4">
							{ownerName}
						</span>
					</div>
				)}

				<DotsDropdown options={dashboardActions} />
			</div>

			<ConfirmationDialog />
		</div>
	);
};

export default memo(DashboardCard);
