import Flag, { FLAG_TYPES } from '../../flag';

export default function FlaggingCell({
	value,
	isLoading = false,
	onChange,
	onOpenTrail,
	caseData,
}) {
	const isPositive = value === FLAG_TYPES.FALSE_POSITIVE;
	const isNegative = value === FLAG_TYPES.TRUE_EXCEPTION;

	const handleFlagClick = (type) => {
		if (isLoading) return; // Prevent clicks while loading
		if (value === type) {
			onChange('');
		} else {
			onChange(type);
		}
	};

	return (
		<div className="inline-flex items-center gap-1 relative">
			{isLoading && (
				<div className="absolute inset-0 flex items-center justify-center z-10 bg-white/50 rounded-full">
					<div className="animate-spin rounded-full h-4 w-4 border-2 border-[#6A12CE] border-t-transparent"></div>
				</div>
			)}
			<Flag
				type={FLAG_TYPES.TRUE_EXCEPTION}
				isActive={isNegative}
				onClickHandler={() => {
					onOpenTrail(caseData);
				}}
			/>

			<Flag
				type={FLAG_TYPES.FALSE_POSITIVE}
				isActive={isPositive}
				onClickHandler={() => handleFlagClick(FLAG_TYPES.FALSE_POSITIVE)}
			/>
		</div>
	);
}
