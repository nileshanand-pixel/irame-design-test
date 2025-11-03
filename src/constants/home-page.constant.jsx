import dashboardActiveIcon from '@/assets/icons/dashboard-active.svg';
import dashboardIcon from '@/assets/icons/dashboard.svg';
import sessionActiveIcon from '@/assets/icons/session-active.svg';
import sessionIcon from '@/assets/icons/session.svg';
import reportsActiveIcon from '@/assets/icons/reports-active.svg';
import reportsIcon from '@/assets/icons/reports.svg';
import workflowActiveIcon from '@/assets/icons/workflow-active.svg';
import workflowIcon from '@/assets/icons/workflow.svg';
import WorkflowTabContent from '@/components/features/home/dashboard/tab-content/workflow-tab-content';
import ReportsTabContent from '@/components/features/home/dashboard/tab-content/reports-tab-content';
import DashboardsTabContent from '@/components/features/home/dashboard/tab-content/dashboard-tab-content';
import SessionsTabContent from '@/components/features/home/dashboard/tab-content/sessions-tab-content';

export const DASHBOARD_TABS_VALUES = {
	WORKFLOWS: 'workflows',
	SESSIONS: 'sessions',
	REPORTS: 'reports',
	DASHBOARDS: 'dashboards',
};

export const DASHBOARD_TABS = [
	{
		title: 'Workflows',
		value: DASHBOARD_TABS_VALUES.WORKFLOWS,
		icon: workflowIcon,
		activeIcon: workflowActiveIcon,
		component: WorkflowTabContent,
		description: 'Total workflow executed',
	},
	{
		title: 'Sessions',
		value: DASHBOARD_TABS_VALUES.SESSIONS,
		icon: sessionIcon,
		activeIcon: sessionActiveIcon,
		component: SessionsTabContent,
		description: 'Total sessions created',
	},
	{
		title: 'Reports',
		value: DASHBOARD_TABS_VALUES.REPORTS,
		icon: reportsIcon,
		activeIcon: reportsActiveIcon,
		component: ReportsTabContent,
		description: 'Total reports generated',
	},
	{
		title: 'Dashboards',
		value: DASHBOARD_TABS_VALUES.DASHBOARDS,
		icon: dashboardIcon,
		activeIcon: dashboardActiveIcon,
		component: DashboardsTabContent,
		description: 'Total dashboards created',
	},
];
