import axiosClientV1, { axiosClientV2 } from '@/lib/axios';

export const getReports = async (token) => {
	const response = await axiosClientV1.get(`/reports/all`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data.reports;
};

export const shareReport = async (token, reportId, data) => {
	const response = await axiosClientV1.post(`/reports/${reportId}/share`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getReportAccessDetails = async (token, reportId) => {
	const response = await axiosClientV1.get(`/reports/${reportId}/shared`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getSessionReports = async (token, sessionId) => {
	const response = await axiosClientV2.get(`/reports/sessions/${sessionId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getDatasourceReports = async (token, datasourceId) => {
	const response = await axiosClientV2.get(
		`/reports/datasources/${datasourceId}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const getDatasources = async (token) => {
	const response = await axiosClientV2.get(`/reports/datasources`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const createSessionReport = async (token, sessionId, data) => {
	const response = await axiosClientV2.post(
		`/reports/sessions/${sessionId}`,
		data,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const getSharedReports = async (token) => {
	const response = await axiosClientV2.get(`/reports/shared-reports`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const createReport = async (token, reportData) => {
	const response = await axiosClientV2.post('/reports', reportData, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getUserReports = async (token) => {
	const response = await axiosClientV2.get('/reports/user-reports', {
		headers: { Authorization: `Bearer ${token}` },
	});
	return response.data;
};

export const getUserReport = async (token, reportId) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/report-cards`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return response.data;
};

export const addQueryToExistingReport = async ({ token, reportId, queryData }) => {
	const url = `/reports/${reportId}/add-query`;
	const response = await axiosClientV2.post(url, queryData, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return response.data;
};

export const createReportAndAddQuery = async ({ token, newReportData }) => {
	const url = '/reports/add-query';
	const response = await axiosClientV2.post(url, newReportData, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return response.data;
};

export const updateReportCardOrder = async ({ token, reportId, reportCardIds }) => {
	const url = `/reports/${reportId}/update-order`;
	const response = await axiosClientV2.post(
		url,
		{
			report_card_ids: reportCardIds,
		},
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return response.data;
};

export const updateVisibleGraphs = async ({
	token,
	reportId,
	reportCardId,
	visibleGraphIds,
}) => {
	const url = `/reports/${reportId}/report-cards/${reportCardId}/update-graph`;
	const response = await axiosClientV2.post(
		url,
		{
			visible_graph_ids: visibleGraphIds,
		},
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return response.data;
};

export const updateReportCardStatus = async ({
	token,
	reportId,
	reportCardId,
	status,
}) => {
	const url = `/reports/${reportId}/report-cards/${reportCardId}/update-status`;
	const response = await axiosClientV2.post(
		url,
		{
			report_card_status: status,
		},
		{
			headers: { Authorization: `Bearer ${token}` },
		},
	);
	return response.data;
};

export const deleteReportCard = async ({ token, reportId, reportCardId }) => {
	const response = await axiosClientV2.delete(
		`/reports/${reportId}/report-cards/${reportCardId}`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const updateReportStatus = async ({ token, reportId, status }) => {
	const url = `/reports/${reportId}/update-status`;
	const response = await axiosClientV2.post(
		url,
		{
			report_status: status,
		},
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const updateReportMetadata = async ({
	token,
	reportId,
	reportCardId,
	riskLevel,
	riskTypes,
}) => {
	const response = await axiosClientV2.post(
		`/reports/${reportId}/report-cards/${reportCardId}/update-metadata`,
		{ risk_level: riskLevel, risk_types: riskTypes },
		{ headers: { Authorization: `Bearer ${token}` } },
	);
	return response.data;
};

export const generateReportSummary = async ({ token, reportId }) => {
	const response = await axiosClientV2.post(
		`/reports/${reportId}/initiate-generate-summary`,
		undefined,
		{ headers: { Authorization: `Bearer ${token}` } },
	);
	return response.data;
};

export const getReportSummary = async ({ token, reportId }) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/summary`, {
		headers: { Authorization: `Bearer ${token}` },
	});
	return response.data;
};

export const getReportCardSources = async (token, reportId, reportCardId) => {
	const response = await axiosClientV2.get(
		`/reports/${reportId}/report-cards/${reportCardId}/sources`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const getActivityTrail = async (token, reportId) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/activity-trail`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getReportComments = async(token, reportId) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/comments`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const getReportCardComments = async(token, reportId, reportCardId) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/report-cards/${reportCardId}/comments`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const addReportComment = async (token, reportId, payload) => {
	const response = await axiosClientV2.post(`/reports/${reportId}/comments`, payload,  {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const addReportCardComment = async(token, reportId, reportCardId, payload) => {
	const response = await axiosClientV2.post(`/reports/${reportId}/report-cards/${reportCardId}/comments`, payload,  {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}
