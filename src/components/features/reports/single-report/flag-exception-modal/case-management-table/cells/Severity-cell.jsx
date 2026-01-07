import { cn } from '@/lib/utils';
import { ChevronDown } from 'lucide-react';

const SEVERITY_LEVELS = {
	HIGH: 'high',
	MEDIUM: 'medium',
	LOW: 'low',
	UNDEFINED: ' ',
};

const SEVERITY_CONFIG = {
	[SEVERITY_LEVELS.UNDEFINED]: {
		bgColor: 'bg-[#F3F4F6]',
		textColor: 'text-[#6B7280]',
		dotColor: 'transparent',
		borderColor: 'border-[#E5E7EB]',
	},
	[SEVERITY_LEVELS.HIGH]: {
		bgColor: 'bg-[#FEF2F2]',
		textColor: 'text-[#DC2626]',
		dotColor: 'bg-[#DC2626]',
		borderColor: 'border-[#FEE2E2]',
	},
	[SEVERITY_LEVELS.MEDIUM]: {
		bgColor: 'bg-[#FFFBEB]',
		textColor: 'text-[#D97706]',
		dotColor: 'bg-[#D97706]',
		borderColor: 'border-[#FEF3C7]',
	},
	[SEVERITY_LEVELS.LOW]: {
		bgColor: 'bg-[#FEFCE8]',
		textColor: 'text-[#CA8A04]',
		dotColor: 'bg-[#CA8A04]',
		borderColor: 'border-[#FEF9C3]',
	},
};

export default function SeverityCell({ value, onOpenTrail, caseData }) {
	const severityStyle =
		SEVERITY_CONFIG[value] || SEVERITY_CONFIG[SEVERITY_LEVELS.LOW];

	return (
		<div className="relative">
			<div
				className={`cursor-pointer flex items-center justify-between px-4 py-2 rounded-full ${severityStyle?.bgColor}`}
				onClick={() => onOpenTrail(caseData)}
			>
				<div className="flex items-center gap-2">
					<span
						className={cn(
							'w-2 h-2 rounded-full',
							severityStyle.dotColor,
						)}
					></span>
					<span
						className={cn(
							'text-sm font-medium',
							severityStyle.textColor,
						)}
					>
						{value.charAt(0).toUpperCase() + value.slice(1)}
					</span>
				</div>
				<ChevronDown className="size-4 text-gray-500" />
			</div>
		</div>
	);
}
