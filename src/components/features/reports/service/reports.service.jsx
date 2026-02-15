import axiosClientV1, { axiosClientV2, axiosClientV3 } from '@/lib/axios';

/**
 * Retrieves unified reports (user-owned and shared) with RBAC, search, sorting, and pagination
 * @param {Object} params - Query parameters
 * @param {string} params.team_id - Required: Team ID for RBAC context
 * @param {string} params.space - Required: 'personal' or 'shared'
 * @param {string} [params.search] - Search term for name, description, summary (partial match, case-insensitive)
 * @param {string} [params.sort_by='created_at'] - Sort field: 'name', 'created_at', 'updated_at'
 * @param {string} [params.sort_order='desc'] - Sort direction: 'asc', 'desc'
 * @param {string[]} [params.status] - Status filter: 'done', 'in_progress', 'in_review', 'draft', 'inactive'
 * @param {number} [params.limit=20] - Page size
 * @param {string} [params.cursor='0'] - Pagination cursor (base64-encoded composite cursor)
 * @returns {Promise<{reports: Array, cursor: string|null}>} Unified reports list with pagination cursor
 */
export const getUnifiedReports = async ({
	team_id,
	space = 'personal',
	search = '',
	sort_by = 'created_at',
	sort_order = 'desc',
	owner_ids,
	limit = 20,
	cursor = '0',
}) => {
	const params = {
		space,
		limit,
		team_id,
	};

	if (owner_ids && owner_ids.length !== 0) {
		params.owner_ids = owner_ids;
	}

	if (search && search.trim()) {
		params.search = search;
	}

	if (sort_by) {
		params.sort_by = sort_by;
	}

	if (sort_order) {
		params.sort_order = sort_order;
	}

	if (cursor && cursor !== '0') {
		params.cursor = cursor;
	}

	const response = await axiosClientV3.get(`/reports`, {
		params,
		headers: {},
	});
	return response.data;
};

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

export const generateCases = async ({ reportId, cardId }) => {
	const response = await axiosClientV1.post(
		`/report-cards/${reportId}/cards/${cardId}/generate-cases`,
	);
	return response.data;
};

export const deleteReport = async ({ reportId }) => {
	const response = await axiosClientV1.delete(`/reports/${reportId}`, {
		headers: {},
	});
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

export const getUserReportsForDashboard = async ({ queryKey, pageParam }) => {
	const dateRange = queryKey[1];
	const params = {
		limit: 10,
	};
	if (dateRange?.startDate) {
		params.start_date = dateRange.startDate;
	}
	if (dateRange?.endDate) {
		params.end_date = dateRange.endDate;
	}
	if (pageParam) {
		params.cursor = pageParam;
	}
	const response = await axiosClientV1.get('/reports', {
		headers: {},
		params,
	});
	return response.data;
};

export const getReportCardCases = async ({
	reportId,
	cardId,
	filters,
	pagination,
	sampleId,
}) => {
	const payload = {
		filters: filters || [],
		pagination: pagination || { page: 1, page_size: 10 },
		sortings: [
			{
				column_name: 'case_id',
				sort_type: 'asc',
			},
		],
	};

	if (sampleId) {
		payload.sample_id = sampleId;
	}

	const response = await axiosClientV1.post(
		`/report-cards/${reportId}/cards/${cardId}/cases`,
		payload,
		{
			headers: {},
		},
	);
	return response.data;
};

export const updateReportCardCase = async ({
	reportId,
	cardId,
	caseId,
	updates,
	isSample = false,
}) => {
	const response = await axiosClientV1.post(
		`/report-cards/${reportId}/cards/${cardId}/cases/${caseId}`,
		{
			updates,
			is_sample: isSample,
		},
		{
			headers: {},
		},
	);
	return response.data;
};

export const bulkUpdateReportCardCases = async ({
	reportId,
	cardId,
	operations,
	isSample = false,
}) => {
	const response = await axiosClientV1.post(
		`/report-cards/${reportId}/cards/${cardId}/cases/bulk`,
		{
			is_sample: isSample,
			operations,
		},
		{
			headers: {},
		},
	);
	return response.data;
};

export const generateSampleData = async ({
	reportId,
	cardId,
	percentageCount,
	sampleName,
}) => {
	const response = await axiosClientV1.post(
		`/report-cards/${reportId}/cards/${cardId}/sample`,
		{
			percentage_count: percentageCount,
			name: sampleName,
			pagination: {
				page: 1,
				page_size: 10,
			},
		},
		{
			headers: {},
		},
	);
	return response.data;
};

export const exportReportCardCases = async ({ reportId, cardId, sampleId }) => {
	const response = await axiosClientV1.get(
		`/report-cards/${reportId}/cards/${cardId}/export`,
		{
			params: {
				sample_id: sampleId,
			},
			headers: {},
		},
	);
	return response.data;
};

export const getReportCardSamples = async ({ reportId, cardId }) => {
	const response = await axiosClientV1.get(
		`/report-cards/${reportId}/cards/${cardId}/samples`,
		{
			headers: {},
		},
	);
	return response.data;
};

export const retrySampleGeneration = async ({ reportId, cardId, sampleId }) => {
	const response = await axiosClientV1.post(
		`/report-cards/${reportId}/cards/${cardId}/samples/${sampleId}/retryGenerate`,
		{},
		{
			headers: {},
		},
	);
	return response.data;
};

export const getReportCardsCaseGenerationStatus = async (reportId) => {
	const response = await axiosClientV2.get(
		`/reports/${reportId}/report-cards/status`,
	);
	return response.data;
};

export const downloadReport = async ({ reportId, type }) => {
	const response = await axiosClientV2.post(
		`reports/generateReport`,
		{
			report_id: reportId,
			type,
		},
		{
			headers: {},
		},
	);
	return response.data;
};
