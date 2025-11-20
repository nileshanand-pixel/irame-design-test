import { useState } from 'react';
import RolePermissionTabContent from './tab-content/role-permission-tab-content';
import LogsTabContent from './tab-content/logs-tab-content';
import TeamsTabContent from './tab-content/teams-tab-content';
import UsersTabContent from './tab-content/users-tab-content';
import ApprovalTabContent from './tab-content/approvals-tab-content';

const USER_MAMANGEMENT_TABS = [
	{
		label: 'Users',
		key: 'users',
		component: UsersTabContent,
	},
	{
		label: 'Teams',
		key: 'teams',
		component: TeamsTabContent,
	},
	{
		label: 'Roles & Permissions',
		key: 'roles-permissions',
		component: RolePermissionTabContent,
	},
	{
		label: 'Approvals',
		key: 'approvals',
		component: ApprovalTabContent,
	},
	{
		label: 'Logs',
		key: 'logs',
		component: LogsTabContent,
	},
];

const AccessManagementPage = () => {
	const [activeTab, setActiveTab] = useState(USER_MAMANGEMENT_TABS[3].key);

	const ActiveComponent = USER_MAMANGEMENT_TABS.find(
		(tab) => tab.key === activeTab,
	)?.component;

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

			<div className="mt-6 h-[calc(100%-4rem)]">
				{ActiveComponent && <ActiveComponent />}
			</div>
		</div>
	);
};

export default AccessManagementPage;
