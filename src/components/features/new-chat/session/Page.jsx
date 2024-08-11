import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from '@/hooks/useRouter';
import { cn, getInitials, getToken } from '@/lib/utils';
import { Input } from '@/components/ui/input';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createQuery, getQueriesOfSession } from '../service/new-chat.service';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Skeleton } from '@/components/ui/skeleton';
import { Button } from '@/components/ui/button';
import ResponseCard from '../ResponseCard';
import ira from '@/assets/icons/ira_icon.svg';
import { toast } from 'sonner';
import Workspace from '../Workspace';
import AddQueryToDashboard from '../AddQueryToDashboard';
import CreateDashboardDialog from '../../dashboard/components/CreateDashboardDialog';
import { createDashboard } from '../../dashboard/service/dashboard.service';
import { queryClient } from '@/lib/react-query';
import QueueStatus from '../QueueStatus';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import isEqual from 'lodash.isequal';

const Workzone = () => {
	const [value] = useLocalStorage('userDetails');
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const dispatch = useDispatch();
	const { pathname, navigate, query } = useRouter();

	const intervalRef = useRef();
	const scrollRef = useRef(null);

	const [workspace, setWorkspace] = useState({
		show: true,
		activeTab: 'planner',
		visitedTabs: [],
	});
	const [prompt, setPrompt] = useState(chatStoreReducer?.inputPrompt || ''); // input field controlled state
	const [answers, setAnswers] = useState([]);
	const [doingScience, setDoingScience] = useState([]);
	const [dashboard, setDashboard] = useState({
		name: '',
		isCreating: false,
		showAdd: false,
		showCreate: false,
		isAdding: false,
	});
	const [errors, setErrors] = useState({});
	const [banners, setBanners] = useState({
		showFailedResponse: false,
		showDelay: false,
	});
	const [isTableLoading, setIsTableLoading] = useState(false);
	const [isGraphLoading, setIsGraphLoading] = useState(true);
	const [responseTimeElapsed, setResponseTimeElapsed] = useState(0);
	const [inputDisabled, setInputDisabled] = useState(false);
	const queries = chatStoreReducer?.queries;

	const scrollToBottom = () => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: 'smooth',
			});
		}
	};

	const handleTabClick = (tab) => {
		setWorkspace((prevState) => ({
			...prevState,
			activeTab: tab,
			visitedTabs: { ...prevState.visitedTabs, [tab]: true },
		}));
	};

	const handleResponseDelay = (newElapsedTime) => {
		if (newElapsedTime >= 30 && !banners?.showDelay) {
			setBanners((prevState) => ({ ...prevState, showDelay: true }));
		}
		if (newElapsedTime >= 600 && !banners?.showFailedResponse) {
			setBanners((prevState) => ({
				...prevState,
				showFailedResponse: true,
				showDelay: false,
			})); //reset delay banner in case of failed response banner
			clearPolling();
		}
	};

	const resetDoingScience = (targetState) => {
		setDoingScience((prevState) => {
			return prevState?.map((item) => ({ ...item, status: targetState }));
		});
	};

	const fetchQueries = () => {
		if (!chatStoreReducer?.activeChatSession?.id) return;
		const checkGraphOrObservationAbsent = (resp) => {
			return (
				resp.status === 'done' && !resp.answer?.graph && !resp.answer?.answer
			);
		};

		getQueriesOfSession(chatStoreReducer?.activeChatSession?.id, getToken())
			.then((resp) => {
				const res = resp?.query_list;
				if (res.length <= 0) return;
				const dataSourceName = resp?.datasource_name;
				const dataSourceId = res[0].datasource_id;
				// Update queries
				const tempQueries = res?.map((item) => ({
					id: item?.query_id,
					question: item?.query,
				}));
				dispatch(
					updateChatStoreProp([
						{ key: 'queries', value: [...tempQueries] },
					]),
				);

				//update datasource name in util reducer if not present
				if (!utilReducer?.selectedDataSource?.name) {
					dispatch(
						updateUtilProp([
							{
								key: 'selectedDataSource',
								value: {
									...utilReducer?.selectedDataSource,
									name: dataSourceName,
									id: dataSourceId,
								},
							},
						]),
					);
				}

				// Update answers
				setAnswers((prevAnswers) => {
					return res.map((newAnswer) => {
						const existingAnswer = prevAnswers.find(
							(answer) => answer.query_id === newAnswer.query_id,
						);

						if (existingAnswer) {
							if (existingAnswer.status === 'done') {
								return existingAnswer;
							}

							const graphKeyExists =
								existingAnswer?.answer &&
								Object.keys(existingAnswer?.answer).includes(
									'graph',
								);
							const newGraph = newAnswer?.answer?.graph;

							// Determine if we need to update the graph key -> helps in graph stopping graph reload
							const shouldUpdateGraph = !graphKeyExists && newGraph;
							return {
								...newAnswer,
								answer: {
									...newAnswer.answer,
									...(shouldUpdateGraph && { graph: newGraph }), // Conditionally add the graph key
								},
							};
						}

						return newAnswer;
					});
				});

				setDoingScience((prevState) => {
					const tempDoingScience = prevState.filter((item) => item.id);
					return res?.map((answerItem) => {
						const status = answerItem?.status !== 'done';
						return { queryId: answerItem?.query_id, status };
					});
				});

				// active query has no graph or observation case check
				const activeQueryResp = res?.find(
					(item) => item?.query_id === chatStoreReducer?.activeQueryId,
				);
				if (!!activeQueryResp) {
					dispatch(
						updateChatStoreProp([
							{
								key: 'activeChatSession',
								value: {
									...chatStoreReducer?.activeChatSession,
									status: activeQueryResp?.status,
								},
							},
						]),
					);
					let failed = checkGraphOrObservationAbsent(activeQueryResp);
					if (failed) {
						setBanners((prevState) => ({
							...prevState,
							showDelay: false,
							showFailedResponse: true,
						}));
						setInputDisabled(false);
						resetDoingScience(false);
						setIsGraphLoading(false);
					}
				}
			})
			.catch((error) => {
				console.error('Error fetching session queries:', error);
				resetDoingScience(false);
				setIsGraphLoading(false);
				setInputDisabled(false);
				setBanners((prevState) => ({
					...prevState,
					showDelay: false,
					showFailedResponse: true,
				}));
				clearPolling();
			});

		setResponseTimeElapsed((prev) => {
			const newElapsedTime = prev + 5;
			handleResponseDelay(newElapsedTime);
			return newElapsedTime;
		});
	};

	const handlePromptChange = (e) => {
		setPrompt(e.target.value);
	};

	const handleAppendQuery = () => {
		try {
			if (inputDisabled) return;
			if (!prompt || !prompt?.trim()) return;
			const lastAns = answers[answers.length - 1];
			const tempPrompt = prompt;
			const tempCurrentQueries = [
				...chatStoreReducer?.queries,
				{ id: '', question: tempPrompt, parentQueryId: lastAns?.query_id },
			];
			dispatch(
				updateChatStoreProp([{ key: 'queries', value: tempCurrentQueries }]),
			);
			createQuery(
				{
					child_no: parseInt(lastAns.child_no) + 1,
					datasource_id: lastAns?.datasource_id,
					parent_query_id: lastAns?.query_id,
					query: tempPrompt,
					session_id: lastAns?.session_id,
				},
				getToken(),
			).then((res) => {
				const updatedQueries = tempCurrentQueries?.map((item) => {
					if (item?.parentQueryId === res?.query_id) {
						return { id: res.query_id, question: tempPrompt };
					}
					return { ...item };
				});
				setDoingScience((prevState) => {
					const tempState = [...prevState];
					tempState.push({ queryId: res?.query_id, status: true });
					return tempState;
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

				queryClient.invalidateQueries(['chat-history'], {
					refetchActive: true,
					refetchInactive: true,
				});
			});

			setResponseTimeElapsed(0);
			setBanners((prevState) => ({
				...prevState,
				showFailedResponse: false,
				showDelay: false,
			}));
			setPrompt('');
		} catch (error) {
			console.log(error);
			setPrompt('');
		}
	};

	const toggleIra = (targetQueryId) => {
		if (!targetQueryId) return;
		if (targetQueryId === chatStoreReducer?.activeQueryId) {
			setWorkspace((prevState) => ({ ...prevState, show: !prevState.show }));
		}
		dispatch(
			updateChatStoreProp([{ key: 'activeQueryId', value: targetQueryId }]),
		);
	};

	const handleCreateNewDashboard = async () => {
		try {
			if (!dashboard.name) {
				setErrors({ dashboardName: 'Please enter dashboard name' });
				return;
			}
			setDashboard((prev) => ({ ...prev, isCreating: true }));
			const resp = await createDashboard(getToken(), dashboard.name);
			if (resp) {
				setDashboard((prev) => ({
					...prev,
					isCreating: false,
					showCreate: false,
				}));
				toast.success('Dashboard created successfully');
				if (pathname.includes('/app/dashboard')) {
					navigate(`/app/new-chat/`);
				} else if (pathname.includes('/app/new-chat/')) {
					queryClient.invalidateQueries(['user-dashboard'], {
						refetchActive: true,
						refetchInactive: true,
					});
				}
			}
		} catch (error) {
			setDashboard((prev) => ({ ...prev, isCreating: false }));
			console.log('dashboard create error', error);
			toast.error('Something went wrong while creating dashboard');
		}
	};

	const renderConversation = () => {
		if (queries.length <= 0) {
			return (
				<div className="mt-8 w-full">
					<div className="mr-1 ml-10 flex items-center gap-2.5 flex-row-reverse">
						<Avatar className="size-9">
							<AvatarImage src={value?.avatar} />
							<AvatarFallback>
								{getInitials(value.userName)}
							</AvatarFallback>
						</Avatar>
						{prompt ? (
							<p className="max-w-[90%] ms-2 bg-purple-4 text-primary80 font-medium px-4 py-2 rounded-tl-[80px] rounded-tr-[6px] rounded-br-[80px] rounded-bl-[80px] min-w-[90%] min-h-6">
								{prompt}
							</p>
						) : (
							<>
								<Skeleton className="h-6 w-full bg-purple-8 ms-1" />
							</>
						)}
					</div>
				</div>
			);
		}
		return queries?.map((query, key) => {
			const answerElem = answers.find((item) => item.query_id === query.id);
			const hasIraGeneratedGraph = !!answerElem?.answer?.graph;
			!hasIraGeneratedGraph && answerElem?.status !== 'done';
			const currentDoingScience =
				doingScience.find((loadingObj) => loadingObj.queryId === query?.id)
					?.status || !!query?.parentQueryId;
			return (
				<>
					<div key={query.id} className="my-2 w-full">
						<div className="ml-10 flex items-center gap-2.5 flex-row-reverse">
							<Avatar className="size-9">
								<AvatarImage src={value?.avatar} />
								<AvatarFallback>
									{getInitials(value.userName)}
								</AvatarFallback>
							</Avatar>
							{query?.question ? (
								<p className="ms-2 mr-1 bg-purple-4 text-primary80 font-medium px-4 py-2 rounded-tl-[80px] rounded-tr-[6px] rounded-br-[80px] rounded-bl-[80px]">
									{query.question}
								</p>
							) : (
								<>
									<Skeleton className="h-6 w-[90%] bg-purple-8 ms-1" />
								</>
							)}
						</div>
						<div className="mt-10 flex items-center space-x-2">
							<img src={ira} alt="ira" className="size-10" />
							<Button
								variant="outline"
								className="text-sm font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
								onClick={() => toggleIra(query?.id)}
							>
								<img
									src="https://d2vkmtgu2mxkyq.cloudfront.net/category.svg"
									className="me-1"
								/>
								{(workspace.show &&
									chatStoreReducer?.activeQueryId === query?.id) ||
								!chatStoreReducer?.activeQueryId
									? 'Hide'
									: 'Show'}{' '}
								Workspace
							</Button>
						</div>
						<div
							className={cn(
								'mt-8',
								currentDoingScience ? 'mb-16' : '',
							)}
						>
							<div className="ml-12 my-10">
								{currentDoingScience && (
									<QueueStatus
										text={
											answerElem?.status_text ||
											'Doing Science'
										}
									/>
								)}
							</div>
							<ResponseCard
								answerResp={answerElem}
								isGraphLoading={isGraphLoading}
								setIsGraphLoading={setIsGraphLoading}
								setAnswerResp={setAnswers}
								setDoingScience={setDoingScience}
								setResponseTimeElapsed={setResponseTimeElapsed}
								setBanners={setBanners}
								doingScience={currentDoingScience}
								setDashboard={setDashboard}
								showTable={
									!answerElem?.answer?.response_dataframe &&
									answerElem?.answer?.graph
								}
								setIsTableLoading={setIsTableLoading}
								isTableLoading={isTableLoading}
							/>
						</div>
					</div>
				</>
			);
		});
	};

	const clearPolling = () => {
		clearInterval(intervalRef.current);
	};

	const markSessionStatusInReducer = (sessionId, status) => {
		let tempSessionHistory = utilReducer?.sessionHistory;
		tempSessionHistory = tempSessionHistory?.map((session) => {
			if (session.session_id === sessionId) {
				return {
					...session,
					status,
				};
			} else return session;
		});
		dispatch(
			updateUtilProp([{ key: 'sessionHistory', value: tempSessionHistory }]),
		);
	};

	useEffect(() => {
		const allDone =
			doingScience.length && doingScience.every((item) => !item.status);
		if (allDone) {
			clearPolling();
			scrollToBottom();
			dispatch(
				updateChatStoreProp([
					{ key: 'activateGraphOnLast', value: true },
					{
						key: 'activeQueryId',
						value: answers?.[answers?.length - 1]?.query_id,
					},
				]),
			);
			markSessionStatusInReducer(
				answers?.[answers?.length - 1]?.session_id,
				'done',
			);
			setInputDisabled(false);
			return;
		}
		if (!chatStoreReducer?.activeQueryId && answers && answers?.length) {
			dispatch(
				updateChatStoreProp([
					{
						key: 'activeQueryId',
						value: answers?.[answers?.length - 1]?.query_id,
					},
				]),
			);
		}

		intervalRef.current = setInterval(() => {
			let hasPendingQueries = true;
			if (doingScience.length && doingScience.every((item) => !item.status)) {
				hasPendingQueries = false;
			}
			if (hasPendingQueries) {
				setInputDisabled(true);
				fetchQueries();
			} else {
				clearPolling();
				resetDoingScience(false);
				setIsGraphLoading(false);
			}
		}, 5000); // Polling interval of 5 seconds
		return () => clearInterval(intervalRef.current);
	}, [doingScience]);

	useEffect(() => {
		if (!query?.sessionId && chatStoreReducer?.activeChatSession?.id) {
			navigate(
				`/app/new-chat/session/?sessionId=${chatStoreReducer?.activeChatSession?.id}`,
				{ replace: true },
			);
			setPrompt('');
		}
		setInputDisabled(true);
		fetchQueries();
	}, [chatStoreReducer?.activeChatSession?.id, chatStoreReducer?.refreshChat]);

	useEffect(() => {
		setAnswers([]);
	}, [chatStoreReducer?.resetIra]);

	useEffect(() => {
		setInputDisabled(true);
		dispatch(
			updateChatStoreProp([
				{
					key: 'activateGraphOnLast',
					value: false,
				},
			]),
		);
	}, [chatStoreReducer?.queries?.length]);

	useEffect(() => {
		// sessionId Present in Url params, absent in Redux
		if (query?.sessionId && !chatStoreReducer?.activeChatSession?.id) {
			dispatch(
				updateChatStoreProp([
					{
						key: 'activeChatSession',
						value: {
							...chatStoreReducer?.activeChatSession,
							id: query?.sessionId,
						},
					},
				]),
			);
		}
	}, [query]);

	return (
		<div className="grid grid-cols-12 gap-4 min-h-[90vh] max-h-[90vh] w-full">
			<div
				className={cn(
					'border rounded-2xl pt-8 px-4 shadow-1xl relative h-full flex-col',
					workspace.show ? 'col-span-8' : 'col-span-12 mx-[8rem]',
				)}
			>
				<div
					ref={scrollRef}
					className="mb-[4vh] h-[68vh] h-sm:h-[72vh] h-md:h-[76vh] h-lg:h-[76vh] h-xl:h-[78vh] overflow-y-auto w-full"
				>
					{renderConversation()}
				</div>

				<div className="bg-white flex justify-center mt-4 pt-2">
					<div className="absolute bottom-4 w-[96%] flex flex-col items-center justify-center z-20 bg-white">
						<div className="rounded-[100px] w-full flex justify-between bg-purple-4 px-3 py-2 mb-2 ">
							<Input
								placeholder="Ask IRA"
								className="border-0 outline-none rounded-none bg-transparent w-full mr-2"
								value={prompt}
								onChange={(e) => handlePromptChange(e)}
								onKeyDown={(e) => {
									if (e.key === 'Enter') handleAppendQuery();
								}}
							/>
							{!inputDisabled ? (
								<div
									className="flex gap-2 items-center pr-3 cursor-pointer"
									onClick={handleAppendQuery}
								>
									<img
										src={`https://d2vkmtgu2mxkyq.cloudfront.net/send.svg`}
										className="size-6"
									/>
								</div>
							) : (
								<div className="flex gap-2 items-center pr-3 cursor-not-allowed">
									<i className="bi bi-arrow-repeat animate-spin text-purple-40 text-xl"></i>
								</div>
							)}
						</div>
						<p className="text-xs text-primary40 font-normal">
							Irame.ai may display inaccurate info, including about
							people, so double-check its responses.
						</p>
					</div>
				</div>
			</div>

			{workspace.show ? (
				<div className="border sticky rounded-3xl py-4 px-4 col-span-4 shadow-1xl h-[90vh]">
					<div className="flex justify-between">
						<div className="flex items-center gap-1">
							<img
								src={`https://d2vkmtgu2mxkyq.cloudfront.net/category.svg`}
								className="me-1 size-6"
							/>
							<h3 className="text-primary80 font-semibold text-xl">
								Ira's Workspace
							</h3>
						</div>
						<i
							className="bi-x text-2xl cursor-pointer"
							onClick={() =>
								setWorkspace((prevState) => ({
									...prevState,
									show: false,
								}))
							}
						></i>
					</div>

					<Workspace
						handleTabClick={handleTabClick}
						workspace={workspace}
						answerResp={
							answers.find(
								(item) =>
									item?.query_id ===
									chatStoreReducer?.activeQueryId,
							) || answers?.[0]
						}
						setWorkspace={setWorkspace}
					/>
				</div>
			) : null}
			{dashboard?.showAdd ? (
				<AddQueryToDashboard
					open={dashboard.showAdd}
					setDashboard={setDashboard}
				/>
			) : null}
			{dashboard?.showCreate ? (
				<CreateDashboardDialog
					open={dashboard.showCreate}
					setOpen={(val) =>
						setDashboard((prev) => ({ ...prev, showCreate: val }))
					}
					dashboardName={dashboard.name}
					setDashboardName={(val) =>
						setDashboard((prev) => ({ ...prev, name: val }))
					}
					handleCreateNewDashboard={handleCreateNewDashboard}
					errors={errors}
					isLoading={dashboard.isCreating}
				/>
			) : null}
		</div>
	);
};

export default Workzone;
