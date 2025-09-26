import { v4 as uuidv4 } from 'uuid';
import { toast } from '@/lib/toast';
import axiosClientV1, { axiosClientV2 } from '@/lib/axios';

export const getPresignedUrl = async (fileName, datasourceId) => {
	const dsId = datasourceId || uuidv4();
	const response = await axiosClientV1.get(
		`/datasources/presigned-url?file_name=${fileName}&datasource_id=${dsId}`,
		{
			headers: {},
		},
	);
	return response.data;
};

export const uploadFile = async (
	file,
	setProgress,
	cancelToken = null,
	datasourceId = null,
) => {
	try {
		const { presigned_url, url } = await getPresignedUrl(
			file?.name?.replace(/\s/g, '_'),
			datasourceId,
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

export const getDataSourcesV2 = async (options) => {
	const response = await axiosClientV2.get(`/datasources`, {
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
	const response = await axiosClientV2.patch(`/datasources/${id}`, data, {
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

export const saveDatasource = async ({ datasourceId, ...data }) => {
	const response = await axiosClientV2.post(`/datasources/${datasourceId}/save`, {
		...data,
	});

	return response.data;
};

export const createEmptyDatasource = async (data) => {
	try {
		const response = await axiosClientV1.post('datasources/upload-init', data, {
			headers: { 'Content-Type': 'application/json' },
		});
		return response.data;
	} catch (error) {
		console.error('Error creating temp datasource', error);
		throw error;
	}
};

export const getDatasourceV2 = async (datasourceId) => {
	try {
		const response = await axiosClientV2.get(`datasources/${datasourceId}`, {
			headers: { 'Content-Type': 'application/json' },
		});
		return response.data;
	} catch (error) {
		console.error('Error fetching datasource with files', error);
		throw error;
	}
};

export const addFiles = async (data) => {
	try {
		const response = await axiosClientV1.post('/files/add-file', data, {
			headers: { 'Content-Type': 'application/json' },
		});
		return response.data;
	} catch (error) {
		console.error('Error adding files to datasource', error);
		throw error;
	}
};

export const copyFiles = async (data, targetDatasourceId) => {
	try {
		const response = await axiosClientV1.post(
			`/files/add-file/${targetDatasourceId}`,
			data,
			{
				headers: { 'Content-Type': 'application/json' },
			},
		);
		return response.data;
	} catch (error) {
		console.error('Error adding files to datasource', error);
		throw error;
	}
};

export const removeFiles = async (fileIds, datasourceId) => {
	try {
		if (!fileIds || !fileIds.length) {
			throw new Error('No file IDs provided for deletion');
		}
		if (!datasourceId) {
			throw new Error('Datasource ID is required for file deletion');
		}

		const response = await axiosClientV1.delete(`/files/${datasourceId}`, {
			headers: { 'Content-Type': 'application/json' },
			data: fileIds,
		});

		// Check if the response indicates any failures
		if (
			response.data &&
			response.data.errors &&
			response.data.errors.length > 0
		) {
			const errorMessages = response.data.errors.join(', ');
			throw new Error(`Some files could not be deleted: ${errorMessages}`);
		}

		return response.data;
	} catch (error) {
		console.error('Error removing files from datasource', error);
		// Provide more specific error messages
		if (error.response?.status === 404) {
			throw new Error('Files or datasource not found');
		} else if (error.response?.status === 403) {
			throw new Error('Permission denied to delete files');
		} else if (error.response?.status >= 500) {
			throw new Error('Server error occurred while deleting files');
		}
		throw error;
	}
};

export const removeSheets = async (fileId, sheetNames) => {
	try {
		const response = await axiosClientV1.delete('/files/delete-sheet', {
			headers: { 'Content-Type': 'application/json' },
			data: {
				file_id: fileId,
				sheet_names: sheetNames,
			},
		});
		return response.data;
	} catch (error) {
		console.error('Error removing sheets from file', error);
		throw error;
	}
};

// Clean upload method for ingestion hook with direct progress callback
export const uploadFileWithProgress = async (
	file,
	onProgress,
	cancelToken,
	datasourceId,
) => {
	// Step 1: Get presigned URL
	const { presigned_url, url } = await getPresignedUrl(file?.name, datasourceId);

	// Step 2: Prepare headers based on cloud provider
	const headers = { 'Content-Type': file.type };
	if (presigned_url.includes('amazonaws.com')) {
		headers['Content-Type'] = file.type;
	} else if (presigned_url.includes('core.windows.net')) {
		headers['x-ms-blob-type'] = 'BlockBlob';
	}

	// Step 3: Upload file with progress tracking
	await axiosClientV1.put(presigned_url, file, {
		headers,
		onUploadProgress: (progressEvent) => {
			const total = progressEvent.total ?? 0;
			const loaded = progressEvent.loaded ?? 0;
			const pct = total > 0 ? Math.round((loaded / total) * 100) : 0;
			if (typeof onProgress === 'function') onProgress(pct);
		},
		cancelToken,
	});

	// Return the result in the expected format
	return {
		name: file.name,
		url,
		presigned_url,
		file_url: url,
	};
};

export const saveDatasourceV2 = async (datasourceId, data) => {
	try {
		const response = await axiosClientV2.post(
			`datasources/${datasourceId}/save`,
			data,
			{ headers: { 'Content-Type': 'application/json' } },
		);
		return response.data;
	} catch (error) {
		console.error('Error saving datasource v2', error);
		throw error;
	}
};

// Clone an existing (non-draft) datasource into a new temporary draft datasource
// Payload shape expected:
// {
//   datasource_type: 'system_generated',
//   datasources: [ { id: <existing_ds_id>, files: [{ file_id }] } ]
// }
export const uploadInitAndClone = async (data) => {
	try {
		const response = await axiosClientV1.post(
			'/datasources/upload-init-and-clone',
			data,
			{ headers: { 'Content-Type': 'application/json' } },
		);
		return response.data;
	} catch (error) {
		console.error('Error cloning datasource', error);
		throw error;
	}
};
