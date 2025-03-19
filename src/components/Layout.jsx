import { useEffect, useMemo, useState } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';
import { useRouter } from '@/hooks/useRouter';
import { cn, getToken } from '@/lib/utils';
import { updateChatStoreProp } from '@/redux/reducer/chatReducer.js';
import GlobalPollReports from './features/reports/components/GlobalPollReports';
import { pdfjs } from 'react-pdf';
import useBreakpoint from '@/hooks/useBreakpoint';
import { useQuery } from '@tanstack/react-query';
import { authUserDetails } from './features/login/service/auth.service';

pdfjs.GlobalWorkerOptions.workerSrc = new URL(
	'pdfjs-dist/build/pdf.worker.min.mjs',
	import.meta.url,
).toString();

const Layout = ({ children }) => {
	const utilReducer = useSelector((state) => state.utilReducer);
	const breakPoint = useBreakpoint()
	const dispatch = useDispatch();
	const { pathname } = useRouter();

	const userFetcher = () => {
		let resp = null;
		authUserDetails(getToken()).then((res) => {
			localStorage.setItem('auth-user-data', JSON.stringify(res));
			resp = res;
		})
		return resp;
	}

	const {data: currentUser} = useQuery({
		queryKey: ['auth-user-details', getToken()],
		queryFn: userFetcher,
		enabled: !!getToken(),
		
	})

	const toggleSideNav = () => {
		dispatch(
			updateUtilProp([
				{ key: 'isSideNavOpen', value: !utilReducer.isSideNavOpen },
			]),
		);
	};
	
	useEffect(() => {
		if (['xs', 'sm', 'md'].includes(breakPoint) && utilReducer.isSideNavOpen) {
			toggleSideNav();
		}
	}, [breakPoint, utilReducer?.isSideNavOpen]);
	



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
					utilReducer?.isSideNavOpen ? 'pl-[270px]' : 'pl-[72px]'
				} `}
			>
				<Header />
				<div
					className={cn(
						'pt-0 px-0 flex bg-gray-300 justify-center h-[calc(100vh-64px)] w-full',
						pathname.includes('/dashboard')
							? 'bg-gray-muted'
							: 'bg-white'
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
