import { useQuery } from '@tanstack/react-query';
import { getForensicJobStatus } from '../service/forensics.service';

export const useForensicJobPolling = (jobId, enabled = true) => {
	return useQuery({
		queryKey: ['forensic-job-status', jobId],
		queryFn: () => getForensicJobStatus(jobId),
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
