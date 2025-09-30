import GraphComponent from '@/components/elements/GraphComponent';
import React, { useEffect, useMemo, useState } from 'react';
import CoderComponent from './CoderComponent';
import { WorkspaceEnum } from './types/new-chat.enum';
import { Button } from '@/components/ui/button';
import FollowUpQuestions from './FollowUpQuestions';
import DOMPurify from 'dompurify';
import TableResponse from '@/components/elements/TableResponse';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { useDispatch, useSelector } from 'react-redux';
import { trackEvent } from '@/lib/mixpanel';
import { ChartNoAxesCombinedIcon, LayoutDashboard } from 'lucide-react';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import AddQueryFlow from '../reports/components/AddQueryFlow';
import { useRouter } from '@/hooks/useRouter';
import useS3File from '@/hooks/useS3File';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';

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
	isLastQuery,
}) => {
	const dispatch = useDispatch();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const [isAddToReportOpen, setIsAddToReportOpen] = useState(false);
	const { query } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const { isDownloading, downloadS3File } = useS3File();

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
		const isLastQuery = isLastQuery;

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
			canDownloadCsv: hasTableData && !!dataFrameItem[1]?.tool_data?.csv_url,
			canAddToReport: hasText && isQueryDone,
			canAddToDashboard: hasGraphData,

			// Related questions
			showRelatedQuestions:
				hasRelatedQuestions &&
				isQnaEnabled &&
				isQueryDone &&
				isNotProcessing &&
				isLastQuery,
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
	]);

	const handleAddQueryToReport = () => {
		dispatch(
			updateChatStoreProp([
				{
					key: 'activeQueryId',
					value: answerResp?.query_id,
				},
			]),
		);
		setIsAddToReportOpen(true);
		trackEvent(
			EVENTS_ENUM.ADD_TO_REPORT_CLICKED,
			EVENTS_REGISTRY.ADD_TO_REPORT_CLICKED,
			() => ({
				chat_session_id: query?.sessionId,
				dataset_id: datasourceData?.datasource_id,
				dataset_name: datasourceData?.name,
				query_id: chatStoreReducer?.activeQueryId,
			}),
		);
	};

	const handleAddToDashboard = () => {
		dispatch(
			updateChatStoreProp([
				{
					key: 'activeQueryId',
					value: answerResp?.query_id,
				},
			]),
		);
		setDashboard((prevState) => ({
			...prevState,
			showAdd: true,
		}));
		trackEvent(
			EVENTS_ENUM.ADD_TO_DASHBOARD_CLICKED,
			EVENTS_REGISTRY.ADD_TO_DASHBOARD_CLICKED,
			() => ({
				chat_session_id: query?.sessionId,
				dataset_id: datasourceData?.datasource_id,
				dataset_name: datasourceData?.name,
				query_id: chatStoreReducer?.activeQueryId,
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
					query_id: chatStoreReducer?.activeQueryId,
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

	return (
		<>
			{displayLogic.showResponseContent && (
				<div className="mt-4 mx-12">
					{displayLogic.hasText && (
						<div className="max-w-[98%] mb-4 bg-purple-4 p-4 rounded-tl-md rounded-e-xl rounded-bl-xl">
							<p
								className="text-primary80 font-medium"
								style={{ whiteSpace: 'pre-wrap' }}
								dangerouslySetInnerHTML={{ __html: safeHTML }}
							></p>
						</div>
					)}

					{displayLogic.showGraph && (
						<div className="mb-4">
							<GraphComponent
								data={{
									graph: graphDataItem[1],
									table: dataFrameItem[1],
								}}
								isGraphLoading={isGraphLoading}
								setIsGraphLoading={setIsGraphLoading}
								showTable={showTable}
								queryId={answerResp?.query_id}
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
							{displayLogic.canDownloadCsv && (
								<Button
									variant="outline"
									className="text-muted-foreground cursor-pointer"
									onClick={() => {
										if (isDownloading) return;

										trackEvent(
											EVENTS_ENUM.DOWNLOAD_CSV_CLICKED,
											EVENTS_REGISTRY.DOWNLOAD_CSV_CLICKED,
											() => ({
												chat_session_id: query?.sessionId,
												dataset_id:
													datasourceData?.datasource_id,
												dataset_name: datasourceData?.name,
												query_id:
													chatStoreReducer?.activeQueryId,
											}),
										);

										downloadS3File(
											dataFrameItem[1]?.tool_data?.csv_url,
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
											<i className="bi-download mr-2"></i>
											Download CSV
										</>
									)}
								</Button>
							)}
							<div className="flex gap-2">
								{displayLogic.canAddToReport && (
									<Button
										variant="outline"
										className="text-muted-foreground cursor-pointer flex gap-1"
										onClick={handleAddQueryToReport}
									>
										<ChartNoAxesCombinedIcon className="w-5 h-5" />
										Add to Report
									</Button>
								)}
								{displayLogic.canAddToDashboard && (
									<Button
										variant="outline"
										className="text-muted-foreground flex gap-1 cursor-pointer"
										onClick={handleAddToDashboard}
									>
										<LayoutDashboard className="w-5 h-5" />
										Add to Dashboard
									</Button>
								)}
							</div>
						</div>
					)}
				</div>
			)}
			{displayLogic.showRelatedQuestions && (
				<div className="mx-12">
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
							/>
						))}
					</div>
				</div>
			)}
			<AddQueryFlow
				isOpen={isAddToReportOpen}
				onClose={() => setIsAddToReportOpen(false)}
			/>
		</>
	);
};

export default ResponseCard;
