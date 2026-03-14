// Custom hook for fetching and managing dashboard data

import { useQuery } from '@tanstack/react-query';
import { getMyDashboards, getSharedDashboards } from '../service/dashboard.service';
import { logError } from '@/lib/logger';
import { useRbac } from '@/hooks/useRbac';

export const useMyDashboards = () => {
	return useQuery({
		queryKey: ['my-dashboards'],
		queryFn: getMyDashboards,
		staleTime: 30000,
		refetchOnWindowFocus: false,
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		placeholderData: (previousData) => previousData,
		onError: (error) => {
			logError(error, {
				feature: 'live-dashboard',
				action: 'fetch-my-dashboards',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
				},
			});
		},
	});
};

export const useSharedDashboards = () => {
	const { isRbacActive } = useRbac();
	return useQuery({
		queryKey: ['shared-dashboards'],
		queryFn: getSharedDashboards,
		enabled: isRbacActive,
		staleTime: 30000,
		refetchOnWindowFocus: false,
		retry: 2,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
		placeholderData: (previousData) => previousData,
		onError: (error) => {
			logError(error, {
				feature: 'live-dashboard',
				action: 'fetch-shared-dashboards',
				extra: {
					errorMessage: error.message,
					status: error.response?.status,
				},
			});
		},
	});
};
