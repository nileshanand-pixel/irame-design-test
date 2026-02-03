export default function LiveTag({ onlyDot = false }) {
	if (onlyDot) {
		return (
			<div className="shrink-0 size-2 bg-green-600 rounded-full animate-pulse"></div>
		);
	}
	return (
		<div className="flex items-center shrink-0">
			<span className="flex items-center gap-1.5 px-3 py-1.5 bg-green-50 text-green-700 text-xs font-semibold rounded-full">
				<span className="size-2 bg-green-600 rounded-full animate-pulse"></span>
				Live
			</span>
		</div>
	);
}
