import axiosClientV1, { axiosClientV2 } from '@/lib/axios';

export const getDatasourceById = async ({ queryKey }) => {
	const id = queryKey[1];
	const response = await axiosClientV1.get(`/datasources/${id}`);

	return response.data;
};

export const getDatasourceByIdV2 = async ({ queryKey }) => {
	const id = queryKey[1];
	const response = await axiosClientV2.get(`/datasources/${id}`);

	return response.data;
};
