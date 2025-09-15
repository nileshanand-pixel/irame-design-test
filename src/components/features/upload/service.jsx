import axiosClientV1, { axiosClientV2 } from '@/lib/axios';

export const uploadInit = async (data) => {
	const response = await axiosClientV1.post(`/datasources/upload-init`, data);

	return response.data;
};

export const getPresignedUrl = async ({ fileName, datasourceId }) => {
	const response = await axiosClientV1.get(`/datasources/presigned-url`, {
		params: {
			datasource_id: datasourceId,
			file_name: fileName,
		},
	});

	return response.data;
};

export const uploadFile = async ({
	file,
	updateProgress,
	cancelToken,
	datasourceId,
}) => {
	try {
		const { presigned_url, url } = await getPresignedUrl({
			fileName: file?.name,
			datasourceId,
		});

		await axiosClientV1.put(presigned_url, file, {
			headers: {
				'Content-Type': file.type,
			},
			onUploadProgress: (progressEvent) => {
				const uploadProgress = Math.round(
					(progressEvent.loaded / progressEvent.total) * 100,
				);
				updateProgress(uploadProgress);
				// setProgress((prevProgress) => {
				// 	if (prevProgress[file.name] !== undefined) {
				// 		return {
				// 			...prevProgress,
				// 			[file.name]: uploadProgress,
				// 		};
				// 	}
				// 	return { ...prevProgress };
				// });
			},
			cancelToken,
		});

		return { name: file.name, url, presigned_url };
	} catch (error) {
		console.error(`Error uploading file ${file.name}`, error);
		throw error;
	}
};

export const addFileInDs = async (data) => {
	const response = await axiosClientV1.post('/files/add-file', data);

	return response.data;
};

export const getDatasourceDetails = async ({ queryKey }) => {
	const { datasourceId, requiredFileId } = queryKey[1];
	const response = await axiosClientV2.get(`/datasources/${datasourceId}`, {
		params: {
			required_files_id: requiredFileId,
		},
	});

	return response.data;
};

export const removeFileFromDs = async ({ datasourceId, fileIds }) => {
	const response = await axiosClientV1.delete(`/files/${datasourceId}`, {
		data: fileIds,
	});

	return response.data;
};

export const getRequiredFilesStatus = async ({ queryKey }) => {
	const { datasourceId, workflowId } = queryKey[1];
	const response = await axiosClientV2.get(
		`/datasources/${datasourceId}/required-file-status/${workflowId}`,
	);

	return response.data;
};
