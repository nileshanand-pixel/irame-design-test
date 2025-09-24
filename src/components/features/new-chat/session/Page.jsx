import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from '@/hooks/useRouter';
import { cn, getInitials } from '@/lib/utils';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createQuery, getQueriesOfSession } from '../service/new-chat.service';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ResponseCard from '../ResponseCard';
import ira from '@/assets/icons/ira_icon.svg';
import { toast } from '@/lib/toast';
import Workspace from '../Workspace';
import AddQueryToDashboard from '../AddQueryToDashboard';
import CreateDashboardDialog from '../../dashboard/components/CreateDashboardDialog';
import { createDashboard } from '../../dashboard/service/dashboard.service';
import { queryClient } from '@/lib/react-query';
import QueueStatus from '../QueueStatus';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { WorkspaceEditProvider } from '../components/WorkspaceEditProvider';
import CHAT_CONSTANTS, {
	CHAT_SESSION_STARTED_EVENT_DATA_KEY,
} from '@/constants/chat.constant';
import QueryDisplay from './components/QueryDisplay';
import Clarification from '../Clarification';
import { WorkspaceEnum } from '../types/new-chat.enum';
// import InputArea from '../InputArea';
import ReportGenerationDialog from './components/ReportGenerationDialog';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';
import { logError } from '@/lib/logger';
import AddQueryFlow from '../../reports/components/AddQueryFlow';
import { getLocalStorage, setLocalStorage } from '@/utils/local-storage';
import { sendChatSessionStartedEvent } from '@/utils/chat';
import InputArea from '../components/input-area/input-area';
import { isUnstructuredData } from '@/utils/datasource-utils';
import useDatasourceDetails from '@/api/datasource/hooks/useDataSourceDetails';

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
		visitedTabs: { planner: true },
	});
	const [prompt, setPrompt] = useState(chatStoreReducer?.inputPrompt || '');
	const [bulkPrompt, setBulkPrompt] = useState([
		{ id: 1, text: 'Hi' },
		{ id: 2, text: 'Bi' },
		{ id: 3, text: 'Ji' },
	]);
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
	const [activeQueryResponse, setActiveQueryResponse] = useState({});
	const [activeQueryProgress, setActiveQueryProgress] = useState(null);
	const [newDashboardIds, setNewDashboardIds] = useState([]);
	const queries = chatStoreReducer?.queries;

	const scrollToBottom = () => {
		if (scrollRef.current) {
			scrollRef.current.scrollTo({
				top: scrollRef.current.scrollHeight,
				behavior: 'smooth',
			});
		}
	};

	const { data: datasourceData } = useDatasourceDetails();
	const { rawFiles } = useMemo(() => {
		const ds = datasourceData;
		return {
			rawFiles: ds?.raw_files,
		};
	}, [datasourceData]);

	const handleTabClick = (tab) => {
		if (tab === 'planner') {
			trackEvent(
				EVENTS_ENUM.PLANNER_TAB_CLICKED,
				EVENTS_REGISTRY.PLANNER_TAB_CLICKED,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: chatStoreReducer?.activeQueryId,
				}),
			);
		} else if (tab === 'reference') {
			trackEvent(
				EVENTS_ENUM.REFERENCE_TAB_CLICKED,
				EVENTS_REGISTRY.REFERENCE_TAB_CLICKED,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: chatStoreReducer?.activeQueryId,
				}),
			);
		} else if (tab === 'coder') {
			trackEvent(
				EVENTS_ENUM.CODER_TAB_CLICKED,
				EVENTS_REGISTRY.CODER_TAB_CLICKED,
				() => ({
					chat_session_id: query?.sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: chatStoreReducer?.activeQueryId,
				}),
			);
		}
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
			}));
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

		const sessionMode = (firstAnswer) => {
			return firstAnswer?.type || 'single';
		};

		getQueriesOfSession(chatStoreReducer?.activeChatSession?.id)
			.then((resp) => {
				const res = resp?.query_list;
				if (res.length <= 0) return;
				const dataSourceName = resp?.datasource_name;
				const dataSourceDetails = resp?.datasource_details;
				const dataSourceId = res[0].datasource_id;
				const tempQueries = res?.map((item) => ({
					id: item?.query_id,
					question: item?.query,
					type: item?.type,
					metadata: item?.metadata,
				}));

				const lastQueryPreviousAnswer = answers[answers.length - 1];
				if (
					lastQueryPreviousAnswer &&
					lastQueryPreviousAnswer?.status === 'in_progress'
				) {
					const lastQueryCurrentAnswer = res[res.length - 1];
					if (lastQueryCurrentAnswer?.status === 'done') {
						trackEvent(
							EVENTS_ENUM.CHAT_MESSAGE_SENT,
							EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
							() => ({
								chat_session_id: lastQueryCurrentAnswer?.session_id,
								query_id: lastQueryCurrentAnswer?.query_id,
								dataset_id: lastQueryCurrentAnswer.dataSourceId,
								dataset_name: resp?.datasource_name,
								message_type: 'ai',
								message_source: '',
								message_text:
									lastQueryCurrentAnswer?.answer?.clarification
										?.tool_data?.text,
								is_clarification:
									!!lastQueryCurrentAnswer?.answer?.clarification,
								message_number: res.length * 2,
								first_message_in_chat: false,
							}),
						);
					}
				}

				dispatch(
					updateChatStoreProp([
						{ key: 'queries', value: [...tempQueries] },
						{
							key: 'activeChatSession',
							value: {
								...chatStoreReducer?.activeChatSession,
								mode: sessionMode(res[0]),
							},
						},
					]),
				);

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

							const shouldUpdateGraph = !graphKeyExists && newGraph;
							return {
								...newAnswer,
								answer: {
									...newAnswer.answer,
									...(shouldUpdateGraph && { graph: newGraph }),
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

				const activeQueryResp = res?.find(
					(item) => item?.query_id === chatStoreReducer?.activeQueryId,
				);
				setActiveQueryResponse(activeQueryResp);
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
				logError(error, {
					feature: 'chat',
					action: 'fetch-session-queries',
				});
				resetDoingScience(false);
				setIsGraphLoading(false);
				setInputDisabled(false);
				setBanners((prevState) => ({
					...prevState,
					showDelay: false,
					showFailedResponse: true,
				}));
				clearPolling();
				navigate('/app/new-chat');
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

	const handleAppendQuery = (
		prompt,
		queries,
		savedQueryReference,
		mode = 'single',
	) => {
		try {
			if (inputDisabled) return;
			if (mode === 'single' && (!prompt || !prompt?.trim())) return;
			setInputDisabled(true);
			setActiveQueryProgress(null);
			const lastAns = answers[answers.length - 1];
			const tempPrompt = prompt;
			const tempCurrentQueries = [
				...chatStoreReducer?.queries,
				{ id: '', question: tempPrompt, parentQueryId: lastAns?.query_id },
			];
			let metadata;
			if (queries && queries?.length > 0) {
				metadata = {
					queries: queries
						.filter((query) => query?.text?.length > 0)
						.map((item) => ({ query: item?.text })),
					saved_query_reference: savedQueryReference,
				};
			}
			const payload = {
				type: mode,
				child_no: parseInt(lastAns.child_no) + 1,
				datasource_id: lastAns?.datasource_id,
				parent_query_id: lastAns?.query_id,
				session_id: lastAns?.session_id,
			};

			if (mode === 'single' && prompt) payload.query = prompt;
			if (mode !== 'single' && metadata) payload.metadata = metadata;
			dispatch(
				updateChatStoreProp([{ key: 'queries', value: tempCurrentQueries }]),
			);
			createQuery(payload).then((res) => {
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

				trackEvent(
					EVENTS_ENUM.CHAT_MESSAGE_SENT,
					EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
					() => ({
						chat_session_id: res?.session_id,
						query_id: res?.query_id,
						dataset_id: query.dataSourceId,
						dataset_name: datasourceData?.name,
						message_type: 'user',
						message_source: 'manual_input',
						message_text: prompt,
						is_clarification: false,
						message_number: 2 * answers.length + 1,
						first_message_in_chat: false,
					}),
				);
				sendChatSessionStartedEvent({
					dataset_id: query.dataSourceId,
					dataset_name: datasourceData?.name,
					start_method: 'manual_input',
					chat_session_id: res?.session_id,
					chat_session_type: 'old',
				});
				queryClient.invalidateQueries(['chat-history']);
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
			logError(error, { feature: 'chat', action: 'append-query' });
			setPrompt('');
		} finally {
			setInputDisabled(false);
		}
	};

	const handleRegenerateResponse = (answer, workspaceChanges) => {
		try {
			if (inputDisabled) return;
			const tempPrompt = workspaceChanges.query;
			const tempCurrentQueries = [
				...chatStoreReducer?.queries,
				{ id: '', question: tempPrompt, parentQueryId: answer.query_id },
			];
			dispatch(
				updateChatStoreProp([{ key: 'queries', value: tempCurrentQueries }]),
			);
			createQuery({
				child_no: parseInt(answer.child_no) + 1,
				datasource_id: answer?.datasource_id,
				parent_query_id: answer?.query_id,
				query: tempPrompt,
				session_id: answer?.session_id,
				workspace_changes: workspaceChanges.apiConfig,
				metadata: {
					queries: answer?.metadata?.queries
						.filter((query) => query?.text?.length > 0)
						.map((item) => ({ query: item?.text })),
					saved_query_reference: answer?.metadata?.saved_query_reference,
				},
				type: answer?.type,
			}).then((res) => {
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

				trackEvent(
					EVENTS_ENUM.CHAT_MESSAGE_SENT,
					EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
					() => ({
						chat_session_id: query?.sessionId,
						dataset_id: datasourceData?.datasource_id,
						dataset_name: datasourceData?.name,
						query_id: chatStoreReducer?.activeQueryId,
						message_type: 'user',
						message_source: 'regenerate_from_edit',
						message_text: tempPrompt,
						is_clarification: false,
						message_number: chatStoreReducer?.queries?.length * 2 + 1,
						first_message_in_chat: false,
					}),
				);
				sendChatSessionStartedEvent({
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					start_method: 'regenerate_from_edit',
					chat_session_id: query?.session_id,
					chat_session_type: 'old',
				});

				queryClient.invalidateQueries(['chat-history']);
			});

			setResponseTimeElapsed(0);
			setBanners((prevState) => ({
				...prevState,
				showFailedResponse: false,
				showDelay: false,
			}));
		} catch (error) {
			console.log(error);
			logError(error, { feature: 'chat', action: 'regenerate-response' });
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
			const resp = await createDashboard(dashboard.name);
			if (resp) {
				setDashboard((prev) => ({
					...prev,
					isCreating: false,
					showCreate: false,
				}));
				toast.success('Dashboard created successfully');
				setNewDashboardIds((prev) => [...prev, resp.dashboard_id]);
				if (pathname.includes('/app/dashboard')) {
					navigate(`/app/new-chat?source=dashboard`);
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
			logError(error, { feature: 'chat', action: 'create-dashboard' });
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
								{getInitials(value.user_name)}
							</AvatarFallback>
						</Avatar>
						<QueryDisplay />
					</div>
				</div>
			);
		}
		return queries?.map((query, key) => {
			const answerElem = answers.find((item) => item.query_id === query.id);
			const hasClarification = !!answerElem?.answer?.clarification;
			const currentDoingScience =
				doingScience.find((loadingObj) => loadingObj.queryId === query?.id)
					?.status || !!query?.parentQueryId;
			const isAllDocuments = isUnstructuredData(rawFiles);

			const showWorkspaceToggle = !hasClarification;
			return (
				<div key={query.id} className="my-2 w-full">
					<div className={`ml-10 flex gap-2.5 flex-row-reverse`}>
						<Avatar className="size-9">
							<AvatarImage src={value?.avatar} />
							<AvatarFallback>
								{getInitials(value.user_name)}
							</AvatarFallback>
						</Avatar>
						<QueryDisplay
							mode={query?.type}
							bulkPrompt={query?.metadata?.queries}
							workflowTitle={
								query?.metadata?.saved_query_reference?.title ||
								query?.metadata?.workflow_reference?.name
							}
							prompt={query?.question}
						/>
					</div>
					<div className="mt-4 flex items-center space-x-2">
						<img src={ira} alt="ira" className="size-10" />
						{showWorkspaceToggle && (
							<Button
								variant="outline"
								className="text-sm font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
								onClick={() => {
									toggleIra(query?.id);
								}}
								disabled={isAllDocuments}
							>
								<img
									src="https://d2vkmtgu2mxkyq.cloudfront.net/category.svg"
									className="me-1 size-5"
								/>
								{(workspace.show &&
									chatStoreReducer?.activeQueryId === query?.id) ||
								!chatStoreReducer?.activeQueryId
									? 'Hide'
									: 'Show'}{' '}
								Workspace
							</Button>
						)}
						{hasClarification && <Clarification />}
					</div>

					<div className={cn(currentDoingScience ? 'mb-16' : '')}>
						<div className="ml-12 my-4">
							{currentDoingScience && (
								<QueueStatus
									text={answerElem?.status_text || 'Doing Science'}
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

	const closeReportGenerateModal = () => {
		dispatch(
			updateUtilProp([{ key: 'isGenerateReportModalOpen', value: false }]),
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
			queryClient.invalidateQueries(['chat-history']);

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
		}, 5000);
		return () => clearInterval(intervalRef.current);
	}, [doingScience]);

	useEffect(() => {
		if (!query?.sessionId && chatStoreReducer?.activeChatSession?.id) {
			navigate(
				`/app/new-chat/session/?sessionId=${chatStoreReducer?.activeChatSession?.id}&source=chat_screen`,
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

	// useEffect(() => {}, [utilReducer?.isGenerateReportModalOpen]);

	// useEffect(() => {}, [processedFiles]);

	const showWorkSpace = () => {
		const markerAnswer =
			answers.find(
				(item) => item?.query_id === chatStoreReducer?.activeQueryId,
			) || answers?.[0];
		const hasClarification = !!markerAnswer?.answer?.clarification;
		const isAllDocuments = isUnstructuredData(rawFiles);
		return workspace.show && !hasClarification && !isAllDocuments;
	};

	const config = {
		queryInBulk: { enabled: false },
		workflowQuery: { enabled: true },
		createReport: { enabled: false },
		createDashboard: { enabled: false },
		savedQueries: { enabled: true },
	};

	const newChatSources = ['pre_chat_screen'];

	const getSessionType = (source) => {
		if (newChatSources.includes(source)) {
			return 'new';
		} else {
			return 'old';
		}
	};

	useEffect(() => {
		const { sessionId, source } = query;

		if (sessionId && datasourceData?.datasource_id && datasourceData?.name) {
			trackEvent(
				EVENTS_ENUM.CHAT_SCREEN_LOADED,
				EVENTS_REGISTRY.CHAT_SCREEN_LOADED,
				() => ({
					chat_session_id: sessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					source: source || 'url',
					chat_session_type: getSessionType(source),
				}),
			);
		}
	}, [query, datasourceData]);

	useEffect(() => {
		if (!dashboard?.showAdd) {
			setNewDashboardIds([]);
		}
	}, [dashboard?.showAdd]);

	useEffect(() => {
		const { sessionId, source } = query;
		if (sessionId) {
			const prevChatSessionStartedEventData = getLocalStorage(
				CHAT_SESSION_STARTED_EVENT_DATA_KEY,
			);
			if (
				prevChatSessionStartedEventData &&
				prevChatSessionStartedEventData.sessionId === sessionId
			) {
				return;
			}
			const chatSessionStartedEventData = {
				sessionId,
				isEventSent: false,
			};
			if (newChatSources.includes(source)) {
				chatSessionStartedEventData.isEventSent = true;
			}
			setLocalStorage(
				CHAT_SESSION_STARTED_EVENT_DATA_KEY,
				chatSessionStartedEventData,
			);
		}
	}, [query]);

	return (
		<div className="grid grid-cols-12 gap-4 px-8 w-full overflow-hidden pb-4">
			<div
				className={`${showWorkSpace() ? 'col-span-8' : 'col-span-12 mx-32'} border rounded-2xl shadow-1xl flex flex-col h-full overflow-hidden`}
			>
				<div ref={scrollRef} className="flex-1 overflow-y-auto p-4">
					{renderConversation()}
				</div>

				<div className="bg-white border-t p-4">
					<InputArea
						config={config}
						onAppendQuery={handleAppendQuery}
						disabled={inputDisabled}
					/>
					<p className="text-xs text-center text-primary40 font-normal mt-2">
						Irame.ai may display inaccurate info, including about people,
						so double-check its responses.
					</p>
				</div>
			</div>

			{showWorkSpace() && (
				<WorkspaceEditProvider
					editDisabled={inputDisabled}
					regenerator={handleRegenerateResponse}
				>
					<div className="col-span-4 border rounded-3xl shadow-1xl flex flex-col h-full overflow-y-auto p-4">
						<div className="flex justify-between items-center mb-4">
							<div className="flex items-center gap-1">
								<img
									src="https://d2vkmtgu2mxkyq.cloudfront.net/category.svg"
									alt="Category Icon"
									className="w-6 h-6"
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
							canEdit={answers.every(
								(item) => item?.status === 'done',
							)}
							setWorkspace={setWorkspace}
						/>
					</div>
				</WorkspaceEditProvider>
			)}

			{/* DASHBOARD MODALS */}
			{dashboard?.showAdd && (
				<AddQueryToDashboard
					open={dashboard.showAdd}
					setDashboard={setDashboard}
					newDashboardIds={newDashboardIds}
				/>
			)}
			{dashboard?.showCreate && (
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
			)}
			{utilReducer.isGenerateReportModalOpen && (
				<ReportGenerationDialog
					open={utilReducer.isGenerateReportModalOpen}
					closeModal={closeReportGenerateModal}
				/>
			)}
		</div>
	);
};

export default Workzone;
