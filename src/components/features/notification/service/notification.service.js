import { NOTIFICATION_TYPE_VALUES } from '@/constants/notification.constant';
import axiosClientV1 from '@/lib/axios';
import { logError } from '@/lib/logger';

// export const getAllNotifications = async ({ queryKey, limit, offset, cursor }) => {
// 	try {
// 		const { notificationType } = queryKey[1];
// 		const params = {
// 			limit: limit || 5,
// 		};

// 		if (cursor) {
// 			params.cursor = cursor;
// 		}

// 		if (notificationType === NOTIFICATION_TYPE_VALUES.UNREAD) {
// 			params.unread = true;
// 		}

// 		const response = await axiosClientV1.get('/notifications/all', {
// 			params,
// 		});
// 		return response.data;
// 	} catch (error) {
// 		logError(error, {
// 			feature: 'notification',
// 			action: 'getAllNotifications',
// 			extra: { notificationType },
// 		});
// 		throw error;
// 	}
// };

export const getUnreadNotificationCount = async () => {
	const response = await axiosClientV1.get('/notifications/unread-count');
	return response.data;
};

export const getAllNotifications = async ({ queryKey, pageParam }) => {
	try {
		const { notificationType } = queryKey[1];
		const params = {};

		if (notificationType === NOTIFICATION_TYPE_VALUES.UNREAD) {
			params.unread = true;
		}

		// Add cursor for pagination if provided
		if (pageParam) {
			params.cursor = pageParam;
		}

		const response = await axiosClientV1.get('/notifications/all', {
			params,
		});
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'notification',
			action: 'getAllNotifications',
			extra: { notificationType },
		});
		throw error;
	}
};

export const readAllNotifications = async () => {
	try {
		const response = await axiosClientV1.patch('/notifications/read-all');
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'notification',
			action: 'readAllNotifications',
		});
		throw error;
	}
};

export const readNotification = async (notificationId) => {
	try {
		const response = await axiosClientV1.patch(
			`/notifications/${notificationId}/read`,
		);
		return response.data;
	} catch (error) {
		logError(error, {
			feature: 'notification',
			action: 'readNotification',
			extra: { notificationId },
		});
		throw error;
	}
};
