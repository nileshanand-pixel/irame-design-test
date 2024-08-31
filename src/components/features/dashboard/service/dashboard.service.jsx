import axiosClient from '@/lib/axios';
import { toast } from 'sonner';

export const getUserDashboard = async (token) => {
	const response = await axiosClient.get(`/dashboards`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data?.dashboard_list;
};

export const deleteUserDashboard = async (token, id) => {
	try {
		const response = await axiosClient.delete(`/dashboards/${id}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		toast.success('Dashboard deleted successfully');
		return response.data;
	} catch (error) {
		toast.error('Something went wrong while deleting dashboard');
		throw error;
	}
};

export const getDashboardContent = async (token, id) => {
	try {
		const response = await axiosClient.get(`/dashboards/${id}/contents`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		return response.data?.dashboard_content_list;
	} catch (error) {
		console.error('Error fetching dashboard content', error);
		throw error;
	}
};

export const createDashboard = async (token, name) => {
	const response = await axiosClient.post(
		`/dashboards`,
		{ title: name },
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const createDashboardContent = async (token, id, content) => {
	const response = await axiosClient.post(
		`/dashboards/${id}/contents`,
		content,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const updateDashboardName = async (token, id, name) => {
	const response = await axiosClient.put(
		`/dashboards/${id}/?title=${name}`,
		{},
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};
