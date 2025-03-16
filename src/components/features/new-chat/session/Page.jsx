import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from '@/hooks/useRouter';
import { cn, getInitials, getToken } from '@/lib/utils';
import React, { useEffect, useRef, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { createQuery, getQueriesOfSession } from '../service/new-chat.service';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
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
import { WorkspaceEditProvider } from '../components/WorkspaceEditProvider';
import CHAT_CONSTANTS from '@/constants/chat.constant';
import QueryDisplay from './components/QueryDisplay';
import Clarification from '../Clarification';
import { WorkspaceEnum } from '../types/new-chat.enum';
import InputArea from '../InputArea';
import ReportGenerationDialog from './components/ReportGenerationDialog';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';

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
			}));
			clearPolling();
		}
	};

	const resetDoingScience = (targetState) => {
		setDoingScience((prevState) => {
			return prevState?.map((item) => ({ ...item, status: targetState }));
		});
	};

	const trackQueryStatus = (answerItem) => {
		if (!answerItem) return;

		let track = false;
		let plannerFinishTime = null;
		let coderFinishTime = null;

		const formatISTTimestamp = (timestamp) => {
			if (!timestamp) return null;
			const date = new Date(timestamp);
			return date
				.toLocaleString('en-IN', {
					timeZone: 'Asia/Kolkata',
					hour12: true,
				})
				.replace(',', '');
		};

		const truncateLargeText = (text, limit = 500) => {
			if (!text) return undefined;
			return text?.substring(0, limit) || undefined;
		};

		const extractPlannerText = (answer) => {
			if (!answer?.planner?.tool_data?.text) return '';
			return answer.planner.tool_data.text;
		};

		const extractCoderText = (answer) => {
			if (!answer?.coder?.tool_data?.text) return '';
			return answer.coder.tool_data.text;
		};

		const formatTimeTaken = (startTime, endTime) => {
			const timeTaken = (endTime - startTime) / 1000;
			if (timeTaken < 60) {
				return `${Math.ceil(timeTaken)} seconds`;
			}
			const minutes = Math.floor(timeTaken / 60);
			const seconds = Math.floor(timeTaken % 60);
			return seconds > 0
				? `${minutes} mins ${seconds} seconds`
				: `${minutes} mins`;
		};

		if (answerItem.status === 'in_queue' && !activeQueryProgress) {
			const createdTime = new Date(answerItem.created_at).getTime();
			setActiveQueryProgress({
				query_id: answerItem.query_id,
				initial_queue: answerItem.rank,
				initial_time: createdTime,
				queue_start: createdTime,
				queue_end: null,
				processing_start: null,
				planner_started: null,
				planner_completed: null,
				planner_completed_text: null,
				planner_time_taken: null,
				coder_started: null,
				coder_completed: null,
				coder_completed_text: null,
				coder_time_taken: null,
				status_history: [answerItem.status],
				current_planner_text: extractPlannerText(answerItem.answer),
				current_coder_text: extractCoderText(answerItem.answer),
			});
			track = true;
		}

		if (answerItem.rank === null && !activeQueryProgress?.processing_start) {
			const processingStart = Date.now();
			setActiveQueryProgress((prev) => ({
				...prev,
				processing_start: processingStart,
				queue_end: processingStart,
			}));
			track = true;
		}

		const currentPlanner = extractPlannerText(answerItem.answer);
		if (currentPlanner) {
			if (!activeQueryProgress?.current_planner_text) {
				const startTime = Date.now();
				setActiveQueryProgress((prev) => ({
					...prev,
					current_planner_text: currentPlanner,
					planner_started: startTime,
				}));
				track = true;
			} else if (activeQueryProgress.current_planner_text !== currentPlanner) {
				setActiveQueryProgress((prev) => ({
					...prev,
					current_planner_text: currentPlanner,
					planner_completed: null,
					planner_completed_text: null,
					planner_time_taken: null,
				}));
			} else if (!activeQueryProgress.planner_completed) {
				plannerFinishTime = Date.now();
				const timeTaken = formatTimeTaken(
					activeQueryProgress.planner_started,
					plannerFinishTime,
				);
				setActiveQueryProgress((prev) => ({
					...prev,
					planner_completed: plannerFinishTime,
					planner_completed_text: currentPlanner,
					planner_time_taken: timeTaken,
				}));
				track = true;
			}
		}

		const currentCoder = extractCoderText(answerItem.answer);
		if (currentCoder) {
			if (!activeQueryProgress?.current_coder_text) {
				const startTime = Date.now();
				setActiveQueryProgress((prev) => ({
					...prev,
					current_coder_text: currentCoder,
					coder_started: startTime,
				}));
				track = true;
			} else if (activeQueryProgress.current_coder_text !== currentCoder) {
				setActiveQueryProgress((prev) => ({
					...prev,
					current_coder_text: currentCoder,
				}));
			} else if (!activeQueryProgress.coder_completed) {
				coderFinishTime = Date.now();
				const timeTaken = formatTimeTaken(
					activeQueryProgress.coder_started,
					coderFinishTime,
				);
				setActiveQueryProgress((prev) => ({
					...prev,
					coder_completed: coderFinishTime,
					coder_completed_text: currentCoder,
					coder_time_taken: timeTaken,
				}));
				track = true;
			}
		}

		const isDone = answerItem.status === 'done';
		const doneTimestamp = isDone
			? new Date(answerItem.updated_at).getTime()
			: null;
		const initialTime = activeQueryProgress?.initial_time;
		const queueStart = activeQueryProgress?.queue_start;
		const queueEnd = activeQueryProgress?.queue_end;
		const processingStart = activeQueryProgress?.processing_start;

		const eventPayload = {
			query_id: answerItem.query_id,
			session_id: answerItem.session_id,
			datasource_id: answerItem.datasource_id,
			query: answerItem.query,
			initial_queue_number:
				activeQueryProgress?.initial_queue ?? answerItem?.rank,
			current_queue_number: isDone ? null : answerItem.rank,
			initial_time: formatISTTimestamp(initialTime),
			queue_time_taken: queueEnd
				? formatTimeTaken(queueStart, queueEnd)
				: null,
			processing_time_taken: isDone
				? formatTimeTaken(processingStart, doneTimestamp)
				: null,
			total_time_taken: isDone
				? formatTimeTaken(initialTime, doneTimestamp)
				: null,
			planner_time_taken: activeQueryProgress?.planner_time_taken || null,
			planner_started_time: formatISTTimestamp(
				activeQueryProgress?.planner_started,
			),
			planner_completed_time: formatISTTimestamp(
				activeQueryProgress?.planner_completed,
			),
			planner_text: activeQueryProgress?.current_planner_text?.substring(
				0,
				500,
			),
			planner_completed_text:
				activeQueryProgress?.planner_completed_text?.substring(0, 500),
			coder_time_taken: activeQueryProgress?.coder_time_taken || null,
			coder_started_time: formatISTTimestamp(
				activeQueryProgress?.coder_started,
			),
			coder_completed_time: formatISTTimestamp(
				activeQueryProgress?.coder_completed,
			),
			coder_text: activeQueryProgress?.current_coder_text?.substring(0, 500),
			coder_completed_text:
				activeQueryProgress?.coder_completed_text?.substring(0, 500),
			queue_start: formatISTTimestamp(queueStart),
			queue_end: formatISTTimestamp(queueEnd),
			processing_start: formatISTTimestamp(processingStart),
			completed_at: formatISTTimestamp(doneTimestamp),
			status: answerItem.status,
			status_text: isDone ? null : answerItem.metadata?.status_text,
			progress_state: {
				...activeQueryProgress,
				planner_completed_text: null,
				planner_text: null,
				coder_text: null,
				coder_completed_text: null,
				current_coder_text: null,
				current_planner_text: null,
			},
		};

		if (!answerItem?.status_text || isDone) {
			track = true;
		}

		if (track) {
			trackEvent(
				EVENTS_ENUM.QUERY_STATUS,
				EVENTS_REGISTRY.QUERY_STATUS,
				() => eventPayload,
			);
		}
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

		getQueriesOfSession(chatStoreReducer?.activeChatSession?.id, getToken())
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

				if (
					!utilReducer?.selectedDataSource?.name ||
					!utilReducer?.selectedDataSource?.details
				) {
					dispatch(
						updateUtilProp([
							{
								key: 'selectedDataSource',
								value: {
									...utilReducer?.selectedDataSource,
									name: dataSourceName,
									id: dataSourceId,
									details: dataSourceDetails,
								},
							},
						]),
					);
				}

				const activeQuery = res[res.length - 1];
				trackQueryStatus(activeQuery);

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
			createQuery(payload, getToken()).then((res) => {
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

				trackEvent(EVENTS_ENUM.REPLY_QUERY_INITIATED, EVENTS_REGISTRY.REPLY_QUERY_INITIATED, (() => ({
					query_id: res?.query_id,
					datasource_id: query.dataSourceId,
					session_id: res?.session_id,
					parent_query_id: lastAns?.query_id,
					child_no: parseInt(lastAns.child_no) + 1,
				})))

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
			trackEvent(
				EVENTS_ENUM.REGENERATE_RESPONSE_CLICKED,
				EVENTS_REGISTRY.REGENERATE_RESPONSE_CLICKED,
				() => ({
					session_id: answer?.session_id,
					child_no: parseInt(answer.child_no) + 1,
					parent_query_id: answer?.query_id,
					workspace_changes: workspaceChanges.apiConfig,
					metadata: {
						queries: answer?.metadata?.queries
							.filter((query) => query?.text?.length > 0)
							.map((item) => ({ query: item?.text })),
						saved_query_reference:
							answer?.metadata?.saved_query_reference,
					},
				}),
			);
			createQuery(
				{
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
						saved_query_reference:
							answer?.metadata?.saved_query_reference,
					},
					type: answer?.type,
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
		} catch (error) {
			console.log(error);
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
				trackEvent(
					EVENTS_ENUM.DASHBOARD_CREATED,
					EVENTS_REGISTRY.DASHBOARDS_CREATED,
					() => ({
						dashboard_id: resp.dashboard_id,
						title: dashboard.name,
						from: 'chat-page',
					}),
				);
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
			const hasIraGeneratedGraph = !!answerElem?.answer?.graph;
			!hasIraGeneratedGraph && answerElem?.status !== 'done';
			const currentDoingScience =
				doingScience.find((loadingObj) => loadingObj.queryId === query?.id)
					?.status || !!query?.parentQueryId;
			const showWorkspaceToggle = !hasClarification;
			return (
				<div key={query.id} className="my-2 w-full">
					<div
						className={`ml-10 flex gap-2.5 flex-row-reverse`}
					>
						<Avatar className="size-9">
							<AvatarImage src={value?.avatar} />
							<AvatarFallback>
								{getInitials(value.user_name)}
							</AvatarFallback>
						</Avatar>
						<QueryDisplay
							mode={query?.type}
							bulkPrompt={query?.metadata?.queries}
							workflowTitle = {query?.metadata?.saved_query_reference?.title || query?.metadata?.workflow_reference?.name}
							prompt={query?.question}
						/>
					</div>
					<div className="mt-10 flex items-center space-x-2">
						<img src={ira} alt="ira" className="size-10" />
						{showWorkspaceToggle && (
							<Button
								variant="outline"
								className="text-sm font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
								onClick={() => {
									trackEvent(
										EVENTS_ENUM.TOGGLE_WORKSPACE_BUTTON,
										EVENTS_REGISTRY.TOGGLE_WORKSPACE_BUTTON,
										() => ({
											query_id: query?.id,
											parent_query_id:
												answerElem?.parent_query_id,
											child_no: answerElem?.child_no,
										}),
									);
									toggleIra(query?.id);
								}}
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
						)}
						{hasClarification && <Clarification />}
					</div>

					<div className={cn('mt-8', currentDoingScience ? 'mb-16' : '')}>
						<div className="ml-12 my-10">
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

	useEffect(() => {}, [utilReducer?.isGenerateReportModalOpen]);

	const showWorkSpace = () => {
		const markerAnswer =
			answers.find(
				(item) => item?.query_id === chatStoreReducer?.activeQueryId,
			) || answers?.[0];
		const hasClarification = !!markerAnswer?.answer?.clarification;
		return workspace.show && !hasClarification;
	};

	const config = {
		queryInBulk: { enabled: false },
		workflowQuery: { enabled: true },
		createReport: { enabled: false },
		createDashboard: { enabled: false },
		savedQueries: { enabled: true },
	};

	return (
		<div className="grid grid-cols-12 gap-4 px-8 min-h-[90vh] max-h-[90vh] overflow-y-hidden w-full">
			<div
				className={cn(
					'border rounded-2xl pt-8 pl-4 mr-4 shadow-1xl relative h-full flex-col',
					showWorkSpace() ? 'col-span-12 lg:col-span-8' : 'col-span-12 lg:mx-[128px]',
				)}
			>
				<div
					ref={scrollRef}
					className="mb-[4vh] h-[68vh] h-sm:h-[72vh] h-md:h-[76vh] h-lg:h-[76vh] h-xl:h-[78vh] pr-4 overflow-y-auto w-full"
				>
					{renderConversation()}
				</div>

				<div className="bg-white flex justify-center mt-4 pt-2">
					<div className="absolute bottom-4 w-[96%] flex flex-col items-center justify-center z-20 bg-white">
						<InputArea
							config={config}
							onAppendQuery={handleAppendQuery}
							disabled={inputDisabled}
						/>
						<p className="text-xs text-primary40 font-normal">
							Irame.ai may display inaccurate info, including about
							people, so double-check its responses.
						</p>
					</div>
				</div>
			</div>

			{showWorkSpace() ? (
				<WorkspaceEditProvider
					editDisabled={inputDisabled}
					regenerator={handleRegenerateResponse}
				>
					<div className="border sticky rounded-3xl py-4 w-full px-4 col-span-12 lg:col-span-4 shadow-1xl h-[90vh]">
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
							canEdit={answers.every(
								(item) => item?.status === 'done',
							)}
							setWorkspace={setWorkspace}
						/>
					</div>
				</WorkspaceEditProvider>
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
