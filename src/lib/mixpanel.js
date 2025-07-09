import { FIRST_EVENT_IN_USER_SESSION, USER_SESSION_ID } from '@/constants/session-manager.constant';
import { getCookie } from '@/utils/cookies';
import { getLocalStorage, removeFromLocalStorage } from '@/utils/local-storage';
import mixpanel from 'mixpanel-browser';
import { MIXPANEL_URL } from '@/config';

const env = import.meta.env.VITE_ENV;
const tokens = {
	local: import.meta.env.VITE_MIXPANEL_TOKEN_LOCAL,
	stage: import.meta.env.VITE_MIXPANEL_TOKEN_STAGE,
	prod: import.meta.env.VITE_MIXPANEL_TOKEN_PROD,
};

export const initAnalytics = () => {
	if (import.meta.env.VITE_MIXPANEL_DISABLED === 'true') return;

	mixpanel.init(tokens[env], {
		api_host: MIXPANEL_URL,
		debug: env === 'local',
		persistence: "localStorage",
	});
};

export const trackEvent = (
	eventName,
	properties,
	propertiesMapper = (params) => ({})
) => {
	if (import.meta.env.VITE_MIXPANEL_DISABLED === 'true') return;

	const { parameters, ...rest } = properties || {};

	const mappedProperties = propertiesMapper(parameters || {});

	const authUserDetails = JSON.parse(localStorage.getItem("userDetails"))
	const user_session_id = getCookie(USER_SESSION_ID);

	const loggedInUserProperties = !!authUserDetails ? {
		...authUserDetails,
		user_session_id,
	} : {};

	if(!!authUserDetails) {
		const first_event_in_user_session = getLocalStorage(FIRST_EVENT_IN_USER_SESSION);
		if(first_event_in_user_session) {
			loggedInUserProperties.first_event_in_user_session = true;
			removeFromLocalStorage(FIRST_EVENT_IN_USER_SESSION);
		}	
	}

	const finalProperties = {
		...rest, //properties except parameters
		...mappedProperties, // build event custom parameters
		env,
		...loggedInUserProperties
	};

	mixpanel.track(eventName, finalProperties);
};

export const trackUser = (userDetails) => {
	if (import.meta.env.VITE_MIXPANEL_DISABLED === 'true') return;
	mixpanel.identify(userDetails.user_id);
	mixpanel.people.set({
		$name: userDetails.user_name,
		$email: userDetails.email
	});
}

export const untrackUser = () => {
	if (import.meta.env.VITE_MIXPANEL_DISABLED === 'true') return;
	mixpanel.reset();
}

export const getErrorAnalyticsProps = (error) => {
	const errorResponseData = error?.response?.data;

	return {
		error_code: errorResponseData?.error_code || error.code,
		error_desc: errorResponseData?.message || error.message,
	}
}
