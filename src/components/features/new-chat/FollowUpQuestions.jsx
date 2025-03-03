import React from 'react';
import { createQuery } from './service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import { getToken } from '@/lib/utils';
import { useDispatch, useSelector } from 'react-redux';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { Button } from '@/components/ui/button';

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
			if (utilReducer.isSideNavOpen)
				dispatch(
					updateChatStoreProp([
						{ key: 'queries', value: tempCurrentQueries },
					]),
				);
			dispatch(updateUtilProp([{ key: 'isSideNavOpen', value: false }]));
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
		<div onClick={handlePrompt} className="relative text-primary80 bg-white  border-b py-4 border-gray-200 cursor-pointer  w-full ">
			<div className="flex items-center justify-between gap-4">
				<img
					src={`https://d2vkmtgu2mxkyq.cloudfront.net/followup_questions.svg`}
					className="size-12"
				/>
				<div className=" flex-1 text-base font-medium  pr-4">
					{question}
				</div>

				<Button
					onClick={(e) => {
						e.stopPropagation();
						handlePrompt();
					}}
					variant="outline"
					className="flex-shrink-0 p-2 outline-none border-none hover:bg-gray-100 rounded-full transition-colors"
					aria-label="Send question"
				>
					<span class="material-symbols-outlined">send</span>
				</Button>
			</div>
		</div>
	);
};

export default FollowUpQuestions;
