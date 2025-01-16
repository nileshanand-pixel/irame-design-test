import axiosClientV1, { axiosClientV2 } from '@/lib/axios';

export const getReports = async (token) => {
	const response = await axiosClientV1.get(`/reports/all`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data.reports;
};

export const shareReport = async(token, reportId, data) => {
	const response = await axiosClientV1.post(`/reports/${reportId}/share`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const getReportAccessDetails = async(token, reportId) => {
	const response = await axiosClientV1.get(`/reports/${reportId}/shared`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const getSessionReports = async(token, sessionId) => {
	const response = await axiosClientV2.get(`/reports/sessions/${sessionId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const getDatasourceReports = async(token, datasourceId) => {
	const response = await axiosClientV2.get(`/reports/datasources/${datasourceId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}


export const getDatasources = async(token) => {
	const response = await axiosClientV2.get(`/reports/datasources`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const createSessionReport = async(token, sessionId, data) => {
	const response = await axiosClientV2.post(`/reports/sessions/${sessionId}`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}


export const getSharedReports = async(token) => {
	const response = await axiosClientV2.get(`/reports/shared-reports`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}
