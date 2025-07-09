import axiosClientV1 from '@/lib/axios';
import { toast } from 'sonner';

export const getUserDashboard = async () => {
	const response = await axiosClientV1.get(`/dashboards`, {
		headers: { },
	});
	return response.data?.dashboard_list;
};

export const deleteUserDashboard = async (id) => {
	try {
		const response = await axiosClientV1.delete(`/dashboards/${id}`, {
			headers: { },
		});
		toast.success('Dashboard deleted successfully');
		return response.data;
	} catch (error) {
		toast.error('Something went wrong while deleting dashboard');
		throw error;
	}
};

export const getDashboardContent = async (id) => {
	try {
		const response = await axiosClientV1.get(`/dashboards/${id}/contents`, {
			headers: { },
		});

		return response.data?.dashboard_content_list;
	} catch (error) {
		console.error('Error fetching dashboard content', error);
		throw error;
	}
};

export const createDashboard = async (name) => {
	const response = await axiosClientV1.post(
		`/dashboards`,
		{ title: name },
		{
			headers: { },
		},
	);
	return response.data;
};

export const createDashboardContent = async (id, content) => {
	const response = await axiosClientV1.post(
		`/dashboards/${id}/contents`,
		content,
		{
			headers: { },
		},
	);
	return response.data;
};

export const updateDashboardName = async (id, name) => {
	const response = await axiosClientV1.put(
		`/dashboards/${id}/?title=${name}`,
		{},
		{
			headers: { },
		},
	);
	return response.data;
};
