// hooks/useWorkflowStatus.js
import { useQuery } from '@tanstack/react-query';
import axiosClientV1 from '@/lib/axios';

const fetchWorkflowStatus = async (referenceId) => {
	const response = await axiosClientV1.get(
		`/queries/${referenceId}/add-workflow/status`,
	);
	return response.data;
};

export const useWorkflowStatus = (referenceId, polling = true) => {
	const hasReference = Boolean(referenceId);
	const shouldPoll = hasReference && polling;

	const queryResult = useQuery({
		queryKey: ['workflow-status', referenceId],
		queryFn: () => fetchWorkflowStatus(referenceId),
		enabled: hasReference,
		refetchInterval: shouldPoll ? 2000 : false,
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: false,
		retry: false,
	});

	return {
		statusData: queryResult.data,
		loading: queryResult.isFetching,
		error: queryResult.error,
		refetch: queryResult.refetch,
	};
};
