import axiosClient from '@/lib/axios';
import { toast } from 'sonner';

export const getReports = async (token) => {
	// const response = await axiosClient.get(`/reports`, {
	// 	headers: {
	// 		Authorization: `Bearer ${token}`,
	// 	},
	// });
	// console.log(response);
	return createReportMockData();
};


function createReportMockData() {
	const mockData = [];

	for (let i = 1; i <= 20; i++) {
		const report = {
			report_id: `report_${i}`,
			name: `Report ${i}`,
			status: i % 2 === 0 ? 'done' : 'in_progress',
			datasource_id: `datasource_${i}`,
			datasource_name: 'blinkit',
			data: {
				type: i % 3 === 0 ? 'manual' : 'auto_generated',
				preview_image_url: `https://example.com/preview_${i}.png`,
				summary: `This is a summary of Report ${i}. It provides insights and data analysis based on the blinkit datasource.`,
				file_url: `https://example.com/report_${i}.pdf`,
			},
			is_hidden: i % 4 === 0 ? 'true' : 'false',
			user_id: `user_${i}`,
			user_name: `User ${i}`,
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		};

		mockData.push(report);
	}
	return mockData;
}