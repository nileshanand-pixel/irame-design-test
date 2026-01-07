import { MdOutlineModeComment } from 'react-icons/md';

export default function CommentsCell({ value, caseData, onOpenTrail }) {
	const handleClick = () => {
		if (onOpenTrail && caseData) {
			onOpenTrail(caseData);
		}
	};

	return (
		<button
			onClick={handleClick}
			className="flex items-center gap-2 text-[#6B7280] hover:text-[#374151] transition-colors"
		>
			<MdOutlineModeComment className="w-4 h-4 text-[#26064ACC]" />
			<span className="text-sm">{value || 0}</span>
		</button>
	);
}
