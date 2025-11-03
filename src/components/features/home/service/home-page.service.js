import axiosClientV1 from '@/lib/axios';

export const getUsersMetrics = async ({ queryKey }) => {
	const dateRange = queryKey[1];

	const response = await axiosClientV1.get('/users/metrics', {
		params: {
			start_date: dateRange.startDate,
			end_date: dateRange.endDate,
		},
	});

	return response.data;
};
