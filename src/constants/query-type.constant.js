export const QUERY_TYPES = {
	WORKFLOW: 'workflow',
	SQL_WORKFLOW: 'sqlWorkflow',
	SINGLE: 'single',
	BULK: 'bulk',
};

export const WORKFLOW_QUERY_TYPES = [QUERY_TYPES.WORKFLOW, QUERY_TYPES.SQL_WORKFLOW];

export const isWorkflowQuery = (type) => WORKFLOW_QUERY_TYPES.includes(type);
