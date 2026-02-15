import React, { memo } from 'react';
import DashboardCard from './DashboardCard';
import DashboardCardSkeleton from './DashboardCardSkeleton';
import EmptyState from '@/components/elements/EmptyState';

const DashboardList = ({
	dashboards,
	isLoading,
	error,
	searchQuery,
	onDashboardClick,
	onCreateDashboard,
	isShared = false,
}) => {
	if (isLoading) {
		return (
			<div className="space-y-4 ">
				{Array.from({ length: 7 }).map((_, index) => (
					<DashboardCardSkeleton key={index} />
				))}
			</div>
		);
	}

	if (dashboards.length === 0) {
		const emptyStateConfig = {
			image: 'https://d2vkmtgu2mxkyq.cloudfront.net/empty-state.svg',
			actionText: searchQuery
				? 'No dashboards found matching your search'
				: 'No dashboards available',
			reactionText: searchQuery
				? 'Try adjusting your search terms'
				: 'Create your first dashboard to get started',
			ctaText: 'Create Dashboard',
			ctaDisabled: false,
			ctaClickHandler: onCreateDashboard || (() => {}),
		};

		return (
			<div className="flex justify-center py-12">
				<EmptyState className="h-auto" config={emptyStateConfig} />
			</div>
		);
	}

	return (
		<div className="space-y-4" style={{ contain: 'layout style paint' }}>
			{dashboards.map((dashboard) => (
				<DashboardCard
					key={dashboard.id}
					dashboard={dashboard}
					onClick={onDashboardClick}
					isShared={isShared}
				/>
			))}
		</div>
	);
};

export default memo(DashboardList);
