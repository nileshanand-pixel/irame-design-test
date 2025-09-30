import axiosClientV1, { axiosClientV2 } from '@/lib/axios';

export const getReports = async () => {
	const response = await axiosClientV1.get(`/reports/all`, {
		headers: {},
	});
	return response.data.reports;
};

export const shareReport = async (reportId, data) => {
	const response = await axiosClientV1.post(`/reports/${reportId}/share`, data, {
		headers: {},
	});
	return response.data;
};

export const getReportAccessDetails = async (reportId) => {
	const response = await axiosClientV1.get(`/reports/${reportId}/shared`, {
		headers: {},
	});
	return response.data;
};

export const getSessionReports = async (sessionId) => {
	const response = await axiosClientV2.get(`/reports/sessions/${sessionId}`, {
		headers: {},
	});
	return response.data;
};

export const getDatasourceReports = async (datasourceId) => {
	const response = await axiosClientV2.get(
		`/reports/datasources/${datasourceId}`,
		{
			headers: {},
		},
	);
	return response.data;
};

export const getDatasourcesByReports = async () => {
	const response = await axiosClientV2.get(`/reports/datasources`, {
		headers: {},
	});
	return response.data;
};

export const createSessionReport = async (sessionId, data) => {
	const response = await axiosClientV2.post(
		`/reports/sessions/${sessionId}`,
		data,
		{
			headers: {},
		},
	);
	return response.data;
};

export const getSharedReports = async () => {
	const response = await axiosClientV2.get(`/reports/shared-reports`, {
		headers: {},
	});
	return response.data;
};

export const createReport = async (reportData) => {
	const response = await axiosClientV2.post('/reports', reportData, {
		headers: {},
	});
	return response.data;
};

export const getUserReports = async () => {
	const response = await axiosClientV2.get('/reports/user-reports', {
		headers: {},
	});
	return response.data;
};

export const getUserReport = async (reportId) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/report-cards`, {
		headers: {},
	});
	return response.data;
};

export const addQueryToExistingReport = async ({ reportId, queryData }) => {
	const url = `/reports/${reportId}/add-query`;
	const response = await axiosClientV2.post(url, queryData, {
		headers: {},
	});
	return response.data;
};

export const createReportAndAddQuery = async ({ newReportData }) => {
	const url = '/reports/add-query';
	const response = await axiosClientV2.post(url, newReportData, {
		headers: {},
	});
	return response.data;
};

export const updateReportCardOrder = async ({ reportId, reportCardIds }) => {
	const url = `/reports/${reportId}/update-order`;
	const response = await axiosClientV2.post(
		url,
		{
			report_card_ids: reportCardIds,
		},
		{
			headers: {},
		},
	);
	return response.data;
};

export const updateVisibleGraphs = async ({
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
			headers: {},
		},
	);
	return response.data;
};

export const updateReportCardStatus = async ({ reportId, reportCardId, status }) => {
	const url = `/reports/${reportId}/report-cards/${reportCardId}/update-status`;
	const response = await axiosClientV2.post(
		url,
		{
			report_card_status: status,
		},
		{
			headers: {},
		},
	);
	return response.data;
};

export const deleteReportCard = async ({ reportId, reportCardId }) => {
	const response = await axiosClientV2.delete(
		`/reports/${reportId}/report-cards/${reportCardId}`,
		{
			headers: {},
		},
	);
	return response.data;
};

export const updateReportStatus = async ({ reportId, status }) => {
	const url = `/reports/${reportId}/update-status`;
	const response = await axiosClientV2.post(
		url,
		{
			report_status: status,
		},
		{
			headers: {},
		},
	);
	return response.data;
};

export const updateReportMetadata = async ({
	reportId,
	reportCardId,
	riskLevel,
	riskTypes,
}) => {
	const response = await axiosClientV2.post(
		`/reports/${reportId}/report-cards/${reportCardId}/update-metadata`,
		{ risk_level: riskLevel, risk_types: riskTypes },
		{ headers: {} },
	);
	return response.data;
};

export const generateReportSummary = async ({ reportId }) => {
	const response = await axiosClientV2.post(
		`/reports/${reportId}/initiate-generate-summary`,
	);
	return response.data;
};

export const getReportSummary = async ({ reportId }) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/summary`);
	return response.data;
};

export const getReportCardSources = async (reportId, reportCardId) => {
	const response = await axiosClientV2.get(
		`/reports/${reportId}/report-cards/${reportCardId}/sources`,
	);
	return response.data;
};

export const getActivityTrail = async (reportId) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/activity-trail`);
	return response.data;
};

export const getReportComments = async (reportId) => {
	const response = await axiosClientV2.get(`/reports/${reportId}/comments`);
	return response.data;
};

export const getReportCardComments = async (reportId, reportCardId) => {
	const response = await axiosClientV2.get(
		`/reports/${reportId}/report-cards/${reportCardId}/comments`,
	);
	return response.data;
};

export const addReportComment = async (reportId, payload) => {
	const response = await axiosClientV2.post(
		`/reports/${reportId}/comments`,
		payload,
	);
	return response.data;
};

export const addReportCardComment = async (reportId, reportCardId, payload) => {
	const response = await axiosClientV2.post(
		`/reports/${reportId}/report-cards/${reportCardId}/comments`,
		payload,
	);
	return response.data;
};
