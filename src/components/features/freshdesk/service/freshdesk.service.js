import axiosClientV1 from '@/lib/axios';

export const getFreshdeskToken = async (token) => {
	const response = await axiosClientV1.post(
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
