import axiosClientV1 from '@/lib/axios';

export const getDatasourceById = async ({ id }) => {
	const response = await axiosClientV1.get(`/datasources/${id}`);

	return response.data;
};
