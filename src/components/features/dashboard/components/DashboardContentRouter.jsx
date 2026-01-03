import React, { useMemo } from 'react';
import { useRouter } from '@/hooks/useRouter';
import DashboardDetailsPage from './DashboardDetailsPage';
import DashboardDetailPageNew from './DashboardDetailPageNew';

/**
 * Router component that decides which dashboard detail page to render
 * - New dashboards (from live-dashboard) -> DashboardDetailPageNew
 * - Old dashboards (from old dashboard page) -> DashboardDetailsPage
 */
const DashboardContentRouter = () => {
	const { query, location } = useRouter();

	// Check source parameter from both query object and URL search params
	const source = useMemo(() => {
		// First try from query object (parsed by useRouter)
		if (query.source === 'live-dashboard') {
			return 'live-dashboard';
		}

		// Fallback: parse directly from URL search params
		const urlParams = new URLSearchParams(location.search);
		const sourceFromUrl = urlParams.get('source');
		if (sourceFromUrl === 'live-dashboard') {
			return 'live-dashboard';
		}

		return null;
	}, [query.source, location.search]);

	// If source is 'live-dashboard', use the new detail page
	if (source === 'live-dashboard') {
		return <DashboardDetailPageNew />;
	}

	// Default to old detail page for existing flows
	return <DashboardDetailsPage />;
};

export default DashboardContentRouter;
