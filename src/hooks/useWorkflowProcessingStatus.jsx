import { useEffect, useRef } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { getWorkflowProcessingStatus } from '@/components/features/business-process/service/workflow.service';

const useWorkflowProcessingStatus = (businessProcessId) => {
	const queryClient = useQueryClient();
	const prevItemsRef = useRef([]);

	const { data, isLoading } = useQuery({
		queryKey: ['workflow-processing-status', businessProcessId],
		queryFn: () => getWorkflowProcessingStatus(businessProcessId),
		enabled: !!businessProcessId,
		refetchInterval: (query) => {
			const items = query?.state?.data?.items || [];
			return items.length > 0 ? 20000 : false;
		},
		staleTime: 0,
	});

	const items = data?.items || [];

	// Detect transitions: workflow disappears from processing list → completed
	// Invalidate main workflow list to refresh
	useEffect(() => {
		const prevIds = new Set(prevItemsRef.current.map((i) => i.workflow_id));
		const currentIds = new Set(items.map((i) => i.workflow_id));

		if (prevIds.size > 0) {
			const completed = [...prevIds].filter((id) => !currentIds.has(id));
			if (completed.length > 0) {
				queryClient.invalidateQueries({
					queryKey: [
						'get-workflows-by-business-process',
						businessProcessId,
					],
				});
			}
		}

		prevItemsRef.current = items;
	}, [items, queryClient, businessProcessId]);

	// Build map for easy lookup
	const statusMap = {};
	items.forEach((item) => {
		statusMap[item.workflow_id] = item;
	});

	return {
		processingItems: items,
		statusMap,
		isLoading,
		hasProcessing: items.length > 0,
	};
};

export default useWorkflowProcessingStatus;
