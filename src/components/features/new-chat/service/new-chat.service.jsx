import { API_URL } from '@/config';
import axios from 'axios';

export const fetchSuggestions = async (dataSourceId, token) => {
	const response = await axios.get(
		`${API_URL}/config/datasource/${dataSourceId}/suggestion`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const createQuerySession = async (dataSourceId, prompt, token) => {
	const response = await axios.post(
		`${API_URL}/query/session`,
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
	const response = await axios.get(`${API_URL}/config/answer`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getQueryAnswers = async (queryId, token) => {
	const response = await axios.get(`${API_URL}/query/${queryId}`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getUserDetails = async (token) => {
	const response = await axios.get(`${API_URL}/oauth/google/user`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};
