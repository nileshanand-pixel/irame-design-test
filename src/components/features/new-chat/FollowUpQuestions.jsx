import React from 'react';
import { createQuery } from './service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { Button } from '@/components/ui/button';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { queryClient } from '@/lib/react-query';
import { sendChatSessionStartedEvent } from '@/utils/chat';
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';

const FollowUpQuestions = ({
	question,
	index,
	setDoingScience,
	setResponseTimeElapsed,
	setBanners,
	answerResp,
	currentSessionData,
}) => {
	const { query, navigate } = useRouter();
	const dispatch = useDispatch();
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const utilReducer = useSelector((state) => state.utilReducer);

	const { data: datasourceData } = useDatasourceDetailsV2();
	const planMode = currentSessionData?.metadata?.plan_mode;

	const handlePrompt = () => {
		try {
			trackEvent(
				EVENTS_ENUM.CLICKED_FOLLOW_UP_SUGGESTION,
				EVENTS_REGISTRY.CLICKED_FOLLOW_UP_SUGGESTION,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: answerResp?.query_id,
					question: question,
					clicked_on: index + 1,
				}),
			);

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
			createQuery({
				child_no: parseInt(answerResp.child_no) + 1,
				datasource_id: answerResp?.datasource_id,
				parent_query_id: answerResp?.query_id,
				query: question,
				session_id: answerResp?.session_id,
				metadata: {
					plan_mode: planMode,
				},
			}).then((res) => {
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
					]),
				);
				queryClient.invalidateQueries({ queryKey: ['chat-history'] });

				trackEvent(
					EVENTS_ENUM.CHAT_MESSAGE_SENT,
					EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
					() => ({
						chat_session_id: query?.sessionId,
						dataset_id: datasourceData?.datasource_id,
						dataset_name: datasourceData?.name,
						query_id: res?.query_id,
						message_type: 'user',
						message_source: 'follow_up',
						message_text: question,
						is_clarification: false,
						message_number: chatStoreReducer?.queries?.length * 2 + 1,
						first_message_in_chat: false,
					}),
				);

				sendChatSessionStartedEvent({
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					start_method: 'follow_up',
					chat_session_id: query?.session_id,
					chat_session_type: 'old',
				});
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
			onClick={handlePrompt}
			className="relative text-primary80 bg-white  border-b py-3 border-gray-200 cursor-pointer  w-full "
		>
			<div className="flex items-center justify-between gap-4">
				<img
					src={`https://d2vkmtgu2mxkyq.cloudfront.net/followup_questions.svg`}
					className="size-10"
				/>
				<div className=" flex-1 text-sm font-medium pr-4">{question}</div>

				<Button
					onClick={(e) => {
						e.stopPropagation();
						handlePrompt();
					}}
					variant="outline"
					className="flex-shrink-0 -mt-2 p-2 outline-none border-none hover:bg-gray-100 rounded-full transition-colors"
					aria-label="Send question"
				>
					<span class="material-symbols-outlined text-xl">send</span>
				</Button>
			</div>
		</div>
	);
};

export default FollowUpQuestions;
