import { API_URL } from '@/config';
import axios from 'axios';

export const loginWithGoogle = async (data) => {
	const response = await axios.post('auth/google/callback', data);
	return response.data;
};
export const logout = async (token) => {
	// const response = await axios.get(`${API_URL}/oauth/google/logout`, {
	// 	headers: {
	// 		Authorization: `Bearer ${token}`,
	// 	},
	// });
	// document.cookie.split(';').forEach((c) => {
	// 	document.cookie = c
	// 		.replace(/^ +/, '')
	// 		.replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
	// });
	window.open(`${API_URL}/oauth/google/logout`, '_blank');
	localStorage.clear();

	// console.log(response.data, '===');
	// return response.data;
};
