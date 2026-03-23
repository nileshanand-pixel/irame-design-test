import { useQuery } from '@tanstack/react-query';
import { getMedicalReaderJobStatus } from '../service/medical-reader.service';

export const useMedicalReaderJobPolling = (jobId, enabled = true) => {
	return useQuery({
		queryKey: ['medical-reader-job-status', jobId],
		queryFn: () => getMedicalReaderJobStatus(jobId),
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
