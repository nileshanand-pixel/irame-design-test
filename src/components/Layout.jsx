import { useState } from 'react';
import Header from './Header';
import SideNav from './SideNav';
import PropTypes from 'prop-types';

const Layout = ({ children }) => {
	const [isSideNavOpen, setIsSideNavOpen] = useState(true);

	const toggleSideNav = () => {
		setIsSideNavOpen(!isSideNavOpen);
	};
	return (
		<div className={`flex items-start justify-between`}>
			<SideNav toggleSideNav={toggleSideNav} isSideNavOpen={isSideNavOpen} />
			<main
				className={`grid w-full h-full ${
					isSideNavOpen ? 'pl-[250px]' : 'pl-[72px]'
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
