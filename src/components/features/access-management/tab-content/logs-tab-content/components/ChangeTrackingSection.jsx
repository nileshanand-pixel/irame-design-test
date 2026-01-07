import { Check } from 'lucide-react';

const formatFieldName = (key) => {
	// Convert camelCase or snake_case to readable labels
	return key
		.replace(/([A-Z])/g, ' $1')
		.replace(/_/g, ' ')
		.replace(/^./, (str) => str.toUpperCase())
		.trim();
};

const StateDisplay = ({ state, label }) => {
	if (!state || typeof state !== 'object') return null;

	return (
		<div className="">
			<div className="flex items-center gap-2 mb-2">
				<span className="text-xs font-semibold text-[#26064A]">{label}</span>
				{label === 'After' && <Check className="size-3 text-green-600" />}
			</div>
			<div className=" border bg-[#f9fafb] border-[#E5E7EB] rounded p-3 space-y-2">
				{Object.entries(state).map(([key, value]) => {
					// Skip if value is null or undefined
					if (value === null || value === undefined) return null;

					// Format complex values
					const displayValue =
						typeof value === 'object'
							? JSON.stringify(value, null, 2)
							: String(value);

					return (
						<div key={key} className="flex justify-between items-start">
							<span className="text-xs text-[#26064A99] font-medium">
								{formatFieldName(key)}:
							</span>
							<span className="text-xs text-[#26064A] font-medium text-right max-w-[60%]">
								{displayValue}
							</span>
						</div>
					);
				})}
			</div>
		</div>
	);
};

export default function ChangeTrackingSection({ log, hideWrapper = false }) {
	const hasBefore = log.before_state && Object.keys(log.before_state).length > 0;
	const hasAfter = log.after_state && Object.keys(log.after_state).length > 0;

	if (!hasBefore && !hasAfter) {
		const emptyState = (
			<div className="text-xs text-[#26064A99] italic py-2">
				No state changes recorded for this activity
			</div>
		);
		if (hideWrapper) return emptyState;
		return (
			<div className="border border-[#E6E2E9] bg-purple-4 rounded-lg p-4 space-y-3">
				<div className="text-sm font-semibold text-[#26064A]">
					What Changed
				</div>
				{emptyState}
			</div>
		);
	}

	const content = (
		<div className="space-y-3">
			{hasBefore && <StateDisplay state={log.before_state} label="Before" />}
			{hasAfter && <StateDisplay state={log.after_state} label="After" />}
		</div>
	);

	if (hideWrapper) return content;

	return (
		<div className="border border-[#E6E2E9] bg-purple-4 rounded-lg p-4 space-y-3">
			<div className="text-sm font-semibold text-[#26064A]">What Changed</div>
			{content}
		</div>
	);
}
