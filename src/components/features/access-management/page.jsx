import { useState } from 'react';

const USER_MAMANGEMENT_TABS = [
	{
		label: 'Users',
		key: 'users',
		component: <div>users tab content</div>,
	},
	{
		label: 'Teams',
		key: 'teams',
		component: <div>teams tab content</div>,
	},
	{
		label: 'Roles & Permissions',
		key: 'roles-permissions',
		component: <div>roles & permissions tab content</div>,
	},
	{
		label: 'Approvals',
		key: 'approvals',
		component: <div>approvals tab content</div>,
	},
	{
		label: 'Logs',
		key: 'logs',
		component: <div>logs tab content</div>,
	},
];

const AccessManagementPage = () => {
	const [activeTab, setActiveTab] = useState(USER_MAMANGEMENT_TABS[0].key);

	return (
		<div className="w-full h-full px-6 pt-4 pb-6">
			<div className="flex gap-8 overflow-auto border-b border-[#0000001A]">
				{USER_MAMANGEMENT_TABS.map((tab) => (
					<div
						key={tab.key}
						onClick={() => setActiveTab(tab.key)}
						className={`py-2 text-sm font-medium cursor-pointer transition-colors ${
							activeTab === tab.key
								? 'text-[#26064A] border-b-2 border-[#6A12CD]'
								: 'text-[#26064ACC] border-b-2 border-transparent hover:text-[#26064A]'
						}`}
					>
						{tab.label}
					</div>
				))}
			</div>
			<div className="mt-6 h-[calc(100%-4rem)] overflow-auto">
				{
					USER_MAMANGEMENT_TABS.find((tab) => tab.key === activeTab)
						?.component
				}
			</div>
		</div>
	);
};

export default AccessManagementPage;
