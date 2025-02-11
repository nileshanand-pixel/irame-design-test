import { v4 as uuidv4 } from 'uuid';
import { toast } from 'sonner';
import axiosClientV1 from '@/lib/axios';


export const getPresignedUrl = async (fileName, authToken) => {
	const response = await axiosClientV1.get(
		`/datasources/presigned-url?file_name=${fileName}&datasource_id=${uuidv4()}`,
		{
			headers: {
				Authorization: `Bearer ${authToken}`,
			},
		},
	);

	return response.data;
};

export const uploadFile = async (file, setProgress, authToken, cancelToken=null) => {
    try {
        const { presigned_url, url } = await getPresignedUrl(
            file?.name?.replace(/\s/g, '_'),
            authToken,
        );

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


export const getDataSources = async (authToken) => {
	const response = await axiosClientV1.get(`/datasources`, {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	return response.data?.datasource_list;
};

export const getDataSourceById = async(authToken, id) => {
	const response = await axiosClientV1.get(`/datasources/${id}`, {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	return response.data;
}

export const createNewDtaSource = async (data, authToken) => {
	const response = await axiosClientV1.post(`/datasources`, data, {
		headers: {
			Authorization: `Bearer ${authToken}`,
		},
	});

	return response.data;
};

export const deleteDataSource = async (dataSourceId, authToken) => {
	try {
		const response = await axiosClientV1.delete(
			`/datasources/${dataSourceId}`,
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

export const updateDataSource = async (id, data, authToken) => {
	const response = await axiosClientV1.patch(`/datasources/${id}`, data, {
		headers: {
			Authorization: `Bearer ${authToken}`,
			"Content-Type": "application/json",
		},
	});

	return response.data;
};
