import GraphComponent from '@/components/elements/GraphComponent';
import React, { useEffect, useMemo, useState } from 'react';
import CoderComponent from './CoderComponent';
import { WorkspaceEnum, EXPORT_STATUS } from './types/new-chat.enum';
import { Button } from '@/components/ui/button';
import FollowUpQuestions from './FollowUpQuestions';
import DOMPurify from 'dompurify';
import TableResponse from '@/components/elements/TableResponse';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { useDispatch, useSelector } from 'react-redux';
import { trackEvent } from '@/lib/mixpanel';
import { toast } from '@/lib/toast';
import {
	ArrowDownToLine,
	ChartNoAxesCombinedIcon,
	Check,
	ChevronDown,
	Copy,
	LayoutDashboard,
	// MoreHorizontal,
	Plus,
	// RefreshCw,
	ThumbsDown,
	ThumbsUp,
	Workflow,
} from 'lucide-react';
import { QUERY_TYPES } from '@/constants/query-type.constant';
import workSpaceHoverIcon from '@/assets/icons/workspace.svg';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import AddQueryFlow from '../reports/components/AddQueryFlow';
import { useRouter } from '@/hooks/useRouter';
import useS3File from '@/hooks/useS3File';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';
import { Input } from '@/components/ui/input';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuLabel,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
	Tooltip,
	TooltipContent,
	TooltipProvider,
	TooltipTrigger,
} from '@/components/ui/tooltip';
import WorkflowModal from './WorkflowModal';
import { FeedbackModal } from '@/components/FeedbackModal';
import {
	getFeedbacksBySession,
	submitFeedback,
} from '@/api/feedback/feedback.service';
import { cn } from '@/lib/utils';
import { getURLSearchParams } from '@/utils/url';
import { PAGE_TYPES } from '@/constants/page.constant';
import { DATASOURCE_TYPES } from '@/constants/datasource.constant';

const OptionsClarification = ({ question, onConfirm }) => {
	const [customValue, setCustomValue] = useState('');

	const handleSubmit = () => {
		onConfirm(customValue);
	};

	return (
		<div className="py-2 flex flex-col gap-2 mt-2">
			<div className="font-normal text-primary80 text-sm">
				{
					new DOMParser().parseFromString(question, 'text/html').body
						.textContent
				}
			</div>
			<Input
				type="text"
				placeholder="Response"
				className="border border-gray-300 text-gray-500 placeholder:text-gray-500 rounded-md p-2 flex-1"
				value={customValue}
				onChange={(e) => setCustomValue(e.target.value)}
			/>
			<Button className="ml-auto" variant="outline" onClick={handleSubmit}>
				Send
			</Button>
		</div>
	);
};

function AddToDropdownItem({ icon: Icon, label, onClick }) {
	return (
		<DropdownMenuItem
			className="flex items-center p-2 gap-2 mt-[6px] text-sm text-primary80 hover:text-primary80 cursor-pointer focus:!bg-purple-4 hover:!bg-purple-4 rounded-[4px]"
			onClick={onClick}
		>
			{(label === 'Workflows' && (
				<span className="material-symbols-outlined text-lg text-primary60">
					family_history
				</span>
			)) || <Icon className="w-5 h-5 text-primary60" />}

			{label}
		</DropdownMenuItem>
	);
}

