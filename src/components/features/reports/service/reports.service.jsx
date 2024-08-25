import axiosClient from '@/lib/axios';
import { toast } from 'sonner';

export const getReports = async (token) => {
	const response = await axiosClient.get(`/report`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data.reports;
};

export const shareReport = async(token, reportId, data) => {
	const response = await axiosClient.post(`/report/${reportId}/share`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}

export const getReportAccessDetails = async(token, reportId) => {
	const response = await axiosClient.get(`/report/${reportId}/shared`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
}
