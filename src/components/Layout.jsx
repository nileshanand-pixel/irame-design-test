import React, { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { useRouter } from '@/hooks/useRouter';
import { cn } from '@/lib/utils';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import GlobalPollReports from './features/reports/components/GlobalPollReports';
import { pdfjs } from 'react-pdf';
import Modals from './Modals';
import FreshdeskWidget from './features/freshdesk/FreshdeskWidget';
import UserSessionManager from './features/user-session-manager';
import { CHAT_SESSION_STARTED_EVENT_DATA_KEY } from '@/constants/chat.constant';
import { removeFromLocalStorage } from '@/utils/local-storage';
import ChooseDataSourceDialog from './ChooseDataSourceDialog';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).toString();

const Layout = ({ children }) => {
	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();
	const { pathname, query } = useRouter();
	const [selectedDataSource, setSelectedDataSource] = useState('');

	useEffect(() => {
		if (pathname && pathname !== '/app/new-chat/session') {
			removeFromLocalStorage(CHAT_SESSION_STARTED_EVENT_DATA_KEY);
		}
	}, [pathname]);

	const toggleSideNav = () => {
		dispatch(
			updateUtilProp([
				{ key: 'isSideNavOpen', value: !utilReducer.isSideNavOpen },
			]),
		);
	};

	useMemo(() => {
		if (!pathname.includes('/app/new-chat')) {
			dispatch(
				updateChatStoreProp([
					{
						key: 'activeChatSession',
						value: {
							id: '',
							title: '',
						},
					},
				]),
			);
		}
	}, [pathname]);

	return (
		<div className={`flex items-start h-screen justify-between`}>
			<UserSessionManager />
			<ChooseDataSourceDialog
				open={utilReducer?.isDatasourceSelectionModalOpen}
				setOpen={(value) =>
					dispatch(
						updateUtilProp([
							{ key: 'isDatasourceSelectionModalOpen', value },
						]),
					)
				}
				selectedDataSource={selectedDataSource}
				setSelectedDataSource={setSelectedDataSource}
			/>
			<SideNav
				toggleSideNav={toggleSideNav}
				isSideNavOpen={utilReducer?.isSideNavOpen}
			/>
			<main
				className={`flex flex-col w-full h-full sidenav-transition ${
					utilReducer?.isSideNavOpen ? 'pl-[16rem]' : 'pl-[4.5rem]'
				} `}
			>
				<Header />
				<div
					className={cn(
						'h-full pt-0 flex  justify-center overflow-x-hidden w-full bg-white',
					)}
				>
					{/* <Outlet /> */}
					{children}
				</div>
				<GlobalPollReports />
			</main>
			<FreshdeskWidget />
			<Modals />
		</div>
	);
};

Layout.propTypes = {
	children: PropTypes.node.isRequired,
};

export default Layout;
