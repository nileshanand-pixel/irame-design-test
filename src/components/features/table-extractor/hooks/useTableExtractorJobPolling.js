import { useQuery } from '@tanstack/react-query';
import { getTableExtractorJobStatus } from '../service/table-extractor.service';

const TERMINAL_STATUSES = ['COMPLETED', 'FAILED', 'CANCELLED'];

export const useTableExtractorJobPolling = (jobId, enabled = true) => {
	return useQuery({
		queryKey: ['table-extractor-job-status', jobId],
		queryFn: async () => {
			const res = await getTableExtractorJobStatus(jobId);
			return res.data;
		},
		enabled: !!jobId && enabled,
		refetchInterval: (query) => {
			const status = query.state.data?.status;
			if (status && TERMINAL_STATUSES.includes(status)) return false;
			return 2000;
		},
		staleTime: 0,
		retry: 3,
		retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
	});
};
