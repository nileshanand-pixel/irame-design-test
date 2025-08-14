import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/lib/toast';
import axiosClientV1 from '@/lib/axios';

export const getPresignedUrl = async (fileName) => {
	const response = await axiosClientV1.get(
		`/datasources/presigned-url?file_name=${fileName}&datasource_id=${uuidv4()}`,
		{
			headers: {},
		},
	);

	return response.data;
};

export const uploadFile = async (file, setProgress, cancelToken = null) => {
	try {
		const { presigned_url, url } = await getPresignedUrl(
			file?.name?.replace(/\s/g, '_'),
		);

		const headers = {};

		if (presigned_url.includes('amazonaws.com')) {
			headers['Content-Type'] = file.type;
		} else if (presigned_url.includes('core.windows.net')) {
			headers['x-ms-blob-type'] = 'BlockBlob';
		}

		await axiosClientV1.put(presigned_url, file, {
			headers: {
				'Content-Type': file.type,
			},
			onUploadProgress: (progressEvent) => {
				const uploadProgress = Math.round(
					(progressEvent.loaded / progressEvent.total) * 100,
				);
				setProgress((prevProgress) => {
					if (prevProgress[file.name] !== undefined) {
						return {
							...prevProgress,
							[file.name]: uploadProgress,
						};
					}
					return { ...prevProgress };
				});
			},
			cancelToken,
		});

		return { name: file.name, url, presigned_url };
	} catch (error) {
		console.error(`Error uploading file ${file.name}`, error);
		throw error;
	}
};

export const getDataSources = async (options) => {
	const response = await axiosClientV1.get(`/datasources`, {
		headers: {},
	});

	return response.data?.datasource_list;
};

export const getDataSourcesWithLimit = async (limit) => {
	const response = await axiosClientV1.get(`/datasources?limit=${limit}`, {
		headers: {},
	});

	return response.data?.datasource_list;
};

export const getDataSourceById = async (id) => {
	const response = await axiosClientV1.get(`/datasources/${id}`, {
		headers: {},
	});

	return response.data;
};

export const createNewDtaSource = async (data) => {
	const response = await axiosClientV1.post(`/datasources`, data, {
		headers: {},
	});

	return response.data;
};

export const deleteDataSource = async (dataSourceId) => {
	try {
		const response = await axiosClientV1.delete(`/datasources/${dataSourceId}`, {
			headers: {},
		});
		toast.success('Data source deleted successfully');
		return response.data;
	} catch (error) {
		console.error('Error deleting data source', error);
		toast.error('Failed to delete data source');

		throw error;
	}
};

export const updateDataSource = async (id, data) => {
	const response = await axiosClientV1.patch(`/datasources/${id}`, data, {
		headers: {
			'Content-Type': 'application/json',
		},
	});

	return response.data;
};

export const parseExcel = async (data) => {
	const response = await axiosClientV1.get(`/files/parse-excel`, {
		headers: {
			'Content-Type': 'application/json',
		},
		params: data,
	});

	return response.data;
};
