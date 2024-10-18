import { useMemo, useState } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { useRouter } from '@/hooks/useRouter';
import { cn } from '@/lib/utils';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import GlobalPollReports from './features/reports/components/GlobalPollReports';
// import FreshdeskWidget from './features/freshdesk/FreshdeskWidget';

const Layout = ({ children }) => {
	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();
	const { pathname } = useRouter();

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
		<div className={`flex items-start justify-between`}>
			<SideNav
				toggleSideNav={toggleSideNav}
				isSideNavOpen={utilReducer?.isSideNavOpen}
			/>
			<main
				className={`grid w-full ${
					utilReducer?.isSideNavOpen ? 'pl-[250px]' : 'pl-[72px]'
				} `}
			>
				<Header />
				<div
					className={cn(
						'px-8 pt-0 flex items-center justify-center h-full w-full',
						pathname.includes('/dashboard')
							? 'bg-gray-muted min-h-[92vh] overflow-y-auto'
							: 'bg-white',
					)}
				>
					{children}
				</div>
				<GlobalPollReports />
			</main>
			{/* <FreshdeskWidget/> */}
		</div>
	);
};

Layout.propTypes = {
	children: PropTypes.node.isRequired,
};

export default Layout;
