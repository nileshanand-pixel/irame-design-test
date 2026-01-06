import { formatActionType } from '@/constants/activityLogActionTypes';
import { formatTimestamp } from '@/utils/dateRangeUtils';

const getSeverityConfig = (severity) => {
	switch (severity) {
		case 'critical':
			return {
				label: 'Critical',
				bgColor: '#FEE2E2',
				textColor: '#DC2626',
			};
		case 'security':
			return {
				label: 'Security',
				bgColor: '#FEF3C7',
				textColor: '#D97706',
			};
		case 'warning':
			return {
				label: 'Warning',
				bgColor: '#FED7AA',
				textColor: '#EA580C',
			};
		case 'info':
		default:
			return {
				label: 'Info',
				bgColor: '#E0E7FF',
				textColor: '#4F46E5',
			};
	}
};

const getCategoryLabel = (category) => {
	const labels = {
		role: 'Role Management',
		team: 'Team Management',
		user: 'User Management',
		invitation: 'Invitation',
		tenant: 'Tenant',
		user_role: 'User Role',
		approval: 'Approval',
		permission: 'Permission',
		security: 'Security',
	};
	return labels[category] || category;
};

export default function EventInformation({ log }) {
	const severityConfig = getSeverityConfig(log.severity);
	const actionLabel = formatActionType(log.action_type);
	const categoryLabel = getCategoryLabel(log.category);

	const { date, time } = formatTimestamp(log.occurred_at || log.created_at);

	return (
		<div className="border border-[#E6E2E9] rounded-lg p-4 space-y-3">
			<div className="text-sm font-semibold text-[#26064A]">
				Event Information
			</div>

			<div className="space-y-2">
				<div className="flex justify-between items-start">
					<span className="text-xs text-[#26064A99] font-medium">
						Action
					</span>
					<span className="text-xs text-[#26064A] font-medium text-right">
						{actionLabel}
					</span>
				</div>

				<div className="flex justify-between items-start">
					<span className="text-xs text-[#26064A99] font-medium">
						Time
					</span>
					<div className="text-right">
						<div className="text-xs text-[#26064A] font-medium">
							{date}
						</div>
						<div className="text-xs text-[#26064A99]">{time}</div>
					</div>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-xs text-[#26064A99] font-medium">
						Category
					</span>
					<span className="text-xs text-[#26064A] font-medium capitalize">
						{categoryLabel}
					</span>
				</div>

				<div className="flex justify-between items-center">
					<span className="text-xs text-[#26064A99] font-medium">
						Severity
					</span>
					<span
						className="text-xs font-medium px-2 py-0.5 rounded"
						style={{
							backgroundColor: severityConfig.bgColor,
							color: severityConfig.textColor,
						}}
					>
						{severityConfig.label}
					</span>
				</div>
			</div>
		</div>
	);
}
