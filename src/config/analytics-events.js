const EVENTS_ENUM = {
    SIGN_IN_PAGE_LOADED: 'SIGN_IN_PAGE_LOADED', 
    CONTINUE_CLICKED: 'CONTINUE_CLICKED',  
    LOGIN_FAILURE: 'LOGIN_FAILURE',		   
    SSO_LOGIN_CLICKED: 'SSO_LOGIN_CLICKED', 
    SUCCESSFUL_LOGIN: 'SUCCESSFUL_LOGIN', 
    LANDING_PAGE_LOADED: 'LANDING_PAGE_LOADED', 
    CONNECT_DATA_SOURCE_CLICKED: 'CONNECT_DATA_SOURCE_CLICKED', 
    SELECT_FROM_LIBRARY_CLICKED: 'SELECT_FROM_LIBRARY_CLICKED', 
    L1_CATEGORY_CLICKED: 'L1_CATEGORY_CLICKED', 
    L2_CATEGORY_CLICKED: 'L2_CATEGORY_CLICKED', 
    CHAT_SESSION_STARTED: 'CHAT_SESSION_STARTED', 
    QUERY_INITIATED: 'QUERY_INITIATED',
    QUERY_STATUS: 'QUERY_STATUS',
    EDIT_WORKSPACE_CLICKED: 'EDIT_WORKSPACE_CLICKED',
    REGENERATE_RESPONSE_CLICKED: 'REGENERATE_RESPONSE_CLICKED',
    ADD_TO_DASHBOARD_CLICKED: 'ADD_TO_DASHBOARD_CLICKED', 
    DOWNLOAD_CSV: 'DOWNLOAD_CSV', 
    DASHBOARD_CREATED: 'DASHBOARD_CREATED', 
    REPORT_SHARED: 'REPORT_SHARED', 
    VIEW_REPORTS_CLICKED: 'VIEW_REPORTS_CLICKED', 
    VIEW_DASHBOARD_CLICKED: 'VIEW_DASHBOARD_CLICKED', 
    GRAPH_TAB_CLICKED: 'GRAPH_TAB_CLICKED', 
    GRAPH_VIEW_CHANGED: 'GRAPH_VIEW_CHANGED', 
    CONFIGURATION_TAB_CLICKED: 'CONFIGURATION_TAB_CLICKED', 
    UPLOAD_DATASOURCE_CLICKED: 'UPLOAD_DATASOURCE_CLICKED', 
    DATASOURCE_INTENT_SELECTED: 'DATASOURCE_INTENT_SELECTED', 
    DATASOURCE_CREATION_FAILED: 'DATASOURCE_CREATION_FAILED', 
    DATASOURCE_FILES_S3_UPLOAD_FAILED: 'DATASOURCE_FILES_S3_UPLOAD_FAILED',
    DATASOURCE_CREATED_SUCCESSFULLY: 'DATASOURCE_CREATED_SUCCESSFULLY',
    DATASOURCE_PROCESSED_SUCCESSFULLY: 'DATASOURCE_PROCESSED_SUCCESSFULLY', 
    SUCCESSFUL_LOGOUT: 'SUCCESSFUL_LOGOUT',  
    CHAT_HISTORY_SESSION_CLICKED: 'CHAT_HISTORY_SESSION_CLICKED',
    WORKSPACE_EDIT_CANCEL_CLICKED: 'WORKSPACE_EDIT_CANCEL_CLICKED',
    WORKSPACE_EDIT_SAVE_CLICKED: 'WORKSPACE_EDIT_SAVE_CLICKED',
    SIDENAV_DASHBOARD_CLICKED: 'SIDENAV_DASHBOARD_CLICKED',
    SIDENAV_REPORT_CLICKED: 'SIDENAV_REPORT_CLICKED',
    DASHBOARDS_CREATED: 'DASHBOARDS_CREATED',
    DASHBOARD_CLICKED: 'DASHBOARD_CLICKED',
    DASHBOARD_SEARCHED: 'DASHBOARD_SEARCHED',
    DASHBOARD_ITEM_CLICKED: 'DASHBOARD_ITEM_CLICKED',
    DASHBOARD_CONTENT_GRAPH_ITEM_CLICKED: 'DASHBOARD_CONTENT_GRAPH_ITEM_CLICKED',
    TOGGLE_WORKSPACE_BUTTON: 'TOGGLE_WORKSPACE_BUTTON',
    FOLLOW_UP_QUERY_INITIATED: 'FOLLOW_UP_QUERY_INITIATED',
    REPLY_QUERY_INITIATED: 'REPLY_QUERY_INITIATED'
};

