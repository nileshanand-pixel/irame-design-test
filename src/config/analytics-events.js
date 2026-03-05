const EVENTS_ENUM = {
	// USER SESSION
	SESSION_STARTED: 'SESSION_STARTED',

	// LOGIN FUNNEL
	SIGN_IN_PAGE_LOADED: 'SIGN_IN_PAGE_LOADED',
	TNC_ACCEPTED: 'TNC_ACCEPTED',
	SSO_LOGIN_CLICKED: 'SSO_LOGIN_CLICKED',
	SSO_LOGIN_ATTEMPTED: 'SSO_LOGIN_ATTEMPTED',
	CREDENTIALS_LOGIN_ATTEMPTED: 'CREDENTIALS_LOGIN_ATTEMPTED',
	LOGIN_SUCCESSFUL: 'LOGIN_SUCCESSFUL',
	LOGIN_FAILURE: 'LOGIN_FAILURE',
	LANDING_PAGE_LOADED: 'LANDING_PAGE_LOADED',

	// QNA FUNNEL
	CONNECT_DATA_SOURCE_CLICKED: 'CONNECT_DATA_SOURCE_CLICKED',
	RECENT_DATA_SOURCE_CLICKED: 'RECENT_DATA_SOURCE_CLICKED',
	SELECT_FROM_LIBRARY_CLICKED: 'SELECT_FROM_LIBRARY_CLICKED',
	SELECT_FROM_LIBRARY_CONTINUE_CLICKED: 'SELECT_FROM_LIBRARY_CONTINUE_CLICKED',
	SELECT_FROM_LIBRARY_CANCEL_CLICKED: 'SELECT_FROM_LIBRARY_CANCEL_CLICKED',
	SELECT_FROM_LIBRARY_CROSS_CLICKED: 'SELECT_FROM_LIBRARY_CROSS_CLICKED',
	SELECT_FROM_LIBRARY_UPLOAD_DATASET_CLICKED:
		'SELECT_FROM_LIBRARY_UPLOAD_DATASET_CLICKED',
	UPLOAD_DATASET_CLICKED: 'UPLOAD_DATASET_CLICKED',
	UPLOAD_DATASET_SUCCESSFUL: 'UPLOAD_DATASET_SUCCESSFUL',
	UPLOAD_DATASET_FAILED: 'UPLOAD_DATASET_FAILED',
	UPLOAD_MORE_CLICKED: 'UPLOAD_MORE_CLICKED',
	SAVE_DATASET_CLICKED: 'SAVE_DATASET_CLICKED',
	SAVE_DATASET_SUCCESSFUL: 'SAVE_DATASET_SUCCESSFUL',
	SAVE_DATASET_FAILED: 'SAVE_DATASET_FAILED',
	REMOVE_UPLOAD_FILE: 'REMOVE_UPLOAD_FILE',
	EXISTING_DATASET_CLICKED: 'EXISTING_DATASET_CLICKED',
	PRE_CHAT_SCREEN_LOADED: 'PRE_CHAT_SCREEN_LOADED',
	CHAT_SCREEN_LOADED: 'CHAT_SCREEN_LOADED',
	CHAT_SUGGESTIONS_LOADED: 'CHAT_SUGGESTIONS_LOADED',
	L1_CATEGORY_CLICKED: 'L1_CATEGORY_CLICKED',
	L2_CATEGORY_CLICKED: 'L2_CATEGORY_CLICKED',
	CHAT_SESSION_STARTED: 'CHAT_SESSION_STARTED',
	PLANNER_TAB_CLICKED: 'PLANNER_TAB_CLICKED',
	PLANNER_EDITED: 'PLANNER_EDITED',
	REFERENCE_TAB_CLICKED: 'REFERENCE_TAB_CLICKED',
	REFERENCE_EDITED: 'REFERENCE_EDITED',
	CODER_TAB_CLICKED: 'CODER_TAB_CLICKED',
	CODER_EDIT_ATTEMPTED: 'CODER_EDIT_ATTEMPTED',
	REGENERATE_RESPONSE_CLICKED: 'REGENERATE_RESPONSE_CLICKED',
	TABULAR_VIEW_TAB_CLICKED: 'TABULAR_VIEW_TAB_CLICKED',
	GRAPHICAL_VIEW_TAB_CLICKED: 'GRAPHICAL_VIEW_TAB_CLICKED',
	ANALYSIS_GRAPH_VARIANT_CLICKED: 'ANALYSIS_GRAPH_VARIANT_CLICKED',
	TABLE_VIEW_CHANGED: 'TABLE_VIEW_CHANGED',
	ADD_TO_DASHBOARD_CLICKED: 'ADD_TO_DASHBOARD_CLICKED',
	VIEW_DASHBOARD_CLICKED: 'VIEW_DASHBOARD_CLICKED',
	ADD_TO_REPORT_CLICKED: 'ADD_TO_REPORT_CLICKED',
	DOWNLOAD_CSV_CLICKED: 'DOWNLOAD_CSV_CLICKED',
	FOLLOW_UP_SUGGESTION_SHOWED: 'FOLLOW_UP_SUGGESTION_SHOWED',
	CLICKED_FOLLOW_UP_SUGGESTION: 'CLICKED_FOLLOW_UP_SUGGESTION',
	CHAT_MESSAGE_SENT: 'CHAT_MESSAGE_SENT',

	// DASHBOARD FUNNEL
	DASHBOARD_HOMEPAGE_LOADED: 'DASHBOARD_HOMEPAGE_LOADED',
	EXISTING_DASHBOARD_CLICKED: 'EXISTING_DASHBOARD_CLICKED',
	DASHBOARD_LOADED: 'DASHBOARD_LOADED',
	GRAPH_CARD_CLICKED: 'GRAPH_CARD_CLICKED',
	DASHBOARD_GRAPH_VIEW_CHANGED: 'DASHBOARD_GRAPH_VIEW_CHANGED',
	DASHBOARD_DOWNLOAD_CSV_CLICKED: 'DASHBOARD_DOWNLOAD_CSV_CLICKED',
	DASHBOARD_IRA_CLICKED: 'DASHBOARD_IRA_CLICKED',
	DASHBOARD_CLOSE_SUMMARY: 'DASHBOARD_CLOSE_SUMMARY',
	EDIT_DASHBOARD_CLICKED: 'EDIT_DASHBOARD_CLICKED',
	DASHBOARD_DETAILS_CHANGED: 'DASHBOARD_DETAILS_CHANGED',
	DASHBOARD_CREATE_NEW_CLICKED: 'DASHBOARD_CREATE_NEW_CLICKED',
	DASHBOARD_NEW_CREATED: 'DASHBOARD_NEW_CREATED',
	DASHBOARD_CREATE_NEW_CANCEL_CLICKED: 'DASHBOARD_CREATE_NEW_CANCEL_CLICKED',
	ADDED_ANALYSIS_TO_DASHBOARD: 'ADDED_ANALYSIS_TO_DASHBOARD',
	ADDED_ANALYSIS_TO_REPORT: 'ADDED_ANALYSIS_TO_REPORT',
	DASHBOARD_SEARCHED: 'DASHBOARD_SEARCHED',

	// CONFIGURATION FUNNEL
	CONFIG_PAGE_LOADED: 'CONFIG_PAGE_LOADED',
	SEARCH_EXISTING_DATASET: 'SEARCH_EXISTING_DATASET',
	DATASET_DELETION_SUCCESSFUL: 'DATASET_DELETION_SUCCESSFUL',
	DATASET_DELETION_FAILED: 'DATASET_DELETION_FAILED',
	DATASET_START_QUERING_CLICKED: 'DATASET_START_QUERING_CLICKED',
	DATASET_EDIT_DESCRIPTION_CLICKED: 'DATASET_EDIT_DESCRIPTION_CLICKED',
	DATASET_DESCRIPTION_UPDATED: 'DATASET_DESCRIPTION_UPDATED',
	DATASET_NAME_UPDATED: 'DATASET_NAME_UPDATED',
	DATASET_COLUMN_DESCRIPTION_UPDATED: 'DATASET_COLUMN_DESCRIPTION_UPDATED',
	DATASET_GLOSARRY_DELETED: 'DATASET_GLOSARRY_DELETED',
	DATASET_GLOSARRY_ADD_MORE_CLICKED: 'DATASET_GLOSARRY_ADD_MORE_CLICKED',
	DATASET_GLOSARRY_TERM_EDITED: 'DATASET_GLOSARRY_TERM_EDITED',
	DATASET_GLOSARRY_DESC_EDITED: 'DATASET_GLOSARRY_DESC_EDITED',
	DATASET_UPDATION_SUCCESSFUL: 'DATASET_UPDATION_SUCCESSFUL',
	DATASET_UPDATION_FAILED: 'DATASET_UPDATION_FAILED',
	DATASET_FILE_DOWNLOADED: 'DATASET_FILE_DOWNLOADED',
	DATASET_FILE_ZOOM_CLICKED: 'DATASET_FILE_ZOOM_CLICKED',

	// SIDEBAR FUNNEL
	SIDE_BAR_ASK_IRA_CLICKED: 'SIDE_BAR_ASK_IRA_CLICKED',
	SIDE_BAR_BUSSINESS_PROCESS_CLICKED: 'SIDE_BAR_BUSSINESS_PROCESS_CLICKED',
	SIDE_BAR_DASHBOARD_CLICKED: 'SIDE_BAR_DASHBOARD_CLICKED',
	SIDE_BAR_REPORT_CLICKED: 'SIDE_BAR_REPORT_CLICKED',
	SIDE_BAR_CONFIGURATION_CLICKED: 'SIDE_BAR_CONFIGURATION_CLICKED',
	SIDE_BAR_CHAT_THREAD_CLICKED: 'SIDE_BAR_CHAT_THREAD_CLICKED',
	SIDE_BAR_CHAT_DELETED: 'SIDE_BAR_CHAT_DELETED',

	// EDA BUILDER FUNNEL
	SIDE_BAR_EDA_BUILDER_CLICKED: 'SIDE_BAR_EDA_BUILDER_CLICKED',
	EDA_ANALYSIS_STARTED: 'EDA_ANALYSIS_STARTED',
	EDA_ANALYSIS_COMPLETED: 'EDA_ANALYSIS_COMPLETED',
	EDA_ANALYSIS_FAILED: 'EDA_ANALYSIS_FAILED',
	EDA_REPORT_VIEWED: 'EDA_REPORT_VIEWED',
	EDA_JOB_DELETED: 'EDA_JOB_DELETED',

	// LOGOUT FUNNEL
	LOGOUT_CLICKED: 'LOGOUT_CLICKED',
	LOGOUT_SUCCESSFUL: 'LOGOUT_SUCCESSFUL',
	LOGOUT_FAILED: 'LOGOUT_FAILED',
};

