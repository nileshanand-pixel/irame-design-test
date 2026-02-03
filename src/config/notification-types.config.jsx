import { ArrowRight } from 'lucide-react';
import shareIcon from '@/assets/icons/share.svg';
import completedIcon from '@/assets/icons/completed.svg';
import patchNotesIcon from '@/assets/icons/patch-notes.svg';
import { toast } from '@/lib/toast';
import { NOTIFICATION_TYPES } from '@/constants/notification.constant';
import { capitalizeWords } from '@/utils/common';
import CircularLoader from '@/components/elements/loading/CircularLoader';
import csvIcon from '@/assets/icons/csv_icon.svg';
import { Download } from 'lucide-react';
import { FiRefreshCcw } from 'react-icons/fi';

export const NOTIFICATION_TYPE_CONFIG = {
	[NOTIFICATION_TYPES.REPORT_SHARED]: {
		icon: shareIcon,
		renderMessage: (notification) => (
			<div className="text-sm text-[#000000CC] break-words">
				<span>
					{capitalizeWords(notification?.metadata?.shared_by_user_name)}{' '}
					shared the{' '}
				</span>
				<span className="font-semibold break-words">
					"{notification?.metadata?.report_name}"
				</span>
				<span> report with you.</span>
			</div>
		),
		button: {
			isBtnPresent: true,
			content: (
				<>
					<span>View report</span>
					<ArrowRight className="size-4" />
				</>
			),
			clickHandler: (notification, { navigate, setIsOpen }) => {
				navigate(`/app/reports/${notification?.metadata?.report_id}`);
				setIsOpen(false);
			},
		},
	},

	[NOTIFICATION_TYPES.WORKFLOW_RUN_COMPLETED]: {
		icon: completedIcon,
		renderMessage: (notification) => (
			<div className="text-sm text-[#000000CC] break-words">
				<span>Workflow</span>{' '}
				<span className="font-semibold break-words">
					"{notification?.metadata?.workflow_run_name}"
				</span>{' '}
				<span>has been completed successfully.</span>
			</div>
		),
		button: {
			isBtnPresent: true,
			content: (
				<>
					<span>View workflow</span>
					<ArrowRight className="size-4" />
				</>
			),
			clickHandler: (notification, { navigate, setIsOpen }) => {
				if (
					notification?.metadata?.session_id &&
					notification?.metadata?.datasource_id
				) {
					navigate(
						`/app/new-chat/session?sessionId=${notification?.metadata?.session_id}&datasource_id=${notification?.metadata?.datasource_id}`,
					);
					setIsOpen(false);
				} else {
					toast.error('Session or datasource not found');
				}
			},
		},
	},

	[NOTIFICATION_TYPES.PATCH_NOTES]: {
		icon: patchNotesIcon,
		renderMessage: (notification) => (
			<div className="text-sm text-[#000000CC] break-words">
				<div dangerouslySetInnerHTML={{ __html: notification?.message }} />
			</div>
		),
		button: {
			isBtnPresent: true,
			content: (notification) => (
				<>
					<span>
						{notification?.metadata?.cta_text || 'View patch notes'}
					</span>
					<ArrowRight className="size-4" />
				</>
			),
			clickHandler: (notification, { setSupademoUrl, setIsSupademoOpen }) => {
				if (notification?.metadata?.url) {
					if (notification?.metadata?.cta_type === 'supademo') {
						setSupademoUrl(notification?.metadata?.url);
						setIsSupademoOpen(true);
					} else {
						window.open(notification?.metadata?.url, '_blank');
					}
				} else {
					toast.error('URL not found');
				}
			},
		},
	},

	[NOTIFICATION_TYPES.SESSION_SHARED]: {
		icon: shareIcon,
		renderMessage: (notification) => (
			<div className="text-sm text-[#000000CC] break-words">
				<span>
					{capitalizeWords(notification?.metadata?.shared_by_user_name)}{' '}
					shared the{' '}
				</span>
				<span className="font-semibold break-words">
					"{notification?.metadata?.session_name}"
				</span>
				<span> session with you.</span>
			</div>
		),
		button: {
			isBtnPresent: true,
			content: (
				<>
					<span>View session</span>
					<ArrowRight className="size-4" />
				</>
			),
			clickHandler: (notification, { navigate, setIsOpen }) => {
				navigate(
					`/app/new-chat/session?sessionId=${notification?.metadata?.session_id}&datasource_id=${notification?.metadata?.datasource_id}`,
				);
				setIsOpen(false);
			},
		},
	},

	[NOTIFICATION_TYPES.CASE_ASSIGNED]: {
		icon: shareIcon,
		renderMessage: (notification) => {
			const { metadata } = notification;
			const caseCount = metadata['case_count'] || 0;
			const assignedByUserName = metadata['assigned_by_user_name'];
			const cardName = metadata['card_name'];
			const reportName = metadata['report_name'];

			return (
				<div className="text-sm text-[#000000CC] break-words">
					{assignedByUserName ? (
						<span>
							{assignedByUserName} assigned you {caseCount} case
							{caseCount !== 1 ? 's' : ''}
						</span>
					) : (
						<span>
							You have been assigned {caseCount} case
							{caseCount !== 1 ? 's' : ''}
						</span>
					)}
					{cardName && (
						<>
							{' '}
							in card{' '}
							<span className="font-semibold">"{cardName}"</span>
						</>
					)}
					{reportName && (
						<>
							{' '}
							of report{' '}
							<span className="font-semibold">"{reportName}"</span>
						</>
					)}
				</div>
			);
		},
		button: {
			isBtnPresent: true,
			content: (
				<>
					<span>View report</span>
					<ArrowRight className="size-4" />
				</>
			),
			clickHandler: (notification, { navigate, setIsOpen }) => {
				navigate(`/app/reports/${notification?.metadata?.report_id}`);
				setIsOpen(false);
			},
		},
	},
	[NOTIFICATION_TYPES.CSV_EXPORT_READY]: {
		icon: csvIcon,
		renderMessage: (notification) => (
			<div className="text-sm text-[#000000CC] break-words">
				<span>Your CSV export for report</span>{' '}
				<span className="font-semibold break-words">
					"{notification?.metadata?.report_name}"
				</span>
				<span>is ready to download.</span>
			</div>
		),
		button: {
			isBtnPresent: true,
			content: (notification, { downloadingNotificationId }) => {
				const isDownloadingThis =
					downloadingNotificationId === notification.external_id;
				return (
					<>
						{isDownloadingThis ? (
							<>
								<span>Downloading...</span>
								<CircularLoader className="animate-spin size-4" />
							</>
						) : (
							<>
								<span>Download CSV</span>
								<Download className="size-4" />
							</>
						)}
					</>
				);
			},
			clickHandler: async (
				notification,
				{ downloadS3File, setDownloadingNotificationId },
			) => {
				if (notification?.metadata?.csv_url) {
					try {
						setDownloadingNotificationId(notification.external_id);
						const fileName =
							notification?.metadata?.file_name || 'export.csv';
						await downloadS3File(
							notification.metadata.csv_url,
							fileName,
						);
					} finally {
						setDownloadingNotificationId(null);
					}
				} else {
					toast.error('CSV URL not found');
				}
			},
			disabled: (notification, { downloadingNotificationId }) =>
				downloadingNotificationId === notification.external_id,
		},
	},
	[NOTIFICATION_TYPES.DASHBOARD_REFRESH_COMPLETED]: {
		renderIcon: () => <FiRefreshCcw className="size-5 text-[#6A12CD]" />,
		renderMessage: (notification) => (
			<div className="text-sm text-[#000000CC] break-words">
				<span>Dashboard</span>{' '}
				<span className="font-semibold break-words">
					"{notification?.metadata?.dashboard_name}"
				</span>{' '}
				<span>has been refreshed successfully.</span>
			</div>
		),
		button: {
			isBtnPresent: true,
			content: (
				<>
					<span>View dashboard</span>
					<ArrowRight className="size-4" />
				</>
			),
			clickHandler: (notification, { navigate, setIsOpen }) => {
				if (notification?.metadata?.dashboard_id) {
					navigate(
						`/app/dashboard/content?id=${notification?.metadata?.dashboard_id}`,
					);
					setIsOpen(false);
				} else {
					toast.error('Dashboard not found');
				}
			},
		},
	},
};

// Helper function to get notification config by type
export const getNotificationConfig = (type) => {
	return NOTIFICATION_TYPE_CONFIG[type] || null;
};
