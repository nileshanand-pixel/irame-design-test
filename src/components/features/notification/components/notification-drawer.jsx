import { useState, useRef, useCallback, useEffect } from 'react';
import { Button } from '../../../ui/button';
import {
	Sheet,
	SheetContent,
	SheetHeader,
	SheetTitle,
	SheetDescription,
} from '../../../ui/sheet';
import { cn } from '@/lib/utils';
import useS3File from '@/hooks/useS3File';
import {
	getAllNotifications,
	readAllNotifications,
	readNotification,
} from '../service/notification.service';
import {
	useInfiniteQuery,
	useMutation,
	useQueryClient,
} from '@tanstack/react-query';
import {
	NOTIFICATION_TYPE_VALUES,
	NOTIFICATION_TABS,
	NOTIFICATION_TYPES,
} from '@/constants/notification.constant';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import { formatRelativeTime } from '@/utils/date-utils';
import { ArrowRight, Download } from 'lucide-react';
import { FiRefreshCcw } from 'react-icons/fi';
import { useNavigate, useLocation } from 'react-router-dom';
import { toast } from '@/lib/toast';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { getNotificationConfig } from '@/config/notification-types.config';

export default function NotificationDrawer({ isOpen, setIsOpen }) {
	const [supademoUrl, setSupademoUrl] = useState(null);
	const [isSupademoOpen, setIsSupademoOpen] = useState(false);
	const [notificationType, setNotificationType] = useState(
		NOTIFICATION_TABS[0]?.value,
	);
	const [downloadingNotificationId, setDownloadingNotificationId] = useState(null);

	const navigate = useNavigate();
	const location = useLocation();
	const queryClient = useQueryClient();
	const observerRef = useRef();
	const scrollContainerRef = useRef();
	const { downloadS3File } = useS3File();

	// Dynamically calculate rem to px conversion
	const remToPx = (rem) => {
		const rootFontSize = parseFloat(
			getComputedStyle(document.documentElement).fontSize,
		);
		return rem * rootFontSize;
	};

	const {
		data,
		isLoading: isNotificationsLoading,
		error,
		fetchNextPage,
		hasNextPage,
		isFetchingNextPage,
	} = useInfiniteQuery({
		queryKey: ['notifications', { notificationType }],
		queryFn: getAllNotifications,
		initialPageParam: undefined,
		getNextPageParam: (lastPage) => {
			// Return the next cursor if there's more data, otherwise undefined
			return lastPage?.has_next ? lastPage?.next_cursor : undefined;
		},
		refetchInterval: 2000,
	});

	// Flatten all pages into a single array of notifications
	const notifications = data?.pages?.flatMap((page) => page?.notifications) || [];
	const totalUnreadCount = data?.pages?.[0]?.total_unread_count || 0;

	// Debug: Log the data to check pagination info
	useEffect(() => {
		if (data?.pages && data.pages.length > 0) {
			const lastPage = data.pages[data.pages.length - 1];
			console.log('Pagination Debug:', {
				totalPages: data.pages.length,
				notificationsCount: notifications.length,
				hasNextPage,
				lastPageData: {
					has_next: lastPage?.has_next,
					next_cursor: lastPage?.next_cursor,
					notificationsInPage: lastPage?.notifications?.length,
				},
			});
		}
	}, [data, hasNextPage, notifications.length]);

	// Intersection Observer callback for infinite scroll
	const lastNotificationElementRef = useCallback(
		(node) => {
			if (isNotificationsLoading) return;
			if (isFetchingNextPage) return;

			if (observerRef.current) observerRef.current.disconnect();

			observerRef.current = new IntersectionObserver(
				(entries) => {
					if (entries[0].isIntersecting && hasNextPage) {
						console.log('Loading more notifications...', {
							hasNextPage,
							isIntersecting: entries[0].isIntersecting,
						});
						fetchNextPage();
					}
				},
				{
					root: scrollContainerRef.current,
					rootMargin: `${remToPx(6.25)}px`,
					threshold: 0.1,
				},
			);

			if (node) observerRef.current.observe(node);
		},
		[isNotificationsLoading, isFetchingNextPage, hasNextPage, fetchNextPage],
	);

	const { mutate: markAllAsRead, isPending: isMarkingAllAsRead } = useMutation({
		mutationFn: readAllNotifications,
		onSuccess: () => {
			queryClient.invalidateQueries({
				queryKey: ['notifications', { notificationType }],
			});
			toast.success('All notifications marked as read');
		},
		onError: (error) => {
			toast.error('Failed to mark all notifications as read');
		},
	});

	const { mutate: markAsRead } = useMutation({
		mutationFn: readNotification,
		onSuccess: () => {
			// Refetch notifications to update the list
			queryClient.invalidateQueries({
				queryKey: ['notifications', { notificationType }],
			});
		},
		onError: (error) => {
			toast.error('Failed to mark notification as read');
		},
	});

	// Helper function to render notification icon
	const renderNotificationIcon = (notification) => {
		const config = getNotificationConfig(notification.type);
		if (!config) return null;

		if (config.renderIcon) {
			return config.renderIcon(notification);
		}
		if (config.icon) {
			return <img src={config.icon} className="size-5" />;
		}
		return null;
	};

	// Helper function to render notification message
	const renderNotificationMessage = (notification, config) => {
		if (config?.renderMessage) {
			return config.renderMessage(notification);
		}
		return null;
	};

	const renderNotificationButton = (notification) => {
		const config = getNotificationConfig(notification.type);
		if (!config?.button?.isBtnPresent) return null;

		const { content, clickHandler, disabled } = config.button;

		const context = {
			navigate,
			setIsOpen,
			setSupademoUrl,
			setIsSupademoOpen,
			downloadS3File,
			downloadingNotificationId,
			setDownloadingNotificationId,
		};

		const buttonContent =
			typeof content === 'function' ? content(notification, context) : content;

		const isDisabled =
			typeof disabled === 'function'
				? disabled(notification, context)
				: disabled;

		return (
			<div>
				<Button
					variant="outline"
					className="border-1 border-[#D0D5DD] text-[#00000099] flex gap-2"
					onClick={(e) => {
						e.stopPropagation();
						if (clickHandler) {
							clickHandler(notification, context);
						}
					}}
					disabled={isDisabled}
				>
					{buttonContent}
				</Button>
			</div>
		);
	};

	const renderNotification = (notification, ref = null) => {
		const isUnread = !notification?.is_read;
		const config = getNotificationConfig(notification.type);

		return (
			<div
				key={notification._id}
				ref={ref}
				className={cn(
					'pt-8 pl-6 flex items-start gap-4 cursor-pointer',
					isUnread && 'bg-[#6A12CD0A]',
				)}
				onClick={() => {
					if (!notification?.is_read) {
						markAsRead(notification.external_id);
					}
				}}
			>
				<div className="flex items-center gap-2">
					{isUnread && (
						<div className="size-2 rounded-full bg-[#6A12CD] shrink-0"></div>
					)}

					<div className="bg-[#8B33AE0A] rounded-xl p-1 size-10 flex justify-center items-center ">
						<div className="p-1 bg-[#8B33AE14] rounded-xl size-8 flex justify-center items-center">
							{renderNotificationIcon(notification)}
						</div>
					</div>
				</div>

				<div className="flex flex-col gap-2 border-b-1 border-b-[#0000001A pb-8 w-full pr-6 overflow-hidden">
					{renderNotificationMessage(notification, config)}

					{renderNotificationButton(notification)}

					<div className="text-xs text-[#475569]">
						{formatRelativeTime(notification.created_at)}
					</div>
				</div>
			</div>
		);
	};

	const handleMarkAllAsReadClick = () => {
		// check if there are any unread notifications
		if (totalUnreadCount > 0) {
			markAllAsRead();
		} else {
			toast.info('No unread notifications');
		}
	};

	return (
		<>
			<Sheet open={isOpen} onOpenChange={setIsOpen}>
				<SheetContent
					side="right"
					className="w-[33.75rem] mr-8 h-[95vh] my-auto rounded-2xl p-0"
				>
					<div>
						<SheetHeader>
							<SheetTitle className="text-xl text-[#000000] font-semibold p-4 pt-5">
								Notifications
							</SheetTitle>
						</SheetHeader>

						<div className="py-2 px-6 flex items-center justify-between border-y-1 border-y-[#0000001A]">
							<div className="flex items-center gap-2">
								{NOTIFICATION_TABS?.map((notification) => (
									<Button
										key={notification.value}
										variant="ghost"
										className={cn(
											'text-[#6A12CD] !text-sm font-medium py-1 px-3 flex gap-1',
											notificationType === notification.value
												? 'text-[#6A12CD] bg-[#6A12CD0A] hover:bg-[#6A12CD0A] hover:text-[#6A12CD]'
												: 'text-[#000000] bg-transparent',
										)}
										onClick={() =>
											setNotificationType(notification.value)
										}
									>
										<span>{notification.label}</span>
										{notification.value ===
											NOTIFICATION_TYPE_VALUES.UNREAD &&
											totalUnreadCount >= 0 && (
												<span>{`(${totalUnreadCount})`}</span>
											)}
									</Button>
								))}
							</div>
							<Button
								variant="ghost"
								className="text-[#6A12CD] text-sm font-medium w-[8.125rem]"
								onClick={handleMarkAllAsReadClick}
								disabled={isMarkingAllAsRead}
							>
								{isMarkingAllAsRead ? (
									<CircularLoader className="animate-spin size-4" />
								) : (
									<span>Mark all as read</span>
								)}
							</Button>
						</div>
					</div>

					<div
						ref={scrollContainerRef}
						className="h-[calc(95vh-9rem)] overflow-y-auto"
					>
						{isNotificationsLoading ? (
							<div className="flex items-center justify-center h-full">
								<CircularLoader className="animate-spin size-4" />
							</div>
						) : !notifications || notifications.length === 0 ? (
							<div className="flex items-center justify-center h-full">
								<span>No notifications</span>
							</div>
						) : (
							<div>
								{notifications.map((notification, index) => {
									// Attach ref to the last notification for infinite scroll
									if (index === notifications.length - 1) {
										return renderNotification(
											notification,
											lastNotificationElementRef,
										);
									}
									return renderNotification(notification);
								})}
								{isFetchingNextPage && (
									<div className="flex items-center justify-center py-4">
										<CircularLoader className="animate-spin size-4" />
									</div>
								)}
							</div>
						)}
					</div>
				</SheetContent>
			</Sheet>

			<Dialog open={isSupademoOpen} onOpenChange={setIsSupademoOpen}>
				<DialogContent className="max-w-[90vw] w-[90vw] h-[90vh] max-h-[90vh]">
					<div className="w-full h-full">
						<iframe
							src={supademoUrl}
							frameBorder="0"
							allow="clipboard-write"
							allowFullScreen
							className="w-full h-full rounded-lg"
						/>
					</div>
				</DialogContent>
			</Dialog>
		</>
	);
}
