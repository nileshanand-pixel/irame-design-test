import axiosClientV1 from '@/lib/axios';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';

// Using the data manager v1 client which has baseURL: /datamanager/app/v1
const BASE_URL = '/sql-workflow';

/**
 * Get SQL parameters for a workflow
 * Used to dynamically generate input forms for users to fill parameter values
 */
export const getWorkflowParameters = async (workflowId) => {
	try {
		const response = await axiosClientV1.post(`${BASE_URL}/parameters`, {
			workflow_id: workflowId,
		});

		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'execute-workflow',
			action: 'get_parameters',
			extra: { workflowId },
		});
		toast.error('Failed to load workflow parameters');
		throw error;
	}
};

/**
 * Execute a workflow with provided parameter values
 * Returns immediately with workflowRunId - actual execution happens asynchronously
 */
export const executeWorkflow = async (workflowId, parameterValues) => {
	try {
		const response = await axiosClientV1.post(`${BASE_URL}/execute`, {
			workflow_id: workflowId,
			parameter_values: parameterValues,
		});

		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'execute-workflow',
			action: 'execute_workflow',
			extra: { workflowId },
		});
		toast.error('Failed to execute workflow');
		throw error;
	}
};
