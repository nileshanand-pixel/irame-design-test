import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useEffect, useState, useMemo } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import {
	deleteSession,
	getUserSession,
} from './features/new-chat/service/new-chat.service';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { logError } from '@/lib/logger';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import InputText from './elements/InputText';
import { resetChatStore, updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import useInfiniteScroll from '@/hooks/useInfiniteScroll';
import Spinner from './elements/loading/Spinner';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import GradientSpinner from './elements/loading/GradientSpinner';
import { updateAuthStoreProp, setSelectedTeam } from '@/redux/reducer/authReducer';
import {
	deleteRunningWorkflow,
	getRecentWorkflowsRunsHomePage,
} from './features/business-process/service/workflow.service';
import { getUserTeams } from '@/api/gatekeeper/team.service';
import { ENABLE_RBAC } from '@/config';
import { useRbac } from '@/hooks/useRbac';
import upperFirst from 'lodash.upperfirst';
import { resetAllStores } from '@/redux/GlobalStore';
import { Hint } from './Hint';
import Tag from './elements/Tag';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';
import { TbSparkles } from 'react-icons/tb';
import { useSessionId } from '@/hooks/use-session-id';
import { queryClient } from '@/lib/react-query';
import useConfirmDialog from '@/hooks/use-confirm-dialog';
import SessionSkeleton from './elements/SessionSkeleton';
import { Check, Share2 } from 'lucide-react';
import homeIcon from '@/assets/icons/home.svg';
import sidenavIcon from '@/assets/icons/sidenav.svg';
import chevronDownIcon from '@/assets/icons/chevron-down.svg';
import { useQuery } from '@tanstack/react-query';
import { useNavigationGuard } from '@/contexts/NavigationGuardContext';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const SideNav = ({ isSideNavOpen, toggleSideNav }) => {
	const [activeTab, setActiveTab] = useState('');
	const [isEditing, setIsEditing] = useState(-1);
	const [sessionTitle, setSessionTitle] = useState('');
	const [expandedBusinessProcesses, setExpandedBusinessProcesses] = useState([]);
	const sessionId = useSessionId();
	const [ConfirmationDialog, confirm] = useConfirmDialog();
	const [teamSearchQuery, setTeamSearchQuery] = useState('');
	const { getGuard } = useNavigationGuard();

	const { pathname, navigate } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	// auth slice is registered under `authStoreReducer` in GlobalStore
	const { user_id, selectedTeamId } = useSelector(
		(state) => state.authStoreReducer || {},
	);
	const { isRbacActive } = useRbac();
	const dispatch = useDispatch();

	// Fetch teams from Gatekeeper
	const teamsQueryKey = useMemo(() => ['user-teams', user_id], [user_id]);
	const { data: teamsData, isLoading: isTeamsLoading } = useQuery({
		queryKey: teamsQueryKey,
		queryFn: getUserTeams,
		enabled: isRbacActive && !!user_id,
		staleTime: 60000, // 1 minute
	});

	// Use useMemo to avoid new array reference on every render
	const teams = useMemo(() => teamsData?.data || [], [teamsData]);

	// Handle team selection, persistence and validation
	useEffect(() => {
		if (isRbacActive && user_id && teams.length > 0) {
			const isCurrentTeamValid = teams.some(
				(t) => (t.externalId || t.id) === selectedTeamId,
			);

			if (!selectedTeamId || !isCurrentTeamValid) {
				const savedTeamId = localStorage.getItem(`team_${user_id}`);
				const isSavedTeamValid =
					savedTeamId &&
					teams.some((t) => (t.externalId || t.id) === savedTeamId);

				if (isSavedTeamValid) {
					dispatch(setSelectedTeam(savedTeamId));
				} else {
					const firstTeamId = teams[0].externalId || teams[0].id;
					dispatch(setSelectedTeam(firstTeamId));
				}
			}
		}
	}, [user_id, teams, selectedTeamId, dispatch]);

	// Get selected team name
	const selectedTeamData = useMemo(
		() => teams.find((team) => (team.externalId || team.id) === selectedTeamId),
		[teams, selectedTeamId],
	);

	const selectedTeamName = selectedTeamData?.name || 'Select Team';

	// Filter teams based on search query
	const filteredTeams = useMemo(
		() =>
			teams.filter((team) =>
				team?.name?.toLowerCase().includes(teamSearchQuery.toLowerCase()),
			),
		[teams, teamSearchQuery],
	);

	const [pollingEnabled, setPollingEnabled] = useState(false);

	// Delay session polling by 30s to reduce initial burst
	useEffect(() => {
		const timer = setTimeout(() => setPollingEnabled(true), 30000);
		return () => clearTimeout(timer);
	}, []);

	const chatHistoryQueryKey = useMemo(() => ['chat-history'], []);
	const {
		data: sessionsData,
		isLoading,
		isFetchingNextPage,
		hasNextPage,
		fetchNextPage,
		Sentinel,
	} = useInfiniteScroll({
		queryKey: chatHistoryQueryKey,
		queryFn: getUserSession,
		paginationType: 'cursor',
		options: {
			limit: 20,
			refetchInterval: pollingEnabled ? 20000 : false,
		},
	});

	const { data: recentWorkflowRuns, isLoading: isBusinessLoading } = useQuery({
		queryKey: ['get-business-processes-home-page'],
		queryFn: () => getRecentWorkflowsRunsHomePage(),
	});

	const bottomMenuList = [
		{
			group: '',
			items: [
				{
					link: '/app/home',
					text: 'Home',
					icon: homeIcon,
					showHint: true,
				},
				{
					link: '/app/business-process',
					text: 'Business Process',
					icon: 'https://d2vkmtgu2mxkyq.cloudfront.net/workflow_icon.svg',
					// beta: true,
					showHint: true,
					trackingCall: () => {
						trackEvent(
							EVENTS_ENUM.SIDE_BAR_BUSSINESS_PROCESS_CLICKED,
							EVENTS_REGISTRY.SIDE_BAR_BUSSINESS_PROCESS_CLICKED,
						);
					},
				},
				{
					link: '/app/dashboard?source=side_bar',
					text: 'Dashboard',
					icon: 'https://d2vkmtgu2mxkyq.cloudfront.net/dashboard_columns.svg',
					trackingCall: () =>
						trackEvent(
							EVENTS_ENUM.SIDE_BAR_DASHBOARD_CLICKED,
							EVENTS_REGISTRY.SIDE_BAR_DASHBOARD_CLICKED,
						),
				},

				{
					link: '/app/reports?source=side_bar',
					text: 'Reports',
					icon: 'https://d2vkmtgu2mxkyq.cloudfront.net/report-icon.svg',
					// beta: true,
					trackingCall: () =>
						trackEvent(
							EVENTS_ENUM.SIDE_BAR_REPORT_CLICKED,
							EVENTS_REGISTRY.SIDE_BAR_REPORT_CLICKED,
						),
				},

				{
					link: '/app/ai-concierge',
					text: 'AI Concierge',
					icon: TbSparkles,
					showHint: true,
					beta: true,
					trackingCall: () =>
						trackEvent(
							EVENTS_ENUM.SIDE_BAR_AI_CONCIERGE_CLICKED,
							EVENTS_REGISTRY.SIDE_BAR_AI_CONCIERGE_CLICKED,
						),
				},
				{
					link: '/app/configuration?source=side_bar',
					text: 'Configuration',
					icon: 'https://d2vkmtgu2mxkyq.cloudfront.net/database.svg',
					trackingCall: () =>
						trackEvent(
							EVENTS_ENUM.SIDE_BAR_CONFIGURATION_CLICKED,
							EVENTS_REGISTRY.SIDE_BAR_CONFIGURATION_CLICKED,
						),
				},
			],
		},
	];

	const getChatHistory = (session) => {
		if (sessionId === session.session_id) return;
		dispatch(resetChatStore());
		navigate(
			`/app/new-chat/session?sessionId=${session.session_id}&source=side_bar&datasource_id=${session.datasource_id}`,
		);
		dispatch(
			updateChatStoreProp([
				{
					key: 'activeChatSession',
					value: { id: session.session_id, title: session.title },
				},
				{ key: 'refreshChat', value: true },
				{ key: 'resetIra', value: !chatStoreReducer?.resetIra },
			]),
		);
	};

	const handleRedirectionAfterDeletion = (threadSessionId, threadWorkflowId) => {
		if (sessionId === threadSessionId || pathname.includes(threadWorkflowId)) {
			dispatch(resetChatStore());
			navigate('/app/home');
		}
	};

	const handleDeleteChatSession = async (e, sessionId, threadType, workflowId) => {
		e.stopPropagation();
		try {
			const confirmed = await confirm({
				header: 'Delete Session?',
				description:
					'This will permanently delete this chat session and all its messages. This action cannot be undone.',
			});
			if (!confirmed) return;

			handleRedirectionAfterDeletion(sessionId, workflowId);

			await deleteSession(sessionId);
			trackEvent(
				EVENTS_ENUM.SIDE_BAR_CHAT_DELETED,
				EVENTS_REGISTRY.SIDE_BAR_CHAT_DELETED,
				() => ({
					type: threadType,
					chat_session_id: sessionId,
					workflow_id: workflowId,
				}),
			);
			// Invalidate queries to trigger re-fetch with updated data
			if (threadType === 'workflow') {
				queryClient.invalidateQueries({
					queryKey: ['get-business-processes-home-page'],
				});
			} else {
				queryClient.invalidateQueries({ queryKey: ['chat-history'] });
			}
		} catch (error) {
			logError(error, {
				feature: 'sidenav',
				action: 'handleDeletion',
				extra: {
					sessionId,
					workflowId,
					threadType,
					errorMessage: error.message,
				},
			});
		}
	};

	const handleRunningWorkflowDeletion = async (
		e,
		sessionId,
		workflowId,
		runId,
	) => {
		e.stopPropagation();
		try {
			const confirmed = await confirm({
				header: 'Delete Workflow Session?',
				description:
					'This will permanently delete this workflow session and all its progress. This action cannot be undone.',
			});
			if (!confirmed) return;

			handleRedirectionAfterDeletion(sessionId, workflowId);

			await deleteRunningWorkflow(runId);
			trackEvent(
				EVENTS_ENUM.SIDE_BAR_CHAT_DELETED,
				EVENTS_REGISTRY.SIDE_BAR_CHAT_DELETED,
				() => ({
					type: 'workflow',
					chat_session_id: sessionId,
					workflow_id: workflowId,
				}),
			);
			queryClient.invalidateQueries({
				queryKey: ['get-business-processes-home-page'],
			});
		} catch (error) {
			logError(error, {
				feature: 'sidenav',
				action: 'handleRunningWorkflowDeletion',
				extra: {
					sessionId,
					workflowId,
					runId,
					errorMessage: error.message,
				},
			});
		}
	};

	const handleAskIraClick = (e) => {
		e.preventDefault();
		trackEvent(
			EVENTS_ENUM.SIDE_BAR_ASK_IRA_CLICKED,
			EVENTS_REGISTRY.SIDE_BAR_ASK_IRA_CLICKED,
		);
		dispatch(
			updateUtilProp([{ key: 'isDatasourceSelectionModalOpen', value: true }]),
		);
	};

	const groupItemsByDate = (items) => {
		const today = [];
		const yesterday = [];
		const last7Days = [];
		const earlier = [];

		items.forEach((item) => {
			const itemDate = dayjs(item.date);
			if (itemDate.isToday()) {
				today.push(item);
			} else if (itemDate.isYesterday()) {
				yesterday.push(item);
			} else if (itemDate.isAfter(dayjs().subtract(7, 'day'))) {
				last7Days.push(item);
			} else {
				earlier.push(item);
			}
		});

		return { today, yesterday, last7Days, earlier };
	};

	const renderSession = (session) => {
		const isActiveSession = sessionId === session.session_id;
		let showSpinner = session.status === 'in_progress';
		const sessionIconUrl = session?.metadata?.workflow_run_id
			? 'https://d2vkmtgu2mxkyq.cloudfront.net/sidenav_workflow_icon.svg'
			: 'https://d2vkmtgu2mxkyq.cloudfront.net/chat.svg';
		const isWorkflow = !!session?.metadata?.workflow_run_id;

		return (
			<div
				className={cn(
					'flex items-center justify-between text-primary80 w-full rounded-lg py-2 pl-1 text-sm font-medium cursor-pointer hover:bg-purple-4',
					isActiveSession ? 'bg-purple-10' : '',
				)}
				key={session.session_id}
				onClick={(e) => {
					trackEvent(
						EVENTS_ENUM.SIDE_BAR_CHAT_THREAD_CLICKED,
						EVENTS_REGISTRY.SIDE_BAR_CHAT_THREAD_CLICKED,
						() => ({
							type: 'qna',
							chat_session_id: session.session_id,
						}),
					);
					if (isEditing === session.session_id) return;
					e.stopPropagation();
					getChatHistory(session);
				}}
			>
				<div
					className={cn(
						'flex items-center w-48',
						isEditing === session.session_id ? '' : 'px-2 py-1',
					)}
				>
					<div className="flex-shrink-0">
						{showSpinner ? (
							<GradientSpinner tailwindBg="bg-[#E6D7F7]" width="1" />
						) : session.metadata?.shared ? (
							<Share2 className="h-4 w-4 text-primary80" />
						) : (
							<img
								src={sessionIconUrl}
								alt="ask-ira"
								className={isWorkflow ? 'size-6' : 'size-5'}
							/>
						)}
					</div>

					<div className="ml-3 min-w-0 flex-1 flex items-center gap-2">
						{isEditing === session.session_id ? (
							<InputText
								value={sessionTitle}
								setValue={(value, e) => {
									e.stopPropagation();
									setSessionTitle(value);
								}}
								className="w-full bg-transparent border-none text-primary80 font-medium truncate"
							/>
						) : (
							<p className="truncate text-primary80 font-medium">
								{session.title}
							</p>
						)}
					</div>
				</div>

				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<i
							className="bi-three-dots-vertical me-3 items-end hover:bg-purple-4 rounded-[0.25rem] py-1"
							onClick={(e) => e.stopPropagation()}
						></i>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							className="text-primary80 font-medium hover:!bg-purple-2"
							onClick={(e) =>
								handleDeleteChatSession(e, session.session_id, 'qna')
							}
						>
							<i className="bi-trash me-2 text-primary80 font-medium"></i>
							Delete
						</DropdownMenuItem>
					</DropdownMenuContent>
				</DropdownMenu>
			</div>
		);
	};

	const toggleBusinessProcess = (bpId) => {
		setExpandedBusinessProcesses((prev) =>
			prev.includes(bpId) ? prev.filter((id) => id !== bpId) : [...prev, bpId],
		);
	};

	const renderBusinessProcess = (bp) => {
		const isExpanded = expandedBusinessProcesses.includes(
			bp.business_process_id,
		);

		return (
			<div key={bp.business_process_id} className="flex flex-col ">
				{/* Parent Item */}
				<div
					className="flex items-center justify-between w-full rounded-lg py-2 pl-2 pr-2 text-sm font-medium cursor-pointer hover:bg-purple-4 group"
					onClick={() => toggleBusinessProcess(bp.business_process_id)}
				>
					<div className="flex items-center gap-3 flex-1 min-w-0">
						<div className="flex items-center flex-1 min-w-0">
							<img
								src="https://d2vkmtgu2mxkyq.cloudfront.net/gear.svg"
								alt="business-process"
								className="size-6 shrink-0"
							/>
							<span className="ml-3 truncate text-primary80">
								{upperFirst(bp.business_process_name)}
							</span>
						</div>

						<i
							className={`bi-chevron-${isExpanded ? 'down' : 'right'} 
					transition-transform duration-200 text-primary60
					`}
						/>
					</div>
				</div>

				{isExpanded && (
					<div className="ml-4 border-l-[0.25rem] border-gray-300 rounded-sm pl-2 space-y-1">
						{bp.workflows.map((workflow) => renderWorkflow(workflow))}
					</div>
				)}
			</div>
		);
	};

	const renderWorkflow = (workflow) => {
		const isActive = sessionId === workflow.session_id;
		const showSpinner = workflow.status !== 'COMPLETED';
		const shouldOpenSession = ['RUNNING', 'COMPLETED', 'FAILED'].includes(
			workflow.status,
		);

		return (
			<div
				className={cn(
					'flex items-center justify-between w-full rounded-lg py-1 pr-2 text-sm font-medium cursor-pointer',
					'hover:bg-purple-4 group transition-colors',
					isActive ? 'bg-purple-10' : '',
				)}
				key={workflow.external_id}
				onClick={() => {
					trackEvent(
						EVENTS_ENUM.SIDE_BAR_CHAT_THREAD_CLICKED,
						EVENTS_REGISTRY.SIDE_BAR_CHAT_THREAD_CLICKED,
						() => ({
							type: 'workflow',
							chat_session_id: workflow.session_id,
							workflow_id: workflow.workflow_check_id,
						}),
					);
					if (shouldOpenSession) {
						resetAllStores();
						dispatch(
							updateChatStoreProp([
								{ key: 'refreshChat', value: true },
								{
									key: 'resetIra',
									value: !chatStoreReducer?.resetIra,
								},
							]),
						);
						navigate(
							`/app/new-chat/session/?sessionId=${workflow.session_id}&source=side_bar&datasource_id=${workflow.datasource_id}`,
						);
					} else {
						navigate(
							`/app/business-process/${workflow.business_process_id}/workflows/${workflow.workflow_check_id}?run_id=${workflow.external_id}&datasource_id=${workflow.datasource_id}`,
						);
					}
				}}
			>
				<div className="flex items-center gap-3 flex-1 min-w-0 pl-3">
					<div className="size-5 flex items-center justify-center shrink-0">
						{showSpinner ? (
							<GradientSpinner tailwindBg="bg-[#E6D7F7]" width="1" />
						) : (
							<img
								src="https://d2vkmtgu2mxkyq.cloudfront.net/workflow_icon.svg"
								alt="workflow"
								className="size-5"
							/>
						)}
					</div>
					<div className="flex gap-2 items-center flex-1 min-w-0">
						<span className="truncate text-primary80">
							{workflow.workflow_check_name}
						</span>
					</div>

					<DropdownMenu>
						<DropdownMenuTrigger asChild>
							<button
								className="group-hover:opacity-100 transition-opacity
							   text-primary60 hover:text-primary80 p-1 rounded"
								onClick={(e) => e.stopPropagation()}
							>
								<i className="bi-three-dots-vertical text-base" />
							</button>
						</DropdownMenuTrigger>
						<DropdownMenuContent align="start" className="min-w-[120px]">
							<DropdownMenuItem
								className="text-primary80 font-medium hover:!bg-purple-2 focus:bg-purple-2"
								onClick={(e) => {
									if (showSpinner) {
										handleRunningWorkflowDeletion(
											e,
											workflow.session_id,
											workflow.workflow_check_id,
											workflow.external_id,
										);
									} else {
										handleDeleteChatSession(
											e,
											workflow.session_id,
											'workflow',
											workflow.workflow_check_id,
										);
									}
								}}
							>
								<i className="bi-trash me-2 text-primary80" />
								Delete
							</DropdownMenuItem>
						</DropdownMenuContent>
					</DropdownMenu>
				</div>
			</div>
		);
	};

	const sessions = sessionsData || [];
	const businessProcesses = recentWorkflowRuns?.business_processes || [];
	const items = [
		...sessions.map((session) => ({
			type: 'session',
			data: session,
			date: new Date(session.created_at),
		})),
		...businessProcesses.map((bp) => {
			const workflowDates = bp.workflows.map((w) =>
				new Date(w.created_at).getTime(),
			);
			const latestDate =
				workflowDates.length > 0 ? Math.max(...workflowDates) : null;
			return {
				type: 'business_process',
				data: bp,
				date: latestDate ? new Date(latestDate) : null,
			};
		}),
	].filter((item) => item.date !== null);
	const groupedItems = groupItemsByDate(items);

	useEffect(() => {
		if (pathname === '/app/new-chat') setActiveTab('');
		else {
			setActiveTab(pathname);
			if (pathname.includes('configuration'))
				setActiveTab('/app/configuration');
			if (pathname.includes('reports')) setActiveTab('/app/reports');
			if (pathname.includes('business-process'))
				setActiveTab('/app/business-process');
			if (pathname.includes('dashboard')) setActiveTab('/app/dashboard');
			if (pathname.includes('ai-concierge')) setActiveTab('/app/ai-concierge');
		}
	}, [pathname]);

	return (
		<div
			className={`fixed flex flex-col h-screen sidenav-transition ${
				isSideNavOpen
					? 'w-[16rem] min-w-[16rem]'
					: 'w-[4.5rem] min-w-[4.5rem]'
			} border-r bg-purple-8`}
		>
			<ConfirmationDialog />
			{/* SideNav Expand Collapse | Hamburger */}
			<div className="m-4 flex items-start">
				<div
					className={cn(
						'w-full flex gap-3 items-start',
						!isSideNavOpen && 'justify-center',
					)}
				>
					<div>
						<img
							src={sidenavIcon}
							className="size-5 mt-1"
							onClick={toggleSideNav}
						/>
					</div>

					{isSideNavOpen && isRbacActive && teams.length > 0 && (
						<div className="w-[calc(100%-1.75rem)]">
							<DropdownMenu
								onOpenChange={(open) => {
									if (!open) {
										setTeamSearchQuery('');
									}
								}}
							>
								<DropdownMenuTrigger
									asChild
									className="!p-0 hover:bg-transparent"
								>
									<div className="w-full cursor-pointer rounded-lg hover:bg-purple-4 p-1 -ml-1 outline-none">
										<div className="flex justify-between items-start w-full">
											<div className="flex-1 min-w-0">
												<div className="text-sm text-[#26064ACC] font-medium truncate text-left">
													{selectedTeamName}
												</div>
												<div className="text-xs text-[#26064A] font-semibold text-left">
													Irame.ai
												</div>
											</div>
											<img
												src={chevronDownIcon}
												className="size-6 ml-2 shrink-0"
											/>
										</div>
									</div>
								</DropdownMenuTrigger>
								<DropdownMenuContent
									className="w-[18rem] p-0"
									align="start"
									side="bottom"
								>
									{/* Header */}
									<div className="px-3 py-3 border-b border-gray-200">
										{/* Search Input */}
										<div className="relative">
											<i className="bi-search absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm"></i>
											<input
												type="text"
												placeholder="Search Team"
												value={teamSearchQuery}
												onChange={(e) =>
													setTeamSearchQuery(
														e.target.value,
													)
												}
												className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-lg text-sm text-gray-700 placeholder:text-gray-400"
												onClick={(e) => e.stopPropagation()}
												onMouseDown={(e) =>
													e.stopPropagation()
												}
												onKeyDown={(e) =>
													e.stopPropagation()
												}
											/>
										</div>
									</div>

									{/* Teams List */}
									<div className="py-1 max-h-64 overflow-y-auto">
										{filteredTeams.length > 0 ? (
											filteredTeams.map((team) => {
												const teamId =
													team.externalId || team.id;
												const isSelected =
													selectedTeamId === teamId;
												return (
													<DropdownMenuItem
														key={teamId}
														className="cursor-pointer focus:bg-purple-4 hover:!bg-purple-4 px-3 py-3 outline-none"
														onClick={() => {
															dispatch(
																setSelectedTeam(
																	teamId,
																),
															);
															queryClient.invalidateQueries();
															setTeamSearchQuery('');
														}}
													>
														<div className="flex items-center justify-between w-full">
															<span className="text-[#26064A] text-sm font-medium truncate">
																{team.name}
															</span>
															{isSelected && (
																<div className="size-4 rounded-full bg-purple-100 flex items-center justify-center shrink-0 ml-2">
																	<Check
																		className="size-2 text-white"
																		strokeWidth={
																			4
																		}
																	/>
																</div>
															)}
															{!isSelected && (
																<div className="size-4 rounded-full border-2 border-gray-300 shrink-0 ml-2"></div>
															)}
														</div>
													</DropdownMenuItem>
												);
											})
										) : (
											<div className="px-3 py-8 text-center text-gray-500 text-sm">
												No teams found
											</div>
										)}
									</div>
								</DropdownMenuContent>
							</DropdownMenu>
						</div>
					)}
				</div>
			</div>

			{/* Ask IRA Button */}
			{!(import.meta.env.VITE_QNA_DISABLED === 'true') && (
				<div className="flex-none mt-6 mb-6 mx-4">
					<Hint
						label="Ask Ira"
						side="right"
						align="start"
						show={!isSideNavOpen}
					>
						<Link
							to={'/app/new-chat?source=side_bar'}
							onClick={handleAskIraClick}
							className={`flex gap-4 items-center cursor-pointer text-primary80 text-sm font-medium ${
								isSideNavOpen
									? 'rounded-[12.5rem] px-5 py-3'
									: 'rounded-full px-2 mx-auto py-2'
							} bg-purple-4`}
						>
							<img
								src="https://d2vkmtgu2mxkyq.cloudfront.net/plus.svg"
								alt="ask-ira"
								className="size-6"
							/>
							{isSideNavOpen && <p>Ask IRA</p>}
						</Link>
					</Hint>
				</div>
			)}

			{/* Main Navigation Menu */}
			<div className="flex-none m-4">
				{bottomMenuList?.map((menu, key) => (
					<div key={key} className="space-y-2">
						{menu?.items?.map((option, optionKey) => {
							const isActive = activeTab === option.link.split('?')[0];
							return (
								<Hint
									label={option.text}
									side="right"
									align="start"
									show={!isSideNavOpen}
								>
									<Link
										to={option.link}
										key={optionKey}
										onClick={(e) => {
											const guard = getGuard();
											if (guard) {
												e.preventDefault();
												guard(option.link, () => {
													setActiveTab(
														option.link.split('?')[0],
													);
													option?.trackingCall &&
														option.trackingCall();
													navigate(option.link);
												});
												return;
											}
											setActiveTab(option.link.split('?')[0]);
											option?.trackingCall &&
												option.trackingCall();
										}}
										className={`flex gap-4 items-center cursor-pointer text-primary80 text-sm font-medium p-2 rounded-md hover:bg-purple-4 border-l-4 ${
											isActive
												? ' border-purple-100 bg-purple-4 font-semibold text-purple-100 '
												: ' border-transparent'
										}`}
									>
										{typeof option.icon === 'string' ? (
											<img
												src={option.icon}
												className={`${isActive ? 'text-purple-100' : ''} size-[1.375rem]`}
												style={{ strokeWidth: '2' }}
											/>
										) : (
											<option.icon
												className={`${isActive ? 'text-purple-100' : 'text-primary80'} size-[1.375rem]`}
												strokeWidth={1.5}
											/>
										)}
										{isSideNavOpen && (
											<p className="truncate">{option.text}</p>
										)}
										{isSideNavOpen && option.beta && (
											<span className="shrink-0 px-1.5 py-px rounded-md bg-white/50 backdrop-blur-sm border border-[rgba(106,18,205,0.12)] text-[9px] font-medium text-purple-100 tracking-wide">
												Beta
											</span>
										)}
									</Link>
								</Hint>
							);
						})}
					</div>
				))}
			</div>

			{/* Scrollable History Section */}
			<div className="flex-1 overflow-y-auto mt-4 pr-1 ml-4">
				{isSideNavOpen && (
					<div className="pr-2 space-y-4 pb-4">
						{isLoading || isBusinessLoading ? (
							<div className="w-full h-full flex items-center justify-center">
								<Spinner />
							</div>
						) : (
							<>
								{groupedItems.today.length > 0 && (
									<div>
										<h3 className="text-primary40 text-xs font-medium text-left mb-2 px-3">
											Today
										</h3>
										<div className="space-y-1">
											{groupedItems.today.map((item) =>
												item.type === 'session'
													? renderSession(item.data)
													: renderBusinessProcess(
															item.data,
														),
											)}
										</div>
									</div>
								)}
								{groupedItems.yesterday.length > 0 && (
									<div>
										<h3 className="text-primary40 text-xs font-medium text-left mb-2 px-3">
											Yesterday
										</h3>
										<div className="space-y-1">
											{groupedItems.yesterday.map((item) =>
												item.type === 'session'
													? renderSession(item.data)
													: renderBusinessProcess(
															item.data,
														),
											)}
										</div>
									</div>
								)}
								{groupedItems.last7Days.length > 0 && (
									<div>
										<h3 className="text-primary40 text-xs font-medium text-left mb-2 px-3">
											Last 7 Days
										</h3>
										<div className="space-y-1">
											{groupedItems.last7Days.map((item) =>
												item.type === 'session'
													? renderSession(item.data)
													: renderBusinessProcess(
															item.data,
														),
											)}
										</div>
									</div>
								)}
								{groupedItems.earlier.length > 0 && (
									<div>
										<h3 className="text-primary40 text-xs font-medium text-left mb-2 px-3">
											Earlier
										</h3>
										<div className="space-y-1">
											{groupedItems.earlier.map((item) =>
												item.type === 'session'
													? renderSession(item.data)
													: renderBusinessProcess(
															item.data,
														),
											)}
										</div>
									</div>
								)}
							</>
						)}
						{isFetchingNextPage && (
							<div className="space-y-1">
								<SessionSkeleton />
								<SessionSkeleton />
								<SessionSkeleton />
								<SessionSkeleton />
							</div>
						)}
					</div>
				)}
				{/* Sentinel at the very bottom of scrollable area */}
				{isSideNavOpen && <Sentinel />}
			</div>
		</div>
	);
};

SideNav.propTypes = {
	isSideNavOpen: PropTypes.bool.isRequired,
	toggleSideNav: PropTypes.func.isRequired,
};

export default SideNav;
