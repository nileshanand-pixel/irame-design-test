import { useQuery } from '@tanstack/react-query';
import { getUnreadNotificationCount } from '@/components/features/notification/service/notification.service';

const useNotificationCount = () => {
	return useQuery({
		queryKey: ['notification-count'],
		queryFn: getUnreadNotificationCount,
		staleTime: 15 * 1000, // 15s
		refetchInterval: 30 * 1000, // 30s — lightweight poll for notification badge
	});
};

export default useNotificationCount;
