import React from 'react';
import { createQuery } from './service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import { getToken } from '@/lib/utils';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { useDispatch } from 'react-redux';

const FollowUpQuestions = ({
	question,
	index,
	setAnswerResp,
	setPromptQuery,
	handleNextStep,
	setDoingScience,
	setResponseTimeElapsed,
	setShowResponseDelayBanner,
	setShowFailedResponseBanner,
	answerResp,
}) => {
	const { query, navigate } = useRouter();
	const dispatch = useDispatch();

	const handlePrompt = () => {
		try {
			setResponseTimeElapsed(0);
			setDoingScience(true);
			setAnswerResp({});
			setPromptQuery({ data: question });
			dispatch(
				updateUtilProp([
					{ key: 'isSideNavOpen', value: false },
					{ key: 'queryPrompt', value: question },
				]),
			);
			handleNextStep(4);
			createQuery(
				{
					child_no: parseInt(answerResp.child_no) + 1,
					datasource_id: query.dataSourceId,
					parent_query_id: query.queryId,
					query: question,
					session_id: query.sessionId,
				},
				getToken(),
			).then((res) => {
				navigate(
					`/app/new-chat/?step=4&dataSourceId=${query.dataSourceId}&sessionId=${query.sessionId}&queryId=${res.query_id}`,
				);
			});

			setResponseTimeElapsed(0);
			setShowFailedResponseBanner(false);
			setShowResponseDelayBanner(false);
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<div
			className="relative bg-purple-4 rounded-xl min-w-[12.5rem] max-w-[12.5rem] h-[12rem] p-4 hover:bg-purple-8 mb-3"
			key={`${index}_question`}
		>
			<div
				className="overflow-y-auto text-base font-medium text-primary80"
				onClick={() => handlePrompt()}
			>
				<p className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80 !line-clamp-6">
					{question}
				</p>
			</div>
		</div>
	);
};

export default FollowUpQuestions;