export function AddToDropdown({
	safeHTML,
	answerResp,
	showGraph,
	handleAddQueryToReport,
	handleAddToDashboard,
	handleAddToWorkflow,
	sessionQueriesData,
}) {
	const [open, setOpen] = useState(false);
	const isWorkflowQuery =
		answerResp?.type === QUERY_TYPES.WORKFLOW ||
		answerResp?.type === QUERY_TYPES.SQL_WORKFLOW ||
		sessionQueriesData?.session_metadata?.workflow_run_id;

	return (
		<DropdownMenu open={open} onOpenChange={setOpen}>
			<DropdownMenuTrigger asChild>
				<Button
					variant="outline"
					className="text-sm gap-2 group font-medium transition-all duration-300 ease-in-out hover:!bg-primary hover:!text-white !text-primary80 flex items-center"
				>
					<Plus className="w-5 h-5" />
					Add to
					<ChevronDown className="w-5 h-5" />
				</Button>
			</DropdownMenuTrigger>

			<DropdownMenuContent
				sideOffset={6}
				align="end"
				className="w-44 rounded-lg shadow-md p-2"
			>
				<DropdownMenuLabel className="text-xs font-normal text-primary60 py-1 px-2 mb-0">
					Add to
				</DropdownMenuLabel>
				<DropdownMenuSeparator className="m-0" />

				{showGraph &&
					sessionQueriesData?.datasource_details?.datasource_type !==
						DATASOURCE_TYPES.SQL_GENERATED && (
						<AddToDropdownItem
							icon={LayoutDashboard}
							label="Dashboard"
							onClick={() => {
								handleAddToDashboard();
								setOpen(false);
							}}
						/>
					)}

				{safeHTML && answerResp?.status === 'done' && (
					<AddToDropdownItem
						icon={ChartNoAxesCombinedIcon}
						label="Reports"
						onClick={() => {
							handleAddQueryToReport();
							setOpen(false);
						}}
					/>
				)}

				{!isWorkflowQuery &&
					sessionQueriesData?.datasource_details?.datasource_type !==
						DATASOURCE_TYPES.SQL_GENERATED && (
						<AddToDropdownItem
							icon={Plus}
							label="Workflows"
							onClick={() => {
								handleAddToWorkflow();
								setOpen(false);
							}}
						/>
					)}
			</DropdownMenuContent>
		</DropdownMenu>
	);
}

