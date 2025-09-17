/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import { createQuerySession, fetchSuggestions } from './service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import { Skeleton } from '@/components/ui/skeleton';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { queryClient } from '@/lib/react-query';
import ScrollList from '@/components/elements/ScrollList';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { useDatasourceId } from '@/hooks/use-datasource-id';

const SelectPrompt = ({ setPrompt, dataSources }) => {
	const [activeTab, setActiveTab] = useState('');
	const [data, setData] = useState([]);
	const { query, navigate } = useRouter();

	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const datasourceId = useDatasourceId();

	const datasourceName = useMemo(() => {
		return dataSources?.filter(
			(dataSource) => dataSource.datasource_id === datasourceId,
		)?.[0]?.name;
	}, [datasourceId, dataSources]);

	const handleActiveTab = (selectedTab) => {
		trackEvent(
			EVENTS_ENUM.L1_CATEGORY_CLICKED,
			EVENTS_REGISTRY.L1_CATEGORY_CLICKED,
			() => ({
				dataset_id: datasourceId,
				dataset_name: datasourceName,
				category_name: selectedTab,
			}),
		);
		setActiveTab(selectedTab);
	};

	const handlePrompt = (question, index, questions) => {
		try {
			trackEvent(
				EVENTS_ENUM.L2_CATEGORY_CLICKED,
				EVENTS_REGISTRY.L2_CATEGORY_CLICKED,
				() => ({
					dataset_id: datasourceId,
					dataset_name: datasourceName,
					l1_category_name: activeTab,
					clicked_on: index + 1,
					total_suggestions: questions.length,
				}),
			);

			dispatch(
				updateChatStoreProp([
					{ key: 'queries', value: [{ id: '', query: question }] },
					{ key: 'refreshChat', value: !chatStoreReducer?.refreshChat },
				]),
			);
			if (utilReducer.isSideNavOpen)
				dispatch(updateUtilProp([{ key: 'isSideNavOpen', value: false }]));
			const payload = {
				datasource_id: datasourceId,
				query: question,
				type: 'single',
			};
			createQuerySession(payload).then((res) => {
				navigate(
					`/app/new-chat/session?sessionId=${res?.session_id}&source=pre_chat_screen&datasource_id=${datasourceId}`,
				);
				(dispatch(
					updateChatStoreProp([
						{
							key: 'initialQuery',
							value: { id: res?.query_id || '', question },
						},
						{
							key: 'queries',
							value: [
								{
									id: res?.query_id || '',
									question: res?.query || question,
								},
							],
						},
						{
							key: 'activeChatSession',
							value: {
								id: res?.session_id,
								title: res?.query || '',
							},
						},
						{ key: 'activeQueryId', value: res?.query_id },
					]),
				),
					queryClient.invalidateQueries(['chat-history'], {
						refetchActive: true,
						refetchInactive: true,
					}));
				trackEvent(
					EVENTS_ENUM.CHAT_SESSION_STARTED,
					EVENTS_REGISTRY.CHAT_SESSION_STARTED,
					() => ({
						dataset_id: datasourceId,
						dataset_name: datasourceName,
						start_method: 'suggestion_click',
						chat_session_id: res?.session_id,
						chat_session_type: 'new',
					}),
				);
				trackEvent(
					EVENTS_ENUM.CHAT_MESSAGE_SENT,
					EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
					() => ({
						chat_session_id: res?.session_id,
						query_id: res?.query_id,
						dataset_id: datasourceId,
						dataset_name: datasourceName,
						message_type: 'user',
						message_source: 'suggestion_click',
						message_text: question,
						is_clarification: false,
						message_number: 1,
						first_message_in_chat: true,
					}),
				);
			});
		} catch (error) {
			console.log(error);
		}
	};

	useEffect(() => {
		let intervalId;

		const fetchData = async () => {
			try {
				if (
					utilReducer?.suggestionData &&
					utilReducer?.suggestionData?.suggestion?.length > 0 &&
					datasourceId === utilReducer.suggestionData.dataSourceId
				) {
					setData(utilReducer.suggestionData);
					if (activeTab === '') {
						setActiveTab(utilReducer.suggestionData?.suggestion[0].type);
					}
				} else {
					const resp = await fetchSuggestions(datasourceId);
					setData(resp);
					setActiveTab(resp?.suggestion[0]?.type);
					dispatch(
						updateUtilProp([{ key: 'suggestionData', value: resp }]),
					);
					if (resp.status === 200 || resp.suggestion.length) {
						trackEvent(
							EVENTS_ENUM.CHAT_SUGGESTIONS_LOADED,
							EVENTS_REGISTRY.CHAT_SUGGESTIONS_LOADED,
							() => ({
								dataset_id: datasourceId,
								dataset_name: datasourceName,
								categories: resp?.suggestion?.map(
									(suggestion) => suggestion.type,
								),
							}),
						);
						clearInterval(intervalId); // Stop polling
					}
				}
			} catch (error) {
				console.error('Error fetching suggestions:', error);
			}
		};

		fetchData();

		if (datasourceId) {
			intervalId = setInterval(fetchData, 5000);
		}

		return () => {
			clearInterval(intervalId);
		};
	}, [datasourceId, dataSources]);

	return (
		<div className="mt-4">
			<div className="w-full flex gap-4">
				{data?.suggestion?.length > 0 ? (
					<ScrollList>
						{data?.suggestion?.map((suggestion) => (
							<li
								key={suggestion?.suggestion_id}
								className={`${
									suggestion?.type === activeTab
										? ' text-purple-100 border-purple-40 tabActiveBg'
										: 'text-black/60 border-black/10'
								}  text-sm font-medium border rounded-3xl px-3 py-2 cursor-pointer min-w-fit max-w-[19.25rem] `}
								onClick={() => handleActiveTab(suggestion?.type)}
							>
								<div className="min-w-fit">{suggestion?.type}</div>
							</li>
						))}
					</ScrollList>
				) : (
					<div className="flex space-x-2">
						{[...Array(4)].map((_, index) => (
							<Skeleton
								key={index}
								className="h-8 w-[9.375rem] bg-purple-4 rounded-2xl"
							/>
						))}
					</div>
				)}
			</div>
			{activeTab ? (
				<ScrollList>
					<div className="w-full overflow-x-scroll horizontal-scrollbar pb-1 flex gap-4 mt-4">
						{data?.suggestion?.length > 0
							? data.suggestion
									.find(
										(suggestion) =>
											suggestion.type === activeTab,
									)
									.questions.map((question, index, questions) => (
										<div
											className="relative bg-purple-4 rounded-xl min-w-[15rem] max-w-[19.25rem] min-h-[8rem] max-h-[21.75rem] p-4 hover:bg-purple-8 mb-3"
											key={`${index}_question`}
										>
											<div
												className="overflow-y-auto text-sm font-medium text-primary80"
												onClick={() =>
													handlePrompt(
														question,
														index,
														questions,
													)
												}
											>
												<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80 !line-clamp-5 ">
													{question}
												</li>
											</div>
											<div
												className="absolute bottom-4 right-4 text-right mt-6 cursor-pointer"
												onClick={(e) => {
													e.stopPropagation();
													setPrompt(question);
												}}
											>
												<img
													src="https://d2vkmtgu2mxkyq.cloudfront.net/draw.svg"
													alt="edit-prompt"
													className="bg-white py-1 px-1 rounded-full size-7"
												/>
											</div>
										</div>
									))
							: [...Array(5)].map((_, index) => (
									<div className="flex space-x-2" key={index}>
										<Skeleton className="h-[125px] w-[250px] rounded-xl bg-purple-4" />
									</div>
								))}
					</div>
				</ScrollList>
			) : (
				<div className="flex space-x-2 mt-4">
					{[...Array(4)].map((_, index) => (
						<Skeleton
							className="h-[7.8rem] w-[15.6rem] rounded-xl bg-purple-4"
							key={index}
						/>
					))}
				</div>
			)}
		</div>
	);
};

export default SelectPrompt;
