import { useQuery } from '@tanstack/react-query';
import { getSpeechAuditorJobStatus } from '../service/speechAuditor.service';

export const useSpeechAuditorJobPolling = (jobId, enabled = true) => {
	return useQuery({
		queryKey: ['sa-job-status', jobId],
		queryFn: () => getSpeechAuditorJobStatus(jobId),
		enabled: !!jobId && enabled,
		retry: 3,
		retryDelay: (attempt) => Math.min(1000 * 2 ** attempt, 10000),
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
