import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/useRouter';
import { useDispatch, useSelector } from 'react-redux';
import { getToken } from '@/lib/utils';
import {
	createQuery,
	getQuerySession,
} from './features/new-chat/service/new-chat.service';
import { updateUtilProp } from '@/redux/reducer/utilReducer';

const SideNav = ({ isSideNavOpen, toggleSideNav }) => {
	const [activeTab, setActiveTab] = useState('');
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

	const getChatHistory = (sessionId) => {
		getQuerySession(sessionId, getToken()).then((res) => {
			dispatch(updateUtilProp([{ key: 'queryPrompt', value: res[0].query }]));
			navigate(
				`/app/new-chat/?step=4&dataSourceId=${res[0].datasource_id}&sessionId=${res[0].session_id}&queryId=${res[0].query_id}`,
			);
			createQuery(
				{
					child_no: parseInt(res[0].child_no) + 1,
					datasource_id: res[0].datasource_id,
					parent_query_id: res[0].query_id,
					query: res[0].query,
					session_id: res[0].session_id,
				},
				getToken(),
			).then((res) => {
				console.log(res, 'create query===');
			});
		});
	};
	useEffect(() => {
		if (pathname === '/app/new-chat') {
			setActiveTab('');
		} else {
			setActiveTab(pathname);
		}
	}, [pathname]);
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
						{isSideNavOpen ? <p>New Chat</p> : null}
					</Link>
					<div
						className={`flex flex-col gap-4 cursor-pointer text-primary80 font-medium p-3 rounded-md`}
					>
						{isSideNavOpen ? (
							<>
								<p>Recent</p>
								<div className=" max-h-[25rem] overflow-y-auto space-y-3.5 mt-2">
									{utilReducer?.sessionHistory.map(
										(session, key) => (
											<div
												className="text-primary80 rounded-lg py-2 px-3 text-sm font-medium max-w-[200px] truncate hover:bg-purple-4 cursor-pointer"
												key={session.session_id}
												onClick={() =>
													getChatHistory(
														session.session_id,
													)
												}
											>
												<i className="bi-chat-right-text-fill me-3"></i>
												{session.title}
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
