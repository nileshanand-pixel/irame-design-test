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
import { pdfjs } from 'react-pdf';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).toString();

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
		<div className={`flex items-start h-screen justify-between`}>
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
						'pt-0 flex bg-gray-300 justify-center h-[calc(100vh-64px)] w-full',
						pathname.includes('/dashboard')
							? 'bg-gray-muted'
							: 'bg-white',
							pathname.includes('workflows') ? 'px-0' : 'px-8'
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
