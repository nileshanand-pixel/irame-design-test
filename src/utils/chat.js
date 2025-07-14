import { CHAT_SESSION_STARTED_EVENT_DATA_KEY } from '@/constants/chat.constant';
import { getLocalStorage, setLocalStorage } from './local-storage';
import { trackEvent } from '@/lib/mixpanel';
import { EVENTS_ENUM, EVENTS_REGISTRY } from '@/config/analytics-events';

export const sendChatSessionStartedEvent = ({
	dataset_id,
	dataset_name,
	start_method,
	chat_session_id,
	chat_session_type,
}) => {
	const chatSessionStartedEventData = getLocalStorage(
		CHAT_SESSION_STARTED_EVENT_DATA_KEY,
	);
	if (!chatSessionStartedEventData.isEventSent) {
		trackEvent(
			EVENTS_ENUM.CHAT_SESSION_STARTED,
			EVENTS_REGISTRY.CHAT_SESSION_STARTED,
			() => ({
				dataset_id,
				dataset_name,
				start_method,
				chat_session_id,
				chat_session_type,
			}),
		);
		const newChatSessionStartedEventData = {
			...chatSessionStartedEventData,
			isEventSent: true,
		};
		setLocalStorage(
			CHAT_SESSION_STARTED_EVENT_DATA_KEY,
			newChatSessionStartedEventData,
		);
	}
};
