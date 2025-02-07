import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@/components/ui/card';
import { ChevronRight, RefreshCw } from 'lucide-react';
import QueueStatus from '../../new-chat/QueueStatus';
import { ErrorResolutionModal } from './ErrorResolutionModal';
import VariablesSection from './VariablesSection';
import {
	clarifyWorkFlowRun,
	getWorkflowRunDetails,
	initiateWorkflowCheck,
	RunWorkFlowRun,
} from '../service/workflow.service';
import { getFileIcon, getToken } from '@/lib/utils';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import { DataSourceSelector } from './DatasourceSelector';
import capitalize from 'lodash.capitalize';
import { getDataSourceById } from '../../configuration/service/configuration.service';
import Tooltip from '../../reports/components/Tooltip';
import { queryClient } from '@/lib/react-query';

const DataSourceCard = ({
	onValidationSuccess,
	variables: initialVariables = {}, // rename for clarity
	workflowId,
	runId,
	dataPoints,
	isRunning,
}) => {
	const navigate = useNavigate();
	const { businessProcessId } = useParams();
	const location = useLocation();

	// --------------------------
	// CLARIFICATIONS / MAPPINGS
	// --------------------------
	const [userClarifications, setUserClarifications] = useState({
		text: '',
		data_mapping: [],
	});

	/**
	 * We'll store the "variables" in local state so we can let the user edit them
	 * in the UI. Then we can put them into userClarifications.variables
	 * whenever we do an action (like re-validate).
	 */
	const [variablesState, setVariablesState] = useState(() => {
		// Transform incoming `initialVariables` (if needed) or store them as-is
		// Assuming shape is:
		//   initialVariables = {
		//     v1: { name: "v1", description: "v1 desc", type: "int", default_value: 1 },
		//     ...
		//   }
		const transformed = {};
		Object.entries(initialVariables).forEach(([key, val]) => {
			transformed[key] = {
				...val,
				// We'll store `value` from `default_value` or fallback
				value: val.default_value ?? '',
			};
		});
		return transformed;
	});

	const handleVariableChange = (varKey, newVal) => {
		setVariablesState((prev) => ({
			...prev,
			[varKey]: {
				...prev[varKey],
				value: newVal,
			},
		}));
	};

	// --------------------------
	// UI State
	// --------------------------
	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedDatasourceId, setselectedDatasourceId] = useState(null);
	const [validationStatus, setValidationStatus] = useState(
		runId ? 'IN_QUEUE' : 'idle',
	);
	const [validationResult, setValidationResult] = useState(null);

	// 6.5 For revalidate button once changes are made in error modal
	//     We'll show "Re-validate" if `shouldShowRevalidate` is true
	const [shouldShowRevalidate, setShouldShowRevalidate] = useState(false);

	// The "Validation Error" modal
	const [isResolutionOpen, setIsResolutionOpen] = useState(false);

	const [currentValidationText, setCurrentValidationText] = useState('');
	const [activeTab, setActiveTab] = useState(null);

	const { data: runDetails, isLoading: isRunLoading } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(getToken(), workflowId, runId),
		enabled: Boolean(runId) && validationStatus !== 'NEED_CLARIFICATION',
		refetchInterval:
			runId && validationStatus !== 'NEED_CLARIFICATION' ? 5000 : false,
	});

	useEffect(() => {
		if (runDetails) {
			setValidationResult(runDetails.validationResult);
			setCurrentValidationText(runDetails?.data?.status_text || '');
			setselectedDatasourceId(runDetails?.datasource_id);
			const newStatus = runDetails?.status;

			if (['IN_QUEUE', 'VALIDATING'].includes(newStatus)) {
				setValidationStatus('validating');
			} else if (newStatus === 'NEED_CLARIFICATION') {
				setValidationStatus('NEED_CLARIFICATION');
				// Automatically open the error resolution modal if there's a validation error
				setIsResolutionOpen(true);
			} else {
				setValidationStatus('idle');
				onValidationSuccess(true);
			}
		}
	}, [runDetails]);

	useEffect(() => {
		if (dataPoints && dataPoints.length > 0) {
			const firstValidFile = dataPoints.find(
				(file) => file.file_name,
			)?.file_name;
			setActiveTab(
				firstValidFile ||
					(dataPoints.some((file) => !file.file_name)
						? 'additional-columns'
						: null),
			);
		}
	}, [dataPoints]);

	// --------------------------
	// QUERIES / MUTATIONS
	// --------------------------
	const initiateWorkflowCheckMutation = useMutation({
		mutationFn: ({ workflowId, payload }) =>
			initiateWorkflowCheck(getToken(), workflowId, payload),
		onSuccess: (data) => {
			toast.success('Workflow initiated successfully');
			if (data?.external_id) {
				navigate(
					`/app/business-process/${businessProcessId}/workflows/${workflowId}?run_id=${data.external_id}`,
				);
			}
		},
		onError: (err) => {
			console.error('Workflow initiation failed!', err);
			toast.error(`Something went wrong: ${err.message}`);
		},
	});

	const datasourceQuery = useQuery({
		queryKey: ['get-datasource-by-id', runDetails?.datasource_id],
		queryFn: () => getDataSourceById(getToken(), runDetails?.datasource_id),
		enabled: !!runDetails?.datasource_id,
	});

	const clarifyWorkFlowMutation = useMutation({
		mutationFn: ({ workflowId, workflowRunId, payload }) =>
			clarifyWorkFlowRun(getToken(), workflowId, workflowRunId, payload),
		onSuccess: (data) => {
			toast.success('Workflow clarification sent successfully!');
			queryClient.invalidateQueries(['workflow-run-details', runId], {
				refetchActive: true,
				refetchInactive: true,
			});
			setShouldShowRevalidate(false);
		},
		onError: (err) => {
			console.error('Workflow clarification sending failed!', err);
			toast.error(`Something went wrong: ${err.message}`);
		},
	});

	const runWorkFlowMutation = useMutation({
		mutationFn: ({ workflowId, workflowRunId }) =>
			RunWorkFlowRun(getToken(), workflowId, workflowRunId),
		onSuccess: (data) => {
			toast.success('Workflow run request sent successfully!');
			const sessionUrl = `${window.location.origin}/app/new-chat/session/?sessionId=${runDetails.session_id}`;
			navigate(sessionUrl);
		},
		onError: (err) => {
			console.error('Workflow run request failed!', err);
			toast.error(`Something went wrong: ${err.message}`);
		},
	});

	// --------------------------
	// HANDLERS
	// --------------------------
	const handleContinue = (data) => {
		setValidationStatus('validating');

		// On "Connect Data Source" => Start workflow
		if (data?.datasource_id) {
			// Merge variablesState into userClarifications.variables
			const mergedVariables = {};
			Object.keys(variablesState).forEach((k) => {
				mergedVariables[k] = {
					...variablesState[k],
					// name, description, type, ...
					// but importantly, 'value': variablesState[k].value
				};
			});

			initiateWorkflowCheckMutation.mutateAsync({
				workflowId,
				payload: {
					datasource_id: data.datasource_id,
					variables: mergedVariables,
					// If you also want your clarifications or data mapping to be sent,
					// you can attach them here:
					user_clarifications: userClarifications,
				},
			});
		}
	};

	const handleOpenModal = () => {
		if (validationStatus === 'validating') return;
		if (validationResult || selectedDatasourceId) {
			if (
				!window.confirm(
					'Your progress will be lost. Do you want to continue?',
				)
			)
				return;
			setselectedDatasourceId(null);
			setValidationResult(null);
			setValidationStatus('idle');
		}
		setIsModalOpen(true);
	};

	const handleTabClick = (fileName) => {
		setActiveTab(fileName === activeTab ? null : fileName);
	};

	const renderRecommendations = () => {
		if (!dataPoints || dataPoints.length === 0) return null;

		// Separate data points with and without file_name
		const additionalColumns = dataPoints.filter((file) => !file.file_name);
		const validDataPoints = dataPoints.filter((file) => file.file_name);

		return (
			<div className="mb-6">
				<h3 className="text-lg font-medium mb-4">Recommendations</h3>
				<div className="w-full overflow-x-auto flex gap-2">
					{/* Render tabs for valid file names */}
					{validDataPoints.map((file) => (
						<Button
							key={file.file_name}
							variant="outline"
							className={`flex gap-2 items-center font-medium border-2 rounded-lg px-4 py-2 cursor-pointer min-w-fit max-w-[19.25rem] ${
								activeTab === file.file_name
									? 'text-purple-100 border-purple-40 tabActiveBg'
									: 'text-black/60 border-black/10'
							}`}
							onClick={() => handleTabClick(file.file_name)}
						>
							<img
								src={getFileIcon(file.file_name)}
								width={20}
								height={20}
								alt="icon"
							/>
							{capitalize(file.file_name)}
						</Button>
					))}

					{/* Render tab for additional columns if they exist */}
					{additionalColumns.length > 0 && (
						<Button
							key="additional-columns"
							variant="outline"
							className={`flex  gap-2 items-center font-medium border-2 rounded-lg px-4 py-2 cursor-pointer min-w-fit max-w-[19.25rem] ${
								activeTab === 'additional-columns'
									? 'text-purple-100 border-purple-40 tabActiveBg'
									: 'text-black/60 border-black/10'
							}`}
							onClick={() => handleTabClick('additional-columns')}
						>
							<img
								src={getFileIcon('demo.xlsx')}
								width={20}
								height={20}
								alt="icon"
							/>
							Additional Columns
						</Button>
					)}
				</div>

				{/* Render headers for active tab */}
				{activeTab && (
					<div className="mt-4 rounded-xl h-fit pb-4 w-full">
						<ul className="flex flex-wrap items-center rounded-full gap-2 text-sm text-black/80">
							{(activeTab === 'additional-columns'
								? additionalColumns.flatMap((file) => file.headers)
								: validDataPoints.find(
										(file) => file.file_name === activeTab,
									)?.headers || []
							).map((header) => (
								<li
									key={header.name}
									className="flex gap-2 px-2 py-1 items-center bg-purple-4 border-2 rounded-lg shadow-sm"
								>
									<Tooltip
										content={capitalize(
											header.description || 'no description',
										)}
									>
										{capitalize(header.name)}
									</Tooltip>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		);
	};

	/**
	 * Called by the child when user clicks "Continue" in the ErrorResolutionModal.
	 * We'll receive a combined string for clarifications + an updated data_mapping array.
	 */
	const handleResolutionComplete = ({ textClarification, dataMapping }) => {
		// Merge new clarifications into our userClarifications
		setUserClarifications((prev) => ({
			...prev,
			text: textClarification, // single combined string
			data_mapping: dataMapping, // array of file-level mappings
		}));

		// Show the Re-validate button once user has updated something
		setShouldShowRevalidate(true);

		// If you want to immediately re-validate or do anything else, do it here
		// e.g. setValidationStatus('validating');

		// Close the modal
		setIsResolutionOpen(false);
	};

	// "Re-validate" handler if you want to let user confirm again after changes
	const handleRevalidate = () => {
		setValidationStatus('validating');

		// Merge the variablesState to userClarifications.variables
		const mergedVariables = {};
		Object.keys(variablesState).forEach((k) => {
			mergedVariables[k] = { ...variablesState[k] };
		});

		// Re-initiate the check, now with the updated user clarifications
		clarifyWorkFlowMutation.mutateAsync({
			workflowId,
			workflowRunId: runId,
			payload: { ...userClarifications, variables: mergedVariables },
		});
	};

	return (
		<>
			{isRunning && (
				<div className="absolute inset-0  bg-white/80  z-50 flex pt-80 justify-center rounded-xl">
					<div className="flex flex-col items-center gap-2 text-primary60">
						<RefreshCw className="w-8 h-8 animate-spin" />
						<span className="font-medium">Running workflow...</span>
					</div>
				</div>
			)}
			<Card className="mb-8 text-primary80 border border-black/10 rounded-xl shadow-none">
				<CardHeader>
					<div className="flex justify-between border-b pb-3">
						<div>
							<CardTitle className="text-lg font-semibold">
								Data Source
							</CardTitle>
							<CardDescription className="text-sm text-primary60">
								Securely connect to a datasource
							</CardDescription>
						</div>
						<div className="flex gap-2">
							{/* 
                6.5 Show Re-validate if the user has made changes in the error modal
                OR if we otherwise want to let them re-validate. 
              */}
							{shouldShowRevalidate && (
								<Button
									variant="outline"
									className="rounded-lg font-medium"
									onClick={handleRevalidate}
									disabled={validationStatus === 'validating'}
								>
									<RefreshCw className="w-4 h-4 mr-2" />{' '}
									Re-validate
								</Button>
							)}

							{validationStatus === 'NEED_CLARIFICATION' && (
								<Button
									variant="outline"
									className="text-state-error hover:bg-state-inProgress/10 hover:text-state-error/0.6 flex items-center font-semibold bg-stateBg-inProgress px-2 py-1 rounded-xl text-sm border-none"
									onClick={() => setIsResolutionOpen(true)}
								>
									<span className="material-symbols-outlined mr-2">
										error
									</span>
									Validation error
									<ChevronRight className="mr-0" />
								</Button>
							)}

							{/* 
                6. Also add a "Resolve Validation Error Manually" button
                if you want it always shown, or show it conditionally.
              */}
							{/* {validationStatus !== 'NEED_CLARIFICATION' && (
								<Button
									variant="outline"
									className="rounded-lg font-medium"
									onClick={() => setIsResolutionOpen(true)}
								>
									Resolve Validation Error Manually
								</Button>
							)} */}
							{!(
								validationStatus === 'validating' ||
								validationStatus === 'NEED_CLARIFICATION'
							) && (
								<Button
									variant="outline"
									className="rounded-lg bg-purple-8 font-medium border-none hover:bg-purple-4"
									onClick={handleOpenModal}
									disabled={validationStatus === 'validating'}
								>
									{selectedDatasourceId
										? 'Try another data source'
										: 'Connect Data Source'}
								</Button>
							)}
						</div>
					</div>
				</CardHeader>
				<CardContent className="space-y-6">
					{validationStatus === 'validating' && (
						<QueueStatus text={currentValidationText} />
					)}

					{/* 7. Manage Variables as text inputs */}
					<VariablesSection
						variables={variablesState}
						onVariablesChange={handleVariableChange}
					/>

					{renderRecommendations()}
				</CardContent>
			</Card>

			{/* DataSource Selector (modal) */}
			<DataSourceSelector
				open={isModalOpen}
				onOpenChange={setIsModalOpen}
				onContinue={handleContinue}
			/>

			{/* Error Resolution Modal (child) */}
			<ErrorResolutionModal
				open={isResolutionOpen}
				onOpenChange={setIsResolutionOpen}
				workflowRunDetails={runDetails}
				dataSourceDetails={datasourceQuery?.data}
				onResolutionComplete={handleResolutionComplete}
			/>
		</>
	);
};

export default DataSourceCard;
