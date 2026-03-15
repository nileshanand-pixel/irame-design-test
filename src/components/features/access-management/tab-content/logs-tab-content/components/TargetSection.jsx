import { User, Users, Shield, Mail } from 'lucide-react';

const getTargetIcon = (targetType) => {
	switch (targetType) {
		case 'user':
			return <User className="size-4 text-[#6A12CD]" />;
		case 'team':
			return <Users className="size-4 text-[#6A12CD]" />;
		case 'role':
			return <Shield className="size-4 text-[#6A12CD]" />;
		case 'invitation':
			return <Mail className="size-4 text-[#6A12CD]" />;
		default:
			return <User className="size-4 text-[#6A12CD]" />;
	}
};

const getResourceIcon = (resourceType) => {
	switch (resourceType) {
		case 'role':
			return <Shield className="size-4 text-[#6A12CD]" />;
		case 'team':
			return <Users className="size-4 text-[#6A12CD]" />;
		case 'user':
			return <User className="size-4 text-[#6A12CD]" />;
		case 'invitation':
			return <Mail className="size-4 text-[#6A12CD]" />;
		default:
			return null;
	}
};

const getTypeLabel = (type) => {
	const labels = {
		user: 'User',
		team: 'Team',
		role: 'Role',
		invitation: 'Invitation',
	};
	return labels[type] || type;
};

export default function TargetSection({ log, hideWrapper = false }) {
	const target = log.target || {};
	const resource = log.resource || {};

	const hasTarget = target.type || target.id || target.name;
	const hasResource = resource.type || resource.id || resource.name;

	if (!hasTarget && !hasResource) {
		const emptyState = (
			<div className="text-xs text-[#26064A99] italic py-2">
				No target or resource information available
			</div>
		);
		if (hideWrapper) return emptyState;
		return (
			<div className="border border-[#E6E2E9] rounded-lg p-4 bg-purple-4 space-y-3">
				<div className="text-sm font-semibold text-[#26064A]">
					Target Information
				</div>
				{emptyState}
			</div>
		);
	}

	const content = (
		<div className="space-y-3">
			{hasTarget && (
				<div>
					<div className="text-xs text-[#26064A99] font-medium mb-1.5">
						Affected {getTypeLabel(target.type)}
					</div>
					<div className="flex items-start gap-2">
						<div className="flex-shrink-0 mt-0.5">
							{getTargetIcon(target.type)}
						</div>
						<div className="flex-1 min-w-0">
							<div className="text-sm text-[#26064A] font-medium">
								{target.name || 'Unknown'}
							</div>
							{target.email && (
								<div className="text-xs text-[#26064A99] mt-0.5">
									{target.email}
								</div>
							)}
						</div>
					</div>
				</div>
			)}

			{hasResource && (
				<div>
					<div className="text-xs text-[#26064A99] font-medium mb-1.5">
						Resource Modified
					</div>
					<div className="flex items-start gap-2">
						{getResourceIcon(resource.type) && (
							<div className="flex-shrink-0 mt-0.5">
								{getResourceIcon(resource.type)}
							</div>
						)}
						<div className="flex-1 min-w-0">
							<div className="text-sm text-[#26064A] font-medium">
								{resource.name || 'Unknown'}
							</div>
							{resource.description && (
								<div className="text-xs text-[#26064A99] mt-0.5">
									{resource.description}
								</div>
							)}
						</div>
					</div>
				</div>
			)}
		</div>
	);

	if (hideWrapper) return content;

	return (
		<div className="border border-[#E6E2E9] rounded-lg p-4 bg-purple-4 space-y-3">
			<div className="text-sm font-semibold text-[#26064A]">
				Target Information
			</div>
			{content}
		</div>
	);
}
