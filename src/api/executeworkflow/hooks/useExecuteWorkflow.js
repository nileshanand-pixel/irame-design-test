import { useQuery, useMutation } from '@tanstack/react-query';
import { getWorkflowParameters, executeWorkflow } from '../execute-workflow.service';
import { getWorkflowRunDetails } from '@/components/features/business-process/service/workflow.service';
import { queryClient } from '@/lib/react-query';

/**
 * Hook to fetch workflow parameters
 * @param {string} workflowId - The workflow ID
 * @param {boolean} shouldFetch - Whether to fetch parameters (default: true)
 */
export const useWorkflowParameters = (workflowId, shouldFetch = true) => {
	return useQuery({
		queryKey: ['workflow-parameters', workflowId],
		queryFn: () => getWorkflowParameters(workflowId),
		enabled: Boolean(workflowId) && shouldFetch,
	});
};

/**
 * Hook to poll workflow run status
 * Automatically stops polling when status is COMPLETED or FAILED
 */
export const useWorkflowRunStatus = (workflowId, runId, shouldPoll = true) => {
	const hasData = Boolean(workflowId && runId);

	return useQuery({
		queryKey: ['workflow-run-status', workflowId, runId],
		queryFn: () => getWorkflowRunDetails(workflowId, runId),
		enabled: hasData && shouldPoll,
		refetchInterval: (data) => {
			if (!data) return 2500; // Poll every 2.5s if no data yet
			if (data.status === 'COMPLETED' || data.status === 'FAILED') {
				return false; // Stop polling when done
			}
			return 2500; // Continue polling
		},
		refetchIntervalInBackground: true,
		refetchOnWindowFocus: false,
		retry: false,
		staleTime: 0,
	});
};

/**
 * Hook to execute a workflow
 */
export const useExecuteWorkflowMutation = (workflowId) => {
	return useMutation({
		mutationFn: (parameterValues) =>
			executeWorkflow(workflowId, parameterValues),
		onSuccess: (data) => {
			// Invalidate and refetch relevant queries
			queryClient.invalidateQueries({
				queryKey: ['workflow-runs', workflowId],
			});
		},
		onError: (error) => {
			console.error('Workflow execution failed:', error);
		},
	});
};
