import axiosClientV1 from '@/lib/axios';
import { toast } from '@/lib/toast';
import { logError } from '@/lib/logger';
import axios from 'axios';
import FormData from 'form-data';
import { DEFAULT_ENHANCE_MODE, rolesConfig } from '@/config/enhance-prompt';

export const fetchSuggestions = async (dataSourceId) => {
	const response = await axiosClientV1.get(
		`/datasources/${dataSourceId}/suggestions`,
		{
			headers: {},
		},
	);
	return response.data;
};

export const createQuerySession = async (data) => {
	const response = await axiosClientV1.post(`/queries/session`, data, {
		headers: {},
	});
	return response.data;
};

// This is not used anywhere as of now. Need to remove
export const getAnswerConfig = async () => {
	const response = await axiosClientV1.get(`/config/answer`, {
		headers: {},
	});
	return response.data;
};

// NO API PRESENT
export const getUserDetails = async () => {
	const response = await axiosClientV1.get(`/oauth/google/user`, {
		headers: {},
	});
	return response.data;
};

export const getUserSession = async (params = {}) => {
	const response = await axiosClientV1.get(`/sessions`, {
		headers: {},
		params,
	});
	return response.data;
};

export const getSqlSessions = async (params = {}) => {
	const response = await axiosClientV1.get(`/sessions/sql`, {
		headers: {},
		params,
	});
	return response.data;
};

export const getSession = async (sessionId) => {
	const response = await axiosClientV1.get(`/sessions/${sessionId}`, {
		headers: {},
	});
	return response.data;
};

export const getUserSessionForDashboard = async ({ queryKey, pageParam }) => {
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
	const response = await axiosClientV1.get(`/sessions`, {
		headers: {},
		params,
	});
	return response.data;
};

export const createQuery = async (data) => {
	const response = await axiosClientV1.post(`/queries`, data, {
		headers: {},
	});
	return response.data;
};

export const getQueryById = async (queryId) => {
	try {
		const response = await axiosClientV1.get(`/queries/${queryId}`, {
			headers: {},
		});
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'chat',
			action: 'get-query-by-id',
			extra: {
				errorMessage: error.message,
				status: error.response?.status,
				queryId,
			},
		});
		throw error;
	}
};

export const deleteSession = async (sessionId) => {
	try {
		const response = await axiosClientV1.delete(`/sessions/${sessionId}`, {
			headers: {},
		});
		toast.success('Session deleted successfully');

		return response.data;
	} catch (error) {
		logError(error, { feature: 'chat', action: 'delete-session' });
		toast.error('Failed to delete session');
		throw error;
	}
};

export const getQueriesOfSession = async (sessionId) => {
	try {
		const response = await axiosClientV1.get(`/queries/session/${sessionId}`, {
			headers: {},
			params: {
				sort_param: 'created_at',
				sort_order: 'asc',
			},
		});
		return response.data;
	} catch (error) {
		if (error?.response?.status !== 403) {
			toast.error('Failed to get session');
		}
		throw error;
	}
};

export const getTemplate = async (templateId) => {
	try {
		const response = await axiosClientV1.get(`/saved-queries/${templateId}`, {
			headers: {},
		});
		return response.data;
	} catch (error) {
		logError(error, { feature: 'chat', action: 'get-template' });
		toast.error('Failed to get session');
		throw error;
	}
};

export const saveTemplate = async (data) => {
	try {
		const response = await axiosClientV1.post(`/saved-queries`, data, {
			headers: {},
		});
		return response.data;
	} catch (error) {
		logError(error, { feature: 'chat', action: 'save-template' });
		toast.error('Failed to save template');
		throw error;
	}
};

export const getTemplates = async () => {
	try {
		const response = await axiosClientV1.get(`/saved-queries`, {
			headers: {},
		});
		return response.data;
	} catch (error) {
		logError(error, { feature: 'chat', action: 'get-templates' });
		toast.error('Failed to get saved Templates');
		throw error;
	}
};

export const editTemplate = async (templateId, data) => {
	try {
		const response = await axiosClientV1.patch(
			`/saved-queries/${templateId}`,
			data,
			{
				headers: {},
			},
		);
		return response.data;
	} catch (error) {
		logError(error, { feature: 'chat', action: 'edit-template' });
		toast.error('Failed to update Template');
		throw error;
	}
};

export const deleteTemplate = async (templateId) => {
	try {
		const response = await axiosClientV1.delete(`/saved-queries/${templateId}`, {
			headers: {},
		});
		return response.data;
	} catch (error) {
		logError(error, { feature: 'chat', action: 'delete-template' });
		toast.error('Failed to delete Template');
		throw error;
	}
};

export const enhancePrompt = async (userInput, mode = DEFAULT_ENHANCE_MODE) => {
	try {
		const data = new FormData();
		data.append('user_input', userInput);
		const userMode = localStorage.getItem('prompt-role');
		data.append(
			'base_instruction',
			rolesConfig[userMode]?.prompt || rolesConfig[mode]?.prompt,
		);

		const config = {
			method: 'post',
			maxBodyLength: Infinity,
			url: 'https://task.irame.ai/enhance-query',
			data: data,
		};

		const response = await axios.request(config);
		return response.data;
	} catch (error) {
		console.log(error);
		logError(error, { feature: 'chat', action: 'enhance-prompt' });
		toast.error('Failed to enhance query');
		throw error;
	}
};

export const updateSessionMetadata = async (sessionId, metadata) => {
	try {
		const response = await axiosClientV1.patch(
			`/sessions/${sessionId}/metadata`,
			metadata,
			{
				headers: {},
			},
		);
		return response.data;
	} catch (error) {
		logError(error, { feature: 'chat', action: 'update-session-metadata' });
		toast.error('Failed to update session metadata');
		throw error;
	}
};

export const getSessionExportStatus = async (sessionId) => {
	try {
		const response = await axiosClientV1.get(
			`/queries/session/${sessionId}/export-status`,
			{
				headers: {},
			},
		);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'chat',
			action: 'get-session-export-status',
		});
		throw error;
	}
};
