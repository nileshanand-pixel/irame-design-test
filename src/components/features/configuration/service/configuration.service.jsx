import axios from 'axios';
import { AI_API_URL, API_URL } from '@/config';
import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';

export const getPresignedUrl = async (fileName, authToken) => {
	const response = await axios.get(
		`${API_URL}/config/datasource/presigned-url?file_name=${fileName}&datasource_id=${uuidv4()}`,
		{
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		},
	);

	return response.data;
};

export const uploadFile = async (file, setProgress, authToken) => {
	try {
		const { presigned_url, url } = await getPresignedUrl(
			file?.name?.replace(/\s/g, '_'),
			authToken,
		);

		await axios.put(presigned_url, file, {
			headers: {
				'Content-Type': file.type,
			},
			onUploadProgress: (progressEvent) => {
				const uploadProgress = Math.round(
					(progressEvent.loaded / progressEvent.total) * 100,
				);
				setProgress((prevProgress) => ({
					...prevProgress,
					[file.name]: uploadProgress,
				}));
			},
		});

		return { name: file.name, url, presigned_url };
	} catch (error) {
		console.error(`Error uploading file ${file.name}`, error);
		throw error;
	}
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

export const deleteDataSource = async (dataSourceId, authToken) => {
	try {
		const response = await axios.delete(
			`${API_URL}/config/datasource/${dataSourceId}`,
			{
				headers: {
					Authorization: `Bearer ${authToken}`,
				},
			},
		);
		toast.success('Data source deleted successfully');
		return response.data;
	} catch (error) {
		console.error('Error deleting data source', error);
		toast.error('Failed to delete data source');

		throw error;
	}
};
