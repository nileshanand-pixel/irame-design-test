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
}) => {
	const dispatch = useDispatch();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const [isAddToReportOpen, setIsAddToReportOpen] = useState(false);

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

	const showGraph = !!graphDataItem;
	const showTableOnly = !showGraph && !!dataFrameItem;

	// show followup questions only for last query
	const showFollowup =
		answerResp?.query_id ===
			chatStoreReducer?.queries?.[chatStoreReducer?.queries?.length - 1]?.id &&
		answerResp?.status === 'done';

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
		// TODO Add mixpanel event later
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
				query_id: answerResp.query_id,
				session_id: answerResp.session_id,
				child_query_number: answerResp.child_no,
			}),
		);
	};

	return (
		<>
			{(safeHTML || (mainItems && mainItems.length > 0)) && (
				<div className="mt-4 mx-12">
					{safeHTML && (
						<div className="mb-8 bg-purple-4 p-4 rounded-tl-md rounded-e-xl rounded-bl-xl">
							<p
								className="text-primary80 font-medium"
								style={{ whiteSpace: 'pre-wrap' }}
								dangerouslySetInnerHTML={{ __html: safeHTML }}
							></p>
						</div>
					)}

					{showGraph && (
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
								tab={
									answerResp?.status === 'done'
										? 'Graphical View'
										: 'Tabular View'
								}
							/>
						</div>
					)}

					{showTableOnly && (
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

					{/* Common CTA Container */}
					{(graphDataItem || dataFrameItem) && (
						<div className="mt-6 mb-14 flex justify-between">
							{dataFrameItem &&
								dataFrameItem[1]?.tool_data?.csv_url && (
									<Button
										variant="outline"
										className="text-muted-foreground cursor-pointer"
										onClick={() =>
											window.open(
												dataFrameItem[1]?.tool_data?.csv_url,
												'_blank',
											)
										}
									>
										<i className="bi-download mr-2"></i>
										Download CSV
									</Button>
								)}
							<div className="flex gap-2">
								<Button
									variant="outline"
									className="text-muted-foreground cursor-pointer flex gap-1"
									onClick={handleAddQueryToReport}
								>
									<ChartNoAxesCombinedIcon className="w-5 h-5" />
									Add to Report
								</Button>
								{showGraph && (
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
			{answerResp?.answer?.follow_up &&
				showFollowup &&
				!doingScience &&
				!isGraphLoading && (
					<div className="mx-12">
						<div className="mt-2 mb-2 font-semibold text-xl text-primary80 pb-4 border-b border-primary10 ">
							Related Questions
						</div>
						<div className=" flex flex-col gap-2 mx-auto">
							{answerResp?.answer?.follow_up?.tool_data?.questions &&
								Array.isArray(
									answerResp?.answer?.follow_up?.tool_data
										?.questions,
								) &&
								showFollowup &&
								answerResp?.answer?.follow_up?.tool_data?.questions?.map(
									(question, index) => (
										<FollowUpQuestions
											key={index}
											question={question}
											index={index}
											setAnswerResp={setAnswerResp}
											setDoingScience={setDoingScience}
											setResponseTimeElapsed={
												setResponseTimeElapsed
											}
											setBanners={setBanners}
											answerResp={answerResp}
										/>
									),
								)}
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
