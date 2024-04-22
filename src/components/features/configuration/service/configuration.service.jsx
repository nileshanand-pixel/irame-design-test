import axios from 'axios';
import { AI_API_URL, API_URL } from '@/config';

export const uploadFile = async (files, setProgress) => {
	const formData = new FormData();

	files.forEach((file, idx) => {
		formData.append(`files`, file);
	});
	let uploadProgress = 0;
	const response = await axios.post(
		`${AI_API_URL}/ira/config/generate_file_urls`,
		formData,
		{
			headers: {
				'Content-Type': 'multipart/form-data',
			},
			onUploadProgress: (progressEvent) => {
				uploadProgress = Math.round(
					(progressEvent.loaded * 100) / progressEvent.total,
				);
				setProgress(uploadProgress);
			},
		},
	);

	return { data: response.data, uploadProgress };
};

export const getDataSources = async (authToken) => {
	const response = await axios.get(`${API_URL}/config/datasource`, {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	return response.data;
};

export const createNewDtaSource = async (data, authToken) => {
	const response = await axios.post(`${API_URL}/config/datasource`, data, {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	return response.data;
};
