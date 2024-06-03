import GraphComponent from '@/components/elements/GraphComponent';
import React, { useMemo } from 'react';
import CoderComponent from './CoderComponent';
import { WorkspaceEnum } from './types/new-chat.enum';
import { Button } from '@/components/ui/button';
import FollowUpQuestions from './FollowUpQuestions';
import DOMPurify from 'dompurify';
import TableResponse from '@/components/elements/TableResponse';

const ResponseCard = ({
	answerResp,
	isGraphLoading,
	setIsGraphLoading,
	setShowFailedResponseBanner,
	handleNextStep,
	setAnswerResp,
	setPromptQuery,
	doingScience,
	setDoingScience,
	setResponseTimeElapsed,
	setShowResponseDelayBanner,
	promptQuery,
	setShowAddToDashboard,
	showTable,
}) => {
	const mainItems = Object.entries(answerResp?.answer || {}).filter(
		([key, value]) =>
			value.tool_space === 'main' && value.tool_type !== WorkspaceEnum.Answer,
	);

	const answerItem = Object.entries(answerResp?.answer || {}).find(
		([key, value]) =>
			value.tool_space === 'main' && value.tool_type === WorkspaceEnum.Answer,
	);

	let safeHTML = '';
	if (answerItem && answerItem[1]?.tool_data) {
		safeHTML = DOMPurify.sanitize(answerItem[1]?.tool_data);
	}

	const isGraphDataPresent = useMemo(() => {
		if (mainItems?.length > 0) {
			mainItems.map(([key, value]) => {
				return value.tool_type === WorkspaceEnum.Graph;
			});
		}
	}, [mainItems]);

	return (
		<>
			{(answerItem || (mainItems && mainItems.length > 0)) && (
				<div className="mt-4 ml-12">
					{answerItem && (
						<div className="mb-8 bg-purple-8 p-4 rounded-tl-md rounded-e-xl rounded-bl-xl">
							<p
								className="text-primary80 font-medium"
								style={{ whiteSpace: 'pre-wrap' }}
								dangerouslySetInnerHTML={{ __html: safeHTML }}
							></p>
						</div>
					)}
					{Array.isArray(mainItems) &&
						mainItems.map(([key, value]) => (
							<div key={key} className="mb-4">
								{value.tool_type === WorkspaceEnum.Graph && (
									<div className="my-4">
										<GraphComponent
											data={value.tool_data}
											isGraphLoading={isGraphLoading}
											setIsGraphLoading={setIsGraphLoading}
											showTable={showTable}
										/>
										<div className="mt-6 mb-14 flex justify-between">
											<Button
												variant="outline"
												className="text-muted-foreground cursor-pointer"
												onClick={() =>
													window.open(
														value?.tool_data
															?.response_csv_curl,
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
													setShowAddToDashboard(true);
												}}
											>
												+ Add to Dashboard
											</Button>
										</div>
									</div>
								)}
								{value.tool_type === WorkspaceEnum.DataFrame && (
									<div className="my-4">
										<TableResponse
											data={value.tool_data}
											isGraphLoading={isGraphLoading}
											setIsGraphLoading={setIsGraphLoading}
											// showTable={showTable}
										/>
										{!isGraphDataPresent ? (
											<div className="mt-6 mb-14 flex justify-between">
												<Button
													variant="outline"
													className="text-muted-foreground cursor-pointer"
													onClick={() =>
														window.open(
															value?.tool_data
																?.response_csv_curl,
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
														setShowAddToDashboard(true);
													}}
												>
													+ Add to Dashboard
												</Button>
											</div>
										) : null}
									</div>
								)}
								{value.tool_type === WorkspaceEnum.Coder && (
									<div className="my-4">
										<h3 className="text-primary100">{key}</h3>
										<CoderComponent data={value?.tool_data} />
									</div>
								)}
							</div>
						))}
				</div>
			)}
			{answerResp?.answer?.follow_up && !doingScience && !isGraphLoading && (
				<>
					<div className="mt-2 ml-12 border-t border-purple-10"></div>
					<div className="!mt-8 ml-12 flex gap-4 overflow-x-auto">
						{answerResp?.answer?.follow_up?.tool_data?.questions &&
							Array.isArray(
								answerResp?.answer?.follow_up?.tool_data?.questions,
							) &&
							answerResp?.answer?.follow_up?.tool_data?.questions?.map(
								(question, index) => (
									<FollowUpQuestions
										key={index}
										question={question}
										index={index}
										handleNextStep={handleNextStep}
										setAnswerResp={setAnswerResp}
										setPromptQuery={setPromptQuery}
										setDoingScience={setDoingScience}
										setResponseTimeElapsed={
											setResponseTimeElapsed
										}
										setShowResponseDelayBanner={
											setShowResponseDelayBanner
										}
										setShowFailedResponseBanner={
											setShowFailedResponseBanner
										}
										answerResp={answerResp}
									/>
								),
							)}
					</div>
				</>
			)}
		</>
	);
};

export default ResponseCard;
