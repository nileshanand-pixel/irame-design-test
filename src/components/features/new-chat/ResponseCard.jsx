import GraphComponent from '@/components/elements/GraphComponent';
import React from 'react';
import CoderComponent from './CoderComponent';
import { WorkspaceEnum, workSpaceMap } from './types/new-chat.enum';
import { Button } from '@/components/ui/button';
import FollowUpQuestions from './FollowUpQuestions';

const ResponseCard = ({
	answerResp,
	isGraphLoading,
	setIsGraphLoading,
	setShowFailedResponseBanner,
	handleNextStep,
	setAnswerResp,
	setPromptQuery,
	setDoingScience,
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

	console.log(answerResp);
	return (
		<div className="mt-4 mb-[145px] ml-12">
			{/* Render 'Answer' component first if available */}
			{answerItem && (
				<div className="mb-8">
					{/* <h3 className="text-primary100 font-medium">
						{workSpaceMap[answerItem[0]].charAt(0).toUpperCase() +
							workSpaceMap[answerItem[0]].slice(1)}
					</h3> */}
					<p
						className="text-primary80 font-medium"
						style={{ whiteSpace: 'pre-wrap' }}
					>
						{answerItem[1]?.tool_data}
					</p>
				</div>
			)}
			{/* Render other main items */}
			{mainItems.map(([key, value]) => (
				<div key={key} className="mb-4">
					{(value.tool_type === WorkspaceEnum.Observation ||
						value.tool_type === WorkspaceEnum.Planner) && (
						<div className="my-4">
							<h3 className="text-primary100 font-medium">
								{key.charAt(0).toUpperCase() + key.slice(1)}
							</h3>
							<p
								className="text-primary80 "
								style={{ whiteSpace: 'pre-wrap' }}
							>
								{value?.tool_data}
							</p>
						</div>
					)}
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
											value?.tool_data?.response_csv_curl,
											'_blank',
										)
									}
								>
									<i className="bi-download mr-2"></i>Download CSV
								</Button>
							</div>
						</div>
					)}
					{value.tool_type === WorkspaceEnum?.Coder && (
						<div className="my-4">
							<h3 className="text-primary100">{key}</h3>
							<CoderComponent data={value?.tool_data} />
						</div>
					)}
				</div>
			))}

			<div className="mt-14 border-t border-purple-10"></div>
			<div className="mt-8 flex flex-wrap gap-4">
				{answerResp?.answer?.follow_up &&
					answerResp?.answer?.follow_up?.tool_data?.questions &&
					answerResp?.answer?.follow_up?.tool_data?.questions?.length >
						0 &&
					answerResp?.answer?.follow_up?.tool_data?.questions?.map(
						(question, index) => (
							<FollowUpQuestions
								question={question}
								index={index}
								handleNextStep={handleNextStep}
								setAnswerResp={setAnswerResp}
								setPromptQuery={setPromptQuery}
								setDoingScience={setDoingScience}
							/>
						),
					)}
			</div>
		</div>
	);
};

export default ResponseCard;
