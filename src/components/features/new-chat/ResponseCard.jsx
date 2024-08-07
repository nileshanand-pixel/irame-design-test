import GraphComponent from '@/components/elements/GraphComponent';
import React, { useEffect, useMemo } from 'react';
import CoderComponent from './CoderComponent';
import { WorkspaceEnum } from './types/new-chat.enum';
import { Button } from '@/components/ui/button';
import FollowUpQuestions from './FollowUpQuestions';
import DOMPurify from 'dompurify';
import TableResponse from '@/components/elements/TableResponse';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { useDispatch, useSelector } from 'react-redux';

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
	const mainItems = Object.entries(answerResp?.answer || {}).filter(
		([key, value]) =>
			value?.tool_space === 'main' && value?.tool_type !== WorkspaceEnum.Answer,
	);

	const answerItem = Object.entries(answerResp?.answer || {}).find(
		([key, value]) =>
			value?.tool_space === 'main' && value?.tool_type === WorkspaceEnum.Answer,
	);

	let safeHTML = '';
	if (answerItem && answerItem[1]?.tool_data?.text) {
		safeHTML = DOMPurify.sanitize(answerItem[1]?.tool_data?.text);
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

	return (
		<>
			{(answerItem || (mainItems && mainItems.length > 0)) && (
				<div className="mt-4 mx-12">
					{answerItem && (
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
							<div className="mb-4">
								<GraphComponent
									data={{graph: graphDataItem[1], table: dataFrameItem[1]}}
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
							<div className="mt-6 mb-14 flex justify-between">
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
								<Button
									className="rounded-lg hover:bg-purple-100 hover:text-white hover:opacity-80"
									onClick={() => {
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
									}}
								>
									+ Add to Dashboard
								</Button>
							</div>
						</div>
					)}
					{showTableOnly && (
						<div className="mb-4">
							<TableResponse
								data={dataFrameItem[1].tool_data}
								isGraphLoading={isTableLoading}
								setIsGraphLoading={setIsTableLoading}
								showTable={showTable}
							/>
							<div className="mt-6 mb-14 flex justify-between">
								<Button
									variant="outline"
									className="text-muted-foreground cursor-pointer"
									onClick={() =>
										window.open(
											dataFrameItem[1]?.tool_data
												?.response_csv_curl,
											'_blank',
										)
									}
								>
									<i className="bi-download mr-2"></i>
									Download CSV
								</Button>
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
						<div className="mt-2 border-t border-purple-10"></div>
						<div className="!mt-8 flex gap-4 overflow-x-auto">
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
		</>
	);
};

export default ResponseCard;
