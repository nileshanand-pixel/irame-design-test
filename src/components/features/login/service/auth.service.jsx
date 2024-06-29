import { API_URL } from '@/config';
import axiosClient from '@/lib/axios';

export const loginWithGoogle = async (data) => {
	const response = await axiosClient.post('auth/google/callback', data);
	return response.data;
};
export const logout = async (token = '') => {
	window.location.href = `${API_URL}/oauth/google/logout`;
	localStorage.clear();
};
