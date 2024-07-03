import axios from 'axios';
import { API_URL } from '@/config';
import { toast } from 'sonner';

export const getUserDashboard = async (token) => {
	const response = await axios.get(`${API_URL}/dashboard`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data?.dashboard_list;
};

export const deleteUserDashboard = async (token, id) => {
	try {
		const response = await axios.delete(`${API_URL}/dashboard/${id}`, {
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
		const response = await axios.get(`${API_URL}/dashboard/${id}/content`, {
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
	const response = await axios.post(
		`${API_URL}/dashboard`,
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
	const response = await axios.post(
		`${API_URL}/dashboard/${id}/content`,
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
	const response = await axios.put(
		`${API_URL}/dashboard/${id}/?title=${name}`,
		{},
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};
