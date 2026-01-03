import { cn } from '@/lib/utils';

export const KPI_KEYS = {
	TOTAL_EXCEPTIONS_FLAGGED_BY_IRA: 'total_exceptions_flagged_by_ira',
	FINAL_EXCEPTIONS_FLAGGED: 'final_exceptions_flagged',
	EXCEPTIONS_RESOLVED: 'exceptions_resolved',
	REVIEW_PENDING: 'review_pending',
};

const KPI_CARDS = [
	{
		heading: 'Exceptions Flagged By Ira',
		key: KPI_KEYS.TOTAL_EXCEPTIONS_FLAGGED_BY_IRA,
		countColor: '#0000FF',
		borderColor: '#0000FF',
		bgColor: '#0000FF03',
	},
	{
		heading: 'Exceptions Flagged',
		key: KPI_KEYS.FINAL_EXCEPTIONS_FLAGGED,
		countColor: '#DC2626',
		borderColor: '#DC2626',
		bgColor: '#DC262603',
	},
	{
		heading: 'Exceptions Resolved',
		key: KPI_KEYS.EXCEPTIONS_RESOLVED,
		countColor: '#18884F',
		borderColor: '#18884F',
		bgColor: '#18884F03',
	},
	{
		heading: 'Exceptions Review Pending',
		key: KPI_KEYS.REVIEW_PENDING,
		countColor: '#DB7707',
		borderColor: '#DB7707',
		bgColor: '#DB770703',
	},
];

export default function Kpis({ kpisData, onSelect, selectedKpi }) {
	const handleSelectKpi = (key) => {
		if (!onSelect) return;

		onSelect(key);
	};

	return (
		<div className="flex items-center gap-4">
			{KPI_CARDS.map((card) => {
				const isSelected = selectedKpi === card.key;

				return (
					<div
						key={card.key}
						className={cn(
							'p-4 rounded-[0.625rem] w-full flex flex-col gap-2 hover:shadow-sm',
							onSelect ? 'cursor-pointer' : 'cursor-default',
						)}
						onClick={() => handleSelectKpi(card.key)}
						style={{
							border: isSelected
								? `0.125rem solid ${card.borderColor}`
								: '0.0625rem solid #E5E7EB',
							backgroundColor: isSelected
								? card.bgColor
								: 'transparent',
						}}
					>
						<div className={cn('text-[#00000099] font-medium text-xs')}>
							{card.heading}
						</div>
						<div
							className="font-semibold text-xl"
							style={{ color: card.countColor }}
						>
							{kpisData?.[card.key] || 0}
						</div>
					</div>
				);
			})}
		</div>
	);
}
