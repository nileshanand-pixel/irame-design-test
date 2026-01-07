import React from 'react';
import { MdOutlineAccessTime } from 'react-icons/md';
import { DEFAULT_VALUES } from '../constants';
import { getDashboardTitle } from '../utils/dashboard-helpers';
import { getTimeAgo } from '@/utils/common';

const SelectedDashboardCard = ({ dashboard }) => {
	if (!dashboard) return null;

	return (
		<div className="flex items-center p-4 rounded-lg bg-purple-4 gap-2.5 border border-[rgba(226, 232, 240, 1)]">
			<div className="flex-shrink-0">
				<div className="w-4 h-4 rounded-full bg-[#6A12CD] flex items-center justify-center">
					<div className="w-2 h-2 rounded-full bg-white"></div>
				</div>
			</div>

			<div className="flex-1 min-w-0">
				<h3 className="truncate text-[#26064A] text-sm font-medium leading-5">
					{getDashboardTitle(dashboard, '')}
				</h3>
				<p className="truncate text-[#26064ACC] text-xs">
					{dashboard.description || DEFAULT_VALUES.DASHBOARD_DESCRIPTION}
				</p>
			</div>

			<div className="flex items-center gap-1.5 flex-shrink-0">
				<MdOutlineAccessTime className="size-4 text-[#26064ACC]" />
				<span className="text-xs text-[#26064ACC]">
					{dashboard.timeAgo ||
						getTimeAgo(
							dashboard.updated_at ||
								dashboard.updatedAt ||
								dashboard.created_at ||
								dashboard.createdAt,
						) ||
						'Recently'}
				</span>
			</div>
		</div>
	);
};

export default SelectedDashboardCard;
