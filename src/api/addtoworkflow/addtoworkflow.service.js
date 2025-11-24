import axiosClientV1 from '@/lib/axios';
import { useState } from 'react';

export const getBusinessProcesses = async () => {
	const response = await axiosClientV1.get('/business-processes/raw');
	return response.data?.processes || [];
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

			return response.data;
		} finally {
			setLoading(false);
		}
	};

	return { initWorkflow, loading };
};

export const getExistingBusinessProcesses = async (queryId) => {
	const response = await axiosClientV1.get(
		`/queries/${queryId}/business-processes`,
	);

	const processes = response.data.business_processes.map((bp) => ({
		external_id: bp.external_id,
		name: bp.name,
		description: bp.description,
		summary: bp.description,
		status: bp.status,
		workflow_check_id: bp.workflow_check_id,
		workflow_check_status: bp.workflow_check_status,
		reference_id: bp.reference_id,
	}));

	return processes;
};

export const saveWorkflow = async ({
	queryId,
	workflowCheckId,
	requiredFiles,
	frequency,
	name,
	description,
}) => {
	const payload = {
		workflow_check_id: workflowCheckId,
		required_files: {
			csv_files: requiredFiles.map((file) => ({
				required_file_id: file.required_file_id,
				name: file.name,
			})),
		},
		frequency,
	};

	if (name !== undefined) {
		payload.name = name;
	}

	if (description !== undefined) {
		payload.description = description;
	}

	const response = await axiosClientV1.put(
		`/queries/${queryId}/add-workflow/save`,
		payload,
	);

	// success toast will be handled by the calling component so that
	// we can attach contextual actions/links (eg. view business process)
	return response.data;
};
