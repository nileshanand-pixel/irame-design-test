/**
 * Constants for Add to Dashboard feature
 */

export const STEPS = {
	SELECT_DASHBOARD: 1,
	SELECT_WIDGETS: 2,
};

export const WIDGET_TYPES = {
	GRAPH: 'graph',
	TABLE: 'table',
	KPI: 'kpi',
};

export const ERROR_CODES = {
	INVALID_REQUEST: 'invalid_request',
	GRAPH_NOT_FOUND: 'graph_not_found',
	TABLE_NOT_FOUND: 'table_not_found',
	DASHBOARD_NOT_FOUND: 'dashboard_not_found',
};

export const DEFAULT_VALUES = {
	DASHBOARD_DESCRIPTION: 'Review of product accessibility features',
	TIMESTAMP_TEXT: '10 minutes ago',
	UNTITLED_DASHBOARD: 'Untitled Dashboard',
	UNTITLED_GRAPH: 'Untitled Graph',
	DATA_TABLE_TITLE: 'Data Table',
};

export const QUERY_KEYS = {
	MY_DASHBOARDS: ['my-dashboards'],
	DASHBOARDS_CONTAINING_QUERY: (queryId) => [
		'dashboards-containing-query',
		queryId,
	],
	QUERY_DATA: (queryId) => ['query-data', queryId],
	DASHBOARD_CONTENT: (dashboardId) => ['dashboard-content', dashboardId],
};

export const DIALOG_CLASSES = {
	SELECT_DASHBOARD: 'max-w-3xl overflow-hidden rounded-xl flex flex-col p-0',
	SELECT_WIDGETS:
		'max-w-7xl max-h-[90vh] rounded-xl overflow-hidden flex flex-col p-0 gap-0',
};
