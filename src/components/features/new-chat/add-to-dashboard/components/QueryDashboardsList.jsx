import React from 'react';
import { cn } from '@/lib/utils';
import { MdOutlineAccessTime } from 'react-icons/md';
import { createDashboardUrl } from '../utils/dashboard-helpers';
import { getTimeAgo } from '@/utils/common';
import upperFirst from 'lodash.upperfirst';

const QueryDashboardsList = ({
	items = [],
	loading = false,
	selectedDashboardId,
	onSelect,
	onOpenDashboard,
}) => {
	return (
		<div className="text-primary60">
			<div className="flex-1 flex flex-col gap-4 overflow-y-auto pr-1 h-[15.625rem]">
				{loading ? (
					<div className="flex flex-col gap-3 text-primary60 h-full">
						<div className="flex-1 flex flex-col gap-2 overflow-y-auto pr-1 custom-scrollbar">
							{[...Array(3)].map((_, i) => (
								<div
									key={i}
									className="flex items-start gap-4 border border-gray-200 rounded-xl p-3"
								>
									<div className="flex flex-col gap-1 flex-1">
										<div className="h-3 bg-purple-8 rounded animate-pulse w-1/2"></div>
										<div className="h-4 bg-purple-8 rounded animate-pulse w-3/4"></div>
									</div>
									<div className="w-6 h-6 bg-purple-8 rounded animate-pulse"></div>
								</div>
							))}
						</div>
					</div>
				) : !items.length ? (
					<div className="flex flex-col items-center justify-center h-full text-[#26064A]">
						<div className="font-semibold">
							Ready to add as dashboard
						</div>
						<div className="text-xs text-center max-w-[28.75rem]">
							This query hasn't been added to any dashboard yet. Select
							a dashboard above to add this query and start automating
							your data insights.
						</div>
					</div>
				) : (
					items.map((dashboard) => {
						const dashboardId = dashboard.dashboard_id || dashboard.id;
						const isSelected = selectedDashboardId === dashboardId;

						return (
							<div
								key={dashboardId}
								onClick={() => onSelect?.(dashboardId)}
								className={cn(
									'flex items-start justify-between gap-10 border border-[#E2E8F0] rounded-xl p-4 transition-colors hover:bg-purple-4 cursor-pointer',
									isSelected &&
										'bg-purple-4 border-purple-10 border',
								)}
							>
								<div className="flex items-start gap-2 font-medium text-primary80 flex-1 min-w-0">
									<div className="flex flex-col gap-1 flex-1 min-w-0">
										<p className="font-medium truncate text-[#26064A] text-sm">
											{upperFirst(dashboard.title)}
										</p>
										{dashboard.description && (
											<p className="text-xs text-[#26064ACC] truncate">
												{dashboard.description}
											</p>
										)}
									</div>
								</div>

								<div className="flex items-center gap-4 flex-shrink-0 self-center">
									<div className="flex items-center gap-1.5">
										<MdOutlineAccessTime className="size-4 text-primary60" />
										<span className="text-xs text-[#26064A]">
											{dashboard.timeAgo ||
												getTimeAgo(
													dashboard.updated_at ||
														dashboard.created_at,
												)}
										</span>
									</div>
									<span
										className="material-symbols-outlined text-sm text-primary60 shrink-0 mt-0.5 cursor-pointer"
										onClick={(e) => {
											e.stopPropagation();
											const url =
												createDashboardUrl(dashboard);
											if (url && onOpenDashboard) {
												onOpenDashboard(url);
											}
										}}
									>
										open_in_new
									</span>
								</div>
							</div>
						);
					})
				)}
			</div>
		</div>
	);
};

export default QueryDashboardsList;
