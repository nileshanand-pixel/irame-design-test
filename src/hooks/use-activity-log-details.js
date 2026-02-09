import { useQuery } from '@tanstack/react-query';
import { activityLogService } from '@/api/gatekeeper/activityLog.service';

/**
 * Hook to fetch single activity log details with enriched data
 * @param {string} logId - Activity log ID
 * @param {Object} options - React Query options
 * @returns {Object} Query result with data, loading, error states
 */
export const useActivityLogDetails = (logId, options = {}) => {
	return useQuery({
		queryKey: ['activity-log', logId],
		queryFn: () => activityLogService.getActivityLogById(logId),
		enabled: !!logId, // Only fetch when logId exists
		staleTime: 5 * 60 * 1000, // Cache for 5 minutes
		...options,
	});
};
