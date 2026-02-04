import useLocalStorage from '@/hooks/useLocalStorage';
import { useRouter } from '@/hooks/useRouter';
import { QUERY_TYPES } from '@/constants/query-type.constant';
import { cn, getInitials } from '@/lib/utils';
import React, { useEffect, useMemo, useRef, useState, useCallback } from 'react';
import { useWorkspaceManager } from '@/hooks/useWorkspaceManager';
import { useDispatch, useSelector } from 'react-redux';
import {
	createQuery,
	getQueriesOfSession,
	getSession,
} from '../service/new-chat.service';
import { useQuery } from '@tanstack/react-query';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import ResponseCard from '../ResponseCard';
import ira from '@/assets/icons/ira_icon.svg';
import { toast } from '@/lib/toast';
import Workspace from '../Workspace';
import AddQueryToDashboard from '../AddQueryToDashboard';
import AddToDashboardModal from '../add-to-dashboard/AddToDashboardModal';
import CreateDashboardDialog from '../../dashboard/components/CreateDashboardDialog';
import { createDashboard } from '../../dashboard/service/dashboard.service';
import { queryClient } from '@/lib/react-query';
import QueueStatus from '../QueueStatus';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { WorkspaceEditProvider } from '../components/WorkspaceEditProvider';
import CHAT_CONSTANTS, {
	CHAT_SESSION_STARTED_EVENT_DATA_KEY,
} from '@/constants/chat.constant';
import QueryDisplay from './components/QueryDisplay';
import Clarification, { CLARIFICATION_TYPE } from '../clarification';
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
import useDatasourceDetailsV2 from '@/api/datasource/hooks/useDatasourceDetailsV2';
import { LockKeyhole, PanelLeft } from 'lucide-react';
import { HamburgerMenuIcon } from '@radix-ui/react-icons';
import { Activity, Code, FileSearch } from 'lucide-react';
import LoadingContainer from '@/components/elements/loading/LoadingContainer';
import { unshareSession } from '@/api/share.service';
import {
	extractActivePath,
	getSiblingInfo,
	removeDescendantChoices,
} from './utils/conversationPath';
import SiblingNavigation from './components/SiblingNavigation';
import QueryActions from './components/QueryActions';
import { REDIRECTION_URL_AFTER_LOGIN } from '@/constants/login-constants';
import UnderstandingStats from './components/understanding-stats';
import { DATASOURCE_TYPES } from '@/constants/datasource.constant';

