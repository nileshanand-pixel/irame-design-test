import axiosClientV1 from '@/lib/axios';

export const getFreshdeskToken = async () => {
	const response = await axiosClientV1.post(
		`/freshdesk/authenticate`,
		{},
		{
			headers: {},
		},
	);

	return response.data.freshdesk_auth_token;
};
