import React from 'react';
import { createQuerySession } from './service/new-chat.service';
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
}) => {
	const { query } = useRouter();
	const dispatch = useDispatch();

	const handlePrompt = () => {
		try {
			setResponseTimeElapsed(0);
			setDoingScience(true);
			setAnswerResp({});
			setPromptQuery({ data: question });
			dispatch(updateUtilProp([{ key: 'isSideNavOpen', value: false }]));
			handleNextStep(4);
			createQuerySession(query.dataSourceId, question, getToken()).then(
				(res) => {
					navigate(
						`/app/new-chat/?step=4&dataSourceId=${query.dataSourceId}&sessionId=${res.session_id}&queryId=${res.query_id}`,
					);
				},
			);
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
				<ul className="divide-y-[24px] divide-transparent line-clamp-3">
					<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80">
						{question}
					</li>
				</ul>
			</div>
		</div>
	);
};

export default FollowUpQuestions;
