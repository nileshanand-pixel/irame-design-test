import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import axiosClient from '@/lib/axios';


export const getPresignedUrl = async (fileName, authToken) => {
	const response = await axiosClient.get(
		`/config/datasource/presigned-url?file_name=${fileName}&datasource_id=${uuidv4()}`,
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

		await axiosClient.put(presigned_url, file, {
			headers: {
				'Content-Type': file.type,
			},
			onUploadProgress: (progressEvent) => {
				const uploadProgress = Math.round(
					(progressEvent.loaded / progressEvent.total) * 100,
				);
				//Handle cancelled files progress
				setProgress((prevProgress) => {
					// Check if the file name is present in the previous state
					if (prevProgress[file.name] !== undefined) {
						return {
							...prevProgress,
							[file.name]: uploadProgress,
						};
					}

					// Return the previous state if the file name is not present
					return { ...prevProgress };
				});
			},
		});

		return { name: file.name, url, presigned_url };
	} catch (error) {
		console.error(`Error uploading file ${file.name}`, error);
		throw error;
	}
};

export const getDataSources = async (authToken) => {
	const response = await axiosClient.get(`/config/datasource`, {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	return response.data?.datasource_list;
};

export const createNewDtaSource = async (data, authToken) => {
	const response = await axiosClient.post(`/config/datasource`, data, {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	return response.data;
};

export const deleteDataSource = async (dataSourceId, authToken) => {
	try {
		const response = await axiosClient.delete(
			`/config/datasource/${dataSourceId}`,
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
