import axiosClientV1 from '@/lib/axios';


export const getBusinessProcesses = async (token) => {
	const response = await axiosClientV1.get(`/business-processes`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};
export const getWorkflowsByBusinessProcess = async (token, businessProcessId) => {
	const response = await axiosClientV1.get(`/workflow-checks/business-process/${businessProcessId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};


export const getRecentWorkflowsRunsHomePage = async (token,) => {
	const response = await axiosClientV1.get(`/business-processes/home-page`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getWorkflowDetails = async (token, workflowCheckId) => {
	const response = await axiosClientV1.get(`/workflow-checks/${workflowCheckId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const initiateWorkflowCheck = async (token, workflowCheckId,  data) => {
	const response = await axiosClientV1.post(`/workflow-checks/${workflowCheckId}/initiate`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getWorkflowRunDetails = async (token,workflowCheckId,  workflowRunId) => {
	const response = await axiosClientV1.get(`/workflow-checks/${workflowCheckId}/runs/${workflowRunId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}


export const getWorkflowRuns = async (token, workflowCheckId,) => {
	const response = await axiosClientV1.get(`/workflow-checks/${workflowCheckId}/runs`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}


export const clarifyWorkFlowRun = async (token,workflowCheckId,  workflowRunId, data) => {
	const response = await axiosClientV1.post(`/workflow-checks/${workflowCheckId}/runs/${workflowRunId}/clarify`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const RunWorkFlowRun = async (token, workflowCheckId,  workflowRunId) => {
	const response = await axiosClientV1.post(`/workflow-checks/${workflowCheckId}/runs/${workflowRunId}/run `, null, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}
