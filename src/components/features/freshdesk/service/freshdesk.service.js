import axiosClient from '@/lib/axios';

export const getFreshdeskToken = async (token) => {
	const response = await axiosClient.post(
		`/freshdesk/authenticate`,
		{},
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);

	return response.data.freshdesk_auth_token;
};
