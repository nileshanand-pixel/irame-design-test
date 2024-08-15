import axiosClient from '@/lib/axios';
import { toast } from 'sonner';

export const fetchSuggestions = async (dataSourceId, token) => {
	const response = await axiosClient.get(
		`/config/datasource/${dataSourceId}/suggestion`,
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const createQuerySession = async (dataSourceId, prompt, token) => {
	const response = await axiosClient.post(
		`/query/session`,
		{
			datasource_id: dataSourceId,
			query: prompt,
		},
		{
			headers: {
				Authorization: `Bearer ${token}`,
			},
		},
	);
	return response.data;
};

export const getAnswerConfig = async (token) => {
	const response = await axiosClient.get(`/config/answer`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

// Not used anywhere as of now
// export const getQueryAnswers = async (queryId, token) => {
// 	const response = await axiosClient.get(`/query/${queryId}`, {
// 		headers: {
// 			Authorization: `Bearer ${token}`,
// 		},
// 	});
// 	return response.data;
// };

export const getUserDetails = async (token) => {
	const response = await axiosClient.get(`/oauth/google/user`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const getUserSession = async (token) => {
	const response = await axiosClient.get(`/session`, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data?.session_list;
};


// Not used as of now
// export const getQuerySession = async (sessionId, token) => {
// 	const response = await axiosClient.get(`/query/session/${sessionId}`, {
// 		headers: {
// 			Authorization: `Bearer ${token}`,
// 		},
// 	});
// 	return response.data;
// };

export const createQuery = async (data, token) => {
	const response = await axiosClient.post(`/query`, data, {
		headers: {
			Authorization: `Bearer ${token}`,
		},
	});
	return response.data;
};

export const deleteSession = async (sessionId, token) => {
	try {
		const response = await axiosClient.delete(`/session/${sessionId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
		});
		toast.success('Session deleted successfully');

		return response.data;
	} catch (error) {
		toast.error('Failed to delete session');
		throw error;
	}
};

export const getQueriesOfSession = async (sessionId, token) => {
	try {
		const response = await axiosClient.get(`/query/session/${sessionId}`, {
			headers: {
				Authorization: `Bearer ${token}`,
			},
			params: {
				sort_param: 'created_at',
				sort_order: 'asc',
			},
		});
		return response.data;
		// return {
		// 	"query_list": [
		// 		{
		// 			"query_id": "66afe94f35cabb9a7db7f586",
		// 			"session_id": "66afe94f35cabb9a7db7f585",
		// 			"datasource_id": "66af7295115b40706375b89a",
		// 			"query": "something session",
		// 			"status": "in_progress",
		// 			"child_no": 1,
		// 			"answer": {
		// 				"planner": {
		// 					"tool_type": "planner",
		// 					"tool_space": "secondary",
		// 					"tool_data": {
		// 						"text": "planner_text"
		// 					}
		// 				},
		// 				"coder": {
		// 					"tool_type": "coder",
		// 					"tool_space": "secondary",
		// 					"tool_data": {
		// 						"text": "python_code_text"
		// 					}
		// 				},
		// 				"follow_up": {
		// 					"tool_type": "follow_up",
		// 					"tool_space": "main",
		// 					"tool_data": {
		// 						"questions": [
		// 							"qu1",
		// 							"que3"
		// 						]
		// 					}
		// 				},
		// 				"response_dataframe": {
		// 					"tool_type": "response_dataframe",
		// 					"tool_space": "main",
		// 					"tool_data": {
		// 						"csv_url": "csv_url.com"
		// 					}
		// 				},
		// 				"reference": {
		// 					"tool_type": "reference",
		// 					"tool_space": "secondary",
		// 					"tool_data": {
		// 						"file1": {
		// 							"columns_used": [
		// 								"col1",
		// 							]
		// 						}
		// 					}
		// 				},
		// 				"answer": {
		// 					"tool_type": "answer",
		// 					"tool_space": "main",
		// 					"tool_data": {
		// 						"text": "answer and observation"
		// 					}
		// 				},
		// 				"graph": {
		// 					"tool_type": "graph",
		// 					"tool_space": "main",
		// 					"tool_data": {
		// 						"graphs": [
		// 							{
		// 								"id": "d68bf326-6d61-43c3-904d-9b1f5e1b2f59",
		// 								"csv_url": "https://irame-sna.s3.ap-south-1.amazonaws.com/files/66a6244f18fc68786e6fa1db_graph_1.csv",
		// 								"title": "Deviation from Average Ratings",
		// 								"type": "Line",
		// 								"x_axis": "Product Name",
		// 								"y_axis": [
		// 									"Deviation from Average"
		// 								],
		// 								"category_filter": "Unusual Rating Indicator"
		// 							},
		// 							{
		// 								"id": "ea7e3884-d28c-48ec-a52e-e9e508f9eda5",
		// 								"csv_url": "https://irame-sna.s3.ap-south-1.amazonaws.com/files/66a6244f18fc68786e6fa1db_graph_2.csv",
		// 								"title": "Unusual Rating Indicator Distribution",
		// 								"type": "Pie",
		// 								"x_axis": "Unusual Rating Indicator",
		// 								"y_axis": [
		// 									"Product Name"
		// 								]
		// 							}
		// 						]
		// 					}
		// 				}
		// 			},
		// 			"status_text": "Compiling everything"
		// 		}
		// 	],
		// 	"datasource_name": "Blinkit_data_something_test3"
		// }
	} catch (error) {
		toast.error('Failed to get session');
		throw error;
	}
};
