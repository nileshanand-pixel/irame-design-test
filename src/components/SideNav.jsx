import { Link } from 'react-router-dom';
import { Button } from './ui/button';
import PropTypes from 'prop-types';
import { useEffect, useState } from 'react';
import { useRouter } from '@/hooks/useRouter';

const SideNav = ({ isSideNavOpen, toggleSideNav }) => {
	const [activeTab, setActiveTab] = useState('');
	const { pathname } = useRouter();

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
						className={`flex gap-4 items-center cursor-pointer text-sm  text-primary80 font-medium p-3 rounded-md hover:bg-purple-4`}
					>
						{isSideNavOpen ? <p>Recent</p> : null}
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
