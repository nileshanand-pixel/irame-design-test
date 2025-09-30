import axiosClientV1, { axiosClientV2 } from '@/lib/axios';
import { toast } from '@/lib/toast';

export const getBusinessProcesses = async () => {
	const response = await axiosClientV1.get(`/business-processes`, {
		headers: {},
	});
	return response.data;
};

export const getWorkflowsByBusinessProcess = async (businessProcessId) => {
	const response = await axiosClientV1.get(
		`/workflow-checks/business-process/${businessProcessId}`,
		{
			headers: {},
		},
	);
	return response.data;
};

export const getRecentWorkflowsRunsHomePage = async () => {
	const response = await axiosClientV1.get(`/business-processes/home-page`, {
		headers: {},
	});
	return response.data;
};

export const getWorkflowDetails = async (workflowCheckId) => {
	const response = await axiosClientV1.get(`/workflow-checks/${workflowCheckId}`, {
		headers: {},
	});
	return response.data;
};

export const initiateWorkflowCheckV2 = async (workflowCheckId, data) => {
	const response = await axiosClientV2.post(
		`/workflow-checks/${workflowCheckId}/initiate`,
		data,
		{
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
	return response.data;
};

export const initiateWorkflowCheck = async (workflowCheckId, data) => {
	const response = await axiosClientV1.post(
		`/workflow-checks/${workflowCheckId}/initiate`,
		data,
		{
			headers: {},
		},
	);
	return response.data;
};

export const getWorkflowRunDetails = async (workflowCheckId, workflowRunId) => {
	const response = await axiosClientV1.get(
		`/workflow-checks/${workflowCheckId}/runs/${workflowRunId}`,
		{
			headers: {},
		},
	);
	return response.data;
};

export const restartWorkflowCheckV2 = async (workflowCheckId, runId, data) => {
	const response = await axiosClientV2.post(
		`/workflow-checks/${workflowCheckId}/runs/${runId}/re-initiate`,
		data,
		{
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
	return response.data;
};

export const getWorkflowRuns = async (workflowCheckId) => {
	const response = await axiosClientV1.get(
		`/workflow-checks/${workflowCheckId}/runs`,
		{
			headers: {},
		},
	);
	return response.data;
};

export const clarifyWorkFlowRun = async (workflowCheckId, workflowRunId, data) => {
	const response = await axiosClientV1.post(
		`/workflow-checks/${workflowCheckId}/runs/${workflowRunId}/clarify`,
		data,
		{
			headers: {},
		},
	);
	return response.data;
};

export const RunWorkFlowRun = async (workflowCheckId, workflowRunId) => {
	const response = await axiosClientV1.post(
		`/workflow-checks/${workflowCheckId}/runs/${workflowRunId}/run `,
		null,
		{
			headers: {},
		},
	);
	return response.data;
};

export const clarifyWorkFlowRunV2 = async (workflowCheckId, workflowRunId, data) => {
	const response = await axiosClientV2.post(
		`/workflow-checks/${workflowCheckId}/runs/${workflowRunId}/clarify`,
		data,
		{
			headers: {
				'Content-Type': 'application/json',
			},
		},
	);
	return response.data;
};

export const deleteRunningWorkflow = async (runId) => {
	try {
		const response = await axiosClientV2.delete(
			`/workflow-checks/runs/${runId}`,
			{
				headers: {},
			},
		);
		toast.success('Session deleted successfully');

		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'workflow',
			action: 'delete-running-workflow',
			extra: { runId },
		});
		toast.error('Failed to delete session');
		throw error;
	}
};
