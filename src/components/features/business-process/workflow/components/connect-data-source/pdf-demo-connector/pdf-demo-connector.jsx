import * as React from 'react';
import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from '@/lib/toast';
import { useWorkflowId } from '@/components/features/business-process/hooks/useWorkflowId';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
	initiateWorkflowCheckV2,
	getWorkflowRunDetails,
} from '@/components/features/business-process/service/workflow.service';
import { saveDatasourceV2 } from '@/components/features/configuration/service/configuration.service';
import { queryClient } from '@/lib/react-query';
import { UploadManager } from '../structured-connector/upload-files-step/upload-manager';
import {
	DatasourceProvider,
	useStructuredDatasourceId,
} from '../structured-connector/hooks/datasource-context';
import RequiredFiles from '../structured-connector/upload-files-step/required-files';
import { CustomLoader } from '../structured-connector/custom-loader';

const PdfDemoConnector = ({ workflow }) => {
	return (
		<DatasourceProvider>
			<PdfDemoConnectorContent workflow={workflow} />
		</DatasourceProvider>
	);
};

const PdfDemoConnectorContent = ({ workflow }) => {
	const workflowId = useWorkflowId();
	const navigate = useNavigate();
	const [searchParams, setSearchParams] = useSearchParams();
	const runId = searchParams.get('run_id');
	const { datasourceId, isReady } = useStructuredDatasourceId();

	const [uploadManagerRef, setUploadManagerRef] = useState(null);
	const [inlineError, setInlineError] = useState('');
	const [showInlineError, setShowInlineError] = useState(false);
	const errorTimeoutRef = useRef(null);

	// Poll for workflow run details
	const { data: runDetails } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(workflowId, runId),
		enabled: Boolean(runId),
		refetchInterval: (query) => {
			const data = query.state.data;
			if (!runId) return false;
			if (!data) return 2000;
			// Keep polling while in queue or mapping (though we skip mapping, status might still be IN_QUEUE)
			if (data.status === 'IN_QUEUE') return 1000;
			return false;
		},
	});

	// Redirect when status is RUNNING
	useEffect(() => {
		if (runDetails?.status === 'RUNNING' && runDetails?.session_id) {
			const dsId = runDetails.datasource_id || datasourceId;
			// Clear search params
			setSearchParams({});
			navigate(
				`/app/new-chat/session/?sessionId=${runDetails.session_id}&source=workflow&datasource_id=${dsId}`,
			);
		}
	}, [runDetails?.status, runDetails?.session_id]);

	// Save datasource mutation
	const saveDatasourceMutation = useMutation({
		mutationFn: async ({ datasourceId, data }) => {
			return await saveDatasourceV2(datasourceId, data);
		},
		onSuccess: () => {
			initiateMutation.mutate();
		},
		onError: (error) => {
			console.error('Error saving datasource:', error);
			toast.error(
				`Failed to save datasource: ${error.message || 'Unknown error'}`,
				{
					position: 'bottom-center',
				},
			);
		},
	});

	// Initiate workflow mutation
	const initiateMutation = useMutation({
		mutationFn: async () => {
			const dummyMapping = {
				csv_files: {
					dummy_file: [
						{
							file_id: 'dummy',
							file_url: 'dummy',
							file_name: 'dummy',
						},
					],
				},
			};

			const payload = {
				datasource_id: datasourceId,
				file_mapping: dummyMapping,
			};

			return await initiateWorkflowCheckV2(workflowId, payload);
		},
		onSuccess: (data) => {
			toast.success('Workflow initiated. Processing started...', {
				position: 'bottom-center',
			});

			queryClient.invalidateQueries(['workflow-runs', workflowId]);

			// Set run_id in search params to trigger polling
			if (data?.external_id) {
				setSearchParams({ run_id: data.external_id });
			}
		},
		onError: (err) => {
			console.error('Error initiating workflow:', err);
			toast.error(`Workflow initiation failed: ${err.message}`, {
				position: 'bottom-center',
			});
		},
	});

	// Validation
	const validateFiles = (items) => {
		if (!items || items.length === 0) {
			return {
				isValid: false,
				errorMessage: 'Please upload at least one file to proceed.',
			};
		}

		const filesWithErrors = items.filter((item) => {
			const status = item.status || 'ready';
			return status === 'error' || status === 'failed';
		});

		if (filesWithErrors.length > 0) {
			return {
				isValid: false,
				errorMessage: 'Please remove all error files before proceeding.',
			};
		}

		const inProgressFiles = items.filter((item) => {
			const status = item.status || 'ready';
			return status === 'uploading' || status === 'processing';
		});

		if (inProgressFiles.length > 0) {
			return {
				isValid: false,
				errorMessage: 'Please wait for all files to finish uploading.',
			};
		}

		return { isValid: true };
	};

	const handleRunWorkflow = async () => {
		setShowInlineError(true);

		if (!uploadManagerRef) {
			setInlineError('Upload manager not ready. Please try again.');
			return;
		}

		const { items, datasourceId: dsId, creatingDS } = uploadManagerRef;

		if (creatingDS) {
			setInlineError('Please wait for the upload session to be ready.');
			return;
		}

		const validation = validateFiles(items);
		if (!validation.isValid) {
			setInlineError(validation.errorMessage);
			return;
		}

		if (!dsId || !isReady) {
			setInlineError('No datasource available. Please upload files first.');
			return;
		}

		if (!workflowId) {
			setInlineError('Workflow ID not found. Please refresh the page.');
			return;
		}

		setInlineError('');
		setShowInlineError(false);

		const saveData = { workflow_check_id: workflowId };
		saveDatasourceMutation.mutate({ datasourceId: dsId, data: saveData });
	};

	useEffect(() => {
		if (showInlineError && inlineError) {
			if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
			errorTimeoutRef.current = setTimeout(() => {
				setShowInlineError(false);
				setInlineError('');
			}, 2000);
		}
		return () => {
			if (errorTimeoutRef.current) clearTimeout(errorTimeoutRef.current);
		};
	}, [showInlineError, inlineError]);

	const isLoading = saveDatasourceMutation.isPending || initiateMutation.isPending;

	// Show loader when processing in queue
	if (runId && runDetails?.status === 'IN_QUEUE') {
		return <CustomLoader />;
	}

	return (
		<div className="flex flex-col h-full min-h-0">
			<div className="flex-1 px-8 flex flex-col overflow-y-auto show-scrollbar">
				<RequiredFiles requiredFiles={workflow?.data?.required_files} />
				<div className="flex-1">
					<UploadManager
						onManagerReady={setUploadManagerRef}
						connectorType="PDF_DEMO"
					/>
				</div>
			</div>

			<div className="px-8 py-4 border-t bg-white flex-shrink-0">
				<div className="flex items-center justify-between">
					<div className="flex-1">
						{showInlineError && inlineError && (
							<p className="text-sm text-red-600 font-medium animate-in fade-in slide-in-from-bottom-1 border border-red-100 bg-red-50 p-2 rounded-md">
								{inlineError}
							</p>
						)}
					</div>
					<Button
						onClick={handleRunWorkflow}
						disabled={isLoading || !isReady}
						className="ml-4 h-11 px-8 font-semibold shadow-sm"
					>
						{isLoading ? (
							<>
								<div className="animate-spin mr-2 h-4 w-4 border-2 border-white border-t-transparent rounded-full" />
								Starting Workflow...
							</>
						) : (
							'Run Workflow'
						)}
					</Button>
				</div>
			</div>
		</div>
	);
};

export default PdfDemoConnector;