const EVENTS_REGISTRY = {
	// USER SESSION
	SESSION_STARTED: {
		trigger: 'when a new session gets created',
		parameters: ['entry_point'],
	},

	// LOGIN FUNNEL
	SIGN_IN_PAGE_LOADED: {
		trigger: 'when user lands on Login Page',
		parameters: [],
	},
	TNC_ACCEPTED: {
		trigger: 'when user click on continue btn of tcn modal',
		parameters: ['tnc_version'],
	},
	SSO_LOGIN_CLICKED: {
		trigger: 'When user clicks on "continue with SSO" and team name input opens',
		parameters: [],
	},
	SSO_LOGIN_ATTEMPTED: {
		trigger: 'When user enters team name and clicks on "continue with SSO"',
		parameters: ['team_name'],
	},
	CREDENTIALS_LOGIN_ATTEMPTED: {
		trigger: 'When user enters username and password and clicks on continue',
		parameter: [],
	},
	LOGIN_SUCCESSFUL: {
		trigger: 'When login is successful',
		parameter: ['type', 'login_type', 'team_name'],
	},
	LOGIN_FAILURE: {
		trigger: 'When login is failed',
		parameters: ['type', 'login_type', 'team_name'],
	},
	LANDING_PAGE_LOADED: {
		trigger: 'When homepage is loaded',
		parameters: [],
	},

	// QNA FUNNEL
	CONNECT_DATA_SOURCE_CLICKED: {
		trigger: 'When user clicks on connect data source',
		parameters: [],
	},
	RECENT_DATA_SOURCE_CLICKED: {
		trigger: 'when user clicks on any recent datasource shown',
		parameter: ['dataset_id', 'dataset_name', 'total_shown', 'clicked_on'],
	},
	SELECT_FROM_LIBRARY_CLICKED: {
		trigger: 'When user clicks on select from library',
		parameters: [],
	},
	SELECT_FROM_LIBRARY_CONTINUE_CLICKED: {
		trigger: 'When user chooses a dataset from the list and clicks on continue',
		parameter: [
			'total_datasets_shown',
			'clicked_on',
			'dataset_id',
			'dataset_name',
		],
	},
	SELECT_FROM_LIBRARY_CANCEL_CLICKED: {
		trigger: 'When user clicks on cancel',
		parameter: [],
	},
	SELECT_FROM_LIBRARY_CROSS_CLICKED: {
		trigger: 'When user crosses the select from library pop-up',
		parameter: [],
	},
	SELECT_FROM_LIBRARY_UPLOAD_DATASET_CLICKED: {
		trigger: 'When no dataset is available and user clicks on upload dataset',
		parameter: [],
	},
	UPLOAD_DATASET_CLICKED: {
		trigger: 'When user clicks on upload dataset',
		parameter: [],
	},
	UPLOAD_DATASET_SUCCESSFUL: {
		trigger: 'When dataset is successfully uploaded',
		parameter: ['files_count', 'files_type'],
	},
	UPLOAD_DATASET_FAILED: {
		trigger: 'When uploading dataset failed',
		parameter: [
			'files_count',
			'files_type',
			'files_failed_count',
			'error_desc',
			'error_code',
		],
	},
	UPLOAD_MORE_CLICKED: {
		trigger: 'When user clicks on upload more',
		parameter: [],
	},
	SAVE_DATASET_CLICKED: {
		trigger: 'When user clicks on save dataset',
		parameter: [
			'files_count',
			'files_type',
			'analysis_chosen',
			'dataset_name',
			'is_description_filled',
		],
	},
	SAVE_DATASET_SUCCESSFUL: {
		trigger: 'When dataset is successfully saved',
		parameter: [
			'files_count',
			'files_type',
			'analysis_chosen',
			'dataset_id',
			'dataset_name',
			'is_description_filled',
			'total_dataset_size',
		],
	},
	SAVE_DATASET_FAILED: {
		trigger: 'When dataset is failed to get saved',
		parameter: [
			'files_count',
			'files_type',
			'total_dataset_size',
			'error_desc',
			'error_code',
		],
	},
	REMOVE_UPLOAD_FILE: {
		trigger: 'When user clicks on cross button in front of uploaded file',
		parameter: ['file_type', 'file_name'],
	},
	EXISTING_DATASET_CLICKED: {
		trigger: 'When user clicks on existing dataset and reaches chat screen',
		parameter: ['dataset_id', 'dataset_name', 'source'],
	},
	PRE_CHAT_SCREEN_LOADED: {
		trigger: 'When pre chat screen is loaded',
		parameter: ['dataset_id', 'dataset_name', 'source'],
	},
	CHAT_SCREEN_LOADED: {
		trigger: 'When chat screen is loaded',
		parameter: [
			'dataset_id',
			'dataset_name',
			'source',
			'chat_session_id',
			'chat_session_type',
		],
	},
	CHAT_SUGGESTIONS_LOADED: {
		trigger: 'When suggestions are loaded after data processing',
		parameter: ['dataset_id', 'dataset_name', 'categories'],
	},
	L1_CATEGORY_CLICKED: {
		trigger: 'when a Level 1 category is clicked',
		parameters: ['dataset_id', 'dataset_name', 'category_name'],
	},
	L2_CATEGORY_CLICKED: {
		trigger: 'when a Level 2 category is clicked',
		parameters: [
			'dataset_id',
			'dataset_name',
			'l1_category_name',
			'clicked_on',
			'total_suggestions',
		],
	},
	CHAT_SESSION_STARTED: {
		trigger: 'when user start a new user session',
		parameters: [
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'start_method',
			'chat_session_type',
		],
	},
	PLANNER_TAB_CLICKED: {
		trigger: 'When user clicks on planner tab',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	PLANNER_EDITED: {
		trigger: 'When user change anything in planner and click on save',
		parameters: [
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'query_id',
			'type_change',
		],
	},
	REFERENCE_TAB_CLICKED: {
		trigger: 'When user clicks on reference tab',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	REFERENCE_EDITED: {
		trigger: 'When user tries to change something in reference',
		parameters: [
			'edited_file_names',
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'query_id',
		],
	},
	CODER_TAB_CLICKED: {
		trigger: 'When user clicks on codder tab',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	CODER_EDIT_ATTEMPTED: {
		trigger: 'When user tries to edit coder',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	REGENERATE_RESPONSE_CLICKED: {
		trigger: 'when regenerate response is clicked',
		parameters: [
			'type_change',
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'query_id',
		],
	},
	TABULAR_VIEW_TAB_CLICKED: {
		trigger: 'When user clicked on tabular view tab',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	GRAPHICAL_VIEW_TAB_CLICKED: {
		trigger: 'When user clicks on graphical view tab',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	ANALYSIS_GRAPH_VARIANT_CLICKED: {
		trigger: 'When user clicks on different graphs',
		parameters: [
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'query_id',
			'graph_id',
			'graph_name',
			'graph_type',
		],
	},
	TABLE_VIEW_CHANGED: {
		trigger: 'When user tries to change the output table view by sorting',
		parameters: [
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'query_id',
			'change_type',
		],
	},
	ADD_TO_DASHBOARD_CLICKED: {
		trigger: 'when add to dashboard is clicked',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	VIEW_DASHBOARD_CLICKED: {
		trigger:
			'When user clicks on view dashboard pop_up after adding to dashboard',
		parameters: [
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'query_id',
			'dashboard_id',
			'dashboard_name',
		],
	},
	ADD_TO_REPORT_CLICKED: {
		trigger: 'When user clicks on add to report',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	DOWNLOAD_CSV_CLICKED: {
		trigger: 'When user downloads CSV from query',
		parameters: ['chat_session_id', 'dataset_id', 'dataset_name', 'query_id'],
	},
	FOLLOW_UP_SUGGESTION_SHOWED: {
		trigger: 'When follow-up suggestions are shown to the user',
		parameters: [
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'query_id',
			'ques_count',
		],
	},
	CLICKED_FOLLOW_UP_SUGGESTION: {
		trigger: 'When user clicks on follow-up suggestion',
		parameters: [
			'chat_session_id',
			'dataset_id',
			'dataset_name',
			'query_id',
			'question',
			'clicked_on',
		],
	},
	CHAT_MESSAGE_SENT: {
		trigger: 'When user or AI sends a message in the chatbox',
		parameters: [
			'chat_session_id',
			'query_id',
			'dataset_id',
			'dataset_name',
			'message_type',
			'message_source',
			'message_text',
			'is_clarification',
			'message_number',
			'first_message_in_chat',
		],
	},

	// DASHBOARD FUNNEL
	DASHBOARD_HOMEPAGE_LOADED: {
		trigger: 'When user reaches dashboard homepage',
		parameters: [],
	},
	EXISTING_DASHBOARD_CLICKED: {
		trigger: 'When user clicks on existing dashboard',
		parameters: ['dashboard_id', 'dashboard_name'],
	},
	DASHBOARD_LOADED: {
		trigger: 'When dashboard is loaded',
		parameters: ['dashboard_id', 'dashboard_name', 'total_cards'],
	},
	GRAPH_CARD_CLICKED: {
		trigger: 'When user clicks on any graph card',
		parameters: [
			'dashboard_id',
			'dashboard_name',
			'query_id',
			'query_text',
			'dashboard_content_id',
		],
	},
	DASHBOARD_GRAPH_VIEW_CHANGED: {
		trigger: 'When user changes the graph',
		parameters: [
			'dashboard_id',
			'dashboard_name',
			'query_id',
			'query_text',
			'graph_id',
			'graph_title',
			'graph_type',
			'dashboard_content_id',
		],
	},
	DASHBOARD_DOWNLOAD_CSV_CLICKED: {
		trigger: 'When user downloads csv',
		parameters: [
			'dashboard_id',
			'dashboard_name',
			'query_id',
			'query_text',
			'dashboard_content_id',
		],
	},
	DASHBOARD_IRA_CLICKED: {
		trigger: 'When user clicks on IRA',
		parameters: [
			'dashboard_id',
			'dashboard_name',
			'query_id',
			'query_text',
			'dashboard_content_id',
		],
	},
	DASHBOARD_CLOSE_SUMMARY: {
		trigger: 'When user clicks on cross to close summary',
		parameters: [
			'dashboard_id',
			'dashboard_name',
			'query_id',
			'query_text',
			'dashboard_content_id',
		],
	},
	EDIT_DASHBOARD_CLICKED: {
		trigger: 'when user clicks on edit dashboard',
		parameters: ['dashboard_id', 'dashboard_name'],
	},
	DASHBOARD_DETAILS_CHANGED: {
		trigger: 'When user update dashboard details',
		parameters: ['dashboard_id', 'change_param'],
	},
	DASHBOARD_CREATE_NEW_CLICKED: {
		trigger: 'When user clicks on create new dashboard',
		parameters: [],
	},
	DASHBOARD_NEW_CREATED: {
		trigger: 'When user creates new dashboard',
		parameters: ['dashboard_id', 'dashboard_name'],
	},
	DASHBOARD_CREATE_NEW_CANCEL_CLICKED: {
		trigger: 'When user clicks on cancel while creating new dashboard',
		parameters: [],
	},
	ADDED_ANALYSIS_TO_DASHBOARD: {
		trigger: 'when user adds analysis to dashboard',
		parameters: [
			'chat_session_id',
			'query_id',
			'dataset_id',
			'dataset_name',
			'dashboard_id',
			'dashboard_name',
			'dashboard_type',
		],
	},
	ADDED_ANALYSIS_TO_REPORT: {
		trigger: 'when user adds analysis to report',
		parameters: [
			'chat_session_id',
			'query_id',
			'dataset_id',
			'dataset_name',
			'report_name',
			'report_id',
			'report_type',
		],
	},
	DASHBOARD_SEARCHED: {
		trigger: 'when dashboard search is performed',
		parameters: ['search_query'],
	},

	// CONFIGURATION FUNNEL
	CONFIG_PAGE_LOADED: {
		trigger: 'When configuration page is loaded',
		parameters: ['source'],
	},
	SEARCH_EXISTING_DATASET: {
		trigger: 'When user searches for dataset',
		parameters: ['search_query'],
	},
	DATASET_DELETION_SUCCESSFUL: {
		trigger: 'When dataset is deleted successfully',
		parameters: ['source', 'dataset_id', 'dataset_name'],
	},
	DATASET_DELETION_FAILED: {
		trigger: 'When dataset is failed to be deleted',
		parameters: [
			'source',
			'dataset_id',
			'dataset_name',
			'error_desc',
			'error_code',
		],
	},
	DATASET_START_QUERING_CLICKED: {
		trigger: 'When user clicks on start querying',
		parameters: ['dataset_id', 'dataset_name'],
	},
	DATASET_EDIT_DESCRIPTION_CLICKED: {
		trigger: 'When user clicks on edit description',
		parameters: ['dataset_id', 'dataset_name'],
	},
	DATASET_DESCRIPTION_UPDATED: {
		trigger: 'When user clicks on save after changing description',
		parameters: ['dataset_id', 'dataset_name', 'old_desc', 'new_desc'],
	},
	DATASET_NAME_UPDATED: {
		trigger: 'When user updates the name',
		parameters: ['dataset_id', 'dataset_name', 'old_name', 'new_name'],
	},
	DATASET_COLUMN_DESCRIPTION_UPDATED: {
		trigger: 'When user updates file column’s description',
		parameters: [
			'dataset_id',
			'dataset_name',
			'file_name',
			'file_id',
			'col_name',
			'old_col_desc',
			'new_col_desc',
		],
	},
	DATASET_GLOSARRY_DELETED: {
		trigger: 'When user deletes the glossary',
		parameters: ['dataset_id', 'dataset_name', 'glossary_term', 'glossary_desc'],
	},
	DATASET_GLOSARRY_ADD_MORE_CLICKED: {
		trigger: 'When user clicks on add more button',
		parameters: ['dataset_id', 'dataset_name'],
	},
	DATASET_GLOSARRY_TERM_EDITED: {
		trigger: 'When user tries to update term',
		parameters: [
			'dataset_id',
			'dataset_name',
			'old_glossary_term',
			'new_glossary_term',
		],
	},
	DATASET_GLOSARRY_DESC_EDITED: {
		trigger: 'When user tries to update description',
		parameters: [
			'dataset_id',
			'dataset_name',
			'old_glossary_desc',
			'new_glossary_desc',
		],
	},
	DATASET_UPDATION_SUCCESSFUL: {
		trigger: 'when dataset is updated successfully',
		parameters: ['dataset_id', 'dataset_name', 'changes'],
	},
	DATASET_UPDATION_FAILED: {
		trigger: 'When save changes is clicked and dataset is failed to get updated',
		parameters: [
			'dataset_id',
			'dataset_name',
			'changes',
			'error_desc',
			'error_code',
		],
	},
	DATASET_FILE_DOWNLOADED: {
		trigger: 'when user downloads a file from dataset',
		parameters: ['dataset_id', 'dataset_name', 'file_name'],
	},
	DATASET_FILE_ZOOM_CLICKED: {
		trigger: 'When file is zoomed in',
		parameters: ['dataset_id', 'dataset_name', 'file_name'],
	},

	// SIDEBAR FUNNEL
	SIDE_BAR_ASK_IRA_CLICKED: {
		trigger: 'when user clicks on ask ira in side bar',
		parameters: [],
	},
	SIDE_BAR_BUSSINESS_PROCESS_CLICKED: {
		trigger: 'when user clicks on business process in side bar',
		parameters: [],
	},
	SIDE_BAR_DASHBOARD_CLICKED: {
		trigger: 'when user clicks on dashboard in side bar',
		parameters: [],
	},
	SIDE_BAR_REPORT_CLICKED: {
		trigger: 'when user clicks on report in side bar',
		parameters: [],
	},
	SIDE_BAR_CONFIGURATION_CLICKED: {
		trigger: 'when user clicks on configuration in side bar',
		parameters: [],
	},
	SIDE_BAR_CHAT_THREAD_CLICKED: {
		trigger: 'when user clicks on chat thread in side bar',
		parameters: ['type', 'chat_session_id', 'workflow_id'],
	},
	SIDE_BAR_CHAT_DELETED: {
		trigger: 'when user deletes a chat thread from side bar',
		parameters: ['type', 'chat_session_id', 'workflow_id'],
	},

	// EDA BUILDER FUNNEL
	SIDE_BAR_EDA_BUILDER_CLICKED: {
		trigger: 'when user clicks on EDA Builder in side bar',
		parameters: [],
	},
	EDA_ANALYSIS_STARTED: {
		trigger: 'when user starts a new EDA analysis',
		parameters: ['file_count', 'file_names'],
	},
	EDA_ANALYSIS_COMPLETED: {
		trigger: 'when EDA analysis completes successfully',
		parameters: ['job_id', 'file_count', 'duration_seconds'],
	},
	EDA_ANALYSIS_FAILED: {
		trigger: 'when EDA analysis fails',
		parameters: ['job_id', 'error_message'],
	},
	EDA_REPORT_VIEWED: {
		trigger: 'when user views an EDA report',
		parameters: ['job_id', 'report_type'],
	},
	EDA_JOB_DELETED: {
		trigger: 'when user deletes an EDA job',
		parameters: ['job_id'],
	},

	// LOGOUT FUNNEL
	LOGOUT_CLICKED: {
		trigger: 'when user clicks on logout',
		parameters: [],
	},
	LOGOUT_SUCCESSFUL: {
		trigger: 'when user successfully logs out',
		parameters: [],
	},
	LOGOUT_FAILED: {
		trigger: 'when user fails to logout',
		parameters: ['error_desc', 'error_code'],
	},
};

export { EVENTS_REGISTRY, EVENTS_ENUM };
