import axiosClientV1 from '@/lib/axios';

export const getTenantRbacStatus = async () => {
	const response = await axiosClientV1.get('/tenant/rbac-status');
	return response.data;
};
