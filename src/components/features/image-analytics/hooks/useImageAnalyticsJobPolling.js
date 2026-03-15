import { useQuery } from '@tanstack/react-query';
import { getImageAnalyticsJobStatus } from '../service/imageAnalytics.service';

export const useImageAnalyticsJobPolling = (jobId, enabled = true) => {
	return useQuery({
		queryKey: ['ia-job-status', jobId],
		queryFn: () => getImageAnalyticsJobStatus(jobId),
		enabled: !!jobId && enabled,
		refetchInterval: (query) => {
			const data = query?.state?.data;
			if (!data) return 2000;
			if (
				data.status === 'COMPLETED' ||
				data.status === 'FAILED' ||
				data.status === 'CANCELLED'
			) {
				return false;
			}
			return 2000;
		},
		refetchIntervalInBackground: true,
	});
};
