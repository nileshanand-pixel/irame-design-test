import axiosClient from '@/lib/axios';
import { toast } from 'sonner';

export const fetchSuggestions = async (dataSourceId, token) => {
	const response = await axiosClient.get(
		`/config/datasource/${dataSourceId}/suggestion`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const createQuerySession = async (dataSourceId, prompt, token) => {
	const response = await axiosClient.post(
		`/query/session`,
		{
			datasource_id: dataSourceId,
			query: prompt,
		},
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const getAnswerConfig = async (token) => {
	const response = await axiosClient.get(`/config/answer`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getQueryAnswers = async (queryId, token) => {
	const response = await axiosClient.get(`/query/${queryId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getUserDetails = async (token) => {
	const response = await axiosClient.get(`/oauth/google/user`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getUserSession = async (token) => {
	const response = await axiosClient.get(`/session`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data?.session_list;
};

export const getQuerySession = async (sessionId, token) => {
	const response = await axiosClient.get(`/query/session/${sessionId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const createQuery = async (data, token) => {
	const response = await axiosClient.post(`/query`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const deleteSession = async (sessionId, token) => {
	try {
		const response = await axiosClient.delete(`/session/${sessionId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		toast.success('Session deleted successfully');

		return response.data;
	} catch (error) {
		toast.error('Failed to delete session');
		throw error;
	}
};

export const getQueriesOfSession = async (sessionId, token) => {
	try {
		const response = await axiosClient.get(`/query/session/${sessionId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params: {
				sort_param: 'created_at',
				sort_order: 'asc',
			},
		});
		return response.data;
	} catch (error) {
		toast.error('Failed to get session');
		throw error;
	}
};
