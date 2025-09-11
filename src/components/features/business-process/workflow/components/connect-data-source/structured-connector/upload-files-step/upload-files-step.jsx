import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { ArrowRight } from '@phosphor-icons/react';
import RequiredFiles from './required-files';
import { UploadManager } from './upload-manager';
import { saveDatasourceV2 } from '@/components/features/configuration/service/configuration.service';
import { toast } from '@/lib/toast';
import { useWorkflowId } from '@/components/features/business-process/hooks/useWorkflowId';
import { useStructuredDatasourceId } from '../hooks/datasource-context';

export const UploadFilesStep = ({ requiredFiles, stepper }) => {
	const workflowId = useWorkflowId();
	const { datasourceId, updateDatasourceId, isReady } =
		useStructuredDatasourceId();
	const [uploadManagerRef, setUploadManagerRef] = useState(null);

	// Save datasource mutation
	const saveDatasourceMutation = useMutation({
		mutationFn: async ({ datasourceId, data }) => {
			return await saveDatasourceV2(datasourceId, data);
		},
		onSuccess: (response) => {
			toast.success('Datasource saved successfully');

			// Check if datasource ID changed and update it via context
			if (response?.datasource_id && datasourceId !== response.datasource_id) {
				updateDatasourceId(response.datasource_id);
			}

			// Move to next step
			stepper.next();
		},
		onError: (error) => {
			console.error('Error saving datasource:', error);
			toast.error(
				`Failed to save datasource: ${error.message || 'Unknown error'}`,
			);
		},
	});

	// Validation function to check for errors in files and sheets
	const validateFilesAndSheets = (items) => {
		if (!items || items.length === 0) {
			return {
				isValid: false,
				errorMessage: 'Please remove all error files before proceeding !',
			};
		}

		// Check for files with error status
		const filesWithErrors = items.filter((item) => {
			const status = item.status || 'ready';
			return status === 'error' || status === 'failed';
		});

		if (filesWithErrors.length > 0) {
			return {
				isValid: false,
				errorMessage: 'Please remove all error files before proceeding !!',
			};
		}

		// Check for sheets with errors
		const sheetsWithErrors = items.filter((item) => {
			if (item.meta?.sheets && Array.isArray(item.meta.sheets)) {
				return item.meta.sheets.some(
					(sheet) => sheet.status === 'FAILED' || sheet.status === 'ERROR',
				);
			}
			return false;
		});

		if (sheetsWithErrors.length > 0) {
			return {
				isValid: false,
				errorMessage: 'Please remove all error files before proceeding !',
			};
		}

		// Check for files still uploading or processing
		const inProgressFiles = items.filter((item) => {
			const status = item.status || 'ready';
			return status === 'uploading' || status === 'processing';
		});

		if (inProgressFiles.length > 0) {
			return {
				isValid: false,
				errorMessage:
					'Please wait for all files to finish uploading and processing before continuing!',
			};
		}

		return { isValid: true };
	};

	const handleContinue = async () => {
		// Get current upload state from UploadManager
		if (!uploadManagerRef) {
			toast.error('Upload manager not ready. Please try again.');
			return;
		}

		const { items, datasourceId, creatingDS } = uploadManagerRef;

		// Check if datasource is still being created
		if (creatingDS) {
			toast.error(
				'Please wait for the upload session to be ready before continuing.',
			);
			return;
		}

		// Validate files and sheets
		const validation = validateFilesAndSheets(items);
		if (!validation.isValid) {
			toast.error(validation.errorMessage);
			return;
		}

		if (!datasourceId || !isReady) {
			toast.error('No datasource available. Please upload files first.');
			return;
		}

		if (!workflowId) {
			toast.error('Workflow ID not found. Please refresh the page.');
			return;
		}

		// Prepare data for save API - only pass the workflow_check_id as required
		const saveData = {
			workflow_check_id: workflowId,
		};

		// Call save API
		saveDatasourceMutation.mutate({
			datasourceId,
			data: saveData,
		});
	};

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 px-8 flex flex-col overflow-y-auto show-scrollbar">
				<RequiredFiles requiredFiles={requiredFiles} />
				<div className="flex-1">
					<UploadManager onManagerReady={setUploadManagerRef} />
				</div>
			</div>

			<div className="border-t border-[#E5E7EB] bg-[#F3F4F680] px-8 py-4 h-[4.5rem] flex items-center justify-end">
				<Button
					className="font-semibold"
					onClick={handleContinue}
					disabled={
						saveDatasourceMutation.isPending ||
						uploadManagerRef?.creatingDS
					}
				>
					{saveDatasourceMutation.isPending ? (
						<>
							<div className="w-4 h-4 mr-2">
								<svg
									className="animate-spin w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							</div>
							<span>Saving...</span>
						</>
					) : uploadManagerRef?.creatingDS ? (
						<>
							<div className="w-4 h-4 mr-2">
								<svg
									className="animate-spin w-4 h-4"
									fill="none"
									viewBox="0 0 24 24"
								>
									<circle
										className="opacity-25"
										cx="12"
										cy="12"
										r="10"
										stroke="currentColor"
										strokeWidth="4"
									></circle>
									<path
										className="opacity-75"
										fill="currentColor"
										d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
									></path>
								</svg>
							</div>
							<span>Initializing...</span>
						</>
					) : (
						<>
							<span>Continue</span>
							<ArrowRight className="ml-1" weight="bold" />
						</>
					)}
				</Button>
			</div>
		</div>
	);
};
