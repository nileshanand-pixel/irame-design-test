import axiosClientV1 from '@/lib/axios';
import { toast } from '@/lib/toast';
import { useState } from 'react';

export const getBusinessProcesses = async () => {
	try {
		const response = await axiosClientV1.get('/business-processes/raw');
		return response.data?.processes || [];
	} catch (error) {
		console.error('Error fetching business processes:', error);
		toast.error('Failed to fetch business processes');
		throw error;
	}
};

export const useInitWorkflow = () => {
	const [loading, setLoading] = useState(false);

	const initWorkflow = async ({
		queryId,
		businessProcessId,
		businessProcessName,
		tags,
		workflow_description,
	}) => {
		setLoading(true);

		console.log({
			queryId,
			businessProcessId,
			businessProcessName,
			tags,
			workflow_description,
		});

		try {
			const payload = businessProcessId
				? {
						business_process_id: businessProcessId,
						tags,
						workflow_description,
					}
				: {
						business_process_name: businessProcessName,
						tags,
						workflow_description,
					};

			const response = await axiosClientV1.post(
				`/queries/${queryId}/add-workflow/init`,
				payload,
			);

			toast.success('Workflow initialized successfully');
			return response.data;
		} catch (error) {
			console.error('Error initializing workflow:', error);
			toast.error('Failed to initialize workflow');
			throw error;
		} finally {
			setLoading(false);
		}
	};

	return { initWorkflow, loading };
};

export const getExistingBusinessProcesses = async (queryId) => {
	try {
		const response = await axiosClientV1.get(
			`/queries/${queryId}/business-processes`,
		);

		const processes = response.data.business_processes.map((bp) => ({
			external_id: bp.external_id,
			name: bp.name,
			summary: bp.description,
			status: bp.status,
		}));

		return processes;
	} catch (error) {
		console.error('Error fetching business processes:', error);
		toast.error('Failed to fetch existing business processes');
		return [];
	}
};

export const saveWorkflow = async ({ queryId, workflowCheckId, requiredFiles }) => {
	try {
		const payload = {
			workflow_check_id: workflowCheckId,
			required_files: {
				csv_files: requiredFiles.map((file) => ({
					required_file_id: file.required_file_id,
					name: file.name,
				})),
			},
		};

		const response = await axiosClientV1.put(
			`/queries/${queryId}/add-workflow/save`,
			payload,
		);

		toast.success('Workflow saved successfully');
		return response.data;
	} catch (error) {
		console.error('Error saving workflow:', error);
		toast.error('Failed to save workflow');
		throw error;
	}
};
