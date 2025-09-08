import axiosClientV1 from '@/lib/axios';

export const getDatasourceById = async ({ queryKey }) => {
	const id = queryKey[1];
	const response = await axiosClientV1.get(`/datasources/${id}`);

	return response.data;
};
