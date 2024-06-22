import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { cn, getToken } from '@/lib/utils';
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
} from './ui/dropdown-menu';
import InputText from './elements/InputText';
import { getDataSources } from './features/configuration/service/configuration.service';
import { resetChatStore, updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import { useQuery } from '@tanstack/react-query';
import Spinner from './elements/Spinner';

const SideNav = ({ isSideNavOpen, toggleSideNav }) => {
	const [activeTab, setActiveTab] = useState('');
	const [isEditing, setIsEditing] = useState(-1);
	const [sessionTitle, setSessionTitle] = useState('');

	const { pathname, navigate } = useRouter();

	const utilReducer = useSelector((state) => state.utilReducer);
	const chatStoreReducer = useSelector((state) => state.chatStoreReducer);

	const dispatch = useDispatch();

	const fetchUserSession = async () => {
		try {
			return getUserSession(getToken());
		} catch (error) {
			console.error('Error fetching user session:', error);
		}
	};

	const { data, isLoading } = useQuery({
		queryKey: ['chat-history'],
		queryFn: fetchUserSession,
	});

	const bottomMenuList = [
		{
			group: '',
			items: [
				{
					link: '/app/dashboard',
					text: 'Dashboard',
					icon: 'columns-gap',
				},
				{
					link: '/app/configuration',
					text: 'Configuration',
					icon: 'gear',
				},
				{
					link: '/app/help',
					text: 'Help',
					icon: 'question-circle',
				},
			],
		},
	];
	const fetchDataSources = async () => {
		const token = getToken();
		if (!token) {
			throw new Error('No token available');
		}
		const data = await getDataSources(token);
		return Array.isArray(data) ? data : [];
	};

	const {
		data: dataSources,
		isLoading: isLoadingDataSources,
		error,
	} = useQuery({
		queryKey: 'data-sources',
		queryFn: fetchDataSources,
		onSuccess: (data) => {
			dispatch(updateUtilProp([{ key: 'dataSources', value: data }]));
		},
		enabled: !!getToken(), // Only run the query if the token exists
	});

	const getChatHistoryDataSourceName = (dataSourceId) => {
		const dataSource = dataSources?.find(
			(source) => source.datasource_id === dataSourceId,
		);
		return dataSource?.name;
	};

	const getChatHistory = (session) => {
		dispatch(resetChatStore());
		dispatch(
			updateUtilProp([
				{
					key: 'selectedDataSource',
					value: {},
				},
			]),
		);
		navigate('/app/new-chat/session');

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

	const handleDeleteChatSession = async (e, sessionId) => {
		e.stopPropagation();
		try {
			const updatedList = utilReducer?.sessionHistory.filter((session) => {
				if (session.session_id !== sessionId) {
					return session;
				}
			});
			await deleteSession(sessionId, getToken());
			dispatch(
				updateUtilProp([{ key: 'sessionHistory', value: updatedList }]),
			);
		} catch (error) {}
	};

	const askIra = (e) => {
		if (e) e.preventDefault();
		dispatch(resetChatStore());
		dispatch(
			updateUtilProp([
				{ key: 'selectedDataSource', value: {} },
				{ key: 'answerFromHistory', value: {} },
			]),
		);
		navigate('/app/new-chat');
	};
	useEffect(() => {
		if (pathname === '/app/new-chat') {
			setActiveTab('');
		} else {
			setActiveTab(pathname);
		}
	}, [pathname]);

	useEffect(() => {
		dispatch(updateUtilProp([{ key: 'sessionHistory', value: data || [] }]));
	}, [data]);

	return (
		<div
			className={`fixed flex flex-col gap-4 ${
				isSideNavOpen ? 'w-[250px] min-w-[250px]' : 'w-[72px] min-w-[72px]'
			} border-r h-screen p-4 bg-purple-8`}
		>
			<div className="grow">
				<Button
					variant="ghost"
					onClick={toggleSideNav}
					className="hover:bg-purple-4"
				>
					<i className="bi-list"></i>
				</Button>
				<div>
					<Link
						to={'/app/new-chat'}
						onClick={askIra}
						className={`flex gap-4 items-center cursor-pointer text-primary80 text-sm font-medium ${
							isSideNavOpen
								? 'rounded-[200px] px-5 py-3'
								: 'rounded-full pl-3 pr-3 mx-auto py-2'
						} mt-10 mb-8 bg-purple-4`}
					>
						<i className="bi-plus-lg"></i>
						{isSideNavOpen ? <p>Ask IRA</p> : null}
					</Link>
					<div
						className={`flex flex-col gap-4 cursor-pointer text-primary80 font-medium p-3 rounded-md`}
					>
						{isSideNavOpen ? (
							<>
								<p>Recent</p>
								<div className=" max-h-[25rem] overflow-y-auto space-y-3.5 mt-2">
									{isLoading ? (
										<Spinner />
									) : (
										utilReducer?.sessionHistory &&
										Array.isArray(utilReducer?.sessionHistory) &&
										utilReducer?.sessionHistory.map(
											(session, key) => (
												<div
													className={cn(
														'flex items-center justify-between text-primary80 w-full rounded-lg py-2 text-sm font-medium  cursor-pointer hover:bg-purple-4',
														chatStoreReducer
															?.activeChatSession
															?.id ===
															session.session_id
															? "bg-purple-10"
															: '',
													)}
													key={session.session_id}
													onClick={() => {
														if (
															isEditing ===
															session.session_id
														)
															return;
														getChatHistory(session);
													}}
												>
													<div
														className={cn(
															'flex items-center max-w-[200px] truncate',
															isEditing ===
																session.session_id
																? ''
																: ' px-2 py-1',
														)}
													>
														<i className="bi-chat-right-text-fill me-3"></i>
														{isEditing ===
														session.session_id ? (
															<InputText
																value={sessionTitle}
																setValue={(
																	value,
																	e,
																) => {
																	e.stopPropagation();
																	setSessionTitle(
																		value,
																	);
																}}
																className="flex bg-transparent border-none text-primary80 font-medium"
															/>
														) : (
															<p className="flex  ">
																{session.title}
															</p>
														)}
													</div>

													<DropdownMenu>
														<DropdownMenuTrigger asChild>
															<i
																className="bi-three-dots-vertical ms-3 items-end hover:bg-purple-8"
																onClick={(e) => {
																	e.stopPropagation();
																}}
															></i>
														</DropdownMenuTrigger>
														<DropdownMenuContent
															align="start"
															className=""
														>
															{/* <DropdownMenuItem
															className="text-primary80 font-medium hover:!bg-purple-4"
															onClick={(e) => {
																e.stopPropagation();
																setIsEditing(
																	session.session_id,
																);
															}}
														>
															Rename
														</DropdownMenuItem> */}
															<DropdownMenuItem
																className="text-primary80 font-medium hover:!bg-purple-2"
																onClick={(e) => {
																	handleDeleteChatSession(
																		e,
																		session.session_id,
																	);
																}}
															>
																Delete
															</DropdownMenuItem>
														</DropdownMenuContent>
													</DropdownMenu>
												</div>
											),
										)
									)}
								</div>
							</>
						) : null}
					</div>
				</div>
			</div>
			<div>
				<div style={{ overflow: 'visible' }}>
					<div style={{ overflow: 'visible' }}>
						{bottomMenuList?.map((menu, key) => (
							<div key={key}>
								{menu?.items?.map((option, optionKey) => {
									const isActive = activeTab === option.link;
									return (
										<Link
											to={option.link}
											key={optionKey}
											onClick={() => setActiveTab(option.link)}
											className={`flex gap-4 items-center cursor-pointer text-primary80 text-sm font-medium p-3 rounded-md hover:bg-purple-4 ${
												isActive
													? 'border-l-4  border-purple-100 bg-purple-4 font-semibold text-purple-100 '
													: ' border-l-4 border-transparent'
											} `}
										>
											<i
												className={`bi-${option.icon}
												${isActive ? 'text-purple-100 ' : ''} `}
												style={{ strokeWidth: '2' }}
											></i>
											{isSideNavOpen ? (
												<p>{option.text}</p>
											) : null}
										</Link>
									);
								})}
							</div>
						))}
					</div>
				</div>
			</div>
		</div>
	);
};

SideNav.propTypes = {
	isSideNavOpen: PropTypes.bool.isRequired,
	toggleSideNav: PropTypes.func.isRequired,
};

export default SideNav;
