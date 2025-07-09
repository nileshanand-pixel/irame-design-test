import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useMutation, useQuery } from '@tanstack/react-query';
import upperFirst from 'lodash.upperfirst';
import { toast } from 'sonner';

import { Button } from '@/components/ui/button';
import {
	Card,
	CardHeader,
	CardTitle,
	CardDescription,
	CardContent,
} from '@/components/ui/card';
import { ChevronRight, RefreshCw, AlertCircle } from 'lucide-react';
import QueueStatus from '@/components/features/new-chat/QueueStatus';
import { ErrorResolutionModal } from './ErrorResolutionModal';
import VariablesSection from './VariablesSection';
import { DataSourceSelector } from './DatasourceSelector';
import Tooltip from '@/components/features/reports/components/Tooltip';

import {
	clarifyWorkFlowRun,
	getWorkflowRunDetails,
	initiateWorkflowCheck,
} from '../../../service/workflow.service';

import { getDataSourceById } from '@/components/features/configuration/service/configuration.service';

import { getFileIcon } from '@/lib/utils';
import { queryClient } from '@/lib/react-query';
import WorkFlowDataSourceCardSkeleton from './WorkFlowDataSourceCardSkeleton';
import { getFileMeta } from '@/lib/file';

const gradientStyle = {
	background: `
linear-gradient(180deg, rgba(106, 18, 205, 0.02) 0%, rgba(106, 18, 205, 0.08) 100%)`,
};

