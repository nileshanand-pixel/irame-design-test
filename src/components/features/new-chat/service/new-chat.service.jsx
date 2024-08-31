import axiosClient from '@/lib/axios';
import { toast } from 'sonner';

export const fetchSuggestions = async (dataSourceId, token) => {
	const response = await axiosClient.get(
		`/datasources/${dataSourceId}/suggestions`,
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
		`/queries/session`,
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

// This is not used anywhere as of now. Need to remove
export const getAnswerConfig = async (token) => {
	const response = await axiosClient.get(`/config/answer`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};


// NO API PRESENT
export const getUserDetails = async (token) => {
	const response = await axiosClient.get(`/oauth/google/user`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getUserSession = async (token) => {
	const response = await axiosClient.get(`/sessions`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data?.session_list;
};


export const createQuery = async (data, token) => {
	const response = await axiosClient.post(`/queries`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const deleteSession = async (sessionId, token) => {
	try {
		const response = await axiosClient.delete(`/sessions/${sessionId}`, {
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
		const response = await axiosClient.get(`/queries/session/${sessionId}`, {
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
