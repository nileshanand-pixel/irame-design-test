import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { cn, getToken } from '@/lib/utils';
import {
	createQuery,
	deleteSession,
	getQuerySession,
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

const SideNav = ({ isSideNavOpen, toggleSideNav }) => {
	const [activeTab, setActiveTab] = useState('');
	const [isEditing, setIsEditing] = useState(-1);
	const [sessionTitle, setSessionTitle] = useState('');

	const { pathname, navigate } = useRouter();

	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();

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
	const getChatHistoryDataSourceName = (dataSourceId) => {
		if (!utilReducer?.dataSources || utilReducer?.dataSources?.length <= 0) {
			getDataSources(getToken()).then((res) => {
				dispatch(updateUtilProp([{ key: 'dataSources', value: res }]));
				const dataSource = res.find(
					(source) => source.datasource_id === dataSourceId,
				);
				return dataSource?.name;
			});
		}
		const dataSource = utilReducer?.dataSources.find(
			(source) => source.datasource_id === dataSourceId,
		);
		return dataSource?.name;
	};

	const getChatHistory = (sessionId, sessionTitle) => {
		dispatch(
			updateUtilProp([
				{ key: 'resetChat', value: true },
				{ key: 'queryPrompt', value: sessionTitle },
			]),
		);
		navigate(`/app/new-chat/?step=4&src=history`);

		getQuerySession(sessionId, getToken()).then((res) => {
			dispatch(
				updateUtilProp([
					{
						key: 'selectedDataSource',
						value: getChatHistoryDataSourceName(
							res[res.length - 1]?.datasource_id,
						),
					},
					{
						key: 'answerFromHistory',
						value: res[res.length - 1],
					},
				]),
			);
			// setValue((prev) => {
			// 	return {
			// 		...prev,
			// 		id: res[0]?.datasource_id,
			// 		name: getChatHistoryDataSourceName(res[0]?.datasource_id),
			// 	};
			// });
			navigate(
				`/app/new-chat/?step=4&&src=history&dataSourceId=${res[0]?.datasource_id}&sessionId=${res[0]?.session_id}&queryId=${res[0]?.query_id}`,
			);
			// createQuery(
			// 	{
			// 		child_no: parseInt(res[0]?.child_no) + 1,
			// 		datasource_id: res[0]?.datasource_id,
			// 		parent_query_id: res[0]?.query_id,
			// 		query: res[0]?.query,
			// 		session_id: res[0]?.session_id,
			// 	},
			// 	getToken(),
			// ).then((res) => {
			// 	// console.log(res, 'create query===');
			// });
		});
	};
	const handleUpdateSession = (sessionId, title) => {
		// dispatch(updateUtilProp([{ key: 'sessionHistory', value: title }]));
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

	const fetchUserSession = () => {
		try {
			// if (utilReducer?.sessionHistory?.length > 0) return;
			getUserSession(getToken()).then((res) => {
				dispatch(updateUtilProp([{ key: 'sessionHistory', value: res }]));
			});
		} catch (error) {
			console.error('Error fetching user session:', error);
		}
	};
	useEffect(() => {
		if (pathname === '/app/new-chat') {
			setActiveTab('');
		} else {
			setActiveTab(pathname);
		}
	}, [pathname]);
	useEffect(() => {
		fetchUserSession();
	}, []);

	return (
		<div
			className={`fixed flex flex-col gap-4 ${
				isSideNavOpen ? 'w-[250px] min-w-[250px]' : 'w-[72px] min-w-[72px]'
			} border-r min-h-screen p-4 bg-purple-8`}
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
									{utilReducer?.sessionHistory &&
										Array.isArray(utilReducer?.sessionHistory) &&
										utilReducer?.sessionHistory.map(
											(session, key) => (
												<div
													className="flex items-center text-primary80 w-full rounded-lg py-2 text-sm font-medium  cursor-pointer "
													key={session.session_id}
													onClick={() => {
														if (
															isEditing ===
															session.session_id
														)
															return;
														getChatHistory(
															session.session_id,
															session.title,
														);
													}}
												>
													<div
														className={cn(
															'flex items-center max-w-[200px] truncate',
															isEditing ===
																session.session_id
																? ''
																: ' px-2 py-1 hover:bg-purple-4',
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
																className="bi-three-dots-vertical ms-3 items-end hover:bg-purple-4"
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
