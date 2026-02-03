// Shared constants for the reports feature

import { LayoutGrid, List } from 'lucide-react';
import ReportFilesList from './components/listing-page/ReportFilesList';
import ReportFilesGrid from './components/listing-page/ReportFilesGrid';

// Views
export const VIEWS = {
	LIST: {
		label: 'List',
		key: 'list',
		icon: List,
		component: ReportFilesList,
	},
	GRID: {
		label: 'Grid',
		key: 'grid',
		icon: LayoutGrid,
		component: ReportFilesGrid,
	},
};

// Tabs
export const TABS = {
	MY_REPORTS: {
		label: 'My Reports',
		fragment: 'my-reports',
		space: 'personal',
		key: 'my-reports',
		isVisible: true,
	},
	SHARED_REPORTS: {
		label: 'Shared Reports',
		fragment: 'shared-reports',
		space: 'shared',
		key: 'shared-reports',
		isVisible: true,
	},
};
export const TABS_ARRAY = Object.values(TABS);
export const TAB_MY_REPORTS = TABS.MY_REPORTS;
export const TAB_SHARED_REPORTS = TABS.SHARED_REPORTS;

// Spaces
export const SPACES = {
	PERSONAL: 'personal',
	SHARED: 'shared',
};

export const SPACES_ARRAY = Object.values(SPACES);
export const PERSONAL = SPACES.PERSONAL;
export const SHARED = SPACES.SHARED;

// Sort / order options
export const ORDERS = {
	ASC: 'asc',
	DESC: 'desc',
	UPDATED_AT: 'updated',
	CREATED_AT: 'created',
};
export const ORDERS_ARRAY = Object.values(ORDERS);
export const ASC = ORDERS.ASC;
export const DESC = ORDERS.DESC;
export const UPDATED_AT = ORDERS.UPDATED_AT;
export const CREATED_AT = ORDERS.CREATED_AT;

export const CASE_GENERATION_STATUS = {
	GENERATED: 'GENERATED',
	GENERATING: 'GENERATING',
	FAILED: 'FAILED',
	NOT_GENERATED: 'NOT_GENERATED',
};
export default {
	VIEWS,
	TABS,
	SPACES,
	ORDERS,
	TABS_ARRAY,
	SPACES_ARRAY,
	ORDERS_ARRAY,
};
