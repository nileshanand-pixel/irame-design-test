import { v4 as uuid } from 'uuid';
import {
	FIRST_EVENT_IN_USER_SESSION,
	SESSION_TIME_IN_MILISECONDS,
	USER_SESSION_ID,
} from '@/constants/session-manager.constant';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';
import { getCookie, setCookie, updateCookieExpiration } from '@/utils/cookies';
import { getEntryPointFromPageUrl } from '@/utils/url';
import { setLocalStorage } from '@/utils/local-storage';

const createSession = (pageUrl) => {
	const user_session_id = uuid();
	setCookie(USER_SESSION_ID, user_session_id, SESSION_TIME_IN_MILISECONDS);

	const defaultPageUrl = window.location.pathname;
	const entry_point = getEntryPointFromPageUrl(pageUrl || defaultPageUrl);

	trackEvent(EVENTS_ENUM.SESSION_STARTED, EVENTS_REGISTRY.SESSION_STARTED, () => ({
		entry_point,
	}));
	setLocalStorage(FIRST_EVENT_IN_USER_SESSION, true);
};

const updateSession = () => {
	updateCookieExpiration(USER_SESSION_ID, SESSION_TIME_IN_MILISECONDS);
};

export const createOrUpdateUserSession = (pageUrl) => {
	const previous_user_session_id = getCookie(USER_SESSION_ID);
	if (previous_user_session_id) {
		updateSession();
	} else {
		createSession(pageUrl);
	}
};
