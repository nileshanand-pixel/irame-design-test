import React from 'react';
import { createQuery } from './service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import { getToken } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { updateUtilProp } from '@/redux/reducer/utilReducer';

const FollowUpQuestions = ({
	question,
	index,
	setDoingScience,
	setResponseTimeElapsed,
	setBanners,
	answerResp,
}) => {
	const { query, navigate } = useRouter();
	const dispatch = useDispatch();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const utilReducer = useSelector((state) => state.utilReducer);

	const handlePrompt = () => {
		try {
			const tempCurrentQueries = [
				...chatStoreReducer?.queries,
				{ id: '', question: question, parentQueryId: answerResp?.query_id },
			];
			if(utilReducer.isSideNavOpen)dispatch(
				updateChatStoreProp([{ key: 'queries', value: tempCurrentQueries }]),
			);
			dispatch(
				updateUtilProp([{ key: 'isSideNavOpen', value: false }]),
			);
			createQuery(
				{
					child_no: parseInt(answerResp.child_no) + 1,
					datasource_id: answerResp?.datasource_id,
					parent_query_id: answerResp?.query_id,
					query: question,
					session_id: answerResp?.session_id,
				},
				getToken(),
			).then((res) => {
				const updatedQueries = tempCurrentQueries?.map((item) => {
					if (item?.parentQueryId === answerResp?.query_id) {
						return { id: res.query_id, question };
					}
					return { ...item };
				});
				dispatch(
					updateChatStoreProp([
						{
							key: 'refreshChat',
							value: !chatStoreReducer?.refreshChat,
						},
						{ key: 'queries', value: updatedQueries },
						{ key: 'activeQueryId', value: res?.query_id },
					]),
				);
			});

			setResponseTimeElapsed(0);
			setBanners((prevState) => ({
				...prevState,
				showFailedResponse: false,
				showDelay: false,
			}));
		} catch (error) {
			console.log(error);
		}
	};
	return (
		<div
			className="relative bg-purple-4 rounded-xl min-w-[12.5rem] max-w-[12.5rem] h-[12rem] p-4 hover:bg-purple-8"
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
