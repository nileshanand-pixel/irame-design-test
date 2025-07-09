import { v4 as uuid } from 'uuid';
import { getCookie, setCookie } from './cookies';
import { FIRST_EVENT_IN_USER_SESSION, SESSION_TIME_IN_MILISECONDS, USER_SESSION_ID } from '@/constants/session-manager.constant';
import { setLocalStorage } from './local-storage';
import { getEntryPointFromPageUrl } from './url';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

export const createSession = (pageUrl) => {
    const user_session_id = uuid();

    setCookie(USER_SESSION_ID, user_session_id, SESSION_TIME_IN_MILISECONDS);
    
    // send session_started event
    const defaultPageUrl = window.location.pathname;
    const entry_point = getEntryPointFromPageUrl(pageUrl || defaultPageUrl);
    
    trackEvent(
        EVENTS_ENUM.SESSION_STARTED,
        EVENTS_REGISTRY.SESSION_STARTED,
        () => ({
            entry_point, 
        }),
    );
    setLocalStorage(FIRST_EVENT_IN_USER_SESSION, true);
}