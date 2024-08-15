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


// function createReportMockData() {
// 	const mockData = [];

// 	for (let i = 1; i <= 20; i++) {
// 		const report = {
// 			report_id: `report_${i}`,
// 			name: `Report ${i}`,
// 			status: i % 2 === 0 ? 'done' : 'in_progress',
// 			datasource_id: `datasource_${i}`,
// 			datasource_name: 'blinkit',
// 			data: {
// 				type: i % 3 === 0 ? 'manual' : 'auto_generated',
// 				preview_image_url: `https://example.com/preview_${i}.png`,
// 				summary: `This is a summary of Report ${i}. It provides insights and data analysis based on the blinkit datasource.`,
// 				file_url: `https://example.com/report_${i}.pdf`,
// 			},
// 			is_hidden: i % 4 === 0 ? 'true' : 'false',
// 			user_id: `user_${i}`,
// 			user_name: `User ${i}`,
// 			created_at: new Date().toISOString(),
// 			updated_at: new Date().toISOString(),
// 		};

// 		mockData.push(report);
// 	}
// 	return mockData;
// }

// {
// 	"report_id": "66bd9349456f71c5efd60c8f",
// 	"datasource_id": "66bd9349456f71c5efd60c8e",
// 	"user_id": "66768040e7168076daeee212",
// 	"name": "EDA Report",
// 	"user_name": "Kuldeep Pandey",
// 	"created_at": "2024-08-15T05:34:01.539000",
// 	"updated_at": "2024-08-15T05:34:01.539000",
// 	"data": {
// 		"type": "auto_generated",
// 		"summary": "This is an auto-generated EDA report of your datasource",
// 		"preview_image_url": "https://d2vkmtgu2mxkyq.cloudfront.net/report-default-preview.png",
// 		"file_url": "https://d2vkmtgu2mxkyq.cloudfront.net/report-default-preview.pdf"
// 	},
// 	"status": "in_progress",
// 	"datasource_name": "Blinkit 15 Aug"
// }