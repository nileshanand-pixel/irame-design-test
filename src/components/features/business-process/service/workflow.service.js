import axiosClientV1, { axiosClientV2 } from '@/lib/axios';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';

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

export const getFeaturedWorkflows = async ({ pageParam }) => {
	const params = {
		limit: 10,
	};
	if (pageParam) {
		params.cursor = pageParam;
	}
	const response = await axiosClientV1.get(`/workflow-checks`, {
		headers: {},
		params,
	});
	return {
		workflow_checks: response.data?.workflow_checks,
		cursor: response.data?.cursor,
	};
};

export const getWorkflowsForDashboard = async ({ queryKey, pageParam }) => {
	const dateRange = queryKey[1];
	const workflowType = queryKey[2];
	const businessProcessId = queryKey[3];

	const params = {
		limit: 10,
		type: workflowType,
	};
	if (pageParam) {
		params.cursor = pageParam;
	}
	if (dateRange?.startDate) {
		params.start_date = dateRange.startDate;
	}
	if (dateRange?.endDate) {
		params.end_date = dateRange.endDate;
	}
	if (businessProcessId && businessProcessId !== 'all') {
		params.business_process_id = businessProcessId;
	}
	const response = await axiosClientV1.get(`/workflows/list-workflows`, {
		params,
	});
	return response.data;
};

export const continuePdfWorkflow = async ({ workflowCheckId, datasourceId }) => {
	const response = await axiosClientV2.post(
		`/workflow-checks/${workflowCheckId}/continue/${datasourceId}`,
	);
	return response.data;
};
