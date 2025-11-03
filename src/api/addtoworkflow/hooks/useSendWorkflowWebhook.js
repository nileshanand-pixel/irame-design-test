import axiosClientV1 from '@/lib/axios';

export const useSendWorkflowWebhook = () => {
	const sendWorkflowWebhook = async (workflowCheckId, mockData = {}) => {
		try {
			const url =
				'https://api-stg.irame.ai/datamanager/internal/v1/workflow-checks/add-webhook';

			const payload = {
				workflow_check_id: workflowCheckId,
				name:
					mockData?.name || 'Vendor & material wise percentage of return',
				description:
					mockData?.description ||
					'Vendor & material wise percentage of return',
				data: mockData?.data || {
					type: 'STRUCTURED',
					ira_type: '',
					plan: 'plan_01',
					code: 'code_01',
					analyst_instruction: 'Analyze material-wise returns per vendor.',
					statistical_analysis_code: 'return_analysis_v1',
					version: 'v2',
					required_files: {
						csv_files: [
							{
								file_ids: ['file_123', 'file_456'],
								file_name: 'MB51',
								description:
									'The dataset provides comprehensive transaction details related to inventory management, covering material IDs, movement types, vendors, and financial metrics.',
								required_columns: [
									{
										name: 'Material',
										description:
											'Unique identifier for the material or product.',
										data_type: 'object',
									},
									{
										name: 'MvT',
										description:
											'Movement type code indicating the type of inventory transaction.',
										data_type: 'int64',
									},
								],
							},
						],
					},
				},
				tags: ['INV'],
				check_id: 'svc_07',
				sub_process: 'svc',
			};

			const response = await axiosClientV1.put(url, payload, {
				headers: {
					'x-app-token': import.meta.env.VITE_STAGE_APP_TOKEN,
					'Content-Type': 'application/json',
				},
				withCredentials: true,
			});
			console.log('Webhook sent successfully:', response.data);
			return response.data;
		} catch (err) {
			console.error('Error sending workflow webhook:', err);
			throw err;
		}
	};

	return { sendWorkflowWebhook };
};
