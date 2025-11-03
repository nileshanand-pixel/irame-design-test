/* eslint-disable react/prop-types */
import { useEffect, useMemo, useState } from 'react';
import {
	createQuerySession,
	fetchSuggestions,
	getTemplates,
	deleteTemplate,
} from './service/new-chat.service';
import { useRouter } from '@/hooks/useRouter';
import { Skeleton } from '@/components/ui/skeleton';
import { useDispatch, useSelector } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { queryClient } from '@/lib/react-query';
import ScrollList from '@/components/elements/ScrollList';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { logError } from '@/lib/logger';
import { useDatasourceId } from '@/hooks/use-datasource-id';
import { EllipsisVertical, Pencil, Trash2 } from 'lucide-react';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import { toast } from '@/lib/toast';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuSeparator,
	DropdownMenuTrigger,
} from '@radix-ui/react-dropdown-menu';

const SelectPrompt = ({ setPrompt, dataSources }) => {
	const [activeTab, setActiveTab] = useState('');
	const [data, setData] = useState([]);
	const [savedQueries, setSavedQueries] = useState([]);
	const [deletingTemplates, setDeletingTemplates] = useState(new Set());
	const { query, navigate } = useRouter();

	const dispatch = useDispatch();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const datasourceId = useDatasourceId();

	const [ConfirmationDialog, confirm] = useConfirmDialog();

	const datasourceName = useMemo(() => {
		return dataSources?.filter(
			(dataSource) => dataSource.datasource_id === datasourceId,
		)?.[0]?.name;
	}, [datasourceId, dataSources]);

	// Determine whether suggestions are currently loaded or still loading
	const suggestionsAvailable = !!(data?.suggestion && data?.suggestion.length > 0);
	const suggestionsLoading = !suggestionsAvailable;

	// Determine whether saved queries are currently loaded or still loading
	const savedQueriesAvailable = savedQueries.length > 0;
	const savedQueriesLoading = !savedQueriesAvailable;

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
		// For Saved Queries tab, toggle selection
		if (selectedTab === 'Saved Queries' && activeTab === 'Saved Queries') {
			setActiveTab('');
		} else {
			setActiveTab(selectedTab);
		}
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

	const handleDeleteQuery = async (queryId, index) => {
		try {
			const confirmed = await confirm({
				header: 'Delete Saved Query?',
				description:
					'This will permanently delete this saved query. This action cannot be undone.',
			});

			if (confirmed) {
				// Prevent duplicate clicks
				setDeletingTemplates((prev) => new Set(prev).add(queryId));
				await deleteTemplate(queryId);
				// Refresh saved queries from API
				try {
					const resp = await getTemplates();
					const formattedQueries =
						resp?.saved_queries?.map((item) => ({
							id: item.external_id,
							question: item?.data?.queries?.[0]?.text || '',
						})) || [];
					setSavedQueries(formattedQueries);
				} catch (err) {
					logError(err, {
						feature: 'chat',
						action: 'refresh-saved-queries',
					});
				}
				toast.success('Saved query deleted successfully');
			}
		} catch (error) {
			logError(error, { feature: 'chat', action: 'delete-saved-query' });
		} finally {
			// Clear deleting state regardless of outcome
			setDeletingTemplates((prev) => {
				const next = new Set(prev);
				next.delete(queryId);
				return next;
			});
		}
	};

	useEffect(() => {
		const fetchSavedQueries = async () => {
			try {
				const resp = await getTemplates();
				const formattedQueries =
					resp?.saved_queries?.map((item) => ({
						id: item.external_id,
						question: item?.data?.queries?.[0]?.text || '',
					})) || [];

				setSavedQueries(formattedQueries);
				console.log('Fetched saved queries:', formattedQueries);
			} catch (error) {
				console.error('Failed to fetch saved queries:', error);
			}
		};
		fetchSavedQueries();
	}, []);

	useEffect(() => {
		let intervalId;

		const fetchData = async () => {
			try {
				const resp = await fetchSuggestions(datasourceId);
				setData(resp);
				setActiveTab(
					resp?.suggestion?.length > 0
						? resp.suggestion[0].type
						: 'Saved Queries',
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
			} catch (error) {
				logError(error, {
					feature: 'chat',
					action: 'fetchSuggestions',
					extra: {
						dataSourceId: query?.dataSourceId,
						errorMessage: error.message,
					},
				});
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
		<>
			<div className="mt-4">
				<div className="w-full flex gap-4">
					{savedQueries.length > 0 || data?.suggestion?.length > 0 ? (
						<ScrollList>
							{savedQueriesLoading && (
								<li
									key="saved_queries_loading"
									className={`text-black/60 text-sm font-medium rounded-3xl px-0 py-0 min-w-fit max-w-[19.25rem]`}
									title="Loading saved queries..."
									aria-busy={true}
								>
									<div className="min-w-fit flex items-center">
										{/* full-size rounded skeleton to match tab shape */}
										<Skeleton className="h-8 w-[9.375rem] bg-purple-4 rounded-3xl" />
									</div>
								</li>
							)}
							{savedQueries.length > 0 && (
								<li
									key="saved_queries"
									className={`${
										activeTab === 'Saved Queries'
											? 'text-purple-100 border-purple-40 bg-purple-4'
											: 'text-black/60 border-black/10'
									} text-sm font-medium border rounded-3xl px-3 py-2 cursor-pointer min-w-fit max-w-[19.25rem]`}
									onClick={() => handleActiveTab('Saved Queries')}
								>
									<div className="min-w-fit">Saved Queries</div>
								</li>
							)}
							{/* Show a skeleton-shaped tab for suggestions while they are loading */}
							{suggestionsLoading && (
								<li
									key="suggestions_loading"
									className={`text-black/60 text-sm font-medium rounded-3xl px-0 py-0 min-w-fit max-w-[19.25rem]`}
									title="Loading suggestions..."
									aria-busy={true}
								>
									<div className="min-w-fit flex items-center">
										{/* full-size rounded skeleton to match tab shape */}
										<Skeleton className="h-8 w-[9.375rem] bg-purple-4 rounded-3xl" />
									</div>
								</li>
							)}
							{data?.suggestion?.map((suggestion) => (
								<li
									key={suggestion?.suggestion_id}
									className={`${
										suggestion?.type === activeTab
											? ' text-purple-100 border-purple-40 bg-purple-4'
											: 'text-black/60 border-black/10'
									}  text-sm font-medium border rounded-3xl px-3 py-2 cursor-pointer min-w-fit max-w-[19.25rem] `}
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
									className="h-8 w-[9.375rem] bg-purple-4 rounded-2xl"
								/>
							))}
						</div>
					)}
				</div>
				{activeTab ? (
					activeTab === 'Saved Queries' ? (
						<ScrollList>
							<div className="w-full overflow-x-scroll horizontal-scrollbar pb-1 flex gap-4 mt-4">
								{savedQueries?.length > 0 ? (
									savedQueries.map((query, index) => (
										<div
											key={query.id || index}
											className="relative bg-purple-4 rounded-xl min-w-[15rem] max-w-[19.25rem] min-h-[10.5rem] p-4 hover:bg-purple-8 mb-3 flex flex-col justify-between"
										>
											<div
												className="overflow-y-auto text-sm font-medium text-primary80 mb-2"
												onClick={() =>
													handlePrompt(
														query.question,
														index,
														savedQueries,
													)
												}
											>
												<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80 !line-clamp-5">
													{query.question}
												</li>
											</div>
											<div className="flex gap-2 justify-end w-full">
												<div
													className={`cursor-pointer p-1 rounded-full${deletingTemplates.has(query.id) ? ' opacity-60 pointer-events-none' : ' bg-white hover:bg-gray-100'}`}
													aria-label="Delete saved query"
													aria-busy={deletingTemplates.has(
														query.id,
													)}
													onClick={(e) => {
														e.stopPropagation();
														if (
															!deletingTemplates.has(
																query.id,
															)
														) {
															handleDeleteQuery(
																query.id,
																index,
															);
														}
													}}
													tabIndex={0}
													role="button"
												>
													{deletingTemplates.has(
														query.id,
													) ? (
														<div className="w-4 h-4">
															<svg
																className="animate-spin w-4 h-4 text-gray-400"
																fill="none"
																viewBox="0 0 24 24"
															>
																<circle
																	className="opacity-25"
																	cx="12"
																	cy="12"
																	r="10"
																	stroke="currentColor"
																	strokeWidth="4"
																></circle>
																<path
																	className="opacity-75"
																	fill="currentColor"
																	d="m4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
																></path>
															</svg>
														</div>
													) : (
														<Trash2 className="size-5 text-primary80" />
													)}
												</div>
												<div
													className="cursor-pointer p-1 rounded-full bg-white hover:bg-gray-100"
													onClick={(e) => {
														e.stopPropagation();
														setPrompt(query.question);
													}}
												>
													<img
														src="https://d2vkmtgu2mxkyq.cloudfront.net/draw.svg"
														alt="edit-prompt"
														className="size-5"
													/>
												</div>
											</div>
										</div>
									))
								) : (
									<div className="flex space-x-2">
										{[...Array(4)].map((_, index) => (
											<Skeleton
												key={index}
												className="h-[7.8rem] w-[15.6rem] rounded-xl bg-purple-4"
											/>
										))}
									</div>
								)}
							</div>
						</ScrollList>
					) : (
						<ScrollList>
							<div className="w-full overflow-x-scroll horizontal-scrollbar pb-1 flex gap-4 mt-4">
								{data?.suggestion?.length > 0
									? data.suggestion
											.find(
												(suggestion) =>
													suggestion.type === activeTab,
											)
											?.questions.map(
												(question, index, questions) => (
													<div
														className="relative bg-purple-4 rounded-xl min-w-[15rem] max-w-[19.25rem] min-h-[8rem] p-4 hover:bg-purple-8 mb-3"
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
															<li className="flex items-center gap-2 hover:cursor-pointer hover:text-purple-80 !line-clamp-5">
																{question}
															</li>
														</div>
														<div className="flex gap-2 justify-end w-full mt-2">
															<div
																className="cursor-pointer p-1 rounded-full bg-white hover:bg-gray-100"
																onClick={(e) => {
																	e.stopPropagation();
																	setPrompt(
																		question,
																	);
																}}
															>
																<img
																	src="https://d2vkmtgu2mxkyq.cloudfront.net/draw.svg"
																	alt="edit-prompt"
																	className="size-5"
																/>
															</div>
														</div>
													</div>
												),
											)
									: [...Array(5)].map((_, index) => (
											<div
												className="flex space-x-2"
												key={index}
											>
												<Skeleton className="h-[125px] w-[250px] rounded-xl bg-purple-4" />
											</div>
										))}
							</div>
						</ScrollList>
					)
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
			<ConfirmationDialog />
		</>
	);
};

export default SelectPrompt;
