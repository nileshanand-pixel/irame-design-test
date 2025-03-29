import mixpanel from 'mixpanel-browser';

const env = import.meta.env.VITE_ENV;
const tokens = {
	local: import.meta.env.VITE_MIXPANEL_TOKEN_LOCAL,
	stage: import.meta.env.VITE_MIXPANEL_TOKEN_STAGE,
	prod: import.meta.env.VITE_MIXPANEL_TOKEN_PROD,
};

export const initAnalytics = () => {
	if (import.meta.env.VITE_MIXPANEL_DISABLED === 'true') return;

	mixpanel.init(tokens[env], {
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

	const authUserDetails = JSON.parse(localStorage.getItem("auth-user-data"))

	const finalProperties = {
		...rest, //properties except parameters
		...mappedProperties, // build event custom parameters
		env,
		...(!!authUserDetails && authUserDetails)
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
	return {
		code: error.code,
		message: error.message,
		status: error.status
	}
}