const Workzone = () => {
	const [value] = useLocalStorage('userDetails');
	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();
	const { pathname, navigate, query } = useRouter();

	const [currentSessionId, setCurrentSessionId] = useState(query?.sessionId);
	const [currentQueryId, setCurrentQueryId] = useState('');
	const [queries, setQueries] = useState([]);
	const [answers, setAnswers] = useState([]);
	const [sessionMode, setSessionMode] = useState('single');
	const [doingScience, setDoingScience] = useState([]);
	const [showSharedSessionModal, setShowSharedSessionModal] = useState(false);

	// Conversation branching state
	const [activePath, setActivePath] = useState({});
	const [userHasNavigated, setUserHasNavigated] = useState(false);
	const [disableAutoScroll, setDisableAutoScroll] = useState(false);
	const [editingQueryId, setEditingQueryId] = useState(null);

	// Derived: selected path and its leaf
	const selectedPathQueries = useMemo(() => {
		return extractActivePath(answers, activePath, userHasNavigated);
	}, [answers, activePath, userHasNavigated]);

	const selectedPathLeafId = useMemo(() => {
		if (!selectedPathQueries || selectedPathQueries.length === 0) return '';
		return selectedPathQueries[selectedPathQueries.length - 1]?.query_id || '';
	}, [selectedPathQueries]);

	const selectedPathLeafPending = useMemo(() => {
		if (!selectedPathLeafId) return false;
		const leaf = answers.find((a) => a?.query_id === selectedPathLeafId);
		if (!leaf) return false;
		return leaf.status !== 'done' && leaf.status !== 'failed';
	}, [answers, selectedPathLeafId]);

	// Fetch current session details to check if it's shared and track background processing
	const { data: currentSessionData, refetch: refetchSession } = useQuery({
		queryKey: ['session', currentSessionId],
		queryFn: () => getSession(currentSessionId),
		enabled: !!currentSessionId,
		staleTime: 60000, // Cache for 1 minute
		refetchOnWindowFocus: false, // Prevent unnecessary refetches when user returns to tab
		// Poll session status when active path has no pending queries but session might have background queries
		refetchInterval: () => {
			// Poll at 30-second intervals when active path is not pending (to catch background queries)
			return !selectedPathLeafPending ? 30000 : false;
		},
		refetchIntervalInBackground: true,
	});

	// React Query for fetching session data
	const {
		data: sessionQueriesData,
		isLoading: isQueriesLoading,
		error: sessionQueryError,
		refetch: refetchQueries,
	} = useQuery({
		queryKey: [
			'chat',
			'session',
			currentSessionId,
			'queries',
			selectedPathLeafId,
		],
		queryFn: () => getQueriesOfSession(currentSessionId),
		enabled: !!currentSessionId,
		refetchOnWindowFocus: false, // Prevent unnecessary refetches when user returns to tab
		// Only poll when user is actively waiting on current path
		refetchInterval: () => (selectedPathLeafPending ? 5000 : false),
		refetchIntervalInBackground: true,
	});

	useEffect(() => {
		if (!currentSessionId || !currentSessionData) {
			setShowSharedSessionModal(false);
			return;
		}

		setShowSharedSessionModal(!!currentSessionData?.metadata?.shared);
	}, [currentSessionId, currentSessionData]);

	// When session status becomes 'done', refetch queries to update UI
	useEffect(() => {
		if (!currentSessionData) return;

		// If session was in_progress and now is done/failed, do final query list fetch
		if (
			currentSessionData.status === 'done' ||
			currentSessionData.status === 'failed'
		) {
			// Only refetch if we're not already polling (not on pending leaf)
			if (!selectedPathLeafPending) {
				refetchQueries();
			}
		}
	}, [currentSessionData?.status, selectedPathLeafPending, refetchQueries]);

	// When user navigates to a path with no pending queries, check session status
	useEffect(() => {
		if (!selectedPathLeafPending && currentSessionId) {
			// Refetch session to check if there are background queries processing
			refetchSession();
		}
	}, [selectedPathLeafPending, currentSessionId, refetchSession]);

	// Use workspace manager hook
	const {
		isExpanded: isWorkspaceExpanded,
		workspaceQueryId,
		activeTab: workspaceActiveTab,
		visitedTabs: workspaceVisitedTabs,
		workspaceAnswer,
		expandWorkspace,
		collapseWorkspace,
		toggleWorkspace,
		switchTab: switchWorkspaceTab,
		switchWorkspaceQuery,
		hasWorkspaceContent,
		getAvailableTabs,
	} = useWorkspaceManager({ answers, currentQueryId });

	// Keep workspace content synced to active path leaf
	useEffect(() => {
		if (selectedPathLeafId) {
			setCurrentQueryId(selectedPathLeafId);
		}
	}, [selectedPathLeafId]);

	// Auto-sync workspace to current query when expanded
	useEffect(() => {
		if (isWorkspaceExpanded && currentQueryId !== workspaceQueryId) {
			switchWorkspaceQuery(currentQueryId);
		}
	}, [
		isWorkspaceExpanded,
		currentQueryId,
		// Note: Not including workspaceQueryId in dependencies to avoid running when manually expanded
	]);

	// Note: No longer syncing query IDs to Redux activeQueryId - using local state instead

	// Process session data callback
	const processSessionData = useCallback(
		(data) => {
			const res = data?.query_list;
			if (!res || res.length <= 0) return;

			// Update queries
			const tempQueries = res.map((item) => ({
				id: item?.query_id,
				question: item?.query,
				type: item?.type,
				metadata: item?.metadata,
				created_at: item?.created_at,
				updated_at: item?.updated_at,
				status: item?.status,
			}));
			setQueries(tempQueries);
			setSessionMode(res[0]?.type || 'single');

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
							Object.keys(existingAnswer?.answer).includes('graph');
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

			// Compute active path queries
			const activePathQueries = extractActivePath(
				res,
				activePath,
				userHasNavigated,
			);
			const activeQueryIds = new Set(activePathQueries.map((q) => q.query_id));

			// Update doing science state - only for queries in active path
			setDoingScience(() => {
				return res
					.filter((answerItem) => activeQueryIds.has(answerItem.query_id))
					.map((answerItem) => {
						const status = answerItem?.status !== 'done';
						return { queryId: answerItem?.query_id, status };
					});
			});
		},
		[activePath, userHasNavigated],
	);

	// Session management functions
	const changeSession = useCallback(
		(newSessionId) => {
			if (newSessionId !== currentSessionId) {
				setCurrentSessionId(newSessionId);
				setQueries([]);
				setAnswers([]);
				setDoingScience([]);
				// Note: workspace state is now managed by useWorkspaceManager hook
				setShowSharedSessionModal(false);
				setActivePath({});
				setUserHasNavigated(false);
				setDisableAutoScroll(false);
				setEditingQueryId(null);
			}
		},
		[currentSessionId],
	);

	const addQuery = useCallback((newQuery) => {
		setQueries((prev) => [...prev, newQuery]);
	}, []);

	const updateQuery = useCallback((queryId, updates) => {
		setQueries((prev) =>
			prev.map((q) => (q.id === queryId ? { ...q, ...updates } : q)),
		);
	}, []);

	const addDoingScience = useCallback((queryId) => {
		setDoingScience((prev) => [...prev, { queryId, status: true }]);
	}, []);

	const resetDoingScience = useCallback((targetState) => {
		setDoingScience((prev) =>
			prev.map((item) => ({ ...item, status: targetState })),
		);
	}, []);

	const setDoingScienceState = useCallback((newDoingScience) => {
		setDoingScience(newDoingScience);
	}, []);

	// Sibling navigation function
	const handleSiblingNavigation = useCallback(
		(parentId, newChildIndex, oldChildId) => {
			setUserHasNavigated(true); // Mark that user took control

			setActivePath((prev) => {
				const newPath = { ...prev };
				newPath[parentId] = newChildIndex;

				// Clear descendant choices from the old branch
				if (oldChildId) {
					removeDescendantChoices(newPath, answers, oldChildId);
				}

				return newPath;
			});
		},
		[answers],
	);

	// Process session data when it's available
	useEffect(() => {
		if (sessionQueriesData?.query_list) {
			processSessionData(sessionQueriesData);
			// Scroll to bottom when session data loads
			//scrollToBottom();
		}
	}, [sessionQueriesData, processSessionData]);

	// Handle session query errors
	useEffect(() => {
		if (sessionQueryError) {
			logError(sessionQueryError, {
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
			navigate(REDIRECTION_URL_AFTER_LOGIN);
		}
	}, [sessionQueryError]);

	const intervalRef = useRef();
	const scrollRef = useRef();

	// Note: workspace state is now managed by useWorkspaceManager hook

	const [prompt, setPrompt] = useState('');
	const [bulkPrompt, setBulkPrompt] = useState([
		{ id: 1, text: 'Hi' },
		{ id: 2, text: 'Bi' },
		{ id: 3, text: 'Ji' },
	]);
	const [dashboard, setDashboard] = useState({
		name: '',
		isCreating: false,
		showAdd: false,
		showSelectDashboard: false,
		selectedDashboard: null,
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
	const [activateGraphOnLast, setActivateGraphOnLast] = useState(false);

	// Track if this is a SQL workflow session based on workflow type from metadata
	const isSqlWorkflowSession =
		currentSessionData?.metadata?.type === 'SQL_WORKFLOW';

	// Detect if redirected from SQL workflow and disable input
	useEffect(() => {
		if (isSqlWorkflowSession) {
			setInputDisabled(true);
		}
	}, [isSqlWorkflowSession]);

	// Fetch datasource details (needed by handlers)
	const { data: datasourceData } = useDatasourceDetailsV2({
		queryOptions: { refetchOnWindowFocus: false },
	});

	// Edit handler
	const handleEdit = useCallback(
		(queryId) => {
			// Validation: prevent editing when input is disabled
			if (inputDisabled) {
				toast.error('Cannot edit while input is disabled');
				return;
			}

			// Validation: prevent editing another query if one is already being edited
			if (editingQueryId && editingQueryId !== queryId) {
				toast.error('Please finish editing the current query first');
				return;
			}

			setEditingQueryId(queryId);
		},
		[inputDisabled, editingQueryId],
	);

	// Save edit handler
	const handleSaveEdit = useCallback(
		(newPrompt) => {
			try {
				if (inputDisabled) return;

				const query = queries.find((q) => q.id === editingQueryId);
				if (!query || !newPrompt.trim()) return;

				const answer = answers.find((a) => a.query_id === editingQueryId);
				if (!answer) return;

				setActiveQueryProgress(null);

				const tempPrompt = newPrompt.trim();
				const newQuery = {
					id: '',
					question: tempPrompt,
					parentQueryId: answer.query_id,
				};

				addQuery(newQuery);

				// Create the edited query as a new branch
				const payload = {
					type: answer?.type || 'single',
					child_no: parseInt(answer.child_no) + 1,
					datasource_id: answer?.datasource_id,
					parent_query_id: answer?.parent_query_id,
					query: tempPrompt,
					session_id: answer?.session_id,
					workspace_changes: null,
					metadata: {
						...(answer?.metadata || {}),
						...(currentSessionData?.metadata?.plan_mode && {
							plan_mode: currentSessionData.metadata.plan_mode,
						}),
					},
				};

				createQuery(payload)
					.then((res) => {
						updateQuery('', { id: res.query_id, question: tempPrompt });
						addDoingScience(res?.query_id);
						// Note: currentQueryId will be updated automatically via selectedPathLeafId sync
						setUserHasNavigated(false); // Reset to auto-follow new query
						setDisableAutoScroll(false); // Reset scroll control

						// Scroll to bottom when edited query is added
						scrollToBottom();

						trackEvent(
							EVENTS_ENUM.CHAT_MESSAGE_SENT,
							EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
							() => ({
								chat_session_id: currentSessionId,
								dataset_id: answer?.datasource_id,
								dataset_name: datasourceData?.name,
								query_id: res?.query_id,
								message_type: 'user',
								message_source: 'edit_query',
								message_text: tempPrompt,
								is_clarification: false,
								message_number: queries?.length * 2 + 1,
								first_message_in_chat: false,
							}),
						);
						sendChatSessionStartedEvent({
							dataset_id: answer?.datasource_id,
							dataset_name: datasourceData?.name,
							start_method: 'edit_query',
							chat_session_id: answer?.session_id,
							chat_session_type: 'old',
						});

						queryClient.invalidateQueries(['chat-history']);
					})
					.catch((error) => {
						console.error('Edit query failed', error);
						logError(error, { feature: 'chat', action: 'edit-query' });
						toast.error('Failed to edit query');
					})
					.finally(() => {
						// inputDisabled is now controlled by session status
					});

				setResponseTimeElapsed(0);
				setBanners((prevState) => ({
					...prevState,
					showFailedResponse: false,
					showDelay: false,
				}));
			} catch (error) {
				console.error('Edit query failed', error);
				logError(error, { feature: 'chat', action: 'edit-query' });
				toast.error('Failed to edit query');
			} finally {
				setEditingQueryId(null);
			}
		},
		[
			editingQueryId,
			queries,
			answers,
			inputDisabled,
			currentSessionId,
			addQuery,
			updateQuery,
			addDoingScience,
			queryClient,
			datasourceData,
		],
	);

	// Cancel edit handler
	const handleCancelEdit = useCallback(() => {
		setEditingQueryId(null);
	}, []);

	const scrollToBottom = () => {
		// Use multiple attempts with increasing delays for reliability
		const scrollAttempts = [50, 150, 300, 500];

		scrollAttempts.forEach((delay, index) => {
			setTimeout(() => {
				if (scrollRef.current) {
					// Try scrollIntoView on a dummy element first
					const dummyElement =
						document.getElementById('scroll-dummy-bottom');
					if (dummyElement) {
						dummyElement.scrollIntoView({
							// behavior: 'smooth',
							block: 'end',
							inline: 'nearest',
						});
					} else {
						// Fallback to scrollTo method
						scrollRef.current.scrollTo({
							top: scrollRef.current.scrollHeight,
							// behavior: 'smooth',
						});
					}
				}
			}, delay);
		});
	};

	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const handleTabClick = (tab) => {
		// Track analytics with workspaceQueryId since workspace tabs are specific to the open workspace
		const queryIdForAnalytics = workspaceQueryId;

		if (tab === 'planner') {
			trackEvent(
				EVENTS_ENUM.PLANNER_TAB_CLICKED,
				EVENTS_REGISTRY.PLANNER_TAB_CLICKED,
				() => ({
					chat_session_id: currentSessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: queryIdForAnalytics,
				}),
			);
		} else if (tab === 'reference') {
			trackEvent(
				EVENTS_ENUM.REFERENCE_TAB_CLICKED,
				EVENTS_REGISTRY.REFERENCE_TAB_CLICKED,
				() => ({
					chat_session_id: currentSessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: queryIdForAnalytics,
				}),
			);
		} else if (tab === 'coder') {
			trackEvent(
				EVENTS_ENUM.CODER_TAB_CLICKED,
				EVENTS_REGISTRY.CODER_TAB_CLICKED,
				() => ({
					chat_session_id: currentSessionId,
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: queryIdForAnalytics,
				}),
			);
		}
		// Switch workspace tab using hook's function
		switchWorkspaceTab(tab);
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
		}
	};

	const handlePromptChange = (e) => {
		setPrompt(e.target.value);
	};

	const handleAppendQuery = (
		prompt,
		bulkQueries,
		savedQueryReference,
		mode = 'single',
	) => {
		try {
			if (inputDisabled) return;
			if (mode === 'single' && (!prompt || !prompt?.trim())) return;
			setActiveQueryProgress(null);
			const lastAns = answers[answers.length - 1];
			const tempPrompt = prompt;
			const newQuery = {
				id: '',
				question: tempPrompt,
				parentQueryId: lastAns?.query_id,
			};

			addQuery(newQuery);

			let metadata;
			if (bulkQueries && bulkQueries?.length > 0) {
				metadata = {
					queries: bulkQueries
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
			if (mode !== 'single' && metadata) {
				payload.metadata = {
					...metadata,
				};
			}
			if (mode === 'single' && currentSessionData?.metadata?.plan_mode) {
				payload.metadata = {
					...payload.metadata,
					plan_mode: currentSessionData.metadata.plan_mode,
				};
			}

			createQuery(payload).then((res) => {
				updateQuery('', { id: res.query_id, question: tempPrompt });
				addDoingScience(res?.query_id);
				// Note: currentQueryId will be updated automatically via selectedPathLeafId sync
				setUserHasNavigated(false); // Reset to auto-follow new query
				setDisableAutoScroll(false); // Reset scroll control

				// Scroll to bottom when new query is added
				scrollToBottom();

				trackEvent(
					EVENTS_ENUM.CHAT_MESSAGE_SENT,
					EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
					() => ({
						chat_session_id: res?.session_id,
						query_id: res?.query_id,
						dataset_id: lastAns?.datasource_id,
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
					dataset_id: lastAns?.datasource_id,
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
			// inputDisabled is now controlled by session status
		}
	};

	const handleRegenerateResponse = (answer, workspaceChanges) => {
		try {
			if (inputDisabled) return;
			const tempPrompt = workspaceChanges.query;
			const newQuery = {
				id: '',
				question: tempPrompt,
				parentQueryId: answer.query_id,
			};

			addQuery(newQuery);

			createQuery({
				child_no: parseInt(answer.child_no) + 1,
				datasource_id: answer?.datasource_id,
				// Make regenerate a sibling of current answer (same parent)
				parent_query_id: answer?.parent_query_id ?? null,
				query: tempPrompt,
				session_id: answer?.session_id,
				workspace_changes: workspaceChanges.apiConfig,
				metadata: {
					queries: answer?.metadata?.queries
						.filter((query) => query?.text?.length > 0)
						.map((item) => ({ query: item?.text })),
					saved_query_reference: answer?.metadata?.saved_query_reference,
					...(workspaceChanges && {
						workspace_id: workspaceChanges?.metadata?.workspace_id,
					}),
					...(currentSessionData?.metadata?.plan_mode && {
						plan_mode: currentSessionData.metadata.plan_mode,
					}),
				},
				type: answer?.type,
			}).then((res) => {
				updateQuery('', { id: res.query_id, question: tempPrompt });
				addDoingScience(res?.query_id);
				// Note: currentQueryId will be updated automatically via selectedPathLeafId sync
				setUserHasNavigated(false); // Reset to auto-follow new query
				setDisableAutoScroll(false); // Reset scroll control

				// Scroll to bottom when regenerated query is added
				scrollToBottom();

				trackEvent(
					EVENTS_ENUM.CHAT_MESSAGE_SENT,
					EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
					() => ({
						chat_session_id: currentSessionId,
						dataset_id: datasourceData?.datasource_id,
						dataset_name: datasourceData?.name,
						query_id: res?.query_id,
						message_type: 'user',
						message_source: 'regenerate_from_edit',
						message_text: tempPrompt,
						is_clarification: false,
						message_number: queries?.length * 2 + 1,
						first_message_in_chat: false,
					}),
				);
				sendChatSessionStartedEvent({
					dataset_id: datasourceData?.datasource_id,
					dataset_name: datasourceData?.name,
					start_method: 'regenerate_from_edit',
					chat_session_id: answer?.session_id,
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
					navigate(REDIRECTION_URL_AFTER_LOGIN);
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

			// Check for duplicate key error
			if (error.response?.data?.error_code === 'duplicate_key') {
				const errorMessage =
					error.response?.data?.message ||
					'A dashboard with this name already exists';
				setErrors({ dashboardName: errorMessage });
				toast.error(errorMessage);
			} else {
				toast.error('Something went wrong while creating dashboard');
			}
		}
	};

	const addClarificationQuery = async (clarificationPayload, currentQuery) => {
		if (inputDisabled) return;

		const answer = answers.find((a) => a.query_id === currentQuery?.id);
		if (!answer) return;

		const newQuery = {
			id: '',
			question: '',
			parentQueryId: answer.query_id,
		};

		addQuery(newQuery);

		const payload = {
			type: answer?.type || 'single',
			child_no: parseInt(answer.child_no) + 1,
			datasource_id: answer?.datasource_id,
			parent_query_id: answer.query_id,
			query: currentQuery?.question,
			session_id: answer?.session_id,
			metadata: {
				...(answer?.metadata || {}),
				...(currentSessionData?.metadata?.plan_mode && {
					plan_mode: currentSessionData.metadata.plan_mode,
				}),
				is_clarification: true,
			},
			clarification: clarificationPayload,
		};

		try {
			const res = await createQuery(payload);
			updateQuery('', { id: res.query_id, question: '' });

			// Mark the parent answer's clarification as clarified locally so UI reflects the change immediately
			try {
				setAnswers((prev) =>
					prev.map((ans) => {
						if (ans.query_id === answer.query_id) {
							return {
								...ans,
								answer: {
									...ans.answer,
									clarification: {
										...(ans.answer?.clarification || {}),
										...clarificationPayload,
										is_clarified: true,
									},
								},
							};
						}
						return ans;
					}),
				);
			} catch (e) {
				console.error('Failed to mark clarification locally', e);
			}
			addDoingScience(res?.query_id);
			// Note: currentQueryId will be updated automatically via selectedPathLeafId sync
			setUserHasNavigated(false); // Reset to auto-follow new query
			setDisableAutoScroll(false); // Reset scroll control

			// Scroll to bottom when edited query is added
			scrollToBottom();

			trackEvent(
				EVENTS_ENUM.CHAT_MESSAGE_SENT,
				EVENTS_REGISTRY.CHAT_MESSAGE_SENT,
				() => ({
					chat_session_id: currentSessionId,
					dataset_id: answer?.datasource_id,
					dataset_name: datasourceData?.name,
					query_id: res?.query_id,
					message_type: 'user',
					message_source: 'clarification',
					message_text: currentQuery?.query,
					is_clarification: false,
					message_number: queries?.length * 2 + 1,
					first_message_in_chat: false,
				}),
			);
			sendChatSessionStartedEvent({
				dataset_id: answer?.datasource_id,
				dataset_name: datasourceData?.name,
				start_method: 'clarification',
				chat_session_id: answer?.session_id,
				chat_session_type: 'old',
			});

			queryClient.invalidateQueries(['chat-history']);
			queryClient.invalidateQueries({
				queryKey: ['chat', 'session', currentSessionId, 'queries'],
			});

			setResponseTimeElapsed(0);
			setBanners((prevState) => ({
				...prevState,
				showFailedResponse: false,
				showDelay: false,
			}));
			return res;
		} catch (error) {
			setQueries((prev) => prev.filter((q) => q !== newQuery));
			console.error('Edit query failed', error);
			logError(error, { feature: 'chat', action: 'edit-query' });
			toast.error('Failed to clarify');
			throw error;
		} finally {
			setEditingQueryId(null);
		}
	};

	const [activePathQueries, isLastQueryHasNonTextClarification] = useMemo(() => {
		const activePathQueries = extractActivePath(
			answers,
			activePath,
			userHasNavigated,
		);
		const lastQuery = activePathQueries[activePathQueries.length - 1];

		const hasNonTextClarification =
			lastQuery?.answer?.clarification &&
			lastQuery?.answer?.clarification?.tool_data?.type &&
			lastQuery?.answer?.clarification?.tool_data?.type !==
				CLARIFICATION_TYPE.TEXT;

		return [activePathQueries, hasNonTextClarification];
	}, [answers, activePath, userHasNavigated]);

	const renderConversation = () => {
		if (activePathQueries.length === 0) {
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

		return (
			<div className="h-full w-full overflow-auto">
				<div className="sticky top-0 w-full px-4 pb-2 flex justify-end bg-white z-[10]">
					<UnderstandingStats
						activePathQueries={activePathQueries}
						doingScience={doingScience}
					/>
				</div>
				{activePathQueries?.map((answerElem, key) => {
					const query = queries.find((q) => q.id === answerElem.query_id);
					const hasClarification = !!answerElem?.answer?.clarification;
					const isClarificationQuery = query?.metadata?.is_clarification;
					const currentDoingScience =
						doingScience.find(
							(loadingObj) =>
								loadingObj.queryId === answerElem?.query_id,
						)?.status || false;
					const isAllDocuments = isUnstructuredData(datasourceData?.files);

					const showWorkspaceToggle = !hasClarification;

					// Get sibling information for navigation
					const siblingInfo = getSiblingInfo(answers, answerElem.query_id);

					// Handler for sibling navigation
					const handleNavigate = (newIndex) => {
						const oldSibling =
							siblingInfo.siblings[siblingInfo.currentIndex];
						handleSiblingNavigation(
							answerElem.parent_query_id,
							newIndex,
							oldSibling?.query_id,
						);
					};

					return (
						<div key={query.id} className="my-2 overflow-hidden">
							<div className={`ml-10 flex gap-2.5 flex-row-reverse`}>
								{/* <Avatar className="size-9">
											<AvatarImage src={value?.avatar} />
											<AvatarFallback>
												{getInitials(value.user_name)}
											</AvatarFallback>
										</Avatar> */}
								{/* Keep QueryDisplay layout untouched to preserve existing actions and min-width */}
								<QueryDisplay
									mode={query?.type}
									bulkPrompt={query?.metadata?.queries}
									workflowTitle={
										query?.metadata?.saved_query_reference
											?.title ||
										query?.metadata?.workflow_reference?.name
									}
									key={query.id}
									prompt={query?.question}
									isEditing={
										editingQueryId === answerElem.query_id
									}
									onSave={handleSaveEdit}
									onCancel={handleCancelEdit}
									createdAt={query?.created_at}
									isClarificationQuery={isClarificationQuery}
								/>
							</div>
							{/* Place sibling navigation in a separate row below the query to avoid disturbing existing action icons */}
							<div className="mt-1 flex justify-end">
								<QueryActions
									siblingInfo={siblingInfo}
									onNavigate={handleNavigate}
									onEdit={() => handleEdit(answerElem.query_id)}
									disabled={inputDisabled}
									disableEdit={
										inputDisabled ||
										answerElem?.type === 'workflow'
									}
									queryText={query?.question}
									queryId={answerElem.query_id}
									savedQueryReference={
										query?.metadata?.saved_query_reference
									}
									onDeleteSuccess={() => {
										// Refetch queries to update the UI after save/delete
										queryClient.invalidateQueries([
											'chat',
											'session',
											currentSessionId,
											'queries',
											selectedPathLeafId,
										]);
									}}
									setUserHasNavigated={setUserHasNavigated}
									setDisableAutoScroll={setDisableAutoScroll}
									isClarificationQuery={isClarificationQuery}
								/>
							</div>

							{/* <div className="mt-4 flex items-center space-x-2">
									<img src={ira} alt="ira" className="size-10" />
									{showWorkspaceToggle && (
										<Button
											variant="outline"
											className="text-sm font-semibold text-purple-100 hover:bg-white hover:text-purple-100 hover:opacity-80 flex items-center"
											onClick={() => {
												toggleIra(answerElem?.query_id);
											}}
											disabled={isAllDocuments}
										>
											<img
												src="https://d2vkmtgu2mxkyq.cloudfront.net/category.svg"
												className="me-1 size-5"
											/>
											{(workspace.show &&
												activeQueryId === answerElem?.query_id) ||
											!activeQueryId
												? 'Hide'
												: 'Show'}{' '}
											Workspace
										</Button>
									)}
									{hasClarification && <Clarification />}
								</div> */}

							<div className="mt-8">
								{!currentDoingScience && hasClarification ? (
									<div>
										<div className="flex items-start space-x-2 mb-4">
											<img
												src={ira}
												alt="ira"
												className="size-10"
											/>
											<Clarification
												data={
													answerElem?.answer?.clarification
												}
												addClarificationQuery={(payload) =>
													addClarificationQuery(
														payload,
														query,
													)
												}
												canClarify={!inputDisabled}
											/>
											{/* <ResponseCard
													answerResp={answerElem}
													isGraphLoading={isGraphLoading}
													setIsGraphLoading={setIsGraphLoading}
													setAnswerResp={setAnswers}
													setDoingScience={setDoingScience}
													setResponseTimeElapsed={
														setResponseTimeElapsed
													}
													setBanners={setBanners}
													doingScience={currentDoingScience}
													setDashboard={setDashboard}
													showTable={
														!answerElem?.answer
															?.response_dataframe &&
														answerElem?.answer?.graph
													}
													setIsTableLoading={setIsTableLoading}
													isTableLoading={isTableLoading}
													hasClarification={hasClarification}
													showWorkspaceToggle={showWorkspaceToggle}
													toggleWorkspace={toggleWorkspace}
													queryId={query?.id}
													isAllDocuments={isAllDocuments}
													workspaceQueryId={workspaceQueryId}
													isWorkspaceExpanded={isWorkspaceExpanded}
													isLastQuery={
														answerElem.query_id ===
														answers[answers.length - 1]?.query_id
													}
													updatedAt={query?.updated_at}
												/> */}
										</div>
									</div>
								) : (
									<div className="flex items-start space-x-3 w-full max-w-full overflow-hidden">
										<img
											src={ira}
											alt="ira"
											className="size-10"
										/>

										<div className="w-full max-w-full">
											{currentDoingScience && (
												<QueueStatus
													text={
														answerElem?.status_text ||
														'Doing Science'
													}
												/>
											)}

											<div className="flex-1 min-w-0">
												<ResponseCard
													answerResp={answerElem}
													isGraphLoading={isGraphLoading}
													setIsGraphLoading={
														setIsGraphLoading
													}
													setAnswerResp={setAnswers}
													setDoingScience={setDoingScience}
													setResponseTimeElapsed={
														setResponseTimeElapsed
													}
													setBanners={setBanners}
													doingScience={
														currentDoingScience
													}
													setDashboard={setDashboard}
													showTable={
														!answerElem?.answer
															?.response_dataframe &&
														answerElem?.answer?.graph
													}
													setIsTableLoading={
														setIsTableLoading
													}
													isTableLoading={isTableLoading}
													hasClarification={
														hasClarification
													}
													showWorkspaceToggle={
														showWorkspaceToggle
													}
													toggleWorkspace={toggleWorkspace}
													queryId={query?.id}
													isAllDocuments={isAllDocuments}
													workspaceQueryId={
														workspaceQueryId
													}
													isWorkspaceExpanded={
														isWorkspaceExpanded
													}
													isLastQuery={
														answerElem.query_id ===
														answers[answers.length - 1]
															?.query_id
													}
													updatedAt={query?.updated_at}
													currentSessionData={
														currentSessionData
													}
													sessionQueriesData={
														sessionQueriesData
													}
												/>
											</div>
										</div>
									</div>
								)}
							</div>
						</div>
					);
				})}
			</div>
		);
	};

	const clearPolling = () => {
		clearInterval(intervalRef.current);
	};

	const closeReportGenerateModal = () => {
		dispatch(
			updateUtilProp([{ key: 'isGenerateReportModalOpen', value: false }]),
		);
	};

	const showWorkSpace = () => {
		// Use workspaceAnswer from hook which already handles query lookup
		const hasClarification = !!workspaceAnswer?.answer?.clarification;
		const isAllDocuments = isUnstructuredData(datasourceData?.files);
		return isWorkspaceExpanded && !hasClarification && !isAllDocuments;
	};

	useEffect(() => {
		const allDone =
			doingScience.length && doingScience.every((item) => !item.status);
		if (allDone) {
			clearPolling();
			// Don't scroll to bottom during sibling navigation or when auto-scroll is disabled
			if (!userHasNavigated && !disableAutoScroll) {
				scrollToBottom();
			}
			setActivateGraphOnLast(true);
			// Invalidate queries to refresh session list with updated status
			queryClient.invalidateQueries(['chat-history']);
			queryClient.invalidateQueries(['session', currentSessionId]);
			// inputDisabled is now controlled by session status, not doingScience
			// Do not reset userHasNavigated; preserve path selection on completion
			return;
		}
		// Note: currentQueryId is now auto-synced via selectedPathLeafId
		// No need to manually set active query here
	}, [
		doingScience,
		currentSessionId,
		queryClient,
		userHasNavigated,
		disableAutoScroll,
	]);

	// useEffect(() => {
	// 	scrollToBottom();
	// }, []);

	// Update session ID when URL changes
	useEffect(() => {
		if (query?.sessionId && query.sessionId !== currentSessionId) {
			changeSession(query.sessionId);
			setPrompt('');
			setBanners({
				showFailedResponse: false,
				showDelay: false,
			});
			scrollToBottom();
		}
	}, [query?.sessionId, currentSessionId, changeSession]);

	// Reset when queries length changes
	useEffect(() => {
		if (queries.length > 0) {
			setActivateGraphOnLast(false);
		}
	}, [queries.length]);

	// Update input disabled based on in-progress queries
	useEffect(() => {
		// Always keep input disabled if this is a SQL workflow session
		if (isSqlWorkflowSession) return;

		// Disable input if session has any query in progress (including background queries)
		const sessionHasProcessing = currentSessionData?.status === 'in_progress';
		setInputDisabled(sessionHasProcessing);
	}, [currentSessionData?.status, isSqlWorkflowSession]);

	// Reset userHasNavigated when new query is added (starts processing)
	useEffect(() => {
		const hasInProgress = doingScience.some((item) => item.status === true);
		if (hasInProgress) {
			// New query started, reset to auto-follow mode
			setUserHasNavigated(false);
			setDisableAutoScroll(false);
			// Reset editing state when new query starts processing
			setEditingQueryId(null);
		}
	}, [doingScience]);

	useEffect(() => {
		// Don't re-enable input if this is a SQL workflow session
		if (isSqlWorkflowSession) return;

		if (queries.length > 0) {
			queries.some((query) => query.status !== 'done')
				? setInputDisabled(true)
				: setInputDisabled(false);
		} else {
			setInputDisabled(false);
		}
	}, [queries, isSqlWorkflowSession]);

	// useEffect(() => {}, [utilReducer?.isGenerateReportModalOpen]);

	// useEffect(() => {}, [processedFiles]);

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

	// answerResp now uses workspaceAnswer from hook which is already computed
	const answerResp = workspaceAnswer || answers?.[0];

	const availableTabs = useMemo(() => {
		if (!answerResp?.answer) return [];
		return ['planner', 'reference', 'coder'].filter(
			(tab) => answerResp?.answer?.[tab]?.tool_space === 'secondary',
		);
	}, [answerResp?.answer]);

	const displayedTabs = useMemo(() => {
		const isCurrentQueryInProgress = doingScience.find(
			(item) => item.queryId === currentQueryId,
		)?.status;
		if (isCurrentQueryInProgress) return ['planner', 'reference', 'coder'];

		const currentQueryAnswer = answers.find(
			(a) => a.query_id === currentQueryId,
		);
		return currentQueryAnswer?.answer
			? ['planner', 'reference', 'coder'].filter(
					(tab) => !!currentQueryAnswer?.answer?.[tab],
				)
			: [];
	}, [doingScience, currentQueryId, answers]);

	const isLoading =
		!answerResp?.answer ||
		!availableTabs ||
		!availableTabs.length ||
		doingScience.some((item) => item.status);

	const handleAddSharedSession = async () => {
		try {
			await unshareSession(currentSessionId);
			toast.success('Session added successfully!');
		} catch (error) {
			console.error('Failed to unshare session:', error);
			toast.error('Failed to add session.');
		} finally {
			setShowSharedSessionModal(false);
		}
	};

	return (
		<div className="flex gap-4 px-4 w-full overflow-hidden pb-4 transition-all duration-500 ease-in-out">
			<div
				className={`border rounded-2xl shadow-1xl flex flex-col h-full overflow-hidden transition-all duration-500 ease-in-out ${
					showWorkSpace() ? 'w-2/3' : 'w-11/12'
				}`}
			>
				<div
					ref={scrollRef}
					className={cn(
						'flex-1 overflow-y-auto p-4 transition-all duration-300',
						showSharedSessionModal
							? 'blur-sm pointer-events-none select-none'
							: '',
					)}
				>
					{renderConversation()}
					<div id="scroll-dummy-bottom" className="h-1" />
				</div>
				<div
					className={`bg-white p-4 ${showSharedSessionModal ? '' : 'border-t'}`}
				>
					<div className="relative">
						<InputArea
							config={config}
							onAppendQuery={handleAppendQuery}
							disabled={inputDisabled}
							isWorkflowLocked={isSqlWorkflowSession}
							isDisabledWithoutLoading={
								isLastQueryHasNonTextClarification
							}
						/>{' '}
						{showSharedSessionModal && (
							<div
								className="absolute -top-8 left-0 w-full flex items-center justify-center bg-white/90 backdrop-blur-sm z-50 rounded-xl pointer-events-auto"
								style={{ height: 'calc(100% + 2rem)' }}
							>
								<div className="bg-white rounded-xl shadow-xl w-full h-full p-6 text-center border border-gray-200 flex flex-col justify-center">
									<p className="flex items-start justify-center text-sm font-normal text-primary80 mb-2">
										<LockKeyhole className="mr-2 w-4 h-4 shrink-0" />
										This session has been shared by your team
										member. To continue the session, add this
										session to your account.
									</p>

									<Button
										className="w-fit bg-primary text-white font-normal mx-auto"
										onClick={handleAddSharedSession}
									>
										Add session
									</Button>
								</div>
							</div>
						)}
					</div>

					<p className="text-xs text-center text-primary40 font-normal mt-2">
						Irame.ai may display inaccurate info, including about people,
						so double-check its responses.
					</p>
				</div>
			</div>

			<div
				className={cn(
					`transition-all duration-500 ease-in-out border rounded-2xl shadow-1xl flex flex-col ${
						isWorkspaceExpanded
							? 'w-1/3 p-4'
							: 'w-[6rem] items-center py-5 px-3 space-y-6'
					}`,
					showSharedSessionModal
						? 'blur-sm pointer-events-none select-none'
						: '',
				)}
			>
				{isWorkspaceExpanded ? (
					<WorkspaceEditProvider
						editDisabled={inputDisabled}
						regenerator={handleRegenerateResponse}
					>
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
							<PanelLeft
								className="h-10 w-10 p-2 text-primary60 cursor-pointer"
								onClick={() => collapseWorkspace()}
							/>
						</div>
						<Workspace
							handleTabClick={handleTabClick}
							workspace={{
								show: isWorkspaceExpanded,
								activeTab: workspaceActiveTab,
								visitedTabs: workspaceVisitedTabs,
							}}
							answerResp={workspaceAnswer || answers?.[0]}
							canEdit={
								!(import.meta.env.VITE_QNA_DISABLED === 'true') &&
								answers.every((item) => item?.status === 'done')
							}
							setWorkspace={() => {}}
							sessionQueriesData={sessionQueriesData}
						/>
					</WorkspaceEditProvider>
				) : (
					<>
						<button onClick={() => toggleWorkspace()} className="mb-2">
							<PanelLeft className="h-10 w-10 p-2 text-primary60" />
						</button>

						<div className="flex flex-col gap-8 items-center">
							{displayedTabs.includes('planner') && (
								<button
									onClick={() =>
										expandWorkspace(currentQueryId, 'planner')
									}
									className="flex flex-col items-center focus:outline-none"
								>
									{isLoading ? (
										<LoadingContainer width={2.5}>
											<Activity className="h-5 w-5 text-primary100" />
										</LoadingContainer>
									) : (
										<span className="p-2 rounded-full border flex items-center justify-center">
											<Activity className="h-5 w-5 text-primary100" />
										</span>
									)}
									<p className="mt-2 text-sm text-primary80">
										Planner
									</p>
								</button>
							)}

							{displayedTabs.includes('reference') &&
								sessionQueriesData?.datasource_details
									?.datasource_type !==
									DATASOURCE_TYPES.SQL_GENERATED && (
									<button
										onClick={() =>
											expandWorkspace(
												currentQueryId,
												'reference',
											)
										}
										className="flex flex-col items-center focus:outline-none"
									>
										{isLoading ? (
											<LoadingContainer width={2.5}>
												<FileSearch className="h-5 w-5 text-primary100" />
											</LoadingContainer>
										) : (
											<span className="p-2 rounded-full border flex items-center justify-center">
												<FileSearch className="h-5 w-5 text-primary100" />
											</span>
										)}
										<p className="mt-2 text-sm text-primary80">
											Reference
										</p>
									</button>
								)}

							{displayedTabs.includes('coder') && (
								<button
									onClick={() =>
										expandWorkspace(currentQueryId, 'coder')
									}
									className="flex flex-col items-center focus:outline-none"
								>
									{isLoading ? (
										<LoadingContainer width={2.5}>
											<Code className="h-5 w-5 text-primary100" />
										</LoadingContainer>
									) : (
										<span className="p-2 rounded-full border flex items-center justify-center">
											<Code className="h-5 w-5 text-primary100" />
										</span>
									)}
									<p className="mt-2 text-sm text-primary100">
										Coder
									</p>
								</button>
							)}
						</div>
					</>
				)}
			</div>

			{/* Original AddQueryToDashboard - commented out */}
			{/* {dashboard?.showAdd && (
			<AddQueryToDashboard
				open={dashboard.showAdd}
				setDashboard={setDashboard}
				newDashboardIds={newDashboardIds}
				queryId={dashboard.queryId}
			/>
		)} */}

			{(dashboard?.showSelectDashboard || dashboard?.showAdd) && (
				<AddToDashboardModal
					open={dashboard.showSelectDashboard || dashboard.showAdd}
					onClose={() =>
						setDashboard((prev) => ({
							...prev,
							showSelectDashboard: false,
							showAdd: false,
							selectedDashboard: null,
						}))
					}
					queryId={dashboard.queryId}
					initialSelectedDashboardId={dashboard?.selectedDashboard?.id}
					initialSelectedDashboard={dashboard?.selectedDashboard}
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
