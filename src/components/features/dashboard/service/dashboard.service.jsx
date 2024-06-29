import axiosClient from '@/lib/axios';
import { toast } from 'sonner';

export const getUserDashboard = async (token) => {
	const response = await axiosClient.get(`/dashboard`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const deleteUserDashboard = async (token, id) => {
	try {
		const response = await axiosClient.delete(`/dashboard/${id}`, {
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
		const response = await axiosClient.get(`/dashboard/${id}/content`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});

		return response.data;
	} catch (error) {
		console.error('Error fetching dashboard content', error);
		throw error;
	}
};

export const createDashboard = async (token, name) => {
	const response = await axiosClient.post(
		`/dashboard`,
		{ tittle: name },
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
		`/dashboard/${id}/content`,
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
		`/dashboard/${id}/?title=${name}`,
		{},
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};
