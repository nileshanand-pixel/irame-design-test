import { useQuery } from '@tanstack/react-query';
import { getEdaJobStatus } from '../service/eda.service';

export const useEdaJobPolling = (jobId, enabled = true) => {
	return useQuery({
		queryKey: ['eda-job-status', jobId],
		queryFn: () => getEdaJobStatus(jobId),
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