const DataSourceCard = ({
	onValidationSuccess,
	variables: initialVariables = {},
	workflowId,
	runId,
	dataPoints,
	isRunning,
}) => {
	const navigate = useNavigate();
	const { businessProcessId } = useParams();

	// -------------------------- State --------------------------
	const [userClarifications, setUserClarifications] = useState({
		text_clarification: '',
		data_mapping: [],
	});
	const [variablesState, setVariablesState] = useState(() => {
		const transformed = {};
		Object.entries(initialVariables).forEach(([key, val]) => {
			transformed[key] = { ...val, value: val.default_value ?? '' };
		});
		return transformed;
	});
	const [fileSizes, setFileSizes] = useState({});

	const [isModalOpen, setIsModalOpen] = useState(false);
	const [selectedDatasourceId, setSelectedDatasourceId] = useState(null);
	const [validationStatus, setValidationStatus] = useState(
		runId ? 'IN_QUEUE' : 'idle',
	);
	const [validationResult, setValidationResult] = useState(null);
	const [shouldShowRevalidate, setShouldShowRevalidate] = useState(false);
	const [isResolutionOpen, setIsResolutionOpen] = useState(false);
	const [currentValidationText, setCurrentValidationText] = useState('');
	const [activeTab, setActiveTab] = useState(null);

	// -------------------------- Queries --------------------------
	const { data: runDetails, isLoading: isRunLoading } = useQuery({
		queryKey: ['workflow-run-details', runId],
		queryFn: () => getWorkflowRunDetails(workflowId, runId),
		enabled: Boolean(runId),
		refetchInterval:
			runId && validationStatus !== 'NEED_CLARIFICATION' ? 5000 : false,
	});

	const datasourceQuery = useQuery({
		queryKey: ['get-datasource-by-id', runDetails?.datasource_id],
		queryFn: () => getDataSourceById(runDetails?.datasource_id),
		enabled: !!runDetails?.datasource_id,
	});

	// -------------------------- Mutations --------------------------
	const initiateWorkflowCheckMutation = useMutation({
		mutationFn: ({ workflowId, payload }) =>
			initiateWorkflowCheck(workflowId, payload),
		onSuccess: (data) => {
			toast.success('Workflow initiated successfully');
			queryClient.invalidateQueries(['workflow-runs', workflowId]);
			if (data?.external_id) {
				navigate(
					`/app/business-process/${businessProcessId}/workflows/${workflowId}?run_id=${data.external_id}`,
				);
			}
		},
		onError: (err) => {
			toast.error(`Workflow initiation failed: ${err.message}`);
			console.error('Workflow initiation error:', err);
			setValidationStatus('idle');
		},
	});

	const clarifyWorkFlowMutation = useMutation({
		mutationFn: ({ workflowId, workflowRunId, payload }) =>
			clarifyWorkFlowRun(workflowId, workflowRunId, payload),
		onSuccess: () => {
			toast.success('Workflow clarification sent successfully!');
			queryClient.invalidateQueries(['workflow-run-details', runId]);
			setShouldShowRevalidate(false);
		},
		onError: (err) => {
			toast.error(`Clarification failed: ${err.message}`);
			console.error('Clarification error:', err);
			setValidationStatus('NEED_CLARIFICATION');
		},
	});

	// -------------------------- Effects --------------------------
	useEffect(() => {
		if (runDetails) {
			setValidationResult(runDetails.validationResult);
			setCurrentValidationText(runDetails?.data?.status_text || '');
			setSelectedDatasourceId(runDetails?.datasource_id);

			const newStatus = runDetails?.status;
			if (['IN_QUEUE', 'VALIDATING'].includes(newStatus)) {
				setValidationStatus('validating');
			} else if (newStatus === 'NEED_CLARIFICATION') {
				setValidationStatus('NEED_CLARIFICATION');
				setIsResolutionOpen(true);
			} else {
				setValidationStatus('idle');
				onValidationSuccess(true);
			}
		}
	}, [runDetails]);

	useEffect(() => {
		if (dataPoints?.length) {
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

	useEffect(() => {
		const fetchFileSizes = async () => {
			if (datasourceQuery.data?.processed_files?.files) {
				const sizes = {};
				await Promise.all(
					datasourceQuery.data.processed_files.files.map(async (file) => {
						try {
							const response = await getFileMeta(file.url);
							sizes[file.id] = response.size;
						} catch (error) {
							console.error('Error fetching file size:', error);
							sizes[file.id] = 0;
						}
					}),
				);
				setFileSizes(sizes);
			}
		};

		fetchFileSizes();
	}, [datasourceQuery.data?.processed_files?.files]);

	// -------------------------- Handlers --------------------------
	const handleVariableChange = (varKey, newVal) => {
		setVariablesState((prev) => ({
			...prev,
			[varKey]: { ...prev[varKey], value: newVal },
		}));
	};

	const handleContinue = (data) => {
		setValidationStatus('validating');

		//prepare api payload
		const mergedVariables = Object.keys(variablesState).reduce(
			(acc, key) => ({
				...acc,
				[key]: variablesState[key],
			}),
			{},
		);

		let payload = {
			variables: mergedVariables,
		};
		if (data?.datasource_id) {
			payload.datasource_id = data.datasource_id;

			initiateWorkflowCheckMutation.mutate({
				workflowId,
				payload,
			});
		} else if (data?.datasource_payload) {
			payload.datasource_payload = data.datasource_payload;

			initiateWorkflowCheckMutation.mutate({
				workflowId,
				payload,
			});
		}
	};
	const handleOpenModal = () => {
		if (validationStatus === 'validating') return;
		if (validationResult || selectedDatasourceId) {
			if (!window.confirm('Your progress will be lost. Continue?')) return;
			setSelectedDatasourceId(null);
			setValidationResult(null);
			setValidationStatus('idle');
		}
		setIsModalOpen(true);
	};

	const handleTabClick = (fileName) => {
		setActiveTab(fileName === activeTab ? null : fileName);
	};

	const handleResolutionComplete = ({ textClarification, dataMapping }) => {
		setUserClarifications((prev) => ({
			...prev,
			text_clarification: textClarification,
			data_mapping: dataMapping,
		}));
		setShouldShowRevalidate(true);
		setIsResolutionOpen(false);
	};

	const handleRevalidate = () => {
		setValidationStatus('validating');
		const mergedVariables = Object.keys(variablesState).reduce(
			(acc, key) => ({
				...acc,
				[key]: variablesState[key],
			}),
			{},
		);

		clarifyWorkFlowMutation.mutate({
			workflowId,
			workflowRunId: runId,
			payload: { ...userClarifications, variables: mergedVariables },
		});
	};

	const formatFileSize = (sizeInBytes) => {
		if (sizeInBytes < 1024) return `${sizeInBytes} B`;
		if (sizeInBytes < 1048576) return `${(sizeInBytes / 1024).toFixed(1)} KB`;
		if (sizeInBytes < 1073741824)
			return `${(sizeInBytes / 1048576).toFixed(1)} MB`;
		return `${(sizeInBytes / 1073741824).toFixed(1)} GB`;
	};

	// -------------------------- Render Helpers --------------------------
	const renderRecommendations = () => {
		if (!dataPoints?.length) return null;

		const additionalColumns = dataPoints.filter((file) => !file.file_name);
		const validDataPoints = dataPoints.filter((file) => file.file_name);

		return (
			<div className="mb-6">
				<h3 className="text-lg font-medium mb-4">Recommendations</h3>
				<div className="w-full overflow-x-scroll flex gap-2">
					{validDataPoints.map((file) => (
						<Button
							key={file.file_name}
							variant="outline"
							className={`flex gap-2 items-center font-medium border-2 rounded-lg px-4 py-2 cursor-pointer min-w-fit max-w-[19.25rem] ${activeTab === file.file_name
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
							{upperFirst(file.file_name)}
						</Button>
					))}

					{additionalColumns.length > 0 && (
						<Button
							variant="outline"
							className={`flex gap-2 items-center font-medium border-2 rounded-lg px-4 py-2 cursor-pointer min-w-fit max-w-[19.25rem] ${activeTab === 'additional-columns'
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
										content={upperFirst(
											header.description || 'no description',
										)}
									>
										{upperFirst(header.name)}
									</Tooltip>
								</li>
							))}
						</ul>
					</div>
				)}
			</div>
		);
	};

	const renderFilesSection = (files, fileSizes) => {
		if (!files?.length) return null;

		if (datasourceQuery.isLoading) {
			return (
				<div className="mt-6 border-b pb-6">
					<h3 className="text-lg font-medium mb-4">Files</h3>
					{[1, 2, 3].map((i) => (
						<div
							key={i}
							className="px-4 py-2.5 rounded-lg mt-2 bg-gray-100 animate-pulse"
							style={gradientStyle}
						>
							<div className="flex justify-between items-center">
								<div className="flex gap-2 items-center">
									<Skeleton className="w-6 h-6 bg-gray-200 rounded" />
									<Skeleton className="h-4 w-48 bg-gray-200" />
								</div>
							</div>
						</div>
					))}
				</div>
			);
		}

		return (
			<div className="mt-6 border-b pb-6">
				<h3 className="text-lg font-medium mb-4">Files</h3>
				{files.length === 0 ? (
					<div className="text-center text-gray-500 py-4">
						No processed files present yet.
					</div>
				) : (
					files.map((file) => (
						<div
							key={file.id}
							style={gradientStyle}
							className="px-4 py-2.5 rounded-lg mt-2"
						>
							<div className="flex justify-between items-center">
								<div className="flex gap-2 items-center">
									<img
										src={getFileIcon(file.filename)}
										alt="file-icon"
										className="size-6"
									/>
									<span className="font-normal text-purple-100">
										{file.filename}
										{fileSizes[file.id] && (
											<span className="ml-2 text-primary60">
												({formatFileSize(fileSizes[file.id])}
												)
											</span>
										)}
									</span>
								</div>
							</div>
						</div>
					))
				)}
			</div>
		);
	};

	return (
		<>
			{isRunning && (
				<div className="absolute inset-0 bg-white/80 z-50 flex pt-80 justify-center rounded-xl">
					<div className="flex flex-col items-center gap-2 text-primary60">
						<RefreshCw className="w-8 h-8 animate-spin" />
						<span className="font-medium">Running workflow...</span>
					</div>
				</div>
			)}

			{isRunLoading ? (
				<WorkFlowDataSourceCardSkeleton />
			) : (
				<>
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
									{shouldShowRevalidate && (
										<Button
											variant="outline"
											className="rounded-lg font-medium"
											onClick={handleRevalidate}
											disabled={
												validationStatus === 'validating'
											}
										>
											<RefreshCw className="w-4 h-4 mr-2" />
											Re-validate
										</Button>
									)}

									{validationStatus === 'NEED_CLARIFICATION' && (
										<Button
											variant="outline"
											className="text-state-error hover:bg-state-inProgress/5 hover:text-state-error/80 flex items-center font-semibold bg-stateBg-inProgress px-2 py-1 rounded-xl text-sm border-none"
											onClick={() => setIsResolutionOpen(true)}
										>
											<span className="material-symbols-outlined mr-2">
												error
											</span>
											Validation error
											<ChevronRight className="mr-0" />
										</Button>
									)}

									{!['validating', 'NEED_CLARIFICATION'].includes(
										validationStatus,
									) && (
											<Button
												variant="outline"
												className="rounded-lg bg-purple-8 font-medium border-none hover:bg-purple-4"
												onClick={handleOpenModal}
												disabled={
													validationStatus === 'validating'
												}
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
							{renderFilesSection(
								datasourceQuery.data?.processed_files?.files,
								fileSizes,
							)}
							<VariablesSection
								variables={variablesState}
								onVariablesChange={handleVariableChange}
							/>

							{renderRecommendations()}
						</CardContent>
					</Card>

					<DataSourceSelector
						open={isModalOpen}
						onOpenChange={setIsModalOpen}
						onContinue={handleContinue}
					/>

					<ErrorResolutionModal
						open={isResolutionOpen}
						onOpenChange={setIsResolutionOpen}
						workflowRunDetails={runDetails}
						dataSourceDetails={datasourceQuery?.data}
						onResolutionComplete={handleResolutionComplete}
					/>
				</>
			)}
		</>
	);
};

export default DataSourceCard;
