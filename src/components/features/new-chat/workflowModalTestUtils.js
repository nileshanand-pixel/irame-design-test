// Test utilities for WorkflowModal component
// This file contains mock data generation for development and testing purposes

/**
 * Generates mock workflow data for visualizing different states in the modal.
 * Used only in development environment to simulate various workflow statuses.
 * @returns {Array} Array of mock workflow objects
 */
export function getMockWorkflows() {
	const mockBase = (suffix) => ({
		name: `Mock ${suffix} Workflow`,
		description: `${suffix} description`,
		status: 'ACTIVE',
		external_id: `mock-bp-${suffix.toLowerCase().replace(/\s+/g, '-')}`,
		workflow_check_id: `mock-wc-${suffix.toLowerCase().replace(/\s+/g, '-')}`,
		reference_id: `mock-ref-${suffix.toLowerCase().replace(/\s+/g, '-')}`,
	});

	return [
		{ ...mockBase('ACTIVE'), workflow_check_status: 'ACTIVE' },
		{ ...mockBase('INACTIVE'), workflow_check_status: 'INACTIVE' },
		{ ...mockBase('IN_PROGRESS'), workflow_check_status: 'IN_PROGRESS' },
		{
			...mockBase('FILE_MAPPING_PROCESSING'),
			workflow_check_status: 'FILE_MAPPING_PROCESSING',
		},
		{
			...mockBase('FILE_MAPPING_PROCESSED'),
			workflow_check_status: 'FILE_MAPPING_PROCESSED',
		},
		{
			...mockBase('FILE_MAPPING_FAILED'),
			workflow_check_status: 'FILE_MAPPING_FAILED',
		},
		{ ...mockBase('CODE_PROCESSING'), workflow_check_status: 'CODE_PROCESSING' },
		{
			...mockBase('CODE_PROCESSING_FAILED'),
			workflow_check_status: 'CODE_PROCESSING_FAILED',
		},
	];
}
