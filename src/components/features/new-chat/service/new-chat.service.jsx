import axiosClientV1 from '@/lib/axios';
import { toast } from 'sonner';
import axios from 'axios';
import FormData from 'form-data';
import { promptMap } from '@/config/enhance-prompt';

export const fetchSuggestions = async (dataSourceId, token) => {
	const response = await axiosClientV1.get(
		`/datasources/${dataSourceId}/suggestions`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const createQuerySession = async (data, token) => {
	const response = await axiosClientV1.post(`/queries/session`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

// This is not used anywhere as of now. Need to remove
export const getAnswerConfig = async (token) => {
	const response = await axiosClientV1.get(`/config/answer`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

// NO API PRESENT
export const getUserDetails = async (token) => {
	const response = await axiosClientV1.get(`/oauth/google/user`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getUserSession = async (token) => {
	const response = await axiosClientV1.get(`/sessions`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data?.session_list;
};

export const createQuery = async (data, token) => {
	const response = await axiosClientV1.post(`/queries`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const deleteSession = async (sessionId, token) => {
	try {
		const response = await axiosClientV1.delete(`/sessions/${sessionId}`, {
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
		const response = await axiosClientV1.get(`/queries/session/${sessionId}`, {
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

export const getTemplate = async (templateId, token) => {
	try {
		const response = await axiosClientV1.get(`/saved-queries/${templateId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		toast.error('Failed to get session');
		throw error;
	}
};

export const saveTemplate = async (data, token) => {
	try {
		const response = await axiosClientV1.post(`/saved-queries`, data, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		toast.error('Failed to save template');
		throw error;
	}
};

export const getTemplates = async (token) => {
	try {
		const response = await axiosClientV1.get(`/saved-queries`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		toast.error('Failed to get saved Templates');
		throw error;
	}
};

export const editTemplate = async (templateId, data, token) => {
	try {
		const response = await axiosClientV1.patch(
			`/saved-queries/${templateId}`,
			data,
			{
				headers: {
					Authorization: `Bearer ${token}`,
				},
			},
		);
		return response.data;
	} catch (error) {
		toast.error('Failed to update Template');
		throw error;
	}
};

export const deleteTemplate = async (templateId, token) => {
	try {
		const response = await axiosClientV1.delete(`/saved-queries/${templateId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		return response.data;
	} catch (error) {
		toast.error('Failed to delete Template');
		throw error;
	}
};

export const enhancePrompt = async (userInput, mode="analyst") => {
	try {
		const data = new FormData();
		data.append('user_input', userInput);
		const userMode = localStorage.getItem('prompt-role');
		data.append('base_instruction', userMode || promptMap[mode]);

		const config = {
			method: 'post',
			maxBodyLength: Infinity,
			url: 'https://task.irame.ai/enhance-query',
			data: data,
		};

		const response = await axios.request(config);
		// setTimeout(() => {}, 2000)
		// return "Lorem Ipsum is simply dummy text of the printing and typesetting industry. Lorem Ipsum has been the industry's standard dummy text ever since the 1500s, when an unknown printer took a galley of type and scrambled it to make a type specimen book. It has survived not only five centuries, but also the leap into electronic typesetting, remaining essentially unchanged. It was popularised in the 1960s with the release of Letraset sheets containing Lorem Ipsum passages, and more recently with desktop publishing software like Aldus PageMaker including versions of Lorem Ipsum."
		return response.data;
	} catch (error) {
		console.log(error);
		toast.error('Failed to enhance query');
		throw error;
	}
};