const ResponseCard = ({
	answerResp,
	isGraphLoading,
	setIsGraphLoading,
	setAnswerResp,
	doingScience,
	setDoingScience,
	setBanners,
	setResponseTimeElapsed,
	setDashboard,
	showTable,
	setIsTableLoading,
	isTableLoading,
	hasClarification,
	showWorkspaceToggle,
	toggleWorkspace,
	queryId,
	isAllDocuments,
	workspaceQueryId,
	isWorkspaceExpanded,
	isLastQuery,
	updatedAt,
	currentSessionData,
	sessionQueriesData,
	exportStatus,
}) => {
	const dispatch = useDispatch();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const [isAddToReportOpen, setIsAddToReportOpen] = useState(false);
	const { query } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const { isDownloading, downloadS3File } = useS3File();
	const [isWorkflowModalOpen, setWorkflowModal] = useState(false);
	const [feedbackModalOpen, setFeedbackModalOpen] = useState(false);
	const [feedbackMap, setFeedbackMap] = useState({});
	const [copied, setCopied] = useState(false);

	useEffect(() => {
		if (!query?.sessionId || !answerResp?.query_id) return;

		const fetchFeedbacks = async () => {
			try {
				const feedbacks = await getFeedbacksBySession(query.sessionId);
				const map = {};
				feedbacks.forEach((f) => {
					map[f.entity_id] =
						f.feedback === 'positive' ? 'Positive' : 'Negative';
				});
				setFeedbackMap(map);
			} catch (err) {
				console.error(err);
			}
		};

		fetchFeedbacks();
	}, [query?.sessionId, answerResp?.query_id]);

	// Check if workflowRefId is in URL params and open modal
	useEffect(() => {
		const urlParams = getURLSearchParams();
		const workflowRefId = urlParams.get('workflowRefId');
		if (workflowRefId) {
			setWorkflowModal(true);
		}
	}, []);

	const { data: datasourceData } = useDatasourceDetailsV2();
	const mainItems = Object.entries(answerResp?.answer || {}).filter(
		([key, value]) =>
			value?.tool_space === 'main' &&
			value?.tool_type !== WorkspaceEnum.Answer,
	);

	const answerItem = Object.entries(answerResp?.answer || {}).find(
		([key, value]) =>
			value?.tool_space === 'main' &&
			value?.tool_type === WorkspaceEnum.Answer,
	);

	const clarificationItem = Object.entries(answerResp?.answer || {}).find(
		([key, value]) =>
			value?.tool_space === 'main' &&
			value?.tool_type === WorkspaceEnum.Clarification,
	);

	let safeHTML = '';
	if (answerItem && answerItem[1]?.tool_data?.text) {
		safeHTML = DOMPurify.sanitize(answerItem[1]?.tool_data?.text);
	} else if (clarificationItem && clarificationItem[1]?.tool_data?.text) {
		safeHTML = DOMPurify.sanitize(clarificationItem[1]?.tool_data?.text);
	}

	const graphDataItem = mainItems.find(
		([key, value]) => value?.tool_type === WorkspaceEnum.Graph,
	);
	const dataFrameItem = mainItems.find(
		([key, value]) => value?.tool_type === WorkspaceEnum.DataFrame,
	);
	const extractionItem = mainItems.find(
		([key, value]) => value?.tool_type === WorkspaceEnum.Extraction,
	);

	const exportState = useMemo(() => {
		const consolidatedExportItem = Object.entries(answerResp?.answer || {}).find(
			([key, value]) => value?.tool_type === WorkspaceEnum.ConsolidatedExport,
		);
		const consolidatedExportData = consolidatedExportItem?.[1]?.tool_data;

		const status =
			exportStatus?.status ||
			consolidatedExportData?.status ||
			EXPORT_STATUS.NOT_CREATED;
		const excelUrl = exportStatus?.excelUrl || consolidatedExportData?.excel_url;

		const baseName = `${datasourceData?.name || 'export'}_${answerResp?.child_no || 1}`;

		return {
			status,
			excelUrl,
			isCompleted: status === EXPORT_STATUS.COMPLETED && !!excelUrl,
			isFailed: status === EXPORT_STATUS.FAILED,
			isInProgress: status === EXPORT_STATUS.IN_PROGRESS,
			isNotCreated: status === EXPORT_STATUS.NOT_CREATED,
			excelFileName: `${baseName}.xlsx`,
			csvFileName: `${baseName}.csv`,
		};
	}, [
		exportStatus,
		answerResp?.answer,
		answerResp?.child_no,
		datasourceData?.name,
	]);

	const displayLogic = useMemo(() => {
		const hasGraphData = !!graphDataItem;
		const hasTableData = !!dataFrameItem;
		const hasText = !!safeHTML;

		const hasRelatedQuestions =
			!!answerResp?.answer?.follow_up?.tool_data?.questions &&
			Array.isArray(answerResp?.answer?.follow_up?.tool_data?.questions);

		const isQueryDone = answerResp?.status === 'done';
		const isQnaEnabled = !(import.meta.env.VITE_QNA_DISABLED === 'true');
		const isNotProcessing = !doingScience;

		// Check if last query is a clarification
		const isLastQueryClarification = !!clarificationItem;

		return {
			// Content availability
			hasText,
			hasGraphData,
			hasTableData,
			hasVisualData: hasGraphData || hasTableData,

			// Display modes
			showGraph: hasGraphData,
			showTableOnly: !hasGraphData && hasTableData,
			showResponseContent: hasText || (mainItems && mainItems.length > 0),

			// Feature availability
			canExportExcel: exportState.isCompleted,
			exportInProgress: exportState.isInProgress,
			showCsvFallback:
				(exportState.isFailed || exportState.isNotCreated) && hasTableData,
			canAddToReport: hasText && isQueryDone,
			canAddToDashboard: hasGraphData,

			// Related questions
			showRelatedQuestions:
				hasRelatedQuestions &&
				isQnaEnabled &&
				isQueryDone &&
				isNotProcessing &&
				isLastQuery &&
				!isLastQueryClarification,
			relatedQuestions: hasRelatedQuestions
				? answerResp.answer.follow_up.tool_data.questions
				: [],
		};
	}, [
		graphDataItem,
		dataFrameItem,
		safeHTML,
		answerResp,
		doingScience,
		isLastQuery,
		mainItems,
		clarificationItem,
		exportState,
	]);

	const handleAddQueryToReport = () => {
		setIsAddToReportOpen(true);
		trackEvent(
			EVENTS_ENUM.ADD_TO_REPORT_CLICKED,
			EVENTS_REGISTRY.ADD_TO_REPORT_CLICKED,
			() => ({
				chat_session_id: query?.sessionId,
				dataset_id: datasourceData?.datasource_id,
				dataset_name: datasourceData?.name,
				query_id: answerResp?.query_id,
			}),
		);
	};

	const handleAddToDashboard = () => {
		setDashboard((prevState) => ({
			...prevState,
			showSelectDashboard: true,
			queryId: answerResp?.query_id,
		}));
		trackEvent(
			EVENTS_ENUM.ADD_TO_DASHBOARD_CLICKED,
			EVENTS_REGISTRY.ADD_TO_DASHBOARD_CLICKED,
			() => ({
				chat_session_id: query?.sessionId,
				dataset_id: datasourceData?.datasource_id,
				dataset_name: datasourceData?.name,
				query_id: answerResp?.query_id,
			}),
		);
	};

	useEffect(() => {
		if (displayLogic.showRelatedQuestions) {
			trackEvent(
				EVENTS_ENUM.FOLLOW_UP_SUGGESTION_SHOWED,
				EVENTS_REGISTRY.FOLLOW_UP_SUGGESTION_SHOWED,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: answerResp?.query_id,
					ques_count:
						answerResp?.answer?.follow_up?.tool_data?.questions?.length,
				}),
			);
		}
	}, [
		displayLogic.showRelatedQuestions,
		answerResp,
		query,
		datasourceData,
		chatStoreReducer,
	]);

	const handleSendPositiveFeedback = async () => {
		const currentFeedback = feedbackMap[answerResp?.query_id];
		if (currentFeedback === 'Positive') return;

		try {
			await submitFeedback({
				entityId: answerResp?.query_id,
				entityType: 'query',
				feedback: 'positive',
				comment: 'This is a positive feedback',
			});
			setFeedbackMap((prev) => ({
				...prev,
				[answerResp?.query_id]: 'Positive',
			}));
		} catch (err) {
			console.error(err);
		}
	};

	const handleCopy = async (textToCopy) => {
		if (!textToCopy) return;
		try {
			await navigator.clipboard.writeText(textToCopy);
			setCopied(true);
			toast.success('Response copied to clipboard');
			setTimeout(() => setCopied(false), 1500);
		} catch (err) {
			console.error('Failed to copy:', err);
			toast.error('Failed to copy response');
		}
	};

	const formatTimestamp = (ts) => {
		if (!ts) return '';

		const date = new Date(ts);

		const month = date.toLocaleString('en-US', { month: 'short' });
		const day = date.getDate();
		let hours = date.getHours();
		const minutes = String(date.getMinutes()).padStart(2, '0');

		const ampm = hours >= 12 ? 'PM' : 'AM';
		hours = hours % 12 || 12;

		return `${month} ${day}, ${hours}:${minutes} ${ampm}`;
	};

	return (
		<>
			<div className="flex flex-col w-full pr-[3rem]">
				{displayLogic.showResponseContent && (
					<div>
						<div className="flex justify-between items-start group gap-2">
							{displayLogic.hasText && (
								<>
									<div className="mb-2">
										<p
											className="text-primary80 font-medium cursor-default"
											style={{ whiteSpace: 'pre-wrap' }}
											dangerouslySetInnerHTML={{
												__html: safeHTML,
											}}
										></p>
									</div>
									<span className="text-base text-primary80 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity duration-200">
										{formatTimestamp(updatedAt)}
									</span>
								</>
							)}
						</div>

						{answerResp?.status === 'done' && !doingScience && (
							<div className="flex text-primary80 gap-1">
								<button
									onClick={() => {
										const tempDiv =
											document.createElement('div');
										tempDiv.innerHTML = safeHTML;
										const plainText =
											tempDiv.textContent ||
											tempDiv.innerText ||
											'';
										handleCopy(plainText);
									}}
									className=" hover:bg-purple-4 hover:scale-105 transition-all duration-150 rounded-md p-0"
									title={copied ? 'Copied!' : 'Copy'}
								>
									{copied ? (
										<Check className="h-9 w-9 p-2" />
									) : (
										<Copy className="h-9 w-9 p-2" />
									)}
								</button>

								{feedbackMap[answerResp?.query_id] !==
									'Negative' && (
									<button
										className=" hover:bg-purple-4 hover:scale-105 transition-all duration-150 rounded-md p-0"
										title="Good Feedback"
										onClick={handleSendPositiveFeedback}
									>
										<ThumbsUp
											className={cn(
												'h-9 w-9 p-2',
												feedbackMap[answerResp?.query_id] ===
													'Positive' &&
													'text-primary fill-current cursor-default',
											)}
										/>
									</button>
								)}

								{feedbackMap[answerResp?.query_id] !==
									'Positive' && (
									<button
										className=" hover:bg-purple-4 hover:scale-105 transition-all duration-150 rounded-md p-0"
										title="Bad Feedback"
										onClick={() => {
											const currentFeedback =
												feedbackMap[answerResp?.query_id];
											if (currentFeedback === 'Negative')
												return;
											setFeedbackModalOpen(true);
										}}
									>
										<ThumbsDown
											className={cn(
												'h-9 w-9 p-2',
												feedbackMap[answerResp?.query_id] ===
													'Negative' &&
													'text-primary fill-current cursor-default',
											)}
										/>
									</button>
								)}
							</div>
						)}

						{displayLogic.showGraph && (
							<div className="my-4">
								<GraphComponent
									data={{
										graph: graphDataItem[1],
										table: dataFrameItem[1],
									}}
									extraction={extractionItem?.[1]}
									isGraphLoading={isGraphLoading}
									setIsGraphLoading={setIsGraphLoading}
									showTable={showTable}
									queryId={answerResp?.query_id}
									page={PAGE_TYPES.QNA}
									contentItem={{
										query_id: answerResp?.query_id,
										content: {
											table: dataFrameItem?.[1]?.tool_data,
											query: answerResp?.query,
											session_id: query?.sessionId,
											datasource_id:
												datasourceData?.datasource_id,
										},
									}}
								/>
							</div>
						)}

						{displayLogic.showTableOnly && (
							<div className="mb-4">
								<TableResponse
									data={dataFrameItem[1].tool_data}
									isGraphLoading={isTableLoading}
									setIsGraphLoading={setIsTableLoading}
									showTable={showTable}
									queryId={answerResp?.query_id}
								/>
							</div>
						)}

						{displayLogic.hasVisualData && (
							<div className="my-4 flex justify-between">
								{displayLogic.showCsvFallback && !doingScience ? (
									<Button
										variant="outline"
										disabled={isDownloading}
										className="text-sm group transition-all duration-300 ease-in-out font-medium !text-primary80 hover:!bg-primary hover:!text-white flex items-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
										onClick={() => {
											trackEvent(
												EVENTS_ENUM.DOWNLOAD_CSV_CLICKED,
												EVENTS_REGISTRY.DOWNLOAD_CSV_CLICKED,
												() => ({
													chat_session_id:
														query?.sessionId,
													dataset_id:
														datasourceData?.datasource_id,
													dataset_name:
														datasourceData?.name,
													query_id: answerResp?.query_id,
												}),
											);

											const csvUrl =
												dataFrameItem[1]?.tool_data?.csv_url;
											downloadS3File(
												csvUrl,
												exportState.csvFileName,
											);
										}}
									>
										{isDownloading ? (
											<>
												<span className="mr-2">
													<CircularLoader size="md" />
												</span>
												Downloading...
											</>
										) : (
											<>
												<ArrowDownToLine className="mr-2 font-medium h-4 w-4" />
												Download CSV
											</>
										)}
									</Button>
								) : (
									<TooltipProvider>
										<Tooltip>
											<TooltipTrigger asChild>
												<span>
													<Button
														variant="outline"
														disabled={
															isDownloading ||
															displayLogic.exportInProgress ||
															!displayLogic.canExportExcel
														}
														className="text-sm group transition-all duration-300 ease-in-out font-medium !text-primary80 hover:!bg-primary hover:!text-white flex items-center cursor-pointer disabled:cursor-not-allowed disabled:opacity-60"
														onClick={() => {
															trackEvent(
																EVENTS_ENUM.DOWNLOAD_CSV_CLICKED,
																EVENTS_REGISTRY.DOWNLOAD_CSV_CLICKED,
																() => ({
																	chat_session_id:
																		query?.sessionId,
																	dataset_id:
																		datasourceData?.datasource_id,
																	dataset_name:
																		datasourceData?.name,
																	query_id:
																		answerResp?.query_id,
																}),
															);

															downloadS3File(
																exportState.excelUrl,
																exportState.excelFileName,
															);
														}}
													>
														{isDownloading ? (
															<>
																<span className="mr-2">
																	<CircularLoader size="md" />
																</span>
																Exporting...
															</>
														) : (
															<>
																<ArrowDownToLine className="mr-2 font-medium h-4 w-4" />
																Export
															</>
														)}
													</Button>
												</span>
											</TooltipTrigger>
											{displayLogic.exportInProgress && (
												<TooltipContent>
													Export URL is being generated.
												</TooltipContent>
											)}
										</Tooltip>
									</TooltipProvider>
								)}
								<div className="flex gap-2">
									<AddToDropdown
										safeHTML={safeHTML}
										answerResp={answerResp}
										showGraph={
											displayLogic?.showGraph ||
											displayLogic?.showTableOnly
										}
										handleAddQueryToReport={
											handleAddQueryToReport
										}
										handleAddToDashboard={handleAddToDashboard}
										handleAddToWorkflow={() =>
											setWorkflowModal(true)
										}
										sessionQueriesData={sessionQueriesData}
									/>
									{showWorkspaceToggle && (
										<Button
											variant="outline"
											className="text-sm group font-medium transition-all duration-300 ease-in-out !text-primary80 hover:!bg-primary hover:!text-white flex items-center"
											onClick={() => toggleWorkspace(queryId)}
											disabled={isAllDocuments}
										>
											<svg
												xmlns="http://www.w3.org/2000/svg"
												viewBox="0 0 17 17"
												className="mr-2 h-4 w-4 transition-colors duration-300"
												fill="none"
											>
												<path
													d="M4.1875 5.89583L7.29167 0.833333C7.375 0.694444 7.47917 0.59375 7.60417 0.53125C7.72917 0.46875 7.86111 0.4375 8 0.4375C8.13889 0.4375 8.27083 0.46875 8.39583 0.53125C8.52083 0.59375 8.625 0.694444 8.70833 0.833333L11.8125 5.89583C11.8958 6.03472 11.9375 6.18056 11.9375 6.33333C11.9375 6.48611 11.9028 6.625 11.8333 6.75C11.7639 6.875 11.6667 6.97569 11.5417 7.05208C11.4167 7.12847 11.2708 7.16667 11.1042 7.16667H4.89583C4.72917 7.16667 4.58333 7.12847 4.45833 7.05208C4.33333 6.97569 4.23611 6.875 4.16667 6.75C4.09722 6.625 4.0625 6.48611 4.0625 6.33333C4.0625 6.18056 4.10417 6.03472 4.1875 5.89583ZM12.5833 16.3333C11.5417 16.3333 10.6562 15.9688 9.92708 15.2396C9.19792 14.5104 8.83333 13.625 8.83333 12.5833C8.83333 11.5417 9.19792 10.6562 9.92708 9.92708C10.6562 9.19792 11.5417 8.83333 12.5833 8.83333C13.625 8.83333 14.5104 9.19792 15.2396 9.92708C15.9687 10.6562 16.3333 11.5417 16.3333 12.5833C16.3333 13.625 15.9687 14.5104 15.2396 15.2396C14.5104 15.9688 13.625 16.3333 12.5833 16.3333ZM0.5 15.0833V10.0833C0.5 9.84722 0.579861 9.64931 0.739583 9.48958C0.899306 9.32986 1.09722 9.25 1.33333 9.25H6.33333C6.56944 9.25 6.76736 9.32986 6.92708 9.48958C7.08681 9.64931 7.16667 9.84722 7.16667 10.0833V15.0833C7.16667 15.3194 7.08681 15.5174 6.92708 15.6771C6.76736 15.8368 6.56944 15.9167 6.33333 15.9167H1.33333C1.09722 15.9167 0.899306 15.8368 0.739583 15.6771C0.579861 15.5174 0.5 15.3194 0.5 15.0833ZM12.5833 14.6667C13.1667 14.6667 13.6597 14.4653 14.0625 14.0625C14.4653 13.6597 14.6667 13.1667 14.6667 12.5833C14.6667 12 14.4653 11.5069 14.0625 11.1042C13.6597 10.7014 13.1667 10.5 12.5833 10.5C12 10.5 11.5069 10.7014 11.1042 11.1042C10.7014 11.5069 10.5 12 10.5 12.5833C10.5 13.1667 10.7014 13.6597 11.1042 14.0625C11.5069 14.4653 12 14.6667 12.5833 14.6667ZM2.16667 14.25H5.5V10.9167H2.16667V14.25ZM6.375 5.5H9.625L8 2.875L6.375 5.5Z"
													fill="currentColor"
													className="text-primary80 group-hover:text-white"
												/>
											</svg>
											{isWorkspaceExpanded &&
											workspaceQueryId === queryId
												? 'Hide'
												: 'View'}{' '}
											Workspace
										</Button>
									)}
								</div>
							</div>
						)}
					</div>
				)}
				{displayLogic.showRelatedQuestions && (
					<div>
						<div className="mt-2 mb-2 font-semibold text-xl text-primary80 pb-4 border-b border-primary10 ">
							Related Questions
						</div>
						<div className=" flex flex-col mx-auto">
							{displayLogic.relatedQuestions.map((question, index) => (
								<FollowUpQuestions
									key={index}
									question={question}
									index={index}
									setAnswerResp={setAnswerResp}
									setDoingScience={setDoingScience}
									setResponseTimeElapsed={setResponseTimeElapsed}
									setBanners={setBanners}
									answerResp={answerResp}
									currentSessionData={currentSessionData}
								/>
							))}
						</div>
					</div>
				)}
			</div>
			<AddQueryFlow
				isOpen={isAddToReportOpen}
				onClose={() => setIsAddToReportOpen(false)}
				queryId={answerResp?.query_id}
			/>
			<WorkflowModal
				open={isWorkflowModalOpen}
				onClose={() => setWorkflowModal(false)}
				queryId={answerResp?.query_id}
			/>
			<FeedbackModal
				isOpen={feedbackModalOpen}
				onClose={() => setFeedbackModalOpen(false)}
				entityId={answerResp?.query_id}
				feedbackMap={feedbackMap}
				setFeedbackMap={setFeedbackMap}
			/>
		</>
	);
};

export default ResponseCard;
