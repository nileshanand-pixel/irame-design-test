import { useState } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import PropTypes from 'prop-types';
import { useSelector, useDispatch } from 'react-redux';
import { updateUtilProp } from '@/redux/reducer/utilReducer';

const Layout = ({ children }) => {
	// const [isSideNavOpen, setIsSideNavOpen] = useState(true);
	const utilReducer = useSelector((state) => state.utilReducer);
	const dispatch = useDispatch();

	const toggleSideNav = () => {
		// setIsSideNavOpen(!isSideNavOpen);
		dispatch(
			updateUtilProp([
				{ key: 'isSideNavOpen', value: !utilReducer.isSideNavOpen },
			]),
		);
	};
	return (
		<div className={`flex items-start justify-between`}>
			<SideNav
				toggleSideNav={toggleSideNav}
				isSideNavOpen={utilReducer?.isSideNavOpen}
			/>
			<main
				className={`grid w-full h-full ${
					utilReducer?.isSideNavOpen ? 'pl-[250px]' : 'pl-[72px]'
				} `}
			>
				<Header />
				<div className="px-8 pt-0">{children}</div>
			</main>
		</div>
	);
};

Layout.propTypes = {
	children: PropTypes.node.isRequired,
};

export default Layout;
