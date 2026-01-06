import { useQuery, keepPreviousData } from '@tanstack/react-query';
import { activityLogService } from '@/api/gatekeeper/activityLog.service';

export const useActivityLogs = (filters = {}, options = {}) => {
	return useQuery({
		queryKey: ['activity-logs', filters],
		queryFn: () => activityLogService.getActivityLogs(filters),
		placeholderData: keepPreviousData,
		staleTime: 30000, // 30 seconds
		...options,
	});
};
