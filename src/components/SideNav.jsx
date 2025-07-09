import { Link } from 'react-router-dom';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { cn } from '@/lib/utils';
import {
	deleteSession,
	getUserSession,
} from './features/new-chat/service/new-chat.service';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import {
	DropdownMenu,
	DropdownMenuContent,
	DropdownMenuItem,
	DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import InputText from './elements/InputText';
import { getDataSources } from './features/configuration/service/configuration.service';
import { resetChatStore, updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { useQuery } from '@tanstack/react-query';
import Spinner from './elements/loading/Spinner';
import dayjs from 'dayjs';
import isToday from 'dayjs/plugin/isToday';
import isYesterday from 'dayjs/plugin/isYesterday';
import GradientSpinner from './elements/loading/GradientSpinner';
import { updateAuthStoreProp } from '@/redux/reducer/authReducer';
import { getRecentWorkflowsRunsHomePage } from './features/business-process/service/workflow.service';
import upperFirst from 'lodash.upperfirst';
import { resetAllStores } from '@/redux/GlobalStore';
import { Hint } from './Hint';
import Tag from './elements/Tag';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { trackEvent } from '@/lib/mixpanel';

dayjs.extend(isToday);
dayjs.extend(isYesterday);

const SideNav = ({ isSideNavOpen, toggleSideNav }) => {
	const [activeTab, setActiveTab] = useState('');
	const [isEditing, setIsEditing] = useState(-1);
	const [sessionTitle, setSessionTitle] = useState('');
	const [expandedBusinessProcesses, setExpandedBusinessProcesses] = useState([]);

	const { pathname, navigate } = useRouter();
	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);
	const dispatch = useDispatch();

	const fetchUserSession = async () => {
		try {
			const data = await getUserSession();
			dispatch(
				updateAuthStoreProp([{ key: 'user_id', value: data?.[0]?.user_id }]),
			);
			return data;
		} catch (error) {
			console.error('Error fetching user session:', error);
		}
	};

	const { data, isLoading } = useQuery({
		queryKey: ['chat-history'],
		queryFn: fetchUserSession,
		refetchInterval: 10000
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
					}
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
					link: '/app/reports/datasources',
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

	const fetchDataSources = async () => {
		const data = await getDataSources();
		dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
		return Array.isArray(data) ? data : [];
	};

	const { data: dataSources } = useQuery({
		queryKey: ['data-sources'],
		queryFn: fetchDataSources,
	});

	const getChatHistoryDataSourceName = (dataSourceId) => {
		const dataSource = dataSources?.find(
			(source) => source.datasource_id === dataSourceId,
		);
		return dataSource?.name;
	};

	const getChatHistory = (session) => {
		dispatch(resetChatStore());
		dispatch(updateUtilProp([{ key: 'selectedDataSource', value: {} }]));
		navigate('/app/new-chat/session?source=side_bar');
		dispatch(
			updateChatStoreProp([
				{
					key: 'activeChatSession',
					value: { id: session.session_id, title: session.title },
				},
				{ key: 'activeQueryId', value: '' },
				{ key: 'refreshChat', value: true },
				{ key: 'resetIra', value: !chatStoreReducer?.resetIra },
			]),
		);

		const datasourceId = session?.datasource_id;
		const datasourceName = getChatHistoryDataSourceName(datasourceId);
		dispatch(
			updateUtilProp([
				{
					key: 'selectedDataSource',
					value: { id: datasourceId, name: datasourceName },
				},
			]),
		);
	};

	const handleDeleteChatSession = async (e, sessionId, threadTypeForTracking, workflowIdForTracking) => {
		e.stopPropagation();
		try {
			const updatedList = utilReducer?.sessionHistory.filter(
				(session) => session.session_id !== sessionId,
			);
			if (!confirm('Are you sure you want to delete this session?')) return;
			await deleteSession(sessionId);
			trackEvent(
				EVENTS_ENUM.SIDE_BAR_CHAT_DELETED,
				EVENTS_REGISTRY.SIDE_BAR_CHAT_DELETED,
				() => ({
					type: threadTypeForTracking,
					chat_session_id: sessionId,
					workflow_id: workflowIdForTracking,
				})
			)
			dispatch(
				updateUtilProp([{ key: 'sessionHistory', value: updatedList }]),
			);
		} catch (error) { }
	};

	const askIra = (e) => {
		if (e) e.preventDefault();
		trackEvent(	
			EVENTS_ENUM.SIDE_BAR_ASK_IRA_CLICKED,
			EVENTS_REGISTRY.SIDE_BAR_ASK_IRA_CLICKED,
		);
		dispatch(resetChatStore());
		dispatch(
			updateUtilProp([
				{ key: 'selectedDataSource', value: {} },
				{ key: 'answerFromHistory', value: {} },
			]),
		);
		navigate('/app/new-chat?source=side_bar');
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
		const isActiveSession =
			chatStoreReducer?.activeChatSession?.id === session.session_id;
		let showSpinner =  session?.status !== 'done';
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
				onClick={() => {
					trackEvent(
						EVENTS_ENUM.SIDE_BAR_CHAT_THREAD_CLICKED,
						EVENTS_REGISTRY.SIDE_BAR_CHAT_THREAD_CLICKED,
						() => ({
							type: "qna",
							chat_session_id: session.session_id,
						})
					)
					if (isEditing === session.session_id) return;
					
					getChatHistory(session);
				}}
			>
				<div
					className={cn(
						'flex items-center max-w-[200px] truncate',
						isEditing === session.session_id ? '' : ' px-2 py-1',
					)}
				>
					{showSpinner ? (
						<GradientSpinner tailwindBg="bg-[#E6D7F7]" width="15" />
					) : (
						<img
							src={sessionIconUrl}
							alt="ask-ira"
							className={`${isWorkflow ? 'size-6' : 'size-5'}`}
						/>
					)}
					{isEditing === session.session_id ? (
						<InputText
							value={sessionTitle}
							setValue={(value, e) => {
								e.stopPropagation();
								setSessionTitle(value);
							}}
							className="flex bg-transparent border-none text-primary80 font-medium"
						/>
					) : (
						<p className="flex ml-3">{session.title}</p>
					)}
				</div>
				<DropdownMenu>
					<DropdownMenuTrigger asChild>
						<i
							className="bi-three-dots-vertical ms-3 me-3 items-end hover:bg-purple-4 rounded-[4px] py-1"
							onClick={(e) => e.stopPropagation()}
						></i>
					</DropdownMenuTrigger>
					<DropdownMenuContent align="start">
						<DropdownMenuItem
							className="text-primary80 font-medium hover:!bg-purple-2"
							onClick={(e) =>
								handleDeleteChatSession(e, session.session_id, "qna")
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
					<div className="ml-4 border-l-2 border-gray-300 rounded-sm pl-2 space-y-1">
						{bp.workflows.map((workflow) => renderWorkflow(workflow))}
					</div>
				)}
			</div>
		);
	};

	const renderWorkflow = (workflow) => {
		const isActive =
			chatStoreReducer?.activeChatSession?.id === workflow.session_id;
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
							type: "workflow",
							chat_session_id: workflow.session_id,
							workflow_id: workflow.workflow_check_id,
						})
					)
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
							`/app/new-chat/session/?sessionId=${workflow.session_id}&source=side_bar`,
						);
					} else {
						navigate(
							`/app/business-process/${workflow.business_process_id}/workflows/${workflow.workflow_check_id}?run_id=${workflow.external_id}`,
						);
					}
				}}
			>
				<div className="flex items-center gap-3 flex-1 min-w-0 pl-3">
					<div className="size-5 flex items-center justify-center shrink-0">
						{showSpinner ? (
							<GradientSpinner tailwindBg="bg-[#E6D7F7]" width="15" />
						) : (
							<img
								src="https://d2vkmtgu2mxkyq.cloudfront.net/workflow_icon.svg"
								alt="workflow"
								className="size-5"
							/>
						)}
					</div>

					<span className="truncate text-primary80 flex-1 min-w-0">
						{workflow.workflow_check_name}
					</span>

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
								onClick={(e) =>
									handleDeleteChatSession(e, workflow.session_id, "workflow", workflow.workflow_check_id)
								}
								disabled
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

	const sessions = data || [];
	const businessProcesses = recentWorkflowRuns?.business_processes || [];
	const items = [
		...sessions.map((session) => ({
			type: 'session',
			data: session,
			date: new Date(session.updated_at),
		})),
		...businessProcesses.map((bp) => {
			const workflowDates = bp.workflows.map((w) =>
				new Date(w?.updated_at || w.created_at).getTime(),
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
			if (pathname.includes('reports'))
				setActiveTab('/app/reports/datasources');
			if (pathname.includes('business-process'))
				setActiveTab('/app/business-process');
			if (pathname.includes('dashboard')) setActiveTab('/app/dashboard');
		}
	}, [pathname]);

	useEffect(() => {
		dispatch(updateUtilProp([{ key: 'sessionHistory', value: data || [] }]));
	}, [data]);

	return (
		<div
			className={`fixed flex flex-col h-screen ${isSideNavOpen ? 'w-[270px] min-w-[270px]' : 'w-[72px] min-w-[72px]'
				} border-r bg-purple-8`}
		>
			{/* SideNav Expand Collapse | Hamburger */}
			<div className="flex-none m-4">
				<img
					src="https://d2vkmtgu2mxkyq.cloudfront.net/hamburger_menu.svg"
					alt="menu"
					className="size-10 cursor-pointer hover:bg-purple-4 rounded-full p-2"
					onClick={toggleSideNav}
				/>
			</div>

			{/* Ask IRA Button */}
			<div className="flex-none mt-6 mb-6 mx-4">
				<Hint
					label="Ask Ira"
					side="right"
					align="start"
					show={!isSideNavOpen}
				>
					<Link
						to={'/app/new-chat?source=side_bar'}
						onClick={askIra}
						className={`flex gap-4 items-center cursor-pointer text-primary80 text-sm font-medium ${isSideNavOpen
								? 'rounded-[200px] px-5 py-3'
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

			{/* Main Navigation Menu */}
			<div className="flex-none m-4">
				{bottomMenuList?.map((menu, key) => (
					<div key={key} className="space-y-2">
						{menu?.items?.map((option, optionKey) => {
							const isActive = activeTab === option.link;
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
										onClick={() => {
											setActiveTab(option.link);
											option?.trackingCall && option.trackingCall();
										}}
										className={`flex gap-4 items-center cursor-pointer text-primary80 text-sm font-medium p-2 rounded-md hover:bg-purple-4 border-l-4 ${isActive
												? ' border-purple-100 bg-purple-4 font-semibold text-purple-100 '
												: ' border-transparent'
											}`}
									>
										<img
											src={option.icon}
											className={`${isActive ? 'text-purple-100' : ''} size-[22px]`}
											style={{ strokeWidth: '2' }}
										/>
										{isSideNavOpen && (
											<p className="truncate">{option.text}</p>
										)}
										{isSideNavOpen && option.beta && (
											<Tag
												className="shrink-0 drop-shadow-md"
												textClassName="text-xs"
												text="Beta"
											/>
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
					</div>
				)}
			</div>
		</div>
	);
};

SideNav.propTypes = {
	isSideNavOpen: PropTypes.bool.isRequired,
	toggleSideNav: PropTypes.func.isRequired,
};

export default SideNav;
