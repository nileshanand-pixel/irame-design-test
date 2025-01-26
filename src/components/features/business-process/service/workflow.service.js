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