const EVENTS_REGISTRY = {
    SIGN_IN_PAGE_LOADED: {
        event_id: 'PRO_1',
        trigger: 'when user lands on Login Page',
        parameters: [],
    },
    CONTINUE_CLICKED: {
        event_id: 'PRO_2',
        trigger: 'when email and password are entered',
        parameters: [],
    },
    LOGIN_FAILURE: {
        event_id: 'PRO_3',
        trigger: 'when login credentials are invalid',
        parameters: [],
    },
    SSO_LOGIN_CLICKED: {
        event_id: 'PRO_4',
        trigger: 'when SSO login button is clicked',
        parameters: [],
    },
    SUCCESSFUL_LOGIN: {
        event_id: 'PRO_5',
        trigger: 'when user successfully logs in',
        parameters: ['enterprise_id', 'user_id'],
    },
    LANDING_PAGE_LOADED: {
        event_id: 'PRO_6',
        trigger: 'when landing page is loaded after login',
        parameters: ['enterprise_id', 'user_id'],
    },
    CONNECT_DATA_SOURCE_CLICKED: {
        event_id: 'PRO_7',
        trigger: 'when user clicks to connect a data source',
        parameters: ['enterprise_id', 'user_id'],
    },
    SELECT_FROM_LIBRARY_CLICKED: {
        event_id: 'PRO_8',
        trigger: 'when user selects a data source from the library',
        parameters: [],
    },
    CHAT_SESSION_STARTED: {
        event_id: 'PRO_9',
        trigger: 'when a new chat session is started',
        parameters: [],
    },
    L1_CATEGORY_CLICKED: {
        event_id: 'PRO_10',
        trigger: 'when a Level 1 category is clicked',
        parameters: [],
    },
    L2_CATEGORY_CLICKED: {
        event_id: 'PRO_11',
        trigger: 'when a Level 2 category is clicked',
        parameters: ['query_id', 'ds_id'],
    },
    QUERY_INITIATED: {
        event_id: 'PRO_12',
        trigger: 'when a query is initiated',
        parameters: ['query_id', 'datasource_id', 'query_number'],
    },
    QUERY_STATUS: {
        event_id: 'PRO_13',
        trigger: 'when query status is updated',
        parameters: [
            'initial_queue_number',
            'processing_started_timestamp',
            'planner_text',
            'planner_completed_timestamp',
            'coder_text',
            'coder_completed_timestamp',
        ],
    },
    EDIT_WORKSPACE_CLICKED: {
        event_id: 'PRO_14',
        trigger: 'when workspace edit is clicked',
        parameters: [
            'query_interpretation_changed',
            'data_availability_changed',
            'data_processing_changed',
        ],
    },
    REGENERATE_RESPONSE_CLICKED: {
        event_id: 'PRO_15',
        trigger: 'when regenerate response is clicked',
        parameters: [],
    },
    ADD_TO_DASHBOARD_CLICKED: {
        event_id: 'PRO_16',
        trigger: 'when add to dashboard is clicked',
        parameters: ['query_id', 'child_query_number'],
    },
    DOWNLOAD_CSV: {
        event_id: 'PRO_17',
        trigger: 'when CSV download is initiated',
        parameters: ['query_id', 'child_query_number'],
    },
    DASHBOARD_CREATED: {
        event_id: 'PRO_18',
        trigger: 'when a dashboard is created',
        parameters: ['page_info'],
    },
    REPORT_SHARED: {
        event_id: 'PRO_19',
        trigger: 'when a report is shared',
        parameters: [],
    },
    VIEW_REPORTS_CLICKED: {
        event_id: 'PRO_20',
        trigger: 'when view reports is clicked',
        parameters: ['snackbar_message'],
    },
    VIEW_DASHBOARD_CLICKED: {
        event_id: 'PRO_21',
        trigger: 'when view dashboard is clicked',
        parameters: ['snackbar_message'],
    },
    GRAPH_TAB_CLICKED: {
        event_id: 'PRO_22',
        trigger: 'when graph tab is clicked',
        parameters: ['total_graph_generated'],
    },
    GRAPH_VIEW_CHANGED: {
        event_id: 'PRO_23',
        trigger: 'when graph view is changed',
        parameters: ['graph_viewed_number'],
    },
    CONFIGURATION_TAB_CLICKED: {
        event_id: 'PRO_24',
        trigger: 'when configuration tab is clicked',
        parameters: [],
    },
    UPLOAD_DATASOURCE_CLICKED: {
        event_id: 'PRO_25',
        trigger: 'when upload data source is clicked',
        parameters: [],
    },
    DATASOURCE_INTENT_SELECTED: {
        event_id: 'PRO_26',
        trigger: 'when data source intent is selected',
        parameters: ['list_of_intent_options'],
    },
    DATASOURCE_CREATION_FAILED: {
        event_id: 'PRO_27',
        trigger: 'when data source creation fails',
        parameters: ['uploaded', 'file_upload_status', 'duplicate_id'],
    },
    
    DATASOURCE_CREATED_SUCCESSFULLY: {
        event_id: 'PRO_28',
        trigger: 'when data source is created successfully',
        parameters: ['datasource_id'],
    },
    DATASOURCE_PROCESSED_SUCCESSFULLY: {
        event_id: 'PRO_29',
        trigger: 'when data source is processed successfully',
        parameters: ['datasource_id'],
    },
    SUCCESSFUL_LOGOUT: {
        event_id: "PRO_30",
        trigger: 'when user logouts from website'
    },
    CHAT_HISTORY_SESSION_CLICKED: {
        event_id: 'PRO_31',
        trigger: 'when user selects a session from history',
        parameters: ['title']
    },
    WORKSPACE_EDIT_CANCEL_CLICKED: {
        event_id: 'PRO_33',
        trigger: 'when workspace edit is canceled',
        parameters: [],
    },
    WORKSPACE_EDIT_SAVE_CLICKED: {
        event_id: 'PRO_34',
        trigger: 'when workspace edit is saved',
        parameters: ['query_id', 'parent_query_id', 'child_no'],
    },
    SIDENAV_DASHBOARD_CLICKED: {
        event_id: 'PRO_35',
        trigger: 'when dashboard is clicked in side navigation',
        parameters: [],
    },
    SIDENAV_REPORT_CLICKED: {
        event_id: 'PRO_36',
        trigger: 'when report is clicked in side navigation',
        parameters: [],
    },
    DASHBOARDS_CREATED: {
        event_id: 'PRO_37',
        trigger: 'when multiple dashboards are created',
        parameters: ['page_info'],
    },
    DASHBOARD_CLICKED: {
        event_id: 'PRO_38',
        trigger: 'when specific dashboard is clicked',
        parameters: ['dashboard_id'],
    },
    DASHBOARD_SEARCHED: {
        event_id: 'PRO_39',
        trigger: 'when dashboard search is performed',
        parameters: ['search_key'],
    },
    DASHBOARD_ITEM_CLICKED: {
        event_id: 'PRO_40',
        trigger: 'when dashboard item is clicked',
        parameters: ['ds_content_id'],
    },
    DASHBOARD_CONTENT_GRAPH_ITEM_CLICKED: {
        event_id: 'PRO_41',
        trigger: 'when graph item in dashboard content is clicked',
        parameters: [],
    },
    TOGGLE_WORKSPACE_BUTTON: {
        event_id: 'PRO_42',
        trigger: 'when workspace button is shown',
        parameters: ['query_id', 'parent_query_id', 'child_no'],
    },
    DATASOURCE_FILES_S3_UPLOAD_FAILED: {
        event_id: 'PRO_43',
        trigger: 'when any of the files selected by user fails to upload',
        parameters: []
    },
    FOLLOW_UP_QUERY_INITIATED: {
        event_id: 'PRO_44',
        trigger: 'when user sends a follow up queries from ui',
        parameters: ['query_id', 'datasource_id', 'query_number', 'parent_query_id', 'session_id'],
    },
    REPLY_QUERY_INITIATED:{
        event_id: 'PRO_45',
        trigger: 'when user sends a reply to ira answer',
        parameters: ['query_id', 'datasource_id', 'query_number', 'parent_query_id', 'session_id'],
    },
};

export { EVENTS_REGISTRY, EVENTS_ENUM };