import GraphComponent from '@/components/elements/GraphComponent';
import React from 'react';
import CoderComponent from './CoderComponent';
import { WorkspaceEnum, workSpaceMap } from './types/new-chat.enum';
import { Button } from '@/components/ui/button';
import FollowUpQuestions from './FollowUpQuestions';
import DOMPurify from 'dompurify';

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
}) => {
	// Extracting main items
	const mainItems = Object.entries(answerResp?.answer || {}).filter(
		([key, value]) => {
			return (
				value.tool_space === 'main' &&
				value.tool_type !== WorkspaceEnum.Answer
			);
		},
	);

	// Find the Answer item
	const answerItem = Object.entries(answerResp?.answer || {}).find(
		([key, value]) => {
			return (
				value.tool_space === 'main' &&
				value.tool_type === WorkspaceEnum.Answer
			);
		},
	);
	let safeHTML = '';
	if (answerItem && answerItem[1]?.tool_data) {
		safeHTML = DOMPurify.sanitize(answerItem[1]?.tool_data);
	}

	return (
		<>
			{answerItem ||
				(mainItems && mainItems.length > 0 && (
					<div className="mt-4 ml-12">
						{' '}
						{/* TODO: why was this needed? mb-[145px] */}
						{answerItem && (
							<div className="mb-8">
								<p
									className="text-primary80 font-medium"
									style={{ whiteSpace: 'pre-wrap' }}
									dangerouslySetInnerHTML={{ __html: safeHTML }}
								></p>
							</div>
						)}
						{/* Render other main items */}
						{Array.isArray(mainItems) &&
							mainItems.map(([key, value]) => (
								<div key={key} className="mb-4">
									{value.tool_type === WorkspaceEnum?.Graph && (
										<div className="my-4">
											<GraphComponent
												data={value.tool_data}
												isGraphLoading={isGraphLoading}
												setIsGraphLoading={setIsGraphLoading}
											/>
											<div className="my-4">
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
											</div>
										</div>
									)}
									{value.tool_type === WorkspaceEnum?.Coder && (
										<div className="my-4">
											<h3 className="text-primary100">
												{key}
											</h3>
											<CoderComponent
												data={value?.tool_data}
											/>
										</div>
									)}
								</div>
							))}
					</div>
				))}
			{answerResp?.answer?.follow_up && !doingScience && !isGraphLoading && (
				<>
					<div className="mt-2 border-t border-purple-10"></div>
					<div className="!mt-8 flex gap-4 overflow-x-auto">
						{answerResp?.answer?.follow_up?.tool_data?.questions &&
							Array.isArray(
								answerResp?.answer?.follow_up?.tool_data?.questions,
							) &&
							answerResp?.answer?.follow_up?.tool_data?.questions?.map(
								(question, index) => (
									<FollowUpQuestions
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

// (Object.keys(answerResp?.answer || {})?.includes(
// 	WorkspaceEnum.Answer,
// ) ||
// 	Object.keys(answerResp?.graph || {})?.includes(
// 		WorkspaceEnum.Graph,
// 	)) &&
