/* eslint-disable react/prop-types */
import { useEffect, useState } from 'react';
import {
	createQuerySession,
	fetchSuggestions,
} from './service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import { tokenCookie, getToken } from '@/lib/utils';
import { Skeleton } from '@/components/ui/skeleton';
import useLocalStorage from '@/hooks/useLocalStorage';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { queryClient } from '@/lib/react-query';
import ScrollList from '@/components/elements/ScrollList';

const SelectPrompt = ({
	setPrompt,
}) => {
	const [activeTab, setActiveTab] = useState('');
	const [data, setData] = useState([]);
	const { query, navigate } = useRouter();

	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const handleActiveTab = (selectedTab) => {
		setActiveTab(selectedTab);
	};

	const handlePrompt = (question) => {
		try {
			navigate(`/app/new-chat/session`);
			dispatch(
				updateChatStoreProp([
					{ key: 'queries', value: [{ id: '', query: question }] },
					{ key: 'refreshChat', value: !chatStoreReducer?.refreshChat },
				]),
			);
			if(utilReducer.isSideNavOpen)dispatch(updateUtilProp([{key: 'isSideNavOpen', value: false}]))
			const payload = {
				datasource_id: query.dataSourceId,
				query: question,
				type: 'single',
			}
			createQuerySession(payload, getToken()).then(
				(res) => {
					dispatch(
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
						});
				},
			);
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
					query.dataSourceId === utilReducer.suggestionData.dataSourceId
				) {
					setData(utilReducer.suggestionData);
					if (activeTab === '') {
						setActiveTab(utilReducer.suggestionData?.suggestion[0].type);
					}
				} else {
					const resp = await fetchSuggestions(
						query.dataSourceId,
						getToken(),
					);
					setData(resp);
					setActiveTab(resp?.suggestion[0]?.type);
					dispatch(
						updateUtilProp([{ key: 'suggestionData', value: resp }]),
					);
					if (resp.status === 200 || resp.suggestion.length) {
						clearInterval(intervalId); // Stop polling
					}
				}
			} catch (error) {
				console.error('Error fetching suggestions:', error);
			}
		};

		fetchData();

		if (query.dataSourceId) {
			intervalId = setInterval(fetchData, 5000);
		}

		return () => {
			clearInterval(intervalId);
		};
	}, [query.dataSourceId]);

	return (
		<div className="">
			<div className="mt-8">
				<div className="w-full overflow-x-auto flex gap-4">
						{data?.suggestion?.length > 0 ? (
							<ScrollList>
								{data?.suggestion?.map((suggestion, index) => (
								<li
									key={suggestion?.suggestion_id}
									className={`${
										suggestion?.type === activeTab
											? ' text-purple-100 border-purple-40 tabActiveBg'
											: 'text-black/60 border-black/10'
									} text-sm font-medium border rounded-3xl px-3 py-2 cursor-pointer min-w-fit max-w-[19.25rem]`}
									onClick={() => handleActiveTab(suggestion?.type)}
								>
									<div className="min-w-fit">
										{suggestion?.type}
									</div>
								</li>
							))}
							</ScrollList>
						) : (
							<div className="flex space-x-2">
								{[...Array(4)].map((_, index) => (
									<Skeleton
										key={index}
										className="h-8 w-[150px] bg-purple-4 rounded-2xl"
									/>
								))}
							</div>
						)}
				</div>
				{activeTab ? (
					<div className="w-full overflow-x-auto flex gap-4 mt-8">
						{data?.suggestion?.length > 0
							? data.suggestion
									.find(
										(suggestion) =>
											suggestion.type === activeTab,
									)
									.questions.map((question, index) => (
										<div
											className="relative bg-purple-4 rounded-xl min-w-[15rem] max-w-[19.25rem] min-h-[12.5rem] max-h-[21.75rem] p-4 hover:bg-purple-8 mb-3"
											key={`${index}_question`}
										>
											<div
												className="overflow-y-auto text-base font-medium text-primary80"
												onClick={() =>
													handlePrompt(question)
												}
											>
												<ul className="divide-y-[24px] divide-transparent ">
													<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80 !line-clamp-5 ">
														{question}
													</li>
												</ul>
											</div>
											<div
												className="absolute bottom-4 right-4 text-right mt-6 cursor-pointer"
												onClick={() => {
													setPrompt(question);
												}}
											>
												<img
													src="https://d2vkmtgu2mxkyq.cloudfront.net/draw.svg"
													alt="edit-prompt"
													className="bg-white py-1 px-1 rounded-full"
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
				) : (
					<div className="flex space-x-2 mt-4">
						{[...Array(4)].map((_, index) => (
							<Skeleton
								className="h-[125px] w-[250px] rounded-xl bg-purple-4"
								key={index}
							/>
						))}
					</div>
				)}
			</div>
		</div>
	);
};

export default SelectPrompt;

// 							<div className={` ${runWorkFlowMutation.isPending ? 'overflow-y-hidden': 'overflow-y-auto'} h-full bg-white relative p-4 flex flex-col min-h-full`}>
